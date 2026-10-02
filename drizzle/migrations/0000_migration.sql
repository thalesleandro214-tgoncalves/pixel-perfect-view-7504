
create type public.app_role as enum ('admin', 'auxiliar');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles or admin" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Colaboradores (auxiliares). user_id links to login account once provisioned.
create table public.colaboradores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  nome text not null,
  cpf text not null unique check (cpf ~ '^[0-9]{11}$'),
  matricula text,
  funcao text not null default 'Auxiliar de Logística',
  equipe text not null default 'Expedição',
  status text not null default 'ativo' check (status in ('ativo','inativo')),
  demo boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.colaboradores to authenticated;
grant all on public.colaboradores to service_role;
alter table public.colaboradores enable row level security;
create policy "self read" on public.colaboradores for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "admin insert" on public.colaboradores for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));
create policy "admin update" on public.colaboradores for update to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "admin delete" on public.colaboradores for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Configurações (single row)
create table public.configuracoes (
  id int primary key default 1 check (id = 1),
  meta_caixas_hora numeric not null default 90,
  tolerancia_meta numeric not null default 3,
  valor_por_caixa numeric not null default 0.112,
  bonus_percentual_acima_meta numeric not null default 0,
  updated_at timestamptz not null default now()
);
grant select, update on public.configuracoes to authenticated;
grant all on public.configuracoes to service_role;
alter table public.configuracoes enable row level security;
create policy "read config" on public.configuracoes for select to authenticated using (true);
create policy "admin update config" on public.configuracoes for update to authenticated
  using (public.has_role(auth.uid(), 'admin'));
insert into public.configuracoes (id) values (1);

-- Produtividade
create table public.produtividade (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references public.colaboradores(id) on delete cascade,
  data date not null,
  horas_trabalhadas numeric not null check (horas_trabalhadas > 0 and horas_trabalhadas <= 24),
  caixas_produzidas integer not null check (caixas_produzidas >= 0),
  caixas_por_hora numeric not null default 0,
  valor_gerado numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (colaborador_id, data)
);
create index on public.produtividade (data);
grant select, insert, update, delete on public.produtividade to authenticated;
grant all on public.produtividade to service_role;
alter table public.produtividade enable row level security;
create policy "self or admin read" on public.produtividade for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or colaborador_id in (select id from public.colaboradores where user_id = auth.uid()));
create policy "admin insert prod" on public.produtividade for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));
create policy "admin update prod" on public.produtividade for update to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "admin delete prod" on public.produtividade for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Automatic calculation from configurable parameters
create or replace function public.calc_produtividade()
returns trigger language plpgsql security definer set search_path = public as $$
declare c public.configuracoes;
begin
  select * into c from public.configuracoes where id = 1;
  new.caixas_por_hora := round(new.caixas_produzidas / new.horas_trabalhadas, 1);
  new.valor_gerado := round(new.caixas_produzidas * c.valor_por_caixa *
    (case when new.caixas_por_hora >= c.meta_caixas_hora then 1 + c.bonus_percentual_acima_meta/100 else 1 end), 2);
  return new;
end $$;
create trigger trg_calc_produtividade before insert or update of horas_trabalhadas, caixas_produzidas
  on public.produtividade for each row execute function public.calc_produtividade();

create or replace function public.recalcular_produtividade()
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'forbidden'; end if;
  update public.produtividade set horas_trabalhadas = horas_trabalhadas;
  get diagnostics n = row_count;
  return n;
end $$;

-- Ranking position for the signed-in auxiliar only (no colleague data exposed)
create or replace function public.minha_posicao_ranking(_inicio date, _fim date)
returns table(posicao integer, total integer) language sql stable security definer set search_path = public as $$
  with r as (
    select p.colaborador_id, sum(p.caixas_produzidas)/nullif(sum(p.horas_trabalhadas),0) as cxh
    from public.produtividade p join public.colaboradores c on c.id = p.colaborador_id
    where p.data between _inicio and _fim and c.status = 'ativo'
    group by p.colaborador_id
  ), ranked as (
    select colaborador_id, rank() over (order by cxh desc)::int as pos, count(*) over ()::int as tot from r
  )
  select pos, tot from ranked
  where colaborador_id = (select id from public.colaboradores where user_id = auth.uid())
$$;

-- Demo data (DEMONSTRATIVO)
insert into public.colaboradores (nome, cpf, matricula, equipe, demo) values
 ('Carlos Silva','52998224725','LG-1001','Expedição',true),
 ('Ana Pereira','12345678909','LG-1002','Expedição',true),
 ('Bruno Santos','98765432100','LG-1003','Separação',true),
 ('Juliana Costa','24681357928','LG-1004','Separação',true),
 ('Rafael Oliveira','13579246828','LG-1005','Conferência',true),
 ('Patrícia Lima','31415926590','LG-1006','Conferência',true),
 ('Marcos Souza','27182818205','LG-1007','Expedição',true),
 ('Fernanda Rocha','16180339805','LG-1008','Separação',true),
 ('Diego Almeida','14142135651','LG-1009','Conferência',true),
 ('Luciana Martins','17320508052','LG-1010','Expedição',true);

insert into public.produtividade (colaborador_id, data, horas_trabalhadas, caixas_produzidas)
select c.id, d::date, h.horas,
  greatest(200, round(h.horas * (base.b + (random()*20 - 10) + (extract(dow from d) = 1)::int * -4)))::int
from public.colaboradores c
cross join generate_series(current_date - 34, current_date, interval '1 day') d
cross join lateral (select (case when random() < 0.15 then 7 else 8 end)::numeric as horas) h
cross join lateral (select 78 + (abs(hashtext(c.cpf)) % 22) as b) base
where extract(dow from d) <> 0;
