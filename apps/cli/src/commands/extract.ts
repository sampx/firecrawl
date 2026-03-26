import { Command } from 'commander';
import { getClient } from '../utils/client.js';
import { handleOutput } from '../utils/output.js';
import { handleError } from '../utils/error.js';
import { Config } from '../utils/config.js';
import fs from 'fs';

export const extractCommand = new Command('extract')
  .description('AI Extract data from URLs')
  .argument('<urls...>', 'URLs to extract from')
  .option('--prompt <text>', 'Extraction prompt')
  .option('--prompt-file <file>', 'Path to a file containing the extraction prompt')
  .option('--schema <file>', 'JSON Schema file path')
  .option('--wait', 'Wait for the extraction to complete')
  .option('--poll-interval <seconds>', 'Polling interval in seconds (default: 2)', '2')
  .option('--timeout <seconds>', 'Timeout in seconds (default: 120)', '120')
  .action(async (urls, options, command) => {
    const globalOptions = command.parent.opts();
    const config: Config = {
      apiUrl: globalOptions.apiUrl,
      apiKey: globalOptions.apiKey,
      verbose: globalOptions.verbose,
    };

    try {
      const client = getClient(config);

      let prompt = options.prompt;
      if (!prompt && options.promptFile) {
        if (!fs.existsSync(options.promptFile)) {
          throw new Error(`Prompt file not found: ${options.promptFile}`);
        }
        prompt = fs.readFileSync(options.promptFile, 'utf8').trim();
      }
      if (!prompt) {
        throw new Error('Either --prompt or --prompt-file is required');
      }

      let schema: any;
      if (options.schema) {
        if (!fs.existsSync(options.schema)) {
          throw new Error(`Schema file not found: ${options.schema}`);
        }
        schema = JSON.parse(fs.readFileSync(options.schema, 'utf8'));
      }

      const pollInterval = parseInt(options.pollInterval, 10);
      const timeout = parseInt(options.timeout, 10);

      if (options.wait) {
        // Wait mode: poll until complete with progress display
        console.log('Starting extraction...');
        const startTime = Date.now();

        const response = await client.extract({
          urls,
          prompt,
          schema,
          pollInterval,
          timeout,
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        
        if (response.status === 'completed') {
          console.log(`\n✓ Extraction completed in ${elapsed}s`);
          if (response.tokensUsed) {
            console.log(`  Tokens used: ${response.tokensUsed}`);
          }
          if (response.creditsUsed) {
            console.log(`  Credits used: ${response.creditsUsed}`);
          }
        } else {
          console.log(`\n✗ Extraction ${response.status} after ${elapsed}s`);
        }

        handleOutput(response, globalOptions.output);
      } else {
        // Async mode: just start the job and return ID
        const response = await client.startExtract({
          urls,
          prompt,
          schema,
        });

        if (response.id) {
          console.log(`Extract job started: ${response.id}`);
          console.log(`Check status with: fc-cli extract-status ${response.id}`);
        }

        handleOutput(response, globalOptions.output);
      }
    } catch (error) {
      handleError(error, config.verbose);
    }
  });