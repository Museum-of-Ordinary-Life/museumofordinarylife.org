# Museum of Ordinary Life

Production source for **museumofordinarylife.org**, the Museum of Ordinary Life's present-day public website.

The Museum is a living archive of everyday human life, established in 2026 while the material it collects is still ordinary.

## Repository structure

- `index.html` — GitHub Pages entry point
- `_includes/` — page markup, split into maintainable source fragments
- `assets/css/` — layout, component, accessibility, and theme styles
- `assets/js/site.js` — navigation, dialogs, theme selection, and progressive enhancement
- `CNAME` — GitHub Pages custom domain
- `_config.yml` — minimal GitHub Pages/Jekyll configuration

GitHub Pages assembles the `_includes/` into ordinary static HTML for visitors. There is no application framework or database dependency.

## Deployment

Publish with **GitHub Pages from the `main` branch, repository root**.

Custom domain: `museumofordinarylife.org`

DNS is managed separately from this repository.

## Related site

The speculative future site is maintained separately in `Museum-of-Ordinary-Life/future.museumofordinarylife.org`.

## Stewardship

Changes should preserve the Museum's accessibility, contributor context, consent model, and distinction between real collection material and illustrative/speculative material.
