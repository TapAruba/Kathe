// Alta de Silver House Barber · Estudio en el dashboard de Tap Aruba (app.taparuba.com).
// Mismo patrón que scripts/onboard-hotwheels.mjs de tap-platform: org + experiencia "web".
//
//   OWNER_EMAIL=dueno@ejemplo.com node tap-aruba/onboard-silverhouse.mjs [ruta/a/.env.local]
//
// Lee NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY del entorno o del .env.local
// indicado (por defecto ../tap-platform/.env.local). Escribe en la base de producción:
// correrlo solo una vez decidido el email del dueño. Es idempotente: si se vuelve a
// correr, actualiza en lugar de duplicar.
//
// El sitio (silverhouse-barber/index.html, TAP_SITE) ya manda visitas y reservas con el
// slug EXP_SLUG. Si se crea el cliente desde HQ en lugar de este script, el slug que HQ
// genera es otro: copiarlo a TAP_SITE en el sitio.
import { readFileSync, existsSync } from 'node:fs';

const envFile = process.argv[2] || new URL('../../tap-platform/.env.local', import.meta.url).pathname;
if (existsSync(envFile)) {
  readFileSync(envFile, 'utf8').split('\n').forEach((l) => {
    const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, '');
  });
}
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP = process.env.NEXT_PUBLIC_APP_URL || 'https://app.taparuba.com';
const OWNER_EMAIL = (process.env.OWNER_EMAIL || '').trim().toLowerCase();
if (!URL_ || !KEY) { console.error('Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.'); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

const api = async (path, opts = {}) => {
  const r = await fetch(`${URL_}${path}`, { ...opts, headers: { ...H, ...(opts.headers || {}) } });
  const text = await r.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  if (!r.ok) throw Object.assign(new Error(`${r.status} ${path} → ${text.slice(0, 400)}`), { status: r.status, body });
  return body;
};

const ORG_SLUG = 'silverhouse-barber';
const EXP_SLUG = 'silverhouse-web';
const SITE = 'silverhouse-barber-demo.vercel.app'; // cambiar por el dominio propio cuando exista
const NAME = 'Silver House Barber · Estudio';

// ---------- 1. org ----------
let [org] = await api(`/rest/v1/orgs?slug=eq.${ORG_SLUG}&select=id,name,settings,branding`);
const settings = {
  ...(org?.settings || {}),
  type: 'Salon & Spa', plan: org?.settings?.plan || 'Starter',
  phone: '+54 9 11 3697-0220', website: SITE,
  address: 'Av. La Plata 1185, CABA, Argentina',
  timezone: 'America/Argentina/Buenos_Aires',
};
// Look "pro": logo y color del negocio sobre el dashboard oscuro, "Powered by Tap Aruba" abajo.
const branding = {
  ...(org?.branding || {}),
  dashboard: 'pro', primary: '#C9A86A',
  logo: `https://${SITE}/silverhouse-logo-480.webp`,
};
if (org) {
  await api(`/rest/v1/orgs?id=eq.${org.id}`, { method: 'PATCH', body: JSON.stringify({ name: NAME, settings, branding }) });
  console.log('org actualizada', org.id);
} else {
  [org] = await api('/rest/v1/orgs', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ slug: ORG_SLUG, name: NAME, settings, branding }) });
  console.log('org creada', org.id);
}
const orgId = org.id;

// ---------- 2. experiencia web (visitas + clientes potenciales) ----------
const expBody = {
  engine: 'web', name: 'Silver House · Sitio web', preset: 'business_site', status: 'active',
  config: { domain: SITE, kind: 'Business', analytics: 'taparuba', accent: '#C9A86A' },
};
const [exp] = await api(`/rest/v1/experiences?slug=eq.${EXP_SLUG}&select=id,org_id`);
if (exp && exp.org_id !== orgId) { console.error(`El slug ${EXP_SLUG} ya es de otra org (${exp.org_id}). No toco nada más.`); process.exit(1); }
if (exp) {
  await api(`/rest/v1/experiences?id=eq.${exp.id}`, { method: 'PATCH', body: JSON.stringify(expBody) });
  console.log('experiencia actualizada', EXP_SLUG, exp.id);
} else {
  const [c] = await api('/rest/v1/experiences', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ org_id: orgId, slug: EXP_SLUG, ...expBody }) });
  console.log('experiencia creada', EXP_SLUG, c.id);
}

// ---------- 3. módulo ----------
try {
  await api('/rest/v1/org_products', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates' }, body: JSON.stringify({ org_id: orgId, product_key: 'website', enabled: true }) });
} catch (e) { console.log('  módulo omitido:', String(e).slice(0, 90)); }

// ---------- 4. acceso del dueño (como "Add a client" en HQ) ----------
if (!OWNER_EMAIL) {
  console.log('\nSin OWNER_EMAIL: falta crear el acceso del dueño. Volver a correr con OWNER_EMAIL=...');
} else {
  let uid;
  try {
    const u = await api('/auth/v1/admin/users', { method: 'POST', body: JSON.stringify({ email: OWNER_EMAIL, email_confirm: true, user_metadata: { full_name: `${NAME} Owner` } }) });
    uid = u.id || u.user?.id;
    console.log('usuario creado', OWNER_EMAIL);
  } catch (e) {
    if (!/already|exists|registered/i.test(String(e))) throw e;
    for (let page = 1; !uid && page <= 20; page++) {
      const l = await api(`/auth/v1/admin/users?page=${page}&per_page=200`);
      const users = l.users || [];
      uid = users.find((x) => (x.email || '').toLowerCase() === OWNER_EMAIL)?.id;
      if (users.length < 200) break;
    }
    if (!uid) throw new Error('El email ya existe pero no lo encontré en la lista de usuarios.');
    console.log('el email ya tenía cuenta: se vincula a este negocio');
  }
  // El dashboard abre el primer negocio del usuario: avisar si ya pertenece a otro.
  const others = await api(`/rest/v1/memberships?user_id=eq.${uid}&org_id=neq.${orgId}&select=org_id,role`);
  if (others.length) console.log(`  OJO: este email ya es miembro de ${others.length} negocio(s) más; conviene un email propio del dueño.`);
  await api('/rest/v1/profiles?on_conflict=id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ id: uid, email: OWNER_EMAIL, full_name: `${NAME} Owner` }) });
  await api('/rest/v1/memberships?on_conflict=user_id,org_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ user_id: uid, org_id: orgId, role: 'client_admin' }) });
  const link = await api('/auth/v1/admin/generate_link', { method: 'POST', body: JSON.stringify({ type: 'recovery', email: OWNER_EMAIL, redirect_to: `${APP}/account/reset` }) });
  const hashed = link.hashed_token || link.properties?.hashed_token;
  console.log('\nLink para que el dueño cree su contraseña (mandarlo por WhatsApp):');
  console.log(hashed ? `${APP}/account/reset?token_hash=${hashed}&type=recovery` : (link.action_link || link.properties?.action_link));
}

console.log('\nORG ID:', orgId);
console.log(`Sitio → TAP_SITE = '${EXP_SLUG}' (ya configurado en silverhouse-barber/index.html)`);
