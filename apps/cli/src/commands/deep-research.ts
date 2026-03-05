import { Command } from "commander";
import { handleOutput } from "../utils/output.js";
import { handleError } from "../utils/error.js";
import { Config } from "../utils/config.js";
import axios from "axios";

export const deepResearchCommand = new Command("deep-research")
  .description("Run a deep research task")
  .argument("<query>", "Research query")
  .option("--wait", "Wait for the research to complete")
  .action(async (query, options, command) => {
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
        headers["Authorization"] = `Bearer ${config.apiKey}`;
      }

      const response = await axios.post(
        `${config.apiUrl}/v1/deep-research`,
        {
          query,
          maxDepth: 7,
          timeLimit: 270,
          maxUrls: 20,
        },
        { headers },
      );

      if (options.wait) {
        const jobId = response.data.id;
        if (config.verbose)
          console.log(`Started deep research job: ${jobId}, waiting...`);

        let status = "pending";
        let result = null;
        while (
          status === "pending" ||
          status === "running" ||
          status === "processing" ||
          status === "in_progress"
        ) {
          await new Promise((r) => setTimeout(r, 5000));
          const statusRes = await axios.get(
            `${config.apiUrl}/v1/deep-research/${jobId}`,
            { headers },
          );
          status = statusRes.data.status;
          result = statusRes.data;
          if (config.verbose) console.log(`Status: ${status}`);
        }
        handleOutput(result, config, globalOptions.output);
      } else {
        handleOutput(response.data, config, globalOptions.output);
      }
    } catch (error) {
      handleError(error, config.verbose);
    }
  });
