import { useAuth } from "./auth";
import { useMe, useMyProd, summarize } from "./data";

export function useMyMonth(ym: string) {
  const { session } = useAuth();
  const me = useMe(session?.user.id);
  const prod = useMyProd(me.data?.id, ym);
  const rows = prod.data ?? [];
  return {
    me: me.data,
    rows,
    sum: summarize(rows),
    loading: me.isLoading || prod.isLoading,
    noProfile: !me.isLoading && !me.data,
  };
}
