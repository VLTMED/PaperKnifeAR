# PROJECT_MAP.md — PaperKnifeAR Planning Baseline

## Planning Gate

- **System date verified by shell:** `2026-05` via `date +%Y-%m`.
- **Planning role:** Staff Software Engineer / Tech Lead.
- **Scope basis:** The repository is treated as the project description because the prompt left `[أدخل وصف المشروع هنا]` empty.
- **Execution status:** Baseline planning is approved for surgical hardening only; changes must remain local-first, privacy-preserving, and PR-based rather than direct `main` pushes.

## Think Before Coding

### Explicit Assumptions

1. PaperKnifeAR is a privacy-first PDF utility for web/PWA and Android, where files remain local to the browser/device.
2. The intended project direction is to maintain and extend the current product, not to rewrite it.
3. Existing tools in `src/components/tools/` define the approved functional surface: merge, split, compress, protect, unlock, rotate, rearrange, page numbers, watermark, metadata, signature, grayscale, PDF-to-image, image-to-PDF, extract images, PDF-to-text, and repair.
4. Offline operation and no-server processing are non-negotiable product constraints.
5. Android support is delivered through Capacitor using the existing `dist` web output and native filesystem/share capabilities.
6. Any future changes must preserve AGPL licensing and avoid introducing trackers, hosted document processing, or remote PDF uploads.

### Open Ambiguities Requiring Approval

1. **Project target:** confirm whether the next phase is maintenance, dependency modernization, a specific new PDF tool, Android publishing work, or UX cleanup.
2. **Supported browser/Android baseline:** confirm minimum Android SDK/browser versions before upgrading React/Vite/Capacitor majors.
3. **Dependency policy:** confirm whether to pin exact versions for reproducibility or keep caret ranges with lockfile enforcement.
4. **Telemetry policy:** confirm whether all telemetry is forbidden. Default plan assumes no analytics and local-only diagnostic logging.

### Simplicity First Decision

- Do not introduce a backend, job queue, database, account system, cloud storage, or remote OCR.
- Keep feature modules self-contained unless logic is already repeated in at least two tools.
- Prefer small, surgical fixes over architectural rewrites.

## [TECH_STACK]

### Current Locked Stack From Repository

| Area | Package / Platform | Locked version | Role | Planning note |
| --- | --- | ---: | --- | --- |
| Runtime UI | React / React DOM | 18.3.1 | SPA rendering | Stable but behind React 19 line; upgrade requires compatibility pass. |
| Routing | react-router-dom | 7.13.0 | Hash-based client routes | Fits GitHub Pages/Capacitor; avoid BrowserRouter unless deployment changes. |
| Build | Vite | 5.4.21 | Web build/dev server | Major upgrade should be a separate milestone due plugin/build changes. |
| Language | TypeScript | 5.9.3 | Static typing | Current lock is modern; keep strict compile as release gate. |
| Mobile shell | Capacitor core/cli/android | 8.0.2 | Android packaging/native bridge | Major 8 already adopted in lockfile. |
| Native plugins | Filesystem / Share / Haptics / App | 8.x | Android filesystem/share UX | Keep Capacitor plugin majors aligned. |
| PDF parsing/rendering | pdfjs-dist | 5.4.530 | PDF loading, pages, thumbnails, text/image extraction | Worker is bundled through Vite; cMaps are local for offline use. |
| PDF writing/editing | pdf-lib | 1.17.1 | PDF mutation | Keep as shared core dependency for edit/security tools. |
| Encryption | @pdfsmaller/pdf-encrypt-lite | 1.0.1 | PDF password protection | Security-sensitive; validate against sample encrypted PDFs. |
| OCR/text tooling | tesseract.js | 7.0.0 | OCR-capable text workflows | Feature can be disabled by `VITE_DISABLE_OCR=true`. |
| Drag/drop sorting | @dnd-kit core/sortable/utilities | 6.3.1 / 10.0.0 / 3.2.2 | Rearrange pages | Keep localized to rearrange/page ordering UX. |
| ZIP packaging | jszip | 3.10.1 | Multi-output downloads | JSZip ships `./index.d.ts`; redundant `@types/jszip` removed. |
| UI utilities | lucide-react / sonner / Tailwind CSS | 0.446.0 / 2.0.7 / 3.4.19 | Icons, toast, styling | Tailwind major upgrade should be isolated. |
| PWA | vite-plugin-pwa | 1.2.0 | Potential PWA support | Present in lockfile but not currently wired into Vite config. |

### Dependency Reliability Protocol

- Shell date was verified as May 2026 before dependency review.
- `npm view` and direct `registry.npmjs.org` requests returned HTTP 403 in this environment, so npm registry verification must be repeated in a network environment with registry access before any upgrade PR.
- Official source checks that remain required before upgrades:
  1. npm package `latest` dist-tag for each dependency.
  2. GitHub releases/changelogs for React, Vite, Capacitor, React Router, PDF.js, pdf-lib, Tesseract.js, Tailwind CSS.
  3. Deprecated/package replacement status for future changes; `@types/jszip` was removed after local package metadata confirmed JSZip ships `./index.d.ts`.
- Do not upgrade across majors in the same PR as feature work.

## [SYSTEM_FLOW]

### Web/PWA User Journey — Verifiable Goals

1. User opens the SPA and sees a category-grouped tool list.
   - Goal: all implemented tools render with title, description, icon, route, and category.
2. User selects or drops a file.
   - Goal: a PDF file enters the in-memory pipeline without upload.
3. User selects a tool.
   - Goal: the target route receives the pipeline file or prompts for local file input.
4. Tool parses/renders PDF locally with `pdfjs-dist` and/or mutates output with `pdf-lib`.
   - Goal: no network request is needed for document contents, workers, or cMaps after app assets are available.
