import { Command } from 'commander';
import { getClient } from '../utils/client.js';
import { handleOutput } from '../utils/output.js';
import { handleError } from '../utils/error.js';
import { Config } from '../utils/config.js';
import fs from 'fs';

export const batchCommand = new Command('batch')
  .description('Start a batch scrape job')
  .argument('<file>', 'File containing URLs (one per line or JSON array)')
  .option('--wait', 'Wait for the batch scrape to complete')
  .option('--poll-interval <seconds>', 'Poll interval in seconds (default: 2)', '2')
  .option('--timeout <seconds>', 'Timeout in seconds (default: 120)', '120')
  .action(async (file, options, command) => {
    const globalOptions = command.parent.opts();
    const config: Config = {
      apiUrl: globalOptions.apiUrl,
      apiKey: globalOptions.apiKey,
      verbose: globalOptions.verbose,
    };

    try {
      if (!fs.existsSync(file)) {
        throw new Error(`File not found: ${file}`);
      }

      const content = fs.readFileSync(file, 'utf8').trim();
      let urls: string[] = [];
      if (content.startsWith('[')) {
        urls = JSON.parse(content);
      } else {
        urls = content.split('\n').map(u => u.trim()).filter(u => u.length > 0);
      }

      const client = getClient(config);
      if (options.wait) {
        const response = await client.batchScrape(urls, {
          pollInterval: parseInt(options.pollInterval, 10),
          timeout: parseInt(options.timeout, 10),
        });
        handleOutput(response, globalOptions.output);
      } else {
        const response = await client.startBatchScrape(urls);
        handleOutput(response, globalOptions.output);
      }
    } catch (error) {
      handleError(error, config.verbose);
    }
  });
