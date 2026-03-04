# AGENTS.md - Firecrawl Development Guide

This document provides essential information for AI coding agents working on the Firecrawl codebase.

## Project Structure

Firecrawl is a **monorepo** containing:
- `apps/api` - Main API and worker code (TypeScript/Node.js)
- `apps/js-sdk` - JavaScript SDK
- `apps/python-sdk` - Python SDK  
- `apps/rust-sdk` - Rust SDK

When working on the API, all changes should be made in `apps/api/`.

## Build, Test, and Development Commands

### Development Server

```bash
# Start API server with hot reload
pnpm --filter firecrawl-scraper-js dev

# Or from apps/api directory:
cd apps/api && pnpm dev
```

### Building

```bash
# Build TypeScript
pnpm --filter firecrawl-scraper-js build

# Or from apps/api:
cd apps/api && pnpm build
```

### Testing

**IMPORTANT**: Always use `pnpm harness` to run tests. This command starts the API server and workers before running tests.

```bash
# Run a single test file (RECOMMENDED for development)
pnpm harness jest src/__tests__/snips/v2/scrape.test.ts

# Run tests matching a pattern
pnpm harness jest --testNamePattern="should work"

# Run specific test suite
pnpm harness jest src/__tests__/snips/v2/crawl.test.ts

# Run all snips (E2E tests) - takes a long time
pnpm harness jest "src/__tests__/snips/v[12]/.+\\.test\\.ts"

# Run unit tests only (no server needed)
pnpm --filter firecrawl-scraper-js test

# Run tests locally without auth
pnpm --filter firecrawl-scraper-js test:local-no-auth
```

### Code Quality

```bash
# Format code with Prettier
pnpm --filter firecrawl-scraper-js format

# Check for unused exports/imports
pnpm --filter firecrawl-scraper-js knip
```

## Test Guidelines

### Test Structure

- **E2E tests (snips)**: Located in `apps/api/src/__tests__/snips/` - ALWAYS PREFERRED
- **Unit tests**: Located in `apps/api/src/**/__tests__/` directories
- Use Jest with `ts-jest` for TypeScript support

### Writing Tests

1. **Always use `scrapeTimeout`** from `./lib` for scrape test timeouts
2. **Test gating**: Conditionally run tests based on environment:

```typescript
import { describeIf, itIf, HAS_FIRE_ENGINE, HAS_AI, TEST_SELF_HOST } from "../lib";

// Skip test if requires fire-engine and running self-hosted
describeIf(!TEST_SELF_HOST)("Fire-engine tests", () => {
  // tests here
});

// Skip test if requires AI and no AI configured
itIf(HAS_AI)("should extract with AI", async () => {
  // test here
});
```

3. **Test environment variables**:
   - `!process.env.TEST_SUITE_SELF_HOSTED` - Gate tests requiring fire-engine
   - `!process.env.TEST_SUITE_SELF_HOSTED || process.env.OPENAI_API_KEY || process.env.OLLAMA_BASE_URL` - Gate AI tests

### Test Requirements

When making changes:
1. Write at least 1 happy path test
2. Write at least 1 failure path test
3. Prefer E2E (snips) over unit tests
4. Use `scrapeTimeout` for all scrape-related tests

## Code Style Guidelines

### Formatting (Prettier)

Configuration in `apps/api/.prettierrc`:
- **Trailing commas**: Always (`"all"`)
- **Tab width**: 2 spaces
- **Semicolons**: Required
- **Quotes**: Double quotes
- **Print width**: 80 characters
- **Arrow parens**: Avoid when possible

Run formatter: `pnpm --filter firecrawl-scraper-js format`

### Imports

Group imports in this order:
1. External modules (Node.js built-ins)
2. Third-party packages (express, zod, etc.)
3. Internal modules (use relative paths)

```typescript
// Node.js built-ins
import crypto from "crypto";
import http from "node:http";

// Third-party packages
import express from "express";
import { z } from "zod";
import * as Sentry from "@sentry/node";

// Internal modules
import { config } from "../../config";
import { logger } from "../../lib/logger";
import { TransportableError } from "../../lib/error";
```

### TypeScript

