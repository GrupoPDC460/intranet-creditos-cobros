-- ============================================================================
-- Intranet Créditos & Cobros · Grupo PDC — Esquema de base de datos (Supabase)
-- Ejecuta este archivo completo en: Supabase → SQL Editor → New query → Run.
-- Crea las tablas, políticas y carga el contenido de ejemplo.
-- ============================================================================

-- ---------- Tablas ----------

create table if not exists public.categories (
  id          text primary key,
  name        text not null,
  slug        text not null,
  description text,
  icon        text,
  "order"     integer not null default 0,
  active      boolean not null default true
);

create table if not exists public.subcategories (
  id          text primary key,
  category_id text not null references public.categories(id) on delete cascade,
  name        text not null,
  slug        text not null,
  "order"     integer not null default 0
);

create table if not exists public.resources (
  id             text primary key,
  name           text not null,
  description    text,
  url            text not null,
  category_id    text not null references public.categories(id) on delete cascade,
  subcategory_id text references public.subcategories(id) on delete set null,
  type           text not null default 'otro',
  icon           text,
  image_url      text,
  "order"        integer not null default 0,
  active         boolean not null default true,
  featured       boolean not null default false,
  open_in_new_tab boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_resources_category on public.resources(category_id);
create index if not exists idx_subcategories_category on public.subcategories(category_id);

-- ---------- Row Level Security ----------
-- La app escribe con la SERVICE ROLE KEY (omite RLS). Habilitamos lectura pública
-- por si en el futuro se usa la anon key para leer desde el cliente.

alter table public.categories    enable row level security;
alter table public.subcategories enable row level security;
alter table public.resources     enable row level security;

drop policy if exists "public read categories" on public.categories;
drop policy if exists "public read subcategories" on public.subcategories;
drop policy if exists "public read resources" on public.resources;

create policy "public read categories"    on public.categories    for select using (true);
create policy "public read subcategories" on public.subcategories for select using (true);
create policy "public read resources"     on public.resources     for select using (true);

-- ---------- Semilla ----------

insert into public.categories (id, name, slug, description, icon, "order", active) values
  ('cat_cobros','Cobros','cobros','Cartera vigente y vencida, gestión y seguimiento de cobranza.','wallet',1,true),
  ('cat_venta','Venta Directa','venta-directa','Herramientas y tableros del canal de venta directa.','shopping-bag',2,true),
  ('cat_credito','Crédito','credito','Análisis, otorgamiento y políticas de crédito.','landmark',3,true),
  ('cat_operaciones','Operaciones','operaciones','Sistemas operativos, tableros y documentación de proceso.','settings-2',4,true),
  ('cat_admin','Administración','administracion','Recursos, documentación y herramientas de soporte.','briefcase',5,true)
on conflict (id) do nothing;

insert into public.subcategories (id, category_id, name, slug, "order") values
  ('sub_cob_sistemas','cat_cobros','Sistemas','sistemas',1),
  ('sub_cob_dashboards','cat_cobros','Dashboards','dashboards',2),
  ('sub_cob_reportes','cat_cobros','Reportes','reportes',3),
  ('sub_cob_onedrive','cat_cobros','OneDrive','onedrive',4),
  ('sub_cob_docs','cat_cobros','Documentación','documentacion',5),
  ('sub_vd_sistemas','cat_venta','Sistemas','sistemas',1),
  ('sub_vd_dashboards','cat_venta','Dashboards','dashboards',2),
  ('sub_vd_reportes','cat_venta','Reportes','reportes',3),
  ('sub_vd_herramientas','cat_venta','Herramientas','herramientas',4),
  ('sub_cr_sistemas','cat_credito','Sistemas','sistemas',1),
  ('sub_cr_dashboards','cat_credito','Dashboards','dashboards',2),
  ('sub_cr_reportes','cat_credito','Reportes','reportes',3),
  ('sub_op_sistemas','cat_operaciones','Sistemas','sistemas',1),
  ('sub_op_dashboards','cat_operaciones','Dashboards','dashboards',2),
  ('sub_op_docs','cat_operaciones','Documentación','documentacion',3),
  ('sub_ad_recursos','cat_admin','Recursos','recursos',1),
  ('sub_ad_docs','cat_admin','Documentación','documentacion',2),
  ('sub_ad_herramientas','cat_admin','Herramientas','herramientas',3)
on conflict (id) do nothing;

insert into public.resources
  (id, name, description, url, category_id, subcategory_id, type, "order", active, featured, open_in_new_tab)
values
  ('res_powerbi','Power BI','Servicio de tableros analíticos de la operación.','https://app.powerbi.com','cat_cobros','sub_cob_dashboards','powerbi',1,true,true,true),
  ('res_dash_cartera','Dashboard de Cartera','Consulta de cartera vigente y vencida por tramo de mora.','https://app.powerbi.com','cat_cobros','sub_cob_dashboards','dashboard',2,true,true,true),
  ('res_kace','KACE','Mesa de servicio y gestión de tickets de soporte.','https://www.quest.com/products/kace-systems-management-appliance/','cat_operaciones','sub_op_sistemas','sistema',1,true,true,true),
  ('res_onedrive_cobros','OneDrive Cobros','Carpeta operativa compartida del equipo de cobros.','https://www.microsoft365.com/launch/onedrive','cat_cobros','sub_cob_onedrive','onedrive',1,true,true,true),
  ('res_sharepoint','SharePoint Créditos & Cobros','Sitio documental del departamento.','https://www.microsoft365.com/launch/sharepoint','cat_admin','sub_ad_docs','sharepoint',1,true,true,true),
  ('res_reporte_diario','Reporte Diario de Gestión','Excel con el consolidado diario de gestión de cobranza.','https://www.microsoft365.com/launch/excel','cat_cobros','sub_cob_reportes','excel',1,true,true,true),
  ('res_teams_cobros','Teams · Cobros CARD','Canal de coordinación del equipo de cobros.','https://teams.microsoft.com','cat_cobros','sub_cob_docs','teams',2,true,false,true),
  ('res_dash_vd','Dashboard Venta Directa','Indicadores de desempeño del canal de venta directa.','https://app.powerbi.com','cat_venta','sub_vd_dashboards','dashboard',1,true,false,true),
  ('res_formulario_convenio','Formulario de Convenio de Pago','Registro de convenios de pago con representantes.','https://forms.office.com','cat_cobros','sub_cob_sistemas','formulario',3,true,false,true),
  ('res_politicas_credito','Políticas de Crédito','Documento vigente de políticas de otorgamiento.','https://www.microsoft365.com/launch/word','cat_credito','sub_cr_sistemas','documento',1,true,false,true),
  ('res_dash_credito','Dashboard de Crédito','Aprobaciones, rechazos y exposición por país.','https://app.powerbi.com','cat_credito','sub_cr_dashboards','dashboard',2,true,false,true),
  ('res_manual_operaciones','Manual de Operaciones','Procedimientos operativos del departamento.','https://www.microsoft365.com/launch/sharepoint','cat_operaciones','sub_op_docs','documento',1,true,false,true)
on conflict (id) do nothing;
