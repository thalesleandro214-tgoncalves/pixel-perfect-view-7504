DROP TRIGGER IF EXISTS trg_calc_produtividade ON public.produtividade;
COMMENT ON FUNCTION public.calc_produtividade() IS 'DEPRECATED: values now come from the official base import';
COMMENT ON FUNCTION public.recalcular_produtividade() IS 'DEPRECATED: values now come from the official base import';
COMMENT ON TABLE public.configuracoes IS 'DEPRECATED: manual parameters removed; official base is the source';

ALTER TABLE public.colaboradores ALTER COLUMN cpf DROP NOT NULL;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS nome_base text, ADD COLUMN IF NOT EXISTS unidade text;
CREATE UNIQUE INDEX IF NOT EXISTS colaboradores_nome_base_key ON public.colaboradores(nome_base);
CREATE UNIQUE INDEX IF NOT EXISTS colaboradores_cpf_key ON public.colaboradores(cpf) WHERE cpf IS NOT NULL;

ALTER TABLE public.produtividade
  ADD COLUMN IF NOT EXISTS unidade text,
  ADD COLUMN IF NOT EXISTS lp_duplo numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mistos numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_mistos_lp numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_mistos numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_mistos_rs numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_gav numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_gaveta numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_gaveta_rs numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_container numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_container numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_container_rs numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paletes_total numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inicio_montagem text,
  ADD COLUMN IF NOT EXISTS termino_montagem text,
  ADD COLUMN IF NOT EXISTS duracao_operacao text,
  ADD COLUMN IF NOT EXISTS minutos numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cx_m numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pagamento_diario numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS acumulado_periodo numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cxh_media_periodo numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS importacao_id uuid;
COMMENT ON COLUMN public.produtividade.valor_gerado IS 'DEPRECATED: replaced by pagamento_diario';
CREATE UNIQUE INDEX IF NOT EXISTS produtividade_colab_data_key ON public.produtividade(colaborador_id, data);

CREATE TABLE public.importacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arquivo text NOT NULL,
  usuario_id uuid,
  total_linhas integer NOT NULL DEFAULT 0,
  inseridos integer NOT NULL DEFAULT 0,
  atualizados integer NOT NULL DEFAULT 0,
  inalterados integer NOT NULL DEFAULT 0,
  invalidos integer NOT NULL DEFAULT 0,
  erros jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.importacoes TO authenticated;
GRANT ALL ON public.importacoes TO service_role;
ALTER TABLE public.importacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read imports" ON public.importacoes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.minha_posicao_ranking(_inicio date, _fim date)
 RETURNS TABLE(posicao integer, total integer)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  with r as (
    select p.colaborador_id, sum(p.caixas_produzidas)/nullif(sum(p.minutos)/60.0,0) as cxh
    from public.produtividade p join public.colaboradores c on c.id = p.colaborador_id
    where p.data between _inicio and _fim and c.status = 'ativo'
    group by p.colaborador_id
  ), ranked as (
    select colaborador_id, rank() over (order by cxh desc nulls last)::int as pos, count(*) over ()::int as tot from r
  )
  select pos, tot from ranked
  where colaborador_id = (select id from public.colaboradores where user_id = auth.uid())
$$;