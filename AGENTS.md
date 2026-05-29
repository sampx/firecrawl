---
name: Firecrawl AGENT RULES
description: Self-hosted web data collection backend for fc-cli and fc-local
---

# Agent Development Rules

## 1. Canonical References

Canonical references:

- DESIGN: `docs/DESIGN.md`
- Referral Docs: `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, `apps/api/AGENTS.md`, `apps/cli/AGENTS.md`

## 2. Architecture and Directories

Runtime chain: `fc-local / user → fc-cli / HTTP API → apps/api → workers / Playwright / SearXNG → Markdown / JSON output`.

| Directory | Responsibility |
|---|---|
| `apps/api/` | Firecrawl API service, workers, and backend logic for scrape, crawl, search, and extract |
| `apps/cli/` | `fc-cli` command-line wrapper that calls the self-hosted API and formats output |
| `apps/playwright-service-ts/` | Browser rendering microservice |
| `my-fc` | Root service management script for Docker Compose lifecycle operations |
| `scripts/` | Service start/stop, logs, build, and helper scripts |
| `searxng/` | Self-hosted SearXNG search configuration |
| `docker-compose.yaml` | Self-hosted service orchestration |
| `docs/` | Project design, architecture, and deployment documents |

Deploy: `external/tools/bin/` exposes scripts to the system `PATH` through symlinks.

## 3. Development Commands (build format test)

| Scenario | Command | When |
|---|---|---|
| Check services | `./my-fc status` | Check self-hosted service status |
| Health check | `./my-fc health` | After changing service orchestration, API, or CLI integration |
| View logs | `./my-fc logs <service> [lines]` | Diagnose runtime issues |
| API dev | `pnpm dev` | Workdir: `apps/api/` |
| API build | `pnpm build` | Workdir: `apps/api/`, after API changes |
| API format | `pnpm format` | Workdir: `apps/api/`, before commit |
| API unused-code check | `pnpm knip` | Workdir: `apps/api/`, after cleanup or refactoring |
| API snips tests | `pnpm test:snips` | Workdir: `apps/api/`, after scrape/crawl changes |
| API targeted test | `pnpm harness jest <test-file>` | Workdir: `apps/api/`, verify a single E2E/snips test |
| CLI dev | `pnpm dev` | Workdir: `apps/cli/` |
| CLI build | `pnpm build` | Workdir: `apps/cli/`, after CLI changes |
| CLI test | `pnpm test` | Workdir: `apps/cli/`, after CLI changes |

## 4. Implementation Rules

- Keep the upstream fork traceable; do not perform broad rewrites or unrelated formatting unless the task explicitly requires it.
- Follow `apps/api/AGENTS.md` when editing `apps/api/`; follow `apps/cli/AGENTS.md` when editing `apps/cli/`.
- CLI only parses arguments, calls the API, and formats output; business processing, scraping strategy, and data extraction logic belong in the API layer.
- New or changed API request bodies must use Zod schemas for runtime validation.
- API errors must use the `TransportableError` family; avoid throwing bare `Error`.
- Use the project logger for runtime information; do not use `console.log` for business logs.
- Do not log or output API keys, environment variable values, request headers, or other sensitive data.
- After changing Docker Compose, `my-fc`, `scripts/`, or `searxng/`, verify with `./my-fc status` or `./my-fc health`.

## 5. Testing

- Follow TDD: write a failing test first, then implement code to make it pass.
- Scrape, crawl, search, and extract changes should prefer E2E/snips tests under `apps/api/src/__tests__/snips/`.
- Run a single API test with `pnpm harness jest <test-file>` so dependent services are orchestrated by the harness.
- All scraping tests must use `scrapeTimeout` to avoid unstable timeouts.
- Use existing `describeIf` / `itIf` patterns for tests gated by environment capabilities.
- CLI changes must at least run the `apps/cli` build and test; use `./my-fc health` or a manual smoke test when real API calls are involved.

## 6. User-Supplied Rules
