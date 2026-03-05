import { Command } from 'commander';
import { getClient } from '../utils/client.js';
import { handleOutput } from '../utils/output.js';
import { handleError } from '../utils/error.js';
import { Config } from '../utils/config.js';

export const crawlStatusCommand = new Command('crawl-status')
  .description('Get the status of a crawl job')
  .argument('<id>', 'Crawl job ID')
  .action(async (id, _options, command) => {
    const globalOptions = command.parent.opts();
    const config: Config = {
      apiUrl: globalOptions.apiUrl,
      apiKey: globalOptions.apiKey,
      format: globalOptions.format,
      verbose: globalOptions.verbose,
    };

    try {
      const client = getClient(config);
      const response = await client.getCrawlStatus(id);
      handleOutput(response, config, globalOptions.output);
    } catch (error) {
      handleError(error, config.verbose);
    }
  });
