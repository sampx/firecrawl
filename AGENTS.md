# AGENTS.md — Firecrawl Development Guide

> **本地部署文档**: `docs/DEPLOYMENT.md`
> **架构设计文档**: `docs/ARCHITECTURE.md`

This document provides essential information for AI coding agents working on the Firecrawl codebase.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  API Layer (Express + WebSocket)                                │
│  V0 (deprecated) | V1 | V2 (current)                            │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│  Service Layer: Scraper | Crawler | Extract | Search            │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│  Worker Layer: NuQ Workers (xN) | Extract/Index Workers         │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│  Data Layer: PostgreSQL (NuQ) | Redis | RabbitMQ | Supabase     │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

| Package | Path | Description |
|---------|------|-------------|
| **api** | `apps/api` | Main API and worker code |
| **js-sdk** | `apps/js-sdk` | JavaScript SDK |
| **python-sdk** | `apps/python-sdk` | Python SDK |
| **rust-sdk** | `apps/rust-sdk` | Rust SDK |
| **cli** | `apps/cli` | Command-line tool |
| **playwright-service-ts** | `apps/playwright-service-ts` | Browser rendering service |

## Build and Test Commands

```bash
# Development
pnpm --filter firecrawl-scraper-js dev

# Build
pnpm --filter firecrawl-scraper-js build

# Test (IMPORTANT: use harness for E2E tests)
pnpm harness jest src/__tests__/snips/v2/scrape.test.ts

# Code quality
pnpm --filter firecrawl-scraper-js format  # Prettier
pnpm --filter firecrawl-scraper-js knip    # Check unused code
```

## Test Guidelines

- **E2E tests (snips)**: `apps/api/src/__tests__/snips/` - ALWAYS PREFERRED
- **Unit tests**: `apps/api/src/**/__tests__/`
- Use `scrapeTimeout` for all scrape tests
- Gate tests with `describeIf(!TEST_SELF_HOST)` and `itIf(HAS_AI)`

## Code Style

### Formatting (Prettier)

- Trailing commas: `all`, Tab width: 2, Semicolons: required
- Double quotes, Print width: 80

### Imports Order

1. Node.js built-ins
2. Third-party packages
3. Internal modules (relative paths)

### TypeScript

- Target: ES2022, Module: NodeNext with ESM
- Use Zod for runtime validation

### Naming

- Files: `kebab-case.ts`, Classes: `PascalCase`
- Functions/variables: `camelCase`, Constants: `UPPER_SNAKE_CASE`

### Error Handling

```typescript
import { TransportableError, ScrapeJobTimeoutError, UnknownError } from "../../lib/error";
throw new ScrapeJobTimeoutError("message");
```

### Logging

```typescript
import { logger } from "../../lib/logger";
logger.info("message", { module: "name", teamId, url });
```

## API Directory Structure

```
apps/api/src/
├── config.ts, index.ts, harness.ts, types.ts
├── controllers/v1/, v2/          # Request handlers by API version
├── routes/v1.ts, v2.ts           # Route definitions
├── services/                     # Business logic
│   ├── supabase.ts, redis.ts     # Database services
│   ├── queue-service.ts          # BullMQ
│   └── worker/                   # NuQ Worker system
├── scraper/scrapeURL/            # Core scraping engine
│   ├── engines/                  # fetch, playwright, fire-engine, pdf
│   ├── transformers/             # markdown, extract
│   └── postprocessors/
├── lib/                          # Shared libraries
│   ├── logger.ts, error.ts       # Logging and errors
│   └── extract/, deep-research/
└── __tests__/snips/              # E2E tests
```

## Core Architecture

### Scraping Engine

Multi-engine fallback: `fire-engine > playwright > fetch`

```
Request → Feature Flags → Robots.txt → Engine Fallback Loop → Transformers → Document
```

### Queue System

| Queue | Backend | Usage |
|-------|---------|-------|
| **NuQ** | PostgreSQL + RabbitMQ | scrape/crawl jobs (high performance) |
| **BullMQ** | Redis | billing, deep research, precrawl |

### Worker Types

| Worker | Purpose |
|--------|---------|
| NuQ Workers | Process scrape/crawl jobs (scalable) |
| Extract Worker | Extraction jobs |
| Index Worker | Search indexing (optional) |

### Authentication

```
Bearer Token → Redis Cache (ACUC) → Supabase RPC → Rate Limiter → ACUC response
```

**ACUC (Auth Credit Usage Chunk)**: `{ api_key, team_id, rate_limits, remaining_credits, concurrency, flags }`

### Middleware Chain

```
authMiddleware → countryCheck → checkCreditsMiddleware → blocklistMiddleware → controller
```

### V2 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /v2/scrape` | Single page scrape |
| `POST /v2/crawl` | Website crawl |
| `GET /v2/crawl/:jobId` | Crawl status (REST/WebSocket) |
| `POST /v2/search` | Search + scrape |
| `POST /v2/extract` | Structured extraction |
| `POST /v2/agent` | FIRE-1 Agent |

### Data Storage

| Storage | Purpose |
|---------|---------|
| Supabase | Users, teams, API keys, billing |
| NuQ PostgreSQL | Job queue state, crawl progress |
| Redis | ACUC cache, rate limiter, locks |
| RabbitMQ | NuQ message broker (optional) |

## Key Environment Variables

| Category | Variables |
|----------|-----------|
| Database | `POSTGRES_*`, `REDIS_URL`, `NUQ_DATABASE_URL` |
| Auth | `SUPABASE_URL`, `SUPABASE_SERVICE_TOKEN` |
| AI | `OPENAI_API_KEY`, `OLLAMA_BASE_URL` |
| Services | `FIRE_ENGINE_BETA_URL`, `PLAYWRIGHT_MICROSERVICE_URL`, `SEARXNG_ENDPOINT` |

## Development Workflow

1. Write tests first (TDD)
2. Implement feature
3. Run tests: `pnpm harness jest <test-file>`
4. Format: `pnpm --filter firecrawl-scraper-js format`
5. Commit with conventional commits: `feat:`, `fix:`, `refactor:`, `test:`

## Important Notes

- Never commit secrets
- Use `scrapeTimeout` in tests
- Prefer E2E (snips) over unit tests
- Use Zod schemas for validation
- Use custom error classes from `src/lib/error.ts`
- Run tests via `pnpm harness`