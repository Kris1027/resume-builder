## Code Formatting

- Prettier with `prettier-plugin-tailwindcss`; config in `.prettierrc` — single quotes, tabWidth 4, printWidth 100
- Run `pnpm format` before committing to avoid CI failures

## Architecture & Conventions

- Form data stored in localStorage under key `resumeData` (+ `resumeData_backup`)
- Template selection passed via URL query param `?templateId=`
- Validation schemas are the single source of truth in `/src/schemas/resume-schema.ts`
- Field errors render only after `isTouched`; error messages are i18n keys, not raw strings
- Required fields: First Name, Last Name, Email (valid format via Zod `.email()`)

## Resume Templates

- **Templates MUST always have white background** — dark mode only affects surrounding UI
- **All templates must be print-optimized** with proper page breaks
- Language proficiency uses European framework: A1, A2, B1, B2, C1, C2, NATIVE
- **New sections added to one template must be added to all three**

## i18n

- All user-facing strings must use `t()` from react-i18next
- New strings must be added in both EN and PL

## GDPR Consent Clause

- With company name: uses `cv.gdprConsent` translation; without: uses `cv.gdprConsentGeneric`
- Rendered at the bottom of all three templates when enabled

## Animations

- All animations disabled when `prefers-reduced-motion: reduce` is set
- Parallax targets only decorative/background layers — never text
- `viewport: { once: true }` on all `whileInView`
- Resume templates are NOT animated — print-clean with white backgrounds

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
