import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Panel, SectionTitle } from "@/components/portal/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useMe } from "@/lib/data";
import { formatCpf } from "@/lib/cpf";

export const Route = createFileRoute("/app/perfil")({ component: Perfil });

function Perfil() {
  const { session } = useAuth();
  const me = useMe(session?.user.id).data;
  const [pw, setPw] = useState("");
  const [cur, setCur] = useState("");
  const [busy, setBusy] = useState(false);

  const change = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) return toast.error("A nova senha precisa de 6+ caracteres.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw, current_password: cur } as never);
    setBusy(false);
    if (error) toast.error("Não foi possível alterar. Confira a senha atual.");
    else {
      toast.success("Senha alterada!");
      setPw("");
      setCur("");
    }
  };

  return (
    <>
      <h1 className="pt-5 text-xl font-semibold tracking-tight lg:text-2xl">Meu perfil</h1>
      <Panel className="mt-4 flex items-center gap-4">
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary font-display text-2xl text-primary-foreground">
          {me?.nome?.[0] ?? "?"}
        </div>
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold">{me?.nome}</div>
          <div className="font-mono text-[11px] text-foreground/50">{me?.cpf ? formatCpf(me.cpf) : ""}</div>
        </div>
      </Panel>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {[
          ["Matrícula", me?.matricula ?? "—"],
          ["Função", me?.funcao],
          ["Unidade", me?.unidade ?? "—"],
          ["Status", me?.status === "ativo" ? "Ativo" : "Inativo"],
        ].map(([k, v]) => (
          <Panel key={k}>
            <div className="label-mono">{k}</div>
            <div className="mt-1 font-semibold">{v}</div>
          </Panel>
        ))}
      </div>
      <SectionTitle>Alterar senha</SectionTitle>
      <Panel>
        <form onSubmit={change} className="space-y-3">
          <div className="space-y-1.5"><Label>Senha atual</Label><Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Nova senha</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          <Button type="submit" disabled={busy}>Salvar nova senha</Button>
        </form>
      </Panel>
    </>
  );
}
