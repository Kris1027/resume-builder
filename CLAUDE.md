# Resume Builder

A resume builder built with React, TypeScript, and TanStack Router. Supports multiple templates, dark mode, i18n (PL/EN), PDF export/import, and PWA with offline support.

**Every new feature MUST be documented in this file.**

## Requirements

- **Node.js**: >=20.19 (`.nvmrc` pinned to 22)
- **Package manager**: pnpm

## Environment Variables

Copy `.env.example` to `.env`:

| Variable        | Description                          | Default                 |
| --------------- | ------------------------------------ | ----------------------- |
| `VITE_SITE_URL` | Base site URL (used for SEO/OG tags) | `http://localhost:5173` |

## Scripts

```bash
pnpm run dev      # Dev server at http://localhost:5173/
pnpm run build    # Production build to dist/
pnpm run preview  # Preview production build
pnpm lint         # TypeScript + ESLint checks
pnpm format       # Format all files with Prettier
pnpm format:check # Check formatting (CI uses this)
pnpm test         # Run all tests once
pnpm test:watch   # Run tests in watch mode
pnpm test:coverage # Run tests with coverage report
pnpm pre-commit   # Format + lint + test + tsc + build (run before every commit)
```

**Always run `pnpm pre-commit` before creating a commit.** Do not commit if it fails.

## Project Structure

```
src/
├── components/
│   ├── ui/                # Base UI components (shadcn/ui style)
│   ├── form-sections/     # CV form section components
│   │   ├── personal-info-section.tsx
│   │   ├── experience-section.tsx
│   │   ├── education-section.tsx
│   │   ├── skills-section.tsx
│   │   ├── languages-section.tsx
│   │   ├── interests-section.tsx
│   │   └── gdpr-consent-section.tsx
│   ├── templates/         # CV render templates (developer, default, veterinary)
│   ├── template-previews/ # Template preview cards
│   ├── pwa-reload-prompt.tsx   # SW update notification
│   ├── pwa-install-prompt.tsx  # Browser install prompt
│   └── offline-indicator.tsx   # Offline status banner
├── contexts/              # React Context providers (theme)
├── data/                  # Sample data, type interfaces for CV data
├── hooks/                 # Custom hooks (use-theme)
├── lib/                   # Utilities (pdf-parser, helpers)
├── locales/               # i18n translations (en/, pl/)
├── pages/                 # Page components
│   ├── builder-page.tsx   # Main form builder
│   ├── preview-page.tsx   # CV preview + PDF export
│   ├── templates-page.tsx # Template gallery
│   └── template-page.tsx  # Single template preview
├── routes/                # TanStack Router route definitions
├── schemas/               # Zod validation schemas (cv-schema)
└── types/                 # TypeScript types (form-types, form-component-types, theme)
```

## Routes

| Path                     | Description                 |
| ------------------------ | --------------------------- |
| `/`                      | Home page                   |
| `/templates`             | Template selection gallery  |
| `/templates/:templateId` | Individual template preview |
| `/builder`               | CV form builder             |
| `/preview`               | CV preview with PDF export  |

## Tech Stack

- **Framework**: React + TypeScript (strict mode)
- **Build**: Vite
- **Package Manager**: pnpm
- **Routing**: TanStack Router
- **Forms**: TanStack Form
- **Styling**: Tailwind CSS
- **Validation**: Zod (schemas) + TanStack Form validators
- **PDF**: pdfjs-dist (import), html2canvas + jsPDF (export)
- **i18n**: react-i18next (PL + EN)
- **Animations**: motion (Framer Motion) — scroll-linked parallax + whileInView entrance animations
- **PWA**: vite-plugin-pwa + workbox (service worker, offline support, install prompt)
- **Testing**: Vitest + React Testing Library

## Testing

- **Framework**: Vitest with jsdom environment
- **Component testing**: React Testing Library + `@testing-library/user-event`
- **Assertions**: `@testing-library/jest-dom` for DOM matchers
- **Coverage**: `@vitest/coverage-v8` with 50% thresholds (lines, functions, branches, statements)
- **Config**: `vitest.config.ts` (separate from Vite config to avoid loading Vite plugins in tests)

### Conventions

- **Co-located tests**: `foo.test.ts` next to `foo.ts` — no separate `__tests__/` directories
- **Custom render**: Use `import { render, screen } from '@/test/test-utils'` instead of RTL directly — wraps with I18nextProvider using real EN translations
- **Real translations**: Tests use actual EN translation file, not mocked `t()` — catches missing translation keys
- **Test names**: `describe` per unit, `it('should ... when ...')` pattern
- **Test behavior, not implementation**: Query by role, label, text — not CSS classes or test IDs

### Test Utilities

