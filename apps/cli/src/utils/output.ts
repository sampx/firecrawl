import fs from 'fs';
import path from 'path';

// Filter links by wildcard pattern. Supports * as wildcard matching any characters.
export function filterLinks(urls: string[], pattern: string): string[] {
  if (!pattern) return urls;
  // Convert glob pattern to regex: * → .*, ? → .
  const regex = new RegExp(
    '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$',
    'i'
  );
  return urls.filter(url => regex.test(url));
}

// Filter links array in data object by wildcard pattern.
export function filterDataLinks(data: any, pattern: string): any {
  if (!pattern) return data;
  if (Array.isArray(data)) {
    return data.map(l => typeof l === 'string' ? l : l.url).filter(Boolean);
  }
  if (data?.links) {
    const filtered = filterLinks(
      data.links.map((l: any) => typeof l === 'string' ? l : l.url).filter(Boolean),
      pattern
    );
    return { ...data, links: filtered };
  }
  return data;
}

/**
 * Format API response for output.
 * - If response has markdown field, output it directly
 * - Otherwise output as JSON
 */
export function formatOutput(data: any): string {
  if (data && typeof data === 'object') {
    // scrape response: { markdown: '...', links: [...], ... }
    if (typeof data.markdown === 'string') return data.markdown;
    // nested data: { data: { markdown: '...' } }
    if (data.data && typeof data.data.markdown === 'string') return data.data.markdown;
    // links array
    if (Array.isArray(data.links)) {
      return data.links.map(l => typeof l === 'string' ? l : JSON.stringify(l)).join('\n');
    }
    if (data.data && Array.isArray(data.data.links)) {
      return data.data.links.map(l => typeof l === 'string' ? l : JSON.stringify(l)).join('\n');
    }
  }
  return typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
}

export function handleOutput(data: any, outputFile?: string) {
  const output = formatOutput(data);
  if (outputFile) {
    fs.writeFileSync(outputFile, output);
  } else {
    console.log(output);
  }
}

interface Document {
  markdown?: string;
  metadata?: {
    url?: string;
    title?: string;
    [key: string]: unknown;
  };
}

/**
 * Convert URL path to a file path for markdown output.
 * - https://example.com/ → index.md
 * - https://example.com/docs/guide → docs/guide.md
 * - https://example.com/docs/guide/ → docs/guide/index.md
 */
function urlToFilePath(url: string): string {
  try {
    const parsed = new URL(url);
    // Strip query string and anchor
    let pathname = parsed.pathname;
    // Remove leading slash
    pathname = pathname.replace(/^\//, '');
    // Handle trailing slash
    if (pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
      if (!pathname) return 'index.md';
      return `${pathname}/index.md`;
    }
    // Handle empty path or root
    if (!pathname) return 'index.md';
    return `${pathname}.md`;
  } catch {
    // Fallback for invalid URLs
    return 'index.md';
  }
}

/**
 * Write crawled documents to a directory structure with markdown files.
 */
export function writeCrawlDocuments(
  documents: Document[],
  outputDir: string,
  verbose?: boolean
): { totalFiles: number; outputDir: string } {
  let totalFiles = 0;

  for (const doc of documents) {
    const markdown = doc.markdown;
    if (!markdown) continue;

    const url = doc.metadata?.url;
    if (!url) continue;

    const filePath = urlToFilePath(url);
    const fullPath = path.join(outputDir, filePath);

    // Create parent directories if needed
    const dir = path.dirname(fullPath);
    fs.mkdirSync(dir, { recursive: true });

    // Write the file
    fs.writeFileSync(fullPath, markdown);
    totalFiles++;

    if (verbose) {
      console.log(`  ${filePath}`);
    }
  }

  console.log(`Wrote ${totalFiles} files to ${outputDir}`);
  return { totalFiles, outputDir };
}
