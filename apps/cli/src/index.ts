import { Command } from 'commander';
import { getConfig } from './utils/config.js';
import { scrapeCommand } from './commands/scrape.js';
import { searchCommand } from './commands/search.js';
import { mapCommand } from './commands/map.js';
import { usageCommand } from './commands/usage.js';
import { crawlCommand } from './commands/crawl.js';
import { crawlStatusCommand } from './commands/crawl-status.js';
import { batchCommand } from './commands/batch.js';
import { batchStatusCommand } from './commands/batch-status.js';
import { extractCommand } from './commands/extract.js';
import { agentCommand } from './commands/agent.js';
import { deepResearchCommand } from './commands/deep-research.js';
import { llmstxtCommand } from './commands/llmstxt.js';
import fs from 'fs';

const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const program = new Command();
const config = getConfig();

program
  .name('fc-cli')
  .description('Firecrawl CLI for AI Agents and Developers')
  .version(packageJson.version);

program
  .option('--api-url <url>', 'Override FIRECRAWL_API_URL', config.apiUrl)
  .option('--api-key <key>', 'Override FIRECRAWL_API_KEY', config.apiKey)
  .option('--format <format>', 'Output format (json, yaml, table)', config.format)
  .option('-o, --output <file>', 'Output to file')
  .option('-v, --verbose', 'Verbose logging', config.verbose)
  .option('-i, --interactive', 'Enter interactive REPL mode');

program.addCommand(scrapeCommand);
program.addCommand(searchCommand);
program.addCommand(mapCommand);
program.addCommand(usageCommand);
program.addCommand(crawlCommand);
program.addCommand(crawlStatusCommand);
program.addCommand(batchCommand);
program.addCommand(batchStatusCommand);
program.addCommand(extractCommand);
program.addCommand(agentCommand);
program.addCommand(deepResearchCommand);
program.addCommand(llmstxtCommand);

program.action(async (options) => {
  if (options.interactive) {
    const { startREPL } = await import('./repl.js');
    startREPL(config);
  } else {
    program.help();
  }
});

program.parse(process.argv);
