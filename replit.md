# PaperKnife

A privacy-focused, 100% offline PDF utility that runs entirely in the browser — merge, split, compress, sign, and sanitize PDFs without data leaving the device.

## Run & Operate

- **Dev:** `npm run dev` (port 5000)
- **Build:** `npm run build` (outputs to `dist/`)
- **Lint:** `npm run lint`

## Stack

- React 18 + TypeScript
- Vite 5 (build tool)
- Tailwind CSS 3
- pdf-lib, pdfjs-dist, tesseract.js (PDF processing + OCR)
- Capacitor 8 (Android bridge)

## Where things live

- `src/` — main React/TS source
- `src/components/tools/` — individual PDF tool UIs (Merge, Split, Compress, etc.)
- `src/utils/` — PDF processing helpers and contexts
- `src/i18n/` — translations (English, Arabic)
- `public/` — static assets (fonts, cmaps, icons)
- `android/` — native Android/Capacitor project
- `vite.config.ts` — build & dev server config
- `tailwind.config.js` — styling config

## Architecture decisions

- Fully client-side: all PDF operations run in-browser via pdf-lib/pdfjs; no server needed
- Capacitor bridges the web app to Android without a separate native codebase
- Vite manual chunks split heavy libs (pdf-lib, pdfjs, tesseract) for better load performance
- PWA-ready via vite-plugin-pwa for offline use

## Product

Offline PDF tools: Merge, Split, Compress, Encrypt/Decrypt, Sign, OCR, Sanitize, Convert.

## User preferences

_Populate as you build_

## Gotchas

- Capacitor CLI requires Node >= 22; current environment uses Node 20 (warnings only, web build unaffected)
- `VITE_BASE` env var controls the base URL path (defaults to `./`)

## Pointers

- [pdf-lib docs](https://pdf-lib.js.org/)
- [pdfjs-dist docs](https://mozilla.github.io/pdf.js/)
- [Capacitor docs](https://capacitorjs.com/docs)
