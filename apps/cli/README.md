# Firecrawl CLI (@firecrawl/cli)

Firecrawl CLI is a command-line interface for [Firecrawl](https://firecrawl.dev), designed for AI Agents and human developers to easily scrape, crawl, and extract data from the web.

## Installation

```bash
cd apps/cli
pnpm install
pnpm build
# Link the command
npm link
```

## Configuration

You can configure the CLI using environment variables or command-line options.

| Environment Variable | CLI Option | Description | Default |
|----------------------|------------|-------------|---------|
| `FIRECRAWL_API_URL` | `--api-url` | API base URL | `http://localhost:3002` |
| `FIRECRAWL_API_KEY` | `--api-key` | API Key | None |
| `FIRECRAWL_OUTPUT` | `--format` | Output format (json, yaml, table) | `json` |

## Usage

### Core Commands

- **Scrape a single URL**:
  ```bash
  fc-cli scrape https://example.com
  ```

- **Search the web**:
  ```bash
  fc-cli search "firecrawl" --limit 5
  ```

- **Map a website**:
  ```bash
  fc-cli map https://example.com
  ```

- **Check usage**:
  ```bash
  fc-cli usage
  ```

### Crawl & Batch

- **Start a crawl**:
  ```bash
  fc-cli crawl https://example.com --limit 10
  ```

- **Check crawl status**:
  ```bash
  fc-cli crawl-status <job_id>
  ```

- **Batch scrape**:
  ```bash
  fc-cli batch urls.txt
  ```

### AI Commands

- **Extract data**:
  ```bash
  fc-cli extract https://example.com/product --prompt "Extract product price and name"
  ```

- **Run an agent**:
  ```bash
  fc-cli agent --prompt "Find the latest news about AI"
  ```

- **Deep research**:
  ```bash
  fc-cli deep-research "Market analysis of web scrapers"
  ```

- **Generate LLMs.txt**:
  ```bash
  fc-cli llmstxt https://example.com
  ```

### Interactive Mode

Enter the REPL mode for easier debugging:
```bash
fc-cli --interactive
```

## Output Formats

- `json` (Default): Best for AI agents.
- `yaml`: Human-readable structured data.
- `table`: Tabular data for quick scanning.

## Saving to File

Use `-o` or `--output` to save the results:
```bash
fc-cli scrape https://example.com -o result.json
```
