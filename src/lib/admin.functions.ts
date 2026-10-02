import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DEMO_ADMIN_CPF = "11144477735";
const DEMO_ADMIN_PASS = "admin1234";
const DEMO_AUX_PASS = "demo1234";
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
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome, cpf },
  });
  if (error) throw error;
  return data.user.id;
}

/** Public: tells the login page whether demo accounts still need to be provisioned. */
export const getSetupStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  return { needsSetup: (count ?? 0) === 0 };
});

/** Public, one-time: only runs while no admin exists. Creates demo logins. */
export const setupDemoAccounts = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  if ((count ?? 0) > 0) return { ok: false, message: "Contas já configuradas." };

  const adminId = await upsertAccount(supabaseAdmin, DEMO_ADMIN_CPF, DEMO_ADMIN_PASS, "Gestor Demo");
  await supabaseAdmin.from("user_roles").upsert({ user_id: adminId, role: "admin" }, { onConflict: "user_id,role" });

  const { data: cols } = await supabaseAdmin.from("colaboradores").select("id,cpf,nome").eq("demo", true);
  for (const c of cols ?? []) {
    const uid = await upsertAccount(supabaseAdmin, c.cpf, DEMO_AUX_PASS, c.nome);
    await supabaseAdmin.from("colaboradores").update({ user_id: uid }).eq("id", c.id);
    await supabaseAdmin.from("user_roles").upsert({ user_id: uid, role: "auxiliar" }, { onConflict: "user_id,role" });
  }
  return { ok: true, message: "Contas de demonstração criadas." };
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
    const { data: col, error } = await supabaseAdmin
      .from("colaboradores")
      .select("id,cpf,nome,user_id,status")
      .eq("id", data.colaboradorId)
      .single();
    if (error || !col) throw new Error("Colaborador não encontrado.");
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
    const { data: col } = await supabaseAdmin
      .from("colaboradores")
      .update({ status: data.status })
      .eq("id", data.colaboradorId)
      .select("user_id")
      .single();
    if (col?.user_id) {
      await supabaseAdmin.auth.admin.updateUserById(col.user_id, {
        ban_duration: data.status === "inativo" ? "876000h" : "none",
      });
    }
    return { ok: true };
  });