| File                      | Purpose                                                          |
| ------------------------- | ---------------------------------------------------------------- |
| `src/test/setup.ts`       | jest-dom matchers + ResizeObserver polyfill                      |
| `src/test/test-utils.tsx` | Custom `render` with I18nextProvider, re-exports RTL + userEvent |
| `src/test/i18n-test.ts`   | Lightweight i18n instance with real EN translations              |

## CI/CD

- **GitHub Actions** runs on push to `main` and pull requests to `main`
- Pipeline: format check → lint → test → build (job name: "Lint, Format, Test & Build")
- Concurrency: in-progress runs are cancelled when a new commit is pushed to the same ref
- **Dependabot** updates npm and GitHub Actions dependencies weekly

## Code Formatting

- **Prettier** with `prettier-plugin-tailwindcss` for automatic Tailwind class sorting
- Config: `.prettierrc` — single quotes, tabWidth 4, printWidth 100
- Ignored: `dist/`, `pnpm-lock.yaml`, `src/routeTree.gen.ts` (see `.prettierignore`)
- **eslint-config-prettier** disables ESLint rules that conflict with Prettier (last entry in `eslint.config.js`)
- Run `pnpm format` before committing to avoid CI failures

## Architecture & Conventions

### Data Flow

- Form data stored in localStorage under key `cvData` (+ `cvData_backup`)
- Auto-save every 30 seconds, manual save button available
- Template selection passed via URL query param `?templateId=`

### Form Data Shape

Types defined in `/src/types/form-types.ts`:

```typescript
{
  templateId: string;
  personalInfo: PersonalInfoProps;
  experiences: ExperienceProps[];
  education: EducationProps[];
  skills: SkillProps[];
  languages: LanguageProps[];
  interests: InterestProps[];
  gdprConsent: GdprConsentProps; // { enabled: boolean; companyName: string }
}
```

### Validation

- Centralized Zod schemas in `/src/schemas/cv-schema.ts` — single source of truth
- Wired into TanStack Form via `validators: { onChange: cvFormSchema }`
- Field errors exposed via `field.state.meta.errors` and rendered inline using `<FieldError>` component (`/src/components/ui/field-error.tsx`)
- Error messages are i18n keys (e.g., `validation.firstNameRequired`) translated at render time
- Errors display only after field is touched (`isTouched` check)
- Required fields: First Name, Last Name, Email
- Email: must be valid format (Zod `.email()`)
- All other fields: optional (validated as strings/booleans/enums per schema)

### Form Component Types

Form section components accept a `FormApi` type from `/src/types/form-component-types.ts`. This file uses ESLint-disabled `any` internally for TanStack Form flexibility.

## CV Templates

Three templates, each in `/src/components/templates/`:

| Template     | Font                | Color        | Audience           |
| ------------ | ------------------- | ------------ | ------------------ |
| `developer`  | JetBrains Mono      | Purple/blue  | Tech professionals |
| `default`    | Montserrat          | Gray         | All industries     |
| `veterinary` | Lato + Merriweather | Emerald/teal | Animal healthcare  |

Google Fonts are imported in `/src/index.css`. Atkinson Hyperlegible is used for UI elements.

### Critical Template Rules

- **CV templates MUST always have white background** — dark mode only affects surrounding UI
- **All templates must be print-optimized** with proper page breaks
- **Language proficiency** uses European framework: A1, A2, B1, B2, C1, C2, NATIVE
- **New sections** added to one template must be added to all three

### Template Detection (PDF Import)

The PDF parser (`/src/lib/pdf-parser.ts`) detects templates by section markers:

- Developer: `// WORK EXPERIENCE`, `// TECH STACK`
- Default: `PROFESSIONAL EXPERIENCE`, `CORE COMPETENCIES`
- Veterinary: `SPECIAL INTERESTS`

## Dark Mode

- Three modes: Light, Dark, System (auto-detect)
- Provider: `/src/contexts/theme-context.tsx`
- Hook: `/src/hooks/use-theme.ts`
- Persists choice in localStorage, responds to system preference changes
- Theme toggle present on all major pages

## i18n

- Translation files: `/src/locales/en/translation.json`, `/src/locales/pl/translation.json`
- All user-facing strings must use `t()` from react-i18next
- New strings must be added in both EN and PL

## GDPR Consent Clause

- Toggle in builder form enables/disables the clause on the CV
- With company name: uses `cv.gdprConsent` translation (mentions company by name)
- Without company name: uses `cv.gdprConsentGeneric` translation (generic clause)
- Rendered at the bottom of all three templates when enabled
- Form data: `GdprConsentProps { enabled: boolean; companyName: string }`

## Animations

Page transitions rely on CSS entrance animations — no View Transition API (disabled because it caused visual artifacts with animated backgrounds).

