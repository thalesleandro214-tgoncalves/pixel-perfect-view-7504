import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BarChart3, History, Home, User } from "lucide-react";
import { Gate } from "@/components/portal/Gate";
import { AppShell, type NavItem } from "@/components/portal/AppShell";
import { currentMonth, monthLabel } from "@/lib/format";

export const Route = createFileRoute("/app")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Minha produtividade · Portal Logístico" },
      { name: "description", content: "Seus indicadores de caixas por hora e valor gerado." },
      { property: "og:title", content: "Minha produtividade · Portal Logístico" },
      { property: "og:description", content: "Seus indicadores de caixas por hora e valor gerado." },
    ],
  }),
  component: Layout,
});

const nav: NavItem[] = [
  { to: "/app", label: "Início", icon: Home, exact: true },
  { to: "/app/desempenho", label: "Desempenho", short: "Desemp.", icon: BarChart3 },
  { to: "/app/historico", label: "Histórico", short: "Hist.", icon: History },
  { to: "/app/perfil", label: "Perfil", icon: User },
];

function Layout() {
  return (
    <Gate role="auxiliar">
      <AppShell nav={nav} subtitle={`Brasal · ${monthLabel(currentMonth())}`}>
        <Outlet />
      </AppShell>
    </Gate>
  );
}
