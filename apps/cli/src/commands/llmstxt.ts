import { Command } from 'commander';
import { handleOutput } from '../utils/output.js';
import { handleError } from '../utils/error.js';
import { Config } from '../utils/config.js';
import axios from 'axios';

export const llmstxtCommand = new Command('llmstxt')
  .description('Generate LLMs.txt for a website')
  .argument('<url>', 'URL to generate LLMs.txt from')
  .action(async (url, _options, command) => {
    const globalOptions = command.parent.opts();
    const config: Config = {
      apiUrl: globalOptions.apiUrl,
      apiKey: globalOptions.apiKey,
      format: globalOptions.format,
      verbose: globalOptions.verbose,
    };

    try {
      const headers: any = {};
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      if (config.verbose) console.log(`Starting LLMs.txt generation for ${url}...`);

      const response = await axios.post(`${config.apiUrl}/v1/llmstxt`, {
        url
      }, { headers });

      const jobId = response.data.id;
      if (config.verbose) console.log(`Job ID: ${jobId}, waiting for completion...`);

      let status = 'pending';
      let result = null;
      while (status === 'pending' || status === 'running') {
        await new Promise(r => setTimeout(r, 2000));
        const statusRes = await axios.get(`${config.apiUrl}/v1/llmstxt/${jobId}`, { headers });
        status = statusRes.data.status;
        result = statusRes.data;
      }
      handleOutput(result, config, globalOptions.output);
    } catch (error) {
      handleError(error, config.verbose);
    }
  });
