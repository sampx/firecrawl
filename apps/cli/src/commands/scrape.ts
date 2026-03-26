import { Command } from 'commander';
import { getClient } from '../utils/client.js';
import { handleOutput } from '../utils/output.js';
import { handleError } from '../utils/error.js';
import { Config } from '../utils/config.js';

export const scrapeCommand = new Command('scrape')
  .description('Scrape a single URL')
  .argument('<url>', 'URL to scrape')
  .option('--format <type>', 'Output content format: markdown (default), html, links', 'markdown')
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
      const scrapeOptions: any = { formats: [options.format] };
      
      if (options.prompt) {
        scrapeOptions.onlyCleanContent = { prompt: options.prompt };
      } else if (options.clean) {
        scrapeOptions.onlyCleanContent = true;
      }

      const response = await client.scrape(url, scrapeOptions);
      handleOutput(response, globalOptions.output);
    } catch (error) {
      handleError(error, config.verbose);
    }
  });
