import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Trophy, Upload, Users } from "lucide-react";
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
  { to: "/admin/produtividade", label: "Importar base", short: "Base", icon: Upload },
  { to: "/admin/ranking", label: "Ranking", icon: Trophy },
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