- **Target**: ES2022
- **Module**: NodeNext with ESM
- **Strict null checks**: Enabled
- Use Zod for runtime validation and type inference

```typescript
// Use Zod schemas for request validation
const scrapeRequestSchema = z.object({
  url: z.string().url(),
  formats: z.array(z.enum(["markdown", "html"])).optional(),
});

type ScrapeRequest = z.infer<typeof scrapeRequestSchema>;
```

### Naming Conventions

- **Files**: `kebab-case.ts` for modules, `PascalCase.ts` for components
- **Classes**: `PascalCase` (e.g., `TransportableError`)
- **Functions/variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE` for global, `camelCase` for local
- **Types/interfaces**: `PascalCase`

### Error Handling

Use custom error classes from `src/lib/error.ts`:

```typescript
import { TransportableError, ScrapeJobTimeoutError, UnknownError } from "../../lib/error";

// Throw specific errors
throw new ScrapeJobTimeoutError("Custom timeout message");

// Wrap unknown errors
try {
  // code
} catch (error) {
  throw new UnknownError(error);
}

// Custom error class
export class MyCustomError extends TransportableError {
  constructor(message: string) {
    super("MY_ERROR_CODE", message);
  }
}
```

### Logging

Use Winston logger from `src/lib/logger.ts`:

```typescript
import { logger } from "../../lib/logger";

logger.info("Operation completed", { 
  module: "scrape-controller",
  method: "scrapeController",
  teamId: team_id,
  url: url 
});

logger.error("Failed to process request", { 
  error: err,
  path: req.path,
  teamId: req.acuc?.team_id 
});
```

### Async/Await

- Always use `async/await` over raw promises
- Use `try/catch` for error handling
- Use `Promise.all()` for concurrent operations

```typescript
// Good
async function processUrls(urls: string[]) {
  const results = await Promise.all(
    urls.map(url => scrapeUrl(url))
  );
  return results;
}

// Avoid
function processUrls(urls: string[]) {
  return Promise.all(urls.map(url => scrapeUrl(url)));
}
```

### Express Controllers

Follow this pattern:

```typescript
export async function myController(
  req: RequestWithAuth<{}, MyResponse, MyRequest>,
  res: Response<MyResponse>,
) {
  try {
    // 1. Validate request with Zod
    req.body = myRequestSchema.parse(req.body);
    
    // 2. Check permissions
    const permissions = checkPermissions(req.body, req.acuc?.flags);
    if (permissions.error) {
      return res.status(403).json({
        success: false,
        error: permissions.error,
      });
    }
    
    // 3. Process request
    const result = await processJob(req.body);
    
    // 4. Return response
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Request failed", { error, path: req.path });
    throw error; // Let error handler deal with it
  }
}
```

## Development Workflow

1. **Write tests first** (TDD approach preferred)
2. **Implement feature/fix**
3. **Run relevant tests locally**: `pnpm harness jest <test-file>`
4. **Format code**: `pnpm --filter firecrawl-scraper-js format`
5. **Check for unused code**: `pnpm --filter firecrawl-scraper-js knip`
6. **Commit with conventional commits**: `feat:`, `fix:`, `refactor:`, `test:`
7. **Push and create PR**
8. **Let CI run full test suite**

## Environment Variables

Key environment variables for local development:
- `TEST_SUITE_SELF_HOSTED` - Set to run self-hosted tests
- `OPENAI_API_KEY` - Required for AI features
- `OLLAMA_BASE_URL` - Alternative to OpenAI
- `FIRE_ENGINE_BETA_URL` - Fire-engine integration
- `PLAYWRIGHT_MICROSERVICE_URL` - Playwright service
- `SEARXNG_ENDPOINT` - Search service endpoint

## Important Notes

- **Never commit secrets or API keys**
- **Always use `scrapeTimeout` in tests** - scrapes can be slow
- **Prefer E2E tests (snips)** over unit tests
- **Use Zod schemas** for all request/response validation
- **Log important operations** with context using Winston
- **Handle errors properly** with custom error classes
- **Test both happy and failure paths**
- **Run tests via `pnpm harness`** - it sets up the environment
