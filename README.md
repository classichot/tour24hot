# TOUR24

Thailand’s marketplace for certified package tours.

> **Search once. Compare every package. Book with confidence.**

TOUR24 is not another travel agency. It is the comparison and trust layer for fixed-departure group tours: verified operators upload the brochures they already sell, AI normalizes them into one schema, and travelers compare **real total cost**, shopping intensity, itinerary quality and agency trust before they book.

This repository (`tour24hot`) is the interactive prototype.

## Product surfaces

| Surface | Route | Who |
| --- | --- | --- |
| Marketplace | `/` `/search` `/packages/[id]` `/compare` | Travelers |
| AI Travel Advisor | `/advisor` `/match` | Travelers |
| Group quotes | `/group` | Travelers / companies |
| My trips | `/trips` `/book/[id]` | Travelers |
| Burn deals | `/burn` | Travelers |
| Partner portal | `/agency` | Tour operators |
| Control Center | `/admin` | TOUR24 operations |

## Signature prototype features

- **Standardized package cards** — advertised price vs real total cost (tips, visa, mandatory extras)
- **Side-by-side compare** with an AI difference explainer
- **Trust score** — explainable 10-factor agency score, not a star average
- **AI PDF import** — brochure drop → extracted fields with confidence scores (Partner)
- **AI Travel Advisor** — natural-language brief scored against live inventory
- **Shopping intensity** and hidden-cost gap on every listing
- **Inventory** — multi-date seats and departure states
- **Control Center** — agency verification, package moderation, risk, disputes

## Design

Copied from the Modernist design system in `design.zip`:

- Warm-neutral ground, **zero radius**, 2px rules
- Archivo + Noto Sans Thai
- Amber accent `#f2b01e` / `#ffc61a` on the 24 mark
- Photography as grayscale plates (deliberate empty slots in this prototype)

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + design tokens |
| Data | Typed bilingual (TH/EN) prototype dataset |
| Deploy | Vercel project `tour24hot` |

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

Thai is the default UI language. Toggle **ไทย / EN** in the header.

## Phase map (from the product brief)

1. **This prototype** — marketplace MVP: search, compare, trust, partner upload, admin
2. Transaction platform — live inventory locks, deposits, payment, settlement
3. Intelligence — ranking, price intelligence, review summaries
4. Network — private-tour RFQ at scale, APIs, affiliates
