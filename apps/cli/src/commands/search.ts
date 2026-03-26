import { Command } from 'commander';
import { getClient } from '../utils/client.js';
import { handleOutput } from '../utils/output.js';
import { handleError } from '../utils/error.js';
import { Config } from '../utils/config.js';

export const searchCommand = new Command('search')
  .description('Perform a web search')
  .argument('<query>', 'Search query')
  .option('--limit <n>', 'Number of results (default: 5)', '5')
  .action(async (query, options, command) => {
    const globalOptions = command.parent.opts();
    const config: Config = {
      apiUrl: globalOptions.apiUrl,
      apiKey: globalOptions.apiKey,
      verbose: globalOptions.verbose,
    };

    try {
      const client = getClient(config);
      const searchOptions: any = {
        limit: parseInt(options.limit, 10),
      };
      const response = await client.search(query, searchOptions);
      handleOutput(response, globalOptions.output);
    } catch (error) {
      handleError(error, config.verbose);
    }
  });