5. User previews or configures the output.
   - Goal: operation-specific validation blocks invalid inputs before processing.
6. User downloads or shares result.
   - Goal: web uses Blob/object URLs/Web Share API fallback; Android uses Capacitor Filesystem/Share.

### Android User Journey — Verifiable Goals

1. Capacitor launches the built `dist` app.
   - Goal: app ID `com.paperknifeAR.app` loads the same route tree.
2. User imports a local document.
   - Goal: document is available to the selected tool without server round-trip.
3. User saves or shares output.
   - Goal: Filesystem writes to Documents or Cache and duplicate names are resolved safely.

### API/Data Flow

```text
Local File/Input
  -> PipelineProvider / tool-local state
  -> pdfjs-dist document loading + local cMaps + bundled worker
  -> tool-specific operation using pdf-lib/pdfjs/canvas/tesseract/jszip
  -> Uint8Array | Blob | data URL
  -> downloadFile/shareFile
  -> Browser download/Web Share OR Capacitor Filesystem/Share
```

## [ARCHITECTURE]

### Existing Feature Slices

- `src/App.tsx`: route registry, tool metadata, providers, app-level platform/view behavior.
- `src/components/tools/`: domain tools. Keep each complete tool in one feature component unless size or repeated logic justifies extraction.
- `src/components/tools/shared/`: repeated tool UI only: headers, success state, privacy badge, native layout.
- `src/utils/`: shared infrastructure and cross-tool utilities such as PDF helpers, pipeline context, persistence, haptics, recent activity, object URL lifecycle, and view mode context.
- `src/i18n/`: Arabic/English strings.
- `public/cmaps/`: local PDF.js character maps for offline rendering.
- `android/`: Capacitor Android shell and native project files.
- `fastlane/metadata/`: Android store metadata/changelogs.

### Surgical Architecture Rules

1. **Feature-first:** new user-facing capabilities live under `src/components/tools/<ToolName>.tsx` and are registered once in `src/App.tsx`.
2. **Shared only when repeated:** move logic to `src/utils/` or `src/components/tools/shared/` only after at least two tools need it.
3. **No micro-files:** avoid splitting helper files by single function. Group cohesive PDF IO/render/download helpers together.
4. **No hidden network dependency:** workers, cMaps, fonts, and processing assets must be local or explicitly approved.
5. **Memory safety:** release object URLs, clear canvases, chunk base64 conversion, and avoid loading all pages at full resolution unless required.
6. **Platform boundary:** isolate Android-only behavior behind Capacitor checks; keep browser path as the default.

### Proposed Minimal Boundaries

- `App shell`: routing, providers, theme/view mode, global drag/drop.
- `Tool feature`: UI state, validation, invocation of PDF operations.
- `PDF core utilities`: load, render, metadata, download/share, unlock helpers.
- `Persistence utilities`: recent activity and workspace state only if local and privacy-preserving.

## Safe Logging Protocol

### Current Constraint

- Logging must never upload files, filenames, page text, document metadata, passwords, or stack traces containing user content.

### Implemented Non-Blocking Logger Design

- `src/utils/logger.ts` provides a tiny client-side logger with levels: `debug`, `info`, `warn`, `error`.
- Default level: `warn` in production, `debug` in development.
- Logs are queued in memory and flushed asynchronously with `queueMicrotask` to `console`, with no persistence and no remote sink.
- Direct ad hoc `console.*` calls in app/tool utilities have been routed through the logger so failures remain visible without leaking raw stacks.
- Redaction contract:
  - Replace filenames with extension and size bucket only.
  - Never log PDF text, metadata fields, passwords, base64, Blob URLs, or full file paths.
- Performance contract:
  - Logging failures are swallowed.
  - No logger call may block PDF processing or rendering.
  - No remote sink without explicit approval.

## No Feature Creep Guardrails

### In Scope

- Maintain current local PDF tools.
- Fix bugs and improve reliability/performance of existing flows.
- Dependency updates only when verified and tested.
- Android/web parity for existing functionality.

### Out of Scope Until Explicitly Approved

- Cloud processing, accounts, subscriptions, collaborative editing, document storage, remote OCR, analytics/tracking, AI document analysis, full PDF editor canvas, template marketplace, or backend APIs.

## Milestones — Verifiable Goals

### Milestone 0 — Approval Gate

- Confirm project target and ambiguity answers.
- Goal: written approval identifies the next implementation objective.

### Milestone 1 — Baseline Health Check

- Run `npm run build` and any available lint/test checks.
- Goal: reproducible baseline result documented before modifying behavior.

### Milestone 2 — Dependency Verification

- Re-run official npm/GitHub checks from an environment without registry/API 403.
- Goal: dependency table updated with current stable `latest` and deprecated status.

### Milestone 3 — Targeted Implementation

- Implement only the approved objective using existing feature boundaries.
- Goal: one PR maps code changes to one user-verifiable outcome.

### Milestone 4 — Regression Suite

- Validate web build, Android build path where available, and at least one sample PDF per affected tool.
- Goal: no privacy regression, no remote file transfer, no broken route/tool registration.

### Milestone 5 — Release Readiness

- Update changelog/store metadata only if user-visible behavior changed.
- Goal: release notes are accurate, minimal, and tied to verified behavior.

## [ORPHANS & PENDING]

1. `vite-plugin-pwa` is installed but not wired into `vite.config.ts`; decide whether to remove or configure in a separate PWA milestone.
2. npm/GitHub latest-version verification is pending because local npm registry calls still return HTTP 403.
3. Minimum Android/browser support policy is not documented in the repo.
4. No automated PDF fixture suite is visible; add only after a concrete maintenance/testing milestone is approved.
