import { Command } from 'commander';
import { getClient } from '../utils/client.js';
import { handleOutput } from '../utils/output.js';
import { handleError } from '../utils/error.js';
import { Config } from '../utils/config.js';

export const agentCommand = new Command('agent')
  .description('Run an AI agent task')
  .requiredOption('--prompt <text>', 'Task description')
  .option('--urls <urls...>', 'Starting URLs')
  .option('--wait', 'Wait for the agent to complete')
  .action(async (options, command) => {
    const globalOptions = command.parent.opts();
    const config: Config = {
      apiUrl: globalOptions.apiUrl,
      apiKey: globalOptions.apiKey,
      format: globalOptions.format,
      verbose: globalOptions.verbose,
    };

    try {
      const client = getClient(config);
      const agentOptions: any = {
        prompt: options.prompt,
        urls: options.urls,
      };

      if (options.wait) {
        const response = await client.agent(agentOptions);
        handleOutput(response, config, globalOptions.output);
      } else {
        const response = await client.startAgent(agentOptions);
        handleOutput(response, config, globalOptions.output);
      }
    } catch (error) {
      handleError(error, config.verbose);
    }
  });
