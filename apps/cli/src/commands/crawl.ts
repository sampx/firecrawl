import { Command } from 'commander';
import { getClient } from '../utils/client.js';
import { handleOutput } from '../utils/output.js';
import { handleError } from '../utils/error.js';
import { Config } from '../utils/config.js';

export const crawlCommand = new Command('crawl')
  .description('Crawl a website')
  .argument('<url>', 'Root URL to crawl')
  .option('--limit <n>', 'Maximum number of pages to crawl (default: 100)', '100')
  .option('--wait', 'Wait for the crawl to complete')
  .action(async (url, options, command) => {
    const globalOptions = command.parent.opts();
    const config: Config = {
      apiUrl: globalOptions.apiUrl,
      apiKey: globalOptions.apiKey,
      format: globalOptions.format,
      verbose: globalOptions.verbose,
    };

    try {
      const client = getClient(config);
      const crawlOptions: any = {
        limit: parseInt(options.limit, 10),
      };

      if (options.wait) {
        const response = await client.crawl(url, crawlOptions);
        handleOutput(response, config, globalOptions.output);
      } else {
        const response = await client.startCrawl(url, crawlOptions);
        handleOutput(response, config, globalOptions.output);
      }
    } catch (error) {
      handleError(error, config.verbose);
    }
  });
