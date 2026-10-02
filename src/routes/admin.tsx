import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ClipboardList, LayoutDashboard, Settings, Trophy, Users } from "lucide-react";
import { Gate } from "@/components/portal/Gate";
import { AppShell, type NavItem } from "@/components/portal/AppShell";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel do gestor · Portal Logístico" },
      { name: "description", content: "Indicadores da equipe, cadastro de auxiliares, produtividade e ranking." },
      { property: "og:title", content: "Painel do gestor · Portal Logístico" },
      { property: "og:description", content: "Indicadores da equipe, cadastro de auxiliares, produtividade e ranking." },
    ],
  }),
  component: Layout,
});

const nav: NavItem[] = [
  { to: "/admin", label: "Painel", icon: LayoutDashboard, exact: true },
  { to: "/admin/auxiliares", label: "Auxiliares", short: "Equipe", icon: Users },
  { to: "/admin/produtividade", label: "Produtividade", short: "Lançar", icon: ClipboardList },
  { to: "/admin/ranking", label: "Ranking", icon: Trophy },
  { to: "/admin/config", label: "Configurações", short: "Config", icon: Settings },
];

function Layout() {
  return (
    <Gate role="admin">
      <AppShell nav={nav} subtitle="Área do gestor">
        <Outlet />
      </AppShell>
    </Gate>
  );
}