- **Entrance animations**: CSS `@keyframes` utility classes applied to page elements:
    - `animate-fade-in-up` — slide up + fade (sections, cards, headings)
    - `animate-fade-in-scale` — scale from 95% + fade (stats, preview)
    - `animate-blur-in` — blur-to-sharp entrance (hero title)
    - `animate-grow-width` — progress bar fill animation
    - `animate-slide-in-left` / `animate-slide-in-right` — horizontal slides
- **Stagger delays**: `.delay-1` through `.delay-5` (100ms increments), or inline `animationDelay` style for 6+
- **Micro-interactions**: `.hover-lift` class for button/card hover (scale + shadow)
- **Accessibility**: All animations disabled when `prefers-reduced-motion: reduce` is set
- **Browser support**: Modern browsers. Animations gracefully degrade with `prefers-reduced-motion`.
- CV templates are NOT animated — they stay print-clean with white backgrounds

### Scroll-linked Parallax & whileInView

- **Dependency**: `motion` (Framer Motion) — shared chunk used by all page routes
- **Hook**: `useParallax` (`/src/hooks/use-parallax.ts`) — wraps `useScroll` + `useTransform` + `useReducedMotion`
    - Takes `yRange` (px of movement) and optional `opacityRange`
    - Returns `{ ref, y, opacity }` to spread onto `motion.div`
    - Returns static values when `prefers-reduced-motion` is active
- **Parallax targets**: Only decorative/background layers (gradients, dot grids, geometric shapes, decorative circles) — never text
- **whileInView animations**: Replace CSS `animate-fade-in-up` / `animate-fade-in-scale` on below-fold content so animations fire when scrolled into view, not on mount
- **`viewport: { once: true }`** on all `whileInView` — fire once then disconnect observer
- Applied to all pages: home, templates, template preview, builder, and preview

## SEO

- **Head management**: TanStack Router `head()` property + `<HeadContent />` in root layout
- **Constants**: `/src/lib/seo.ts` — `SITE_URL` (from `VITE_SITE_URL` env var), `SEO_DEFAULTS`, `OG_DEFAULTS`, `TEMPLATE_NAMES`
- **Per-route titles**: Each route defines `head()` with unique `title`, `og:title`, `twitter:title`, and `canonical` link
- **Title convention**: `Page Name | Resume Builder` (child routes), `Resume Builder - Create Professional Resumes in Minutes` (home)
- **Static fallbacks**: `index.html` contains static meta/OG/Twitter tags for crawlers that don't execute JS
- **JSON-LD**: Schema.org `WebApplication` structured data in root route `head()` via `script:ld+json`
- **Open Graph image**: `/public/og-image.png` (1200x630)
- **Favicons**: `/public/favicon.svg`, `favicon-32x32.png`, `favicon-16x16.png`, `apple-touch-icon.png`
- **Crawlers**: `/public/robots.txt` + `/public/sitemap.xml` (excludes `/preview` — user-specific data)

## PWA (Progressive Web App)

- **Plugin**: `vite-plugin-pwa` with `registerType: 'autoUpdate'` and `generateSW` workbox mode
- **Config**: `VitePWA()` in `vite.config.ts` — manifest, icons, and workbox settings
- **Service worker**: Precaches all static assets (`js`, `css`, `html`, `svg`, `png`, `woff2`); runtime caches Google Fonts with `StaleWhileRevalidate`
- **Manifest**: `dist/manifest.webmanifest` — standalone display, green theme (`#a7f3d0`)
- **Icons**: `/public/pwa-192x192.png`, `/public/pwa-512x512.png` (generated from `favicon.svg`)
- **TypeScript**: `"vite-plugin-pwa/react"` in `tsconfig.app.json` types for `virtual:pwa-register/react` module

### PWA Components (in `/src/components/`)

| Component          | File                     | Behavior                                                                                                                    |
| ------------------ | ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `PwaReloadPrompt`  | `pwa-reload-prompt.tsx`  | Shows "offline ready" (auto-dismisses after 5s) or "new version available" (with Reload button). Uses `useRegisterSW` hook. |
| `PwaInstallPrompt` | `pwa-install-prompt.tsx` | Listens for `beforeinstallprompt` event. Shows install banner. Persists dismissal in localStorage (`pwaInstallDismissed`).  |
| `OfflineIndicator` | `offline-indicator.tsx`  | Amber top banner when `navigator.onLine` is false. Reacts to `online`/`offline` window events.                              |

All three are mounted in `root-layout.tsx` alongside `<PrivacyNotice />`. UI follows the same fixed bottom-bar pattern (except `OfflineIndicator` which is a top bar). Strings use `pwa.*` i18n keys.

## PDF Import

- Uses `pdfjs-dist` to extract CV data from PDF metadata (Keywords field)
- Falls back to raw text parsing if no metadata found
- Only works reliably with PDFs generated by this application
- Entry point: "Load PDF" button in builder page header
