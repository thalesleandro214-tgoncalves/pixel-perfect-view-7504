import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cpfToEmail, formatCpf, isValidCpf } from "@/lib/cpf";
import { createFirstAdmin, getSetupStatus } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import warehouse from "@/assets/warehouse.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entrar · Portal de Produtividade Logística" },
      { name: "description", content: "Acesse com seu CPF e senha para ver sua produtividade do dia." },
      { property: "og:title", content: "Entrar · Portal de Produtividade Logística" },
      { property: "og:description", content: "Acesse com seu CPF e senha para ver sua produtividade do dia." },
    ],
  }),
  component: Login,
});

function Login() {
  const { session, role, loading } = useAuth();
  const navigate = useNavigate();
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const statusFn = useServerFn(getSetupStatus);
  const setupFn = useServerFn(createFirstAdmin);
  const [nome, setNome] = useState("");
  const status = useQuery({ queryKey: ["setup-status"], queryFn: () => statusFn() });
  const first = !!status.data?.needsSetup;

  useEffect(() => {
    if (!loading && session && role) navigate({ to: role === "admin" ? "/admin" : "/app", replace: true });
  }, [loading, session, role, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidCpf(cpf)) return toast.error("CPF inválido. Confira os números.");
    if (password.length < 6) return toast.error("Senha deve ter pelo menos 6 caracteres.");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: cpfToEmail(cpf), password });
    setBusy(false);
    if (error) {
      toast.error(/banned/i.test(error.message) ? "Usuário inativo. Procure seu gestor." : "CPF ou senha incorretos.");
    }
  };

  const setup = async (e: FormEvent) => {
    e.preventDefault();
    if (nome.trim().length < 3) return toast.error("Informe seu nome.");
    if (!isValidCpf(cpf)) return toast.error("CPF inválido.");
    if (password.length < 8) return toast.error("A senha do administrador precisa de 8+ caracteres.");
    setBusy(true);
    try {
      await setupFn({ data: { nome: nome.trim(), cpf: cpf.replace(/\D/g, ""), password } });
      const { error } = await supabase.auth.signInWithPassword({ email: cpfToEmail(cpf), password });
      if (error) throw error;
      toast.success("Administrador cadastrado.");
      status.refetch();
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível concluir o cadastro.");
    }
    setBusy(false);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden lg:block">
        <img src={warehouse} alt="Centro de distribuição de bebidas" width={1024} height={1280} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-deep/95 via-primary-deep/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-primary-foreground">
          <div className="stripe-top mb-6 h-1 w-40 opacity-90" style={{ background: "repeating-linear-gradient(90deg, var(--primary-foreground) 0 16px, transparent 16px 28px)" }} />
          <h2 className="num-display text-6xl uppercase">Cada caixa<br />conta.</h2>
          <p className="mt-4 max-w-sm text-sm opacity-85">Sua produtividade do dia e do mês — em um só lugar.</p>
        </div>
      </div>

      <div className="flex flex-col bg-background">
        <div className="bg-wave relative px-6 pb-16 pt-10 text-primary-foreground lg:hidden">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-80">Brasal · Logística</div>
          <h1 className="num-display mt-3 text-5xl uppercase">Portal de<br />Produtividade</h1>
        </div>

        <div className="-mt-8 flex flex-1 items-start justify-center px-4 pb-10 lg:mt-0 lg:items-center">
          <div className="glass shadow-card relative w-full max-w-sm overflow-hidden p-6 rise">
            <div className="stripe-top absolute inset-x-0 top-0 h-1" />
            <div className="hidden lg:block">
              <div className="label-mono">Brasal · Logística</div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">Portal de Produtividade</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground lg:mt-2">{first ? "Primeiro acesso: cadastre o administrador da plataforma." : "Entre com seu CPF e senha."}</p>

            <form onSubmit={first ? setup : submit} className="mt-6 space-y-4">
              {first && (
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} className="h-12 text-base" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" inputMode="numeric" autoComplete="username" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(formatCpf(e.target.value))} className="h-12 font-mono text-base" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw">Senha</Label>
                <div className="relative">
                  <Input id="pw" type={show ? "text" : "password"} autoComplete={first ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pr-11 text-base" />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Mostrar senha">
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={busy} className="h-12 w-full text-base font-semibold">
                {busy && <Loader2 className="size-4 animate-spin" />} {first ? "Cadastrar administrador" : "Entrar"}
              </Button>
              {!first && <button type="button" onClick={() => setForgot(true)} className="w-full text-center text-sm text-primary hover:underline">
                Esqueci minha senha
              </button>}
            </form>

          </div>
        </div>
      </div>

      <Dialog open={forgot} onOpenChange={setForgot}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Esqueceu a senha?</DialogTitle>
            <DialogDescription>
              Procure seu gestor ou o administrador do portal. Ele pode criar uma nova senha para você em poucos segundos.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
