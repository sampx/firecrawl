import { Command } from 'commander';
import { getClient } from '../utils/client.js';
import { handleOutput } from '../utils/output.js';
import { handleError } from '../utils/error.js';
import { Config } from '../utils/config.js';

export const extractStatusCommand = new Command('extract-status')
  .description('Get the status of an extract job')
  .argument('<id>', 'Extract job ID')
  .option('--wait', 'Wait for the extraction to complete')
  .option('--poll-interval <seconds>', 'Polling interval in seconds (default: 2)', '2')
  .option('--timeout <seconds>', 'Timeout in seconds (default: 120)', '120')
  .action(async (id, options, command) => {
    const globalOptions = command.parent.opts();
    const config: Config = {
      apiUrl: globalOptions.apiUrl,
      apiKey: globalOptions.apiKey,
      verbose: globalOptions.verbose,
    };

    try {
      const client = getClient(config);
      const pollInterval = parseInt(options.pollInterval, 10);
      const timeout = parseInt(options.timeout, 10);

      if (options.wait) {
        // Wait mode: poll until complete with progress display
        console.log(`Waiting for extract job: ${id}`);
        const startTime = Date.now();
        const deadline = startTime + timeout * 1000;

        while (Date.now() < deadline) {
          const response = await client.getExtractStatus(id);
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

          if (response.status === 'completed') {
            console.log(`\n✓ Extraction completed in ${elapsed}s`);
            if (response.tokensUsed) {
              console.log(`  Tokens used: ${response.tokensUsed}`);
            }
            if (response.creditsUsed) {
              console.log(`  Credits used: ${response.creditsUsed}`);
            }
            handleOutput(response, globalOptions.output);
            return;
          }

          if (response.status === 'failed' || response.status === 'cancelled') {
            console.log(`\n✗ Extraction ${response.status} after ${elapsed}s`);
            handleOutput(response, globalOptions.output);
            return;
          }

          // Show progress
          process.stdout.write(`\r  Status: ${response.status} (${elapsed}s elapsed)`);
          await new Promise((r) => setTimeout(r, pollInterval * 1000));
        }

        console.log(`\n✗ Timeout after ${timeout}s`);
        const finalResponse = await client.getExtractStatus(id);
        handleOutput(finalResponse, globalOptions.output);
      } else {
        // Just get status once
        const response = await client.getExtractStatus(id);
        
        console.log(`Extract job: ${id}`);
        console.log(`  Status: ${response.status}`);
        if (response.tokensUsed) {
          console.log(`  Tokens used: ${response.tokensUsed}`);
        }
        if (response.creditsUsed) {
          console.log(`  Credits used: ${response.creditsUsed}`);
        }
        
        handleOutput(response, globalOptions.output);
      }
    } catch (error) {
      handleError(error, config.verbose);
    }
  });