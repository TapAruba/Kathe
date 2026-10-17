# Silver House Barber · Estudio — sitio web

Sitio estático de una sola página (`index.html`), sin build ni dependencias externas obligatorias.
Las animaciones son CSS livianas (sin librerías) y las tipografías están incluidas en el propio sitio, así que no depende de ningún CDN.

```
silverhouse-barber/
├── index.html              ← todo el sitio (HTML + CSS + JS)
├── fonts/                  ← Cinzel, Cormorant Garamond, Hanken Grotesk, Space Mono (auto-alojadas)
├── img/
│   ├── estudio/            ← fotos reales del local (hero y sección "El Estudio")
│   ├── paquetes/           ← fotos de cada paquete (Unsplash, ver CREDITS.md): originales + recortes -800/-1200 y miniaturas -thumb
│   └── og-silverhouse.jpg  ← imagen para compartir en WhatsApp / redes
├── silverhouse-logo.png    ← logo original (lo usa Google vía JSON-LD)
├── silverhouse-logo-192.webp ← logo liviano para header y pie
├── favicon-32.png, apple-touch-icon.png ← íconos del navegador / celular
├── silverhouse-badge.jpg   ← sello original
├── silverhouse-badge-276.webp ← sello liviano del banner
└── SITE_INVENTORY.md       ← qué hay en el sitio y dónde se edita cada cosa
```

## Ver en local

```bash
cd silverhouse-barber
python3 -m http.server 8000   # abrir http://localhost:8000
```

## Publicar en Vercel

1. En vercel.com → **Add New… → Project** → importar el repo de GitHub `danieljoseguerramontalvo-bot/Kathe`
   (o, en el proyecto existente `silverhousebarber`, **Settings → Git** → conectar este repo).
2. Configuración del proyecto:
   - **Root Directory:** `silverhouse-barber`
   - **Framework Preset:** `Other`
   - **Build Command / Output Directory / Install Command:** vacíos
3. **Deploy.** Cada push a la rama de producción vuelve a publicar el sitio.

Alternativa sin Git: arrastrar la carpeta `silverhouse-barber/` a vercel.com/new (o `npx vercel --prod` dentro de la carpeta).
El archivo `.vercelignore` evita publicar las capturas y los `.md`.

## Dashboard de Tap Aruba

El sitio está conectado al dashboard de Tap Aruba (app.taparuba.com), igual que los demás negocios:

- **Visitas:** al abrir la página se manda una visita a `app.taparuba.com/api/track`. Se ve en el dashboard, en **Resumen** y **Sitio web**.
- **Reservas:** al tocar "Confirmar por WhatsApp" se manda una copia de la reserva a `app.taparuba.com/api/leads`. Se ve en **Sitio web → Clientes potenciales**. WhatsApp se abre igual que antes.
- Se configura en `index.html` → `TAP_SITE` (hoy `silver-house-barber-estudio-website`, el slug de la experiencia "web" que crea HQ). Si queda vacío, no se manda nada. En localhost tampoco se manda nada.
- **Alta del negocio:** `tap-aruba/onboard-silverhouse.mjs`. Necesita las claves de Supabase de tap-platform y el email del dueño. Si se da de alta desde HQ (pasos en `docs/Silver-House-Pasos-para-activar.pdf`), el slug es el mismo; solo si HQ le agrega un sufijo hay que copiarlo a `TAP_SITE`.
- **Guía del dueño (español):** `docs/Silver-House-Guia-del-Dashboard.pdf` y `docs/Silver-House-Que-Incluye.pdf`. La fuente está en `docs/guia-dashboard/`; se regenera con `node build.js guia.html ../Silver-House-Guia-del-Dashboard.pdf`.
