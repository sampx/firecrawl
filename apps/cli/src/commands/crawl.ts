import { Command } from 'commander';
import { getClient } from '../utils/client.js';
import { handleOutput, writeCrawlDocuments } from '../utils/output.js';
import { handleError } from '../utils/error.js';
import { Config } from '../utils/config.js';

export const crawlCommand = new Command('crawl')
  .description('Crawl a website')
  .argument('<url>', 'Root URL to crawl')
  .option('--limit <n>', 'Maximum number of pages to crawl (default: 100)', '100')
  .option('--timeout <ms>', 'Timeout per page in milliseconds (default: 60000)', '60000')
  .option('--wait', 'Wait for the crawl to complete')
  .option('--clean', 'Use AI to clean content (remove nav, ads, sidebars, etc.)')
  .option('--prompt <text>', 'Custom prompt for AI content processing (implies --clean)')
  .action(async (url, options, command) => {
    const globalOptions = command.parent.opts();
    const config: Config = {
      apiUrl: globalOptions.apiUrl,
      apiKey: globalOptions.apiKey,
      verbose: globalOptions.verbose,
    };

    try {
      const client = getClient(config);
      const crawlOptions: any = {
        limit: parseInt(options.limit, 10),
      };

      const scrapeOptions: any = {};
      if (options.timeout) {
        scrapeOptions.timeout = parseInt(options.timeout, 10);
      }
      if (options.prompt) {
        scrapeOptions.onlyCleanContent = { prompt: options.prompt };
      } else if (options.clean) {
        scrapeOptions.onlyCleanContent = true;
      }

      if (options.wait) {
        const response = await client.crawl(url, crawlOptions, scrapeOptions);
        const documents = response.data || [];

        if (globalOptions.output) {
          // Directory output: write markdown files
          writeCrawlDocuments(documents, globalOptions.output, config.verbose);
        } else {
          // Default: hostname-based directory
          const hostname = new URL(url).hostname;
          writeCrawlDocuments(documents, `./${hostname}`, config.verbose);
        }
      } else {
        const response = await client.startCrawl(url, crawlOptions);
        handleOutput(response, globalOptions.output);
      }
    } catch (error) {
      handleError(error, config.verbose);
    }
  });
