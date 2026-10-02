import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { LogOut, type LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";

export type NavItem = { to: string; label: string; short?: string; icon: LucideIcon; exact?: boolean };

export function AppShell({ nav, subtitle, children }: { nav: NavItem[]; subtitle: string; children: ReactNode }) {
  const { signOut } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const logout = async () => {
    await qc.cancelQueries();
    qc.clear();
    await signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="stripe-top h-1 opacity-60" />
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="grid size-10 place-items-center rounded-xl bg-sidebar-primary font-display text-lg text-sidebar-primary-foreground">B</div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Portal de Produtividade</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] opacity-70">Brasal · Logística</div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.exact }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium opacity-80 transition hover:bg-sidebar-accent hover:opacity-100"
              activeProps={{ className: "!bg-sidebar-primary !text-sidebar-primary-foreground !opacity-100" }}
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="p-4">
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm opacity-80 hover:bg-sidebar-accent hover:opacity-100">
            <LogOut className="size-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 border-b border-foreground/5 bg-card/70 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-[560px] items-center gap-3 px-4 py-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary font-display text-primary-foreground">B</div>
          <div className="min-w-0 leading-none">
            <div className="truncate text-[14px] font-semibold tracking-tight">Portal de Produtividade</div>
            <div className="truncate font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/45">{subtitle}</div>
          </div>
          <button onClick={logout} aria-label="Sair" className="ml-auto rounded-full p-2 text-foreground/60 hover:bg-muted">
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-[560px] px-4 pb-32 lg:max-w-6xl lg:px-8 lg:pb-12 lg:pt-6">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-foreground/5 bg-card/85 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-[560px]" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0,1fr))` }}>
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.exact }} className="group flex flex-col items-center gap-1 py-2.5 text-foreground/45" activeProps={{ className: "!text-primary" }}>
              <n.icon className="size-[18px]" />
              <span className="font-mono text-[9px] uppercase tracking-[0.12em]">{n.short ?? n.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
