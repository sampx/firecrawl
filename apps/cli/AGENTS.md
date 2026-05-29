---
name: fc-cli
description: CLI wrapper that calls Firecrawl API and formats terminal output
---

# fc-cli — Agent Development Rules

## 1. Canonical References

- Project-level rules (architecture, deployment): `../../AGENTS.md`
- Design doc (includes §6.1 fc-cli command interface): `../../docs/DESIGN.md`

## 2. Architecture and Directories

Execution chain: `user/REPL → Commander.js subcommand → utils (client/config/output/error) → @mendable/firecrawl-js SDK → Firecrawl API`

CLI handles argument parsing, SDK calls, and output formatting only. All scrape/crawl/search/extract processing belongs to the API layer.

| Directory / File | Responsibility |
|------------------|----------------|
| `src/index.ts` | Entry: Commander program definition, global options, subcommand registration |
| `src/repl.ts` | Interactive REPL mode (readline loop, spawn child processes for commands) |
| `src/commands/` | Subcommand definitions; one Command export per file |
| `src/utils/client.ts` | Firecrawl SDK singleton client (`getClient`) |
| `src/utils/config.ts` | Config loading (`FIRECRAWL_API_URL`, `FIRECRAWL_API_KEY`) |
| `src/utils/output.ts` | Output formatting + file writing (`handleOutput`, `writeCrawlDocuments`) |
| `src/utils/error.ts` | Error formatting (`formatError`, `handleError`) |
| `bin/fc-cli` | Entry shebang → `dist/index.js` |

## 3. Development Commands

| Scenario | Command | Workdir |
|----------|---------|---------|
| Install dependencies | `pnpm install` | `apps/cli/` |
| Build | `pnpm build` | `apps/cli/` |
| Dev (watch) | `pnpm dev` | `apps/cli/` |
| Test | `pnpm test` | `apps/cli/` |
| Health check | `./my-fc health` | Project root (when real API calls are involved) |

## 4. Implementation Rules

- **Command pattern**: One file per subcommand, exporting `xxxCommand` (`new Command('xxx')`); register via `program.addCommand()` in `src/index.ts`.
- **Responsibility boundary**: CLI only parses arguments, calls the SDK, and formats output. Scraping strategy, data extraction, and error retry logic belong to the API layer.
- **ESM modules**: `"type": "module"`; import paths must use `.js` suffix.
- **TypeScript strict** mode; tsup bundling (ESM + sourcemap, entry `src/index.ts`, output `dist/`).
- **Config**: `Config` interface holds `apiUrl`, `apiKey`, `verbose`; passed via global options.
- **Output formatting**: `handleOutput` for stdout/file output; `writeCrawlDocuments` writes crawl results as directory structure; `filterLinks` filters URLs with glob patterns.
- **Do not log** API keys, environment variable values, request headers, or other sensitive data.

## 5. Testing

- Follow TDD: write a failing test first, then implement code to make it pass.
- Test framework: Jest (`--experimental-vm-modules` for ESM); config in `jest.config.js`.
- CLI changes must at least run `pnpm build` + `pnpm test`.
- When real API calls are involved, verify with `./my-fc health` or manual smoke testing.

## 6. User-Supplied Rules
