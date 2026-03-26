import readline from 'readline';
import chalk from 'chalk';
import { Config } from './utils/config.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function startREPL(config: Config) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.cyan('fc-cli > '),
  });

  console.log(chalk.green('Welcome to Firecrawl CLI Interactive Mode!'));
  console.log(chalk.gray('Type "help" for commands or "exit" to quit.'));

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    if (input === 'exit' || input === 'quit') {
      rl.close();
      return;
    }

    if (input === '') {
      rl.prompt();
      return;
    }

    if (input === 'help') {
      console.log(chalk.yellow('Commands:'));
      console.log('  scrape <url>');
      console.log('  search <query>');
      console.log('  crawl <url>');
      console.log('  crawl-status <id>');
      console.log('  map <url>');
      console.log('  extract <urls...> --prompt <text>');
      console.log('  batch <file>');
      console.log('  batch-status <id>');
      console.log('  llmstxt <url>');
      console.log('  exit');
      rl.prompt();
      return;
    }

    // Execute the command by spawning a new process of the same CLI
    // This ensures consistency but might be slightly slower than direct call.
    // For a real REPL, we'd want to call the command functions directly.
    const args = input.split(/\s+/);
    
    // Construct the command to run: node dist/index.js [args] --api-url ... --api-key ...
    const cliPath = path.resolve(__dirname, 'index.js');
    const fullArgs = [cliPath, ...args];
    if (config.apiUrl) fullArgs.push('--api-url', config.apiUrl);
    if (config.apiKey) fullArgs.push('--api-key', config.apiKey);

    const child = spawn('node', fullArgs, { stdio: 'inherit' });

    child.on('close', () => {
      rl.prompt();
    });
  });

  rl.on('close', () => {
    console.log(chalk.green('\nGoodbye!'));
    process.exit(0);
  });
}
