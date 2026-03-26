import { Command } from 'commander';
import { handleOutput } from '../utils/output.js';
import { handleError } from '../utils/error.js';
import { Config } from '../utils/config.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

interface MarkdownFile {
  relativePath: string;
  title: string;
  description: string;
  content: string;
}

function isUrl(arg: string): boolean {
  return arg.startsWith('http://') || arg.startsWith('https://');
}

function extractTitle(content: string, filename: string): string {
  // 1. Try frontmatter title
  const fmMatch = content.match(/^---\n[\s\S]*?^title:\s*["']?(.+?)["']?\s*$/m);
  if (fmMatch) return fmMatch[1].trim();

  // 2. Try first H1
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();

  // 3. Use filename
  return path.basename(filename, '.md').replace(/[-_]/g, ' ');
}

function extractDescription(content: string, maxLength = 80): string {
  // Remove frontmatter
  let text = content.replace(/^---\n[\s\S]*?^---\n/m, '');
  // Remove headings
  text = text.replace(/^#+\s+.+$/gm, '');
  // Find first non-empty paragraph
  const paragraphs = text.split(/\n\n+/);
  for (const p of paragraphs) {
    const cleaned = p.trim()
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_`#]/g, '')
      .replace(/\n/g, ' ')
      .trim();
    if (cleaned.length < 10) continue;
    if (/^(Loading|Index your code|Edit Wiki|Last indexed)/i.test(cleaned)) continue;
    return cleaned.length > maxLength
      ? cleaned.slice(0, maxLength).trim() + '...'
      : cleaned;
  }
  return '';
}

function scanMarkdownFiles(dir: string, verbose?: boolean): MarkdownFile[] {
  const files: MarkdownFile[] = [];
  const baseDir = path.resolve(dir);

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const relativePath = path.relative(baseDir, fullPath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const title = extractTitle(content, entry.name);
        const description = extractDescription(content);

        files.push({ relativePath, title, description, content });
        if (verbose) console.log(`  Found: ${relativePath}`);
      }
    }
  }

  walk(baseDir);
  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

function generateLlmsTxt(files: MarkdownFile[], dirName: string): string {
  let output = `# ${dirName} llms.txt\n\n`;

  for (const file of files) {
    const desc = file.description ? `: ${file.description}` : '';
    output += `- [${file.title}](${file.relativePath})${desc}\n`;
  }

  return output;
}

function generateLlmsFullTxt(files: MarkdownFile[], dirName: string): string {
  let output = `# ${dirName} llms-full.txt\n\n`;

  for (const file of files) {
    // Remove frontmatter from content
    const content = file.content.replace(/^---\n[\s\S]*?^---\n/m, '');
    output += `## ${file.title}\n\n${content.trim()}\n\n`;
  }

  return output;
}

async function handleLocalDirectory(
  dir: string,
  options: { full?: boolean; verbose?: boolean },
): Promise<void> {
  const resolvedDir = path.resolve(dir);

  if (!fs.existsSync(resolvedDir)) {
    console.error(`Directory not found: ${resolvedDir}`);
    process.exit(1);
  }

  if (!fs.statSync(resolvedDir).isDirectory()) {
    console.error(`Not a directory: ${resolvedDir}`);
    process.exit(1);
  }

  if (options.verbose) console.log(`Scanning directory: ${resolvedDir}`);

  const files = scanMarkdownFiles(resolvedDir, options.verbose);

  if (files.length === 0) {
    console.error(`No markdown files found in ${resolvedDir}`);
    process.exit(1);
  }

  console.log(`Found ${files.length} markdown files`);

  const dirName = path.basename(resolvedDir);
  const llmsTxt = generateLlmsTxt(files, dirName);
  const llmsTxtPath = path.join(resolvedDir, 'llms.txt');
  fs.writeFileSync(llmsTxtPath, llmsTxt);
  console.log(`Generated: ${llmsTxtPath}`);

  if (options.full) {
    const llmsFullTxt = generateLlmsFullTxt(files, dirName);
    const llmsFullTxtPath = path.join(resolvedDir, 'llms-full.txt');
    fs.writeFileSync(llmsFullTxtPath, llmsFullTxt);
    console.log(`Generated: ${llmsFullTxtPath}`);
  }
}

export const llmstxtCommand = new Command('llmstxt')
  .description('Generate LLMs.txt for a website or local directory')
  .argument('<path>', 'URL or local directory path')
  .option('--full', 'Also generate llms-full.txt (local directory only)')
  .action(async (inputPath, options, command) => {
    const globalOptions = command.parent.opts();
    const config: Config = {
      apiUrl: globalOptions.apiUrl,
      apiKey: globalOptions.apiKey,
      verbose: globalOptions.verbose,
    };

    try {
      if (isUrl(inputPath)) {
        // URL mode: call API
        const headers: any = {};
        if (config.apiKey) {
          headers['Authorization'] = `Bearer ${config.apiKey}`;
        }

        if (config.verbose) console.log(`Starting LLMs.txt generation for ${inputPath}...`);

        const response = await axios.post(`${config.apiUrl}/v1/llmstxt`, {
          url: inputPath
        }, { headers });

        const jobId = response.data.id;
        if (config.verbose) console.log(`Job ID: ${jobId}, waiting for completion...`);

        let status = 'pending';
        let result = null;
        while (status === 'pending' || status === 'running' || status === 'processing') {
          await new Promise(r => setTimeout(r, 2000));
          const statusRes = await axios.get(`${config.apiUrl}/v1/llmstxt/${jobId}`, { headers });
          status = statusRes.data.status;
          result = statusRes.data;
        }
        handleOutput(result, globalOptions.output);
      } else {
        // Local directory mode
        await handleLocalDirectory(inputPath, {
          full: options.full,
          verbose: config.verbose,
        });
      }
    } catch (error) {
      handleError(error, config.verbose);
    }
  });
