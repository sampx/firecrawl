import { Command } from 'commander';
import { getClient } from '../utils/client.js';
import { handleOutput } from '../utils/output.js';
import { handleError } from '../utils/error.js';
import { Config } from '../utils/config.js';

export const mapCommand = new Command('map')
  .description('Discover links on a website')
  .argument('<url>', 'URL to map')
  .option('--limit <n>', 'Maximum number of links to return (default: 100)', '100')
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
      const mapOptions: any = {
        limit: parseInt(options.limit, 10),
      };
      const response = await client.map(url, mapOptions);
      handleOutput(response, config, globalOptions.output);
    } catch (error) {
      handleError(error, config.verbose);
    }
  });
