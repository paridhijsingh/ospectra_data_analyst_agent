# OSpectra Analytics Platform

This repository contains a unified recruitment and financial analytics proof of concept. It includes deterministic synthetic datasets, governed metric definitions, interactive visualizations, and a modular orchestration pipeline.

## Requirements

- Node.js 22.13 or newer
- npm

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Production build

```bash
npm run build
npm run start
```

## Important folders

- `app/`: application shell and styling
- `components/`: reusable interface components
- `lib/recruitment-data.ts`: synthetic recruitment records
- `lib/metric-engine.ts`: recruitment metric calculations
- `lib/financial-metrics.ts`: financial scenarios and metrics
- `lib/orchestrator.ts`: routing, validation, execution, quality, and narrative stages
- `semantic/`: governed semantic-model definitions

The datasets are synthetic and the application runs without an external database.
# ospectra_data_analyst_agent
