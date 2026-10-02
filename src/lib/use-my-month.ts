import { useAuth } from "./auth";
import { useConfig, useMe, useMyProd, summarize } from "./data";

export function useMyMonth(ym: string) {
  const { session } = useAuth();
  const me = useMe(session?.user.id);
  const cfg = useConfig();
  const prod = useMyProd(me.data?.id, ym);
  const rows = prod.data ?? [];
  return {
    me: me.data,
    cfg: cfg.data,
    rows,
    sum: summarize(rows),
    loading: me.isLoading || cfg.isLoading || prod.isLoading,
    noProfile: !me.isLoading && !me.data,
  };
}
