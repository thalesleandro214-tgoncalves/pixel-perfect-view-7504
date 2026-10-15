import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseBase } from "./base-oficial";

const emailOf = (cpf: string) => `${cpf}@portal.local`;

type AdminClient = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

async function findUserByEmail(admin: AdminClient, email: string) {
  for (let page = 1; page < 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const u = data.users.find((x) => x.email === email);
    if (u) return u;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function upsertAccount(admin: AdminClient, cpf: string, password: string, nome: string) {
  const email = emailOf(cpf);
  const existing = await findUserByEmail(admin, email);
  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, { password, ban_duration: "none" });
    if (error) throw error;
    return existing.id;
  }
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { nome, cpf } });
  if (error) throw error;
  return data.user.id;
}

async function adminCount(admin: AdminClient) {
  const { count } = await admin.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
  return count ?? 0;
}

/** Public: tells the login page whether the platform still needs its first admin. */
export const getSetupStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return { needsSetup: (await adminCount(supabaseAdmin)) === 0 };
});

function cpfOk(c: string) {
  if (!/^\d{11}$/.test(c) || /^(\d)\1+$/.test(c)) return false;
  const dv = (n: number) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += Number(c[i]) * (n + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(c[9]) && dv(10) === Number(c[10]);
}

/** Public, only while no admin exists: first access registers the administrator. */
export const createFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ nome: z.string().trim().min(3).max(120), cpf: z.string().regex(/^\d{11}$/), password: z.string().min(8).max(72) }).parse(d))
  .handler(async ({ data }) => {
    if (!cpfOk(data.cpf)) throw new Error("CPF inválido.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if ((await adminCount(supabaseAdmin)) > 0) throw new Error("O administrador já foi cadastrado.");
    const uid = await upsertAccount(supabaseAdmin, data.cpf, data.password, data.nome);
    const { error } = await supabaseAdmin.from("user_roles").upsert({ user_id: uid, role: "admin" }, { onConflict: "user_id,role" });
    if (error) throw new Error("Não foi possível concluir o cadastro.");
    return { ok: true };
  });

async function assertAdmin(supabase: { rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" }) => PromiseLike<{ data: boolean | null }> }, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Acesso restrito ao administrador.");
}

/** Admin: create or reset the login (password) of a colaborador. */
export const setColaboradorPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ colaboradorId: z.string().uuid(), password: z.string().min(6).max(72) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: col, error } = await supabaseAdmin.from("colaboradores").select("id,cpf,nome,user_id,status").eq("id", data.colaboradorId).single();
    if (error || !col) throw new Error("Colaborador não encontrado.");
    if (!col.cpf) throw new Error("Cadastre o CPF do colaborador antes de criar a senha.");
    const uid = await upsertAccount(supabaseAdmin, col.cpf, data.password, col.nome);
    if (col.status === "inativo") await supabaseAdmin.auth.admin.updateUserById(uid, { ban_duration: "876000h" });
    await supabaseAdmin.from("colaboradores").update({ user_id: uid }).eq("id", col.id);
    await supabaseAdmin.from("user_roles").upsert({ user_id: uid, role: "auxiliar" }, { onConflict: "user_id,role" });
    return { ok: true };
  });

/** Admin: activate / inactivate a colaborador (blocks login when inactive). */
export const setColaboradorStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ colaboradorId: z.string().uuid(), status: z.enum(["ativo", "inativo"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: col } = await supabaseAdmin.from("colaboradores").update({ status: data.status }).eq("id", data.colaboradorId).select("user_id").single();
    if (col?.user_id) {
      await supabaseAdmin.auth.admin.updateUserById(col.user_id, { ban_duration: data.status === "inativo" ? "876000h" : "none" });
    }
    return { ok: true };
  });

const CAMPOS = [
  "unidade", "lp_duplo", "mistos", "total_mistos_lp", "valor_mistos", "total_mistos_rs", "total_gav", "valor_gaveta",
  "total_gaveta_rs", "total_container", "valor_container", "total_container_rs", "paletes_total", "caixas_produzidas",
  "inicio_montagem", "termino_montagem", "duracao_operacao", "minutos", "cx_m", "caixas_por_hora", "pagamento_diario",
  "acumulado_periodo", "cxh_media_periodo",
] as const;

/** Admin: idempotent import of the official base. Key = colaborador (NOME da base) + DATA. */
export const importarBase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ arquivo: z.string().max(200), conteudo: z.string().min(1).max(15_000_000) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { linhas, erros } = parseBase(data.conteudo);

    // colaboradores by nome_base (create missing ones without login)
    const { data: cols, error: ce } = await db.from("colaboradores").select("id,nome_base");
    if (ce) throw new Error(ce.message);
    const byNome = new Map((cols ?? []).filter((c) => c.nome_base).map((c) => [c.nome_base!, c.id]));
    const novos = new Map<string, { nome_base: string; nome: string; matricula: string | null; unidade: string }>();
    for (const l of linhas) if (!byNome.has(l.nome_base) && !novos.has(l.nome_base)) novos.set(l.nome_base, { nome_base: l.nome_base, nome: l.nome, matricula: l.matricula, unidade: l.unidade });
    if (novos.size) {
      const { data: ins, error } = await db.from("colaboradores").insert([...novos.values()]).select("id,nome_base");
      if (error) throw new Error(error.message);
      for (const c of ins ?? []) byNome.set(c.nome_base!, c.id);
    }

    const ids = [...new Set(linhas.map((l) => byNome.get(l.nome_base)!))];
    const existentes = new Map<string, Record<string, unknown>>();
    for (let i = 0; i < ids.length; i += 50) {
      const { data: ex, error } = await db.from("produtividade").select(`colaborador_id,data,${CAMPOS.join(",")}`).in("colaborador_id", ids.slice(i, i + 50)).limit(20000);
      if (error) throw new Error(error.message);
      for (const r of (ex ?? []) as unknown as Record<string, unknown>[]) existentes.set(`${r.colaborador_id}|${r.data}`, r);
    }

    const { data: imp } = await db.from("importacoes").insert({ arquivo: data.arquivo, usuario_id: context.userId, total_linhas: linhas.length + erros.length }).select("id").single();

    let inseridos = 0, atualizados = 0, inalterados = 0;
    const payload: Record<string, unknown>[] = [];
    for (const l of linhas) {
      const colaborador_id = byNome.get(l.nome_base)!;
      const row: Record<string, unknown> = { colaborador_id, data: l.data };
      for (const k of CAMPOS) row[k] = l[k];
      const ex = existentes.get(`${colaborador_id}|${l.data}`);
      if (!ex) inseridos++;
      else if (CAMPOS.every((k) => (typeof l[k] === "number" ? Number(ex[k]) === l[k] : String(ex[k] ?? "") === l[k]))) { inalterados++; continue; }
      else atualizados++;
      payload.push({ ...row, horas_trabalhadas: +(l.minutos / 60).toFixed(4), valor_gerado: l.pagamento_diario, importacao_id: imp?.id ?? null });
    }
    for (let i = 0; i < payload.length; i += 500) {
      const { error } = await db.from("produtividade").upsert(payload.slice(i, i + 500) as never, { onConflict: "colaborador_id,data" });
      if (error) throw new Error(error.message);
    }
    const resumo = { inseridos, atualizados, inalterados, invalidos: erros.length, erros, novosColaboradores: novos.size };
    if (imp) await db.from("importacoes").update({ inseridos, atualizados, inalterados, invalidos: erros.length, erros }).eq("id", imp.id);
    return resumo;
  });
