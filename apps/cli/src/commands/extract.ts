import { Command } from 'commander';
import { getClient } from '../utils/client.js';
import { handleOutput } from '../utils/output.js';
import { handleError } from '../utils/error.js';
import { Config } from '../utils/config.js';
import fs from 'fs';

export const extractCommand = new Command('extract')
  .description('AI Extract data from URLs')
  .argument('<urls...>', 'URLs to extract from')
  .requiredOption('--prompt <text>', 'Extraction prompt')
  .option('--schema <file>', 'JSON Schema file path')
  .action(async (urls, options, command) => {
    const globalOptions = command.parent.opts();
    const config: Config = {
      apiUrl: globalOptions.apiUrl,
      apiKey: globalOptions.apiKey,
      format: globalOptions.format,
      verbose: globalOptions.verbose,
    };

    try {
      const client = getClient(config);
      let schema: any;
      if (options.schema) {
        if (!fs.existsSync(options.schema)) {
          throw new Error(`Schema file not found: ${options.schema}`);
        }
        schema = JSON.parse(fs.readFileSync(options.schema, 'utf8'));
      }

      const extractOptions: any = {
        urls,
        prompt: options.prompt,
        schema,
      };

      const response = await client.extract(extractOptions);
      handleOutput(response, config, globalOptions.output);
    } catch (error) {
      handleError(error, config.verbose);
    }
  });
