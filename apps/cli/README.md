# Firecrawl CLI (@firecrawl/cli)

Firecrawl CLI is a command-line interface for [Firecrawl](https://firecrawl.dev), designed for AI Agents and human developers to easily scrape, crawl, and extract data from the web.

## Installation

```bash
# From the cli directory
cd apps/cli
pnpm install
pnpm build

# Link globally
npm link

# Or use directly
node ./dist/index.js --help
```

## Configuration

Configure the CLI using environment variables or command-line options.

| Environment Variable | CLI Option | Description | Default |
|----------------------|------------|-------------|---------|
| `FIRECRAWL_API_URL` | `--api-url` | API base URL | `http://localhost:3002` |
| `FIRECRAWL_API_KEY` | `--api-key` | API Key | None |

### Global Options

These options work with all commands:

```bash
fc-cli --api-url <url>      # Override API URL
fc-cli --api-key <key>      # Override API Key
fc-cli -o, --output <file>  # Save output to file
fc-cli -v, --verbose        # Enable verbose logging
fc-cli -i, --interactive    # Enter interactive REPL mode
```

## Commands

### scrape

Scrape a single URL and extract content.

```bash
# Basic scrape (returns markdown)
fc-cli scrape https://example.com

# Specify output format
fc-cli scrape https://example.com --format html
fc-cli scrape https://example.com --format markdown
fc-cli scrape https://example.com --format links

# Save to file
fc-cli scrape https://example.com -o output.md

# Use AI to clean content (removes nav, ads, sidebars, footers)
fc-cli scrape https://example.com --clean

# Use custom prompt for AI content processing
fc-cli scrape https://example.com --prompt "Summarize in 3 bullet points"
fc-cli scrape https://example.com --prompt "Extract only the product description"
```

**Options:**
- `--format <type>` - Output format: `markdown` (default), `html`, `links`
- `--clean` - Use AI to clean content (removes navigation, ads, sidebars, footers, etc.)
- `--prompt <text>` - Custom prompt for AI content processing (implies `--clean`)

### search

Perform a web search and retrieve page content.

```bash
# Basic search
fc-cli search "firecrawl"

# Limit results
fc-cli search "firecrawl" --limit 10
```

**Options:**
- `--limit <n>` - Number of results (default: 5)

### map

Discover links on a website.

```bash
# Map a website
fc-cli map https://example.com

# Limit results
fc-cli map https://example.com --limit 50

# Filter links by URL pattern (supports * wildcard)
fc-cli map https://example.com --filter "*docs*"
fc-cli map https://example.com --filter "*api*/v1/*"
```

**Options:**
- `--limit <n>` - Maximum number of links (default: 100)
- `--filter <pattern>` - Filter links by URL pattern using `*` as wildcard

### crawl

Crawl an entire website.

```bash
# Start a crawl (returns job ID)
fc-cli crawl https://example.com

# Limit pages and wait for completion
fc-cli crawl https://example.com --limit 50 --wait

# Crawl with custom timeout (useful for JS-heavy sites)
fc-cli crawl https://example.com --limit 50 --timeout 120000 --wait

# Crawl and save to directory (auto-creates .md files)
fc-cli crawl https://example.com --limit 20 --wait -o ./output

# Crawl with AI-powered content cleaning (removes nav, ads, sidebars)
fc-cli crawl https://example.com --limit 20 --clean --wait

# Crawl with custom AI prompt for content processing
fc-cli crawl https://example.com --limit 20 --prompt "Extract main article only" --wait
```

**Options:**
- `--limit <n>` - Maximum pages to crawl (default: 100)
- `--timeout <ms>` - Timeout per page in milliseconds (default: 60000)
- `--wait` - Wait for crawl to complete
- `--clean` - Use AI to clean content (removes navigation, ads, sidebars, footers, etc.)
- `--prompt <text>` - Custom prompt for AI content processing (implies `--clean`)

**Note:** When using `--wait`, the CLI automatically creates a directory structure with `.md` files organized by URL path.

### crawl-status

Check the status of a crawl job.

```bash
fc-cli crawl-status <job_id>
```

### batch

Scrape multiple URLs from a file.

```bash
# Start batch job (returns job ID)
fc-cli batch urls.txt

# Wait for completion
fc-cli batch urls.txt --wait

# Customize polling interval and timeout
fc-cli batch urls.txt --wait --poll-interval 5 --timeout 180
```

**Input File Formats:**

1. **Plain text** - One URL per line:
   ```
   https://example.com/page1
   https://example.com/page2
   https://example.com/page3
   ```

2. **JSON array**:
   ```json
   ["https://example.com/page1", "https://example.com/page2"]
   ```

**Options:**
- `--wait` - Wait for batch to complete (shows progress)
- `--poll-interval <seconds>` - Polling interval when waiting (default: 2)
- `--timeout <seconds>` - Timeout when waiting (default: 120)

### batch-status

Check the status of a batch job.

```bash
# Check status once
fc-cli batch-status <job_id>

# Wait for job to complete
fc-cli batch-status <job_id> --wait

# With custom timeout
fc-cli batch-status <job_id> --wait --timeout 60
```

**Options:**
- `--wait` - Wait for batch to complete (shows progress)
- `--poll-interval <seconds>` - Polling interval when waiting (default: 2)
- `--timeout <seconds>` - Timeout when waiting (default: 120)

### extract

Extract structured data from URLs using AI.

```bash
# Start extract job (returns job ID immediately)
fc-cli extract https://example.com/product --prompt "Extract product price and name"

# Wait for extraction to complete
fc-cli extract https://example.com/product --prompt "Extract product info" --wait

# Extract from multiple URLs
fc-cli extract https://site1.com https://site2.com --prompt "Extract contact information"

# Use prompt from file
fc-cli extract https://example.com --prompt-file prompt.txt

# Use JSON schema for structured output
fc-cli extract https://example.com --prompt "Extract product info" --schema schema.json

# Customize polling interval and timeout
fc-cli extract https://example.com --prompt "Extract data" --wait --poll-interval 5 --timeout 180
```

**Options:**
- `--prompt <text>` - Extraction prompt (required if not using --prompt-file)
- `--prompt-file <file>` - Path to file containing prompt
- `--schema <file>` - JSON Schema file for structured output
- `--wait` - Wait for extraction to complete (shows progress)
- `--poll-interval <seconds>` - Polling interval when waiting (default: 2)
- `--timeout <seconds>` - Timeout when waiting (default: 120)

### extract-status

Check the status of an extract job.

```bash
# Check status once
fc-cli extract-status <job_id>

# Wait for job to complete
fc-cli extract-status <job_id> --wait

# With custom timeout
fc-cli extract-status <job_id> --wait --timeout 60
```

**Options:**
- `--wait` - Wait for extraction to complete (shows progress)
- `--poll-interval <seconds>` - Polling interval when waiting (default: 2)
- `--timeout <seconds>` - Timeout when waiting (default: 120)

### llmstxt

Generate an LLMs.txt file for a website or local directory.

```bash
# URL mode: fetch from website via API
fc-cli llmstxt https://example.com

# Directory mode: generate from local markdown files
fc-cli llmstxt ./crawl-output

# Directory mode with full content
fc-cli llmstxt ./crawl-output --full
```

**Directory mode** scans all `.md` files and generates:
- `<dir>/llms.txt` - Index with titles and descriptions
- `<dir>/llms-full.txt` - Full content (with `--full` option)

**Options:**
- `--full` - Also generate llms-full.txt (directory mode only)

## Interactive Mode

Enter REPL mode for interactive command execution:

```bash
fc-cli --interactive
```

Available commands in REPL:
- `scrape <url>`
- `search <query>`
- `crawl <url>`
- `crawl-status <id>`
- `map <url>`
- `extract <urls...> --prompt <text>`
- `extract-status <id>`
- `batch <file>`
- `batch-status <id>`
- `llmstxt <url>`
- `exit` or `quit`

## Output Format

The CLI outputs data in a sensible format based on the response:

- **Scrape**: Outputs markdown by default (or `html`/`links` with `--format`)
- **Map**: Outputs list of URLs (one per line)
- **Search**: Outputs JSON results
- **Crawl** (with `--wait`): Creates directory structure with `.md` files
- **Extract**: Outputs JSON with extracted data

### Saving Output

Use `-o` or `--output` to save results to a file:

```bash
# Save scrape result to file
fc-cli scrape https://example.com -o result.md

# Save crawl as directory structure
fc-cli crawl https://example.com --wait -o ./my-crawl

# Save extract result as JSON
fc-cli extract https://example.com --prompt "Extract data" --wait -o result.json
```

## Error Handling

The CLI provides clear error messages for common issues:

- Missing API key
- Invalid URLs
- Network errors
- API rate limits
- File not found errors

Use `--verbose` for detailed error information.

## Examples

### Complete Workflow

```bash
# 1. Scrape a single page
fc-cli scrape https://example.com -o page.md

# 2. Crawl a site and save as markdown files
fc-cli crawl https://docs.example.com --limit 50 --wait -o ./docs

# 3. Extract structured data
fc-cli extract https://example.com/products --prompt "Extract all product names and prices" --wait -o products.json

# 4. Search for pages
fc-cli search "firecrawl documentation" --limit 3
```

### Map with Filtering

```bash
# Map a site and filter to only API documentation
fc-cli map https://example.com --filter "*api*"

# Map and filter to nested paths
fc-cli map https://example.com --filter "*/docs/v1/*"

# Map with multiple filters (pipe to further processing)
fc-cli map https://example.com --limit 500 --filter "*guides*" | grep -i "authentication"
```

### Batch Processing

```bash
# Create URL list
cat > urls.txt << EOF
https://example.com/page1
https://example.com/page2
https://example.com/page3
EOF

# Process batch (async)
fc-cli batch urls.txt

# Process batch and wait for completion
fc-cli batch urls.txt --wait -o results.json

# Process batch with custom settings
fc-cli batch urls.txt --wait --poll-interval 3 --timeout 300

# Check batch job status
fc-cli batch-status <job_id>

# Wait for an existing batch job
fc-cli batch-status <job_id> --wait
```

## 技术栈

| 类别 | 技术 |
|------|------|
| 运行时 | Node.js (ESM) |
| 语言 | TypeScript (strict) |
| CLI 框架 | Commander.js |
| 打包 | tsup |
| SDK | @mendable/firecrawl-js |
| 测试 | Jest |

## 相关文档

| 文档 | 说明 |
|------|------|
| [AGENTS.md](./AGENTS.md) | 项目规范（面向开发） |
| [PRD](../../docs/products/firecrawl/PRD-firecrawl-api.md) | 产品需求文档 |
| [DESIGN](../../docs/products/firecrawl/DESIGN-firecrawl-api.md) | 架构设计文档 |

## License

AGPL-3.0（核心）| MIT（SDK）
