import { describe, expect, it } from "vitest";
import { COLUNAS, parseBase } from "@/lib/base-oficial";

const head = COLUNAS.join(";");
const row = "35664: THALLIS DAMASCENO;MATRIZ;29/09/2026;1;11;12;0.75;9.00;0;0.75;0.00;0;3.75;0.00;1932;06:11;12:30;05:18;319;6.06;363.16;9.00;9.00;332.70";

describe("parseBase", () => {
  it("lê DD/MM/AAAA e valores oficiais sem recalcular", () => {
    const { linhas, erros } = parseBase(`${head}\n${row}`);
    expect(erros).toEqual([]);
    expect(linhas[0].data).toBe("2026-09-29");
    expect(linhas[0].caixas_por_hora).toBe(363.16);
    expect(linhas[0].pagamento_diario).toBe(9);
    expect(linhas[0].matricula).toBe("35664");
  });
  it("paletes = Total Mistos+LP + Total Gav. + Total Container", () => {
    const r = row.replace(";12;0.75;9.00;0;", ";12;0.75;9.00;3;").replace(";0.00;0;3.75;", ";0.00;2;3.75;");
    expect(parseBase(`${head}\n${r}`).linhas[0].paletes_total).toBe(17);
  });
  it("aceita vírgula decimal", () => {
    expect(parseBase(`${head}\n${row.replace("363.16", "363,16")}`).linhas[0].caixas_por_hora).toBe(363.16);
  });
  it("rejeita data inválida e linha duplicada (colaborador + data)", () => {
    const { linhas, erros } = parseBase(`${head}\n${row}\n${row}\n${row.replace("29/09/2026", "31/09/2026")}`);
    expect(linhas).toHaveLength(1);
    expect(erros.map((e) => e.linha)).toEqual([3, 4]);
  });
});
