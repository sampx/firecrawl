# 改进 Firecrawl `llmstxt` 功能

## 目标定位

**为开发人员生成本地 LLM 可用的文档包**。

输入：网站 URL  
输出：本地目录，包含结构化的 markdown 文档

---

## 两种输出类型

| 类型 | 文件 | 用途 | 使用场景 |
|------|------|------|----------|
| **index** | llms.txt + *.md 文件 | 索引 + 本地 markdown | 选择性加载，灵活引用 |
| **full** | llms-full.txt | 单文件内嵌所有内容 | 直接喂给 LLM context |

---

## CLI 设计

```bash
# 默认：输出索引 + 本地 markdown 文件
firecrawl llmstxt https://fastht.ml --output ./fasthtml-docs

# 输出单文件（内嵌内容）
firecrawl llmstxt https://fastht.ml --type full --output ./llms-full.txt

# 两者都输出
firecrawl llmstxt https://fastht.ml --type both --output ./fasthtml-docs

# 其他选项
firecrawl llmstxt https://fastht.ml \
  --output ./docs \
  --type index \
  --max-urls 100 \
  --no-cache
```

### CLI 参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--type` | `index` | 输出类型：`index` / `full` / `both` |
| `--output, -o` | `./<project-name>` | 输出目录/文件 |
| `--max-urls, -m` | `100` | 最大 URL 数量 |
| `--no-cache` | - | 禁用缓存 |
| `--no-detect` | - | 跳过已有 /llms.txt 检测 |

---

## 输出格式

### 1. Index 类型（默认）

**目录结构**：

```
./fasthtml-docs/
├── llms.txt                    # 索引文件
├── docs/
│   ├── quickstart.md
│   └── introduction.md
├── api/
│   └── reference.md
└── blog/
    └── announcing-fasthtml.md
```

**llms.txt 内容**：

```markdown
# FastHTML

> FastHTML is a python library which brings together Starlette, Uvicorn, HTMX, and fastcore's FT "FastTags" into a library for creating server-rendered hypermedia applications.

## Docs

- [Quick Start](./docs/quickstart.md): A brief overview of many FastHTML features
- [Introduction](./docs/introduction.md): Getting started with FastHTML

## API

- [Reference](./api/reference.md): Complete API documentation

## Optional

- [Announcing FastHTML](./blog/announcing-fasthtml.md): Introduction blog post
```

**单个 markdown 文件**（如 `docs/quickstart.md`）：

```markdown
# Quick Start

> Source: https://fastht.ml/docs/quickstart.html

[markdown content...]
```

### 2. Full 类型

**llms-full.txt 内容**：

```markdown
# FastHTML

> FastHTML is a python library which brings together Starlette, Uvicorn, HTMX, and fastcore's FT "FastTags" into a library for creating server-rendered hypermedia applications.

---

## Docs

### Quick Start

Source: https://fastht.ml/docs/quickstart.html

[markdown content...]

### Introduction

Source: https://fastht.ml/docs/introduction.html

[markdown content...]

---

## API

### Reference

Source: https://fastht.ml/api/reference.html

[markdown content...]

---

## Optional

### Announcing FastHTML

Source: https://fastht.ml/blog/announcing-fasthtml.html

[markdown content...]
```

**关键改进**：
- 每个文档块带 `Source: <url>` 元信息
- Agent 可追溯来源
- 按 H2 分区组织

---

## 文件命名规则

从 URL 转换为本地文件路径：

```
https://fastht.ml/docs/quickstart.html     → docs/quickstart.md
https://fastht.ml/docs/api/reference.html  → docs/api/reference.md
https://fastht.ml/blog/2024/01/post.html   → blog/2024-01-post.md
https://fastht.ml/                         → index.md
```

**规则**：
1. 移除域名，保留路径
2. 移除文件扩展名（`.html`, `.php` 等）
3. 追加 `.md`
4. 首页特殊处理 → `index.md`
5. 清理非法字符（`?`, `#`, `&` → `-`）

---

## 后端 API 改动

### 返回结构

```typescript
interface LlmstxtResponse {
  success: boolean;
  data: {
    // 项目信息
    projectName: string;
    summary: string;
    
    // 类型 1: index（结构化文件列表）
    files?: Array<{
      filename: string;      // 相对路径: "docs/quickstart.md"
      content: string;       // markdown 内容
      url: string;           // 原始 URL
      title: string;         // 页面标题
      section: string;       // 分区: Docs, API, Blog...
      description: string;   // 简短描述
    }>;
    
    // 类型 2: full（单文件内容）
    fullText?: string;
  };
}
```

### 请求参数

```typescript
interface LlmstxtRequest {
  url: string;
  maxUrls?: number;          // default: 100
  cache?: boolean;           // default: true
  detectExisting?: boolean;  // default: true
}
```

**注**：`type` 由 CLI 决定如何处理返回数据，不传给后端。

---

## 实现细节

### 1. 新增：文件路径生成

```typescript
// file-path-utils.ts

export function urlToFilePath(url: string): string {
  const parsed = new URL(url);
  let path = parsed.pathname;
  
  // 首页特殊处理
  if (path === '/' || path === '') {
    return 'index.md';
  }
  
  // 移除前导斜杠
  path = path.replace(/^\//, '');
  
  // 移除文件扩展名
  path = path.replace(/\.(html?|php|aspx?)$/i, '');
  
  // 清理非法字符
  path = path.replace(/[?#&]/g, '-');
  
  // 追加 .md
  return `${path}.md`;
}

export function urlToDirectory(url: string): string {
  const filePath = urlToFilePath(url);
  const parts = filePath.split('/');
  if (parts.length <= 1) return '';
  return parts.slice(0, -1).join('/');
}
```

### 2. 新增：URL 优先级策略

```typescript
// url-prioritizer.ts

import { categorizeUrl, DEFAULT_SECTION_RULES, SectionRule } from './section-rules';

interface PrioritizedUrl {
  url: string;
  priority: number;
  section: string;
  depth: number;
}

const SECTION_WEIGHTS: Record<string, number> = {
  'Docs': 30,
  'API': 25,
  'Examples': 20,
  'Guides': 20,
  'Pages': 10,
  'Blog': 5,
  'Changelog': 5,
  'Support': 5,
};

const KEYFILE_PATTERNS = [
  /index/i,
  /readme/i,
  /getting.?started/i,
  /intro/i,
  /quickstart/i,
  /overview/i,
  /main/i,
];

export function calculatePriority(url: string): { priority: number; section: string; depth: number } {
  const parsed = new URL(url);
  const path = parsed.pathname.toLowerCase();
  const depth = path.split('/').filter(Boolean).length;
  const { section, optional } = categorizeUrl(url);

  let priority = 50;
  priority += SECTION_WEIGHTS[section] || 10;
  priority += Math.max(0, 20 - depth * 5);
  if (KEYFILE_PATTERNS.some(p => p.test(path))) priority += 15;
  if (optional) priority -= 20;

  return { priority: Math.min(100, Math.max(0, priority)), section, depth };
}

export function prioritizeUrls(urls: string[], maxUrls: number): string[] {
  if (urls.length <= maxUrls) return urls;

  const scored = urls.map(url => ({
    url,
    ...calculatePriority(url),
  }));

  const bySection = new Map<string, PrioritizedUrl[]>();
  for (const item of scored) {
    if (!bySection.has(item.section)) bySection.set(item.section, []);
    bySection.get(item.section)!.push(item);
  }

  const baseQuota = Math.max(5, Math.floor(maxUrls / bySection.size));
  const selected: PrioritizedUrl[] = [];
  const selectedUrls = new Set<string>();

  for (const [, items] of bySection) {
    items.sort((a, b) => b.priority - a.priority);
    const quota = Math.min(baseQuota, items.length);
    for (let i = 0; i < quota; i++) {
      selected.push(items[i]);
      selectedUrls.add(items[i].url);
    }
  }

  const remaining = maxUrls - selected.length;
  if (remaining > 0) {
    const unselected = scored.filter(s => !selectedUrls.has(s.url));
    unselected.sort((a, b) => b.priority - a.priority);
    selected.push(...unselected.slice(0, remaining));
  }

  return selected.map(s => s.url);
}

export function getCoverageStats(urls: string[], selectedUrls: string[]): {
  totalUrls: number;
  selectedUrls: number;
  sections: Array<{ name: string; total: number; selected: number; coverage: number }>;
} {
  const allBySection = new Map<string, number>();
  const selectedBySection = new Map<string, number>();

  for (const url of urls) {
    const { section } = categorizeUrl(url);
    allBySection.set(section, (allBySection.get(section) || 0) + 1);
  }

  for (const url of selectedUrls) {
    const { section } = categorizeUrl(url);
    selectedBySection.set(section, (selectedBySection.get(section) || 0) + 1);
  }

  const sections = [...allBySection.entries()].map(([name, total]) => ({
    name,
    total,
    selected: selectedBySection.get(name) || 0,
    coverage: Math.round((selectedBySection.get(name) || 0) / total * 100),
  }));

  return { totalUrls: urls.length, selectedUrls: selectedUrls.length, sections };
}
```

### 3. 新增：分区规则

```typescript
// section-rules.ts

export interface SectionRule {
  patterns: RegExp[];
  section: string;
  optional?: boolean;
}

export const DEFAULT_SECTION_RULES: SectionRule[] = [
  { patterns: [/\/docs?\//, /\/documentation\//, /\/guide/, /\/tutorial/], section: 'Docs' },
  { patterns: [/\/api\//, /\/reference\//], section: 'API' },
  { patterns: [/\/example/, /\/demo/], section: 'Examples' },
  { patterns: [/\/blog\//, /\/news\//, /\/posts?\//], section: 'Blog', optional: true },
  { patterns: [/\/changelog\//, /\/release/], section: 'Changelog', optional: true },
];

export function categorizeUrl(url: string, rules: SectionRule[] = DEFAULT_SECTION_RULES): { section: string; optional: boolean } {
  const path = new URL(url).pathname.toLowerCase();
  
  for (const rule of rules) {
    if (rule.patterns.some(p => p.test(path))) {
      return { section: rule.section, optional: rule.optional ?? false };
    }
  }
  return { section: 'Pages', optional: false };
}
```

### 4. 新增：格式化输出

```typescript
// llmstxt-formatter.ts

import { urlToFilePath } from './file-path-utils';
import { categorizeUrl } from './section-rules';

export interface FileInfo {
  filename: string;
  content: string;
  url: string;
  title: string;
  section: string;
  description: string;
}

export interface LlmsTxtParams {
  projectName: string;
  summary: string;
  description?: string;
  files: FileInfo[];
}

export function formatLlmsTxtIndex(params: LlmsTxtParams): string {
  const lines: string[] = [];
  
  lines.push(`# ${params.projectName}`, '');
  lines.push(`> ${params.summary}`, '');
  
  if (params.description) {
    lines.push(params.description, '');
  }
  
  // 按分区分组
  const bySection = new Map<string, FileInfo[]>();
  for (const file of params.files) {
    if (!bySection.has(file.section)) bySection.set(file.section, []);
    bySection.get(file.section)!.push(file);
  }
  
  // 排序：非 Optional 在前
  const sorted = [...bySection.entries()].sort((a, b) => {
    const aOptional = a[0] === 'Blog' || a[0] === 'Changelog' || a[0] === 'Optional';
    const bOptional = b[0] === 'Blog' || b[0] === 'Changelog' || b[0] === 'Optional';
    if (aOptional !== bOptional) return aOptional ? 1 : -1;
    return b[1].length - a[1].length;
  });
  
  for (const [section, files] of sorted) {
    const heading = (section === 'Blog' || section === 'Changelog') ? 'Optional' : section;
    lines.push(`## ${heading}`);
    for (const file of files) {
      lines.push(`- [${file.title}](${file.filename}): ${file.description}`);
    }
    lines.push('');
  }
  
  return lines.join('\n').trim();
}

export function formatLlmsTxtFull(params: LlmsTxtParams): string {
  const lines: string[] = [];
  
  lines.push(`# ${params.projectName}`, '');
  lines.push(`> ${params.summary}`, '');
  lines.push('---', '');
  
  // 按分区分组
  const bySection = new Map<string, FileInfo[]>();
  for (const file of params.files) {
    if (!bySection.has(file.section)) bySection.set(file.section, []);
    bySection.get(file.section)!.push(file);
  }
  
  for (const [section, files] of bySection) {
    lines.push(`## ${section}`, '');
    
    for (const file of files) {
      lines.push(`### ${file.title}`, '');
      lines.push(`Source: ${file.url}`, '');
      lines.push(file.content, '');
      lines.push('---', '');
    }
  }
  
  return lines.join('\n').trim();
}

export function formatSingleFile(file: FileInfo): string {
  const lines: string[] = [];
  lines.push(`# ${file.title}`, '');
  lines.push(`> Source: ${file.url}`, '');
  lines.push(file.content);
  return lines.join('\n').trim();
}
```

### 5. 重构：主生成函数

```typescript
// generate-llmstxt-service.ts

import { prioritizeUrls, getCoverageStats } from './url-prioritizer';
import { categorizeUrl } from './section-rules';
import { urlToFilePath } from './file-path-utils';
import { formatLlmsTxtIndex, formatLlmsTxtFull, FileInfo } from './llmstxt-formatter';

export async function performGenerateLlmsTxt(options: GenerateLLMsTextServiceOptions) {
  const { generationId, teamId, url, maxUrls = 100, cache = true, detectExisting = true } = options;
  const logger = _logger.child({ module: 'generate-llmstxt', generationId, teamId });
  const costTracking = new CostTracking();
  const acuc = await getACUCTeam(teamId);
  const effectiveMaxUrls = Math.min(maxUrls, 5000);

  try {
    // 1. 检测已有文件（可选跳过）
    if (detectExisting) {
      const existing = await tryFetchExistingLlmsTxt(url, teamId, acuc?.flags);
      if (existing) {
        logger.info('Found existing /llms.txt', { url });
        // 已有文件直接返回，不做处理
        await updateGeneratedLlmsTxt(generationId, { status: 'completed', generatedText: existing });
        return { success: true, data: { existingLlmsTxt: existing } };
      }
    }

    // 2. 检查缓存
    if (cache) {
      const cached = await getLlmsTextFromCache(url, effectiveMaxUrls);
      if (cached) {
        logger.info('Found cached result', { url });
        return { success: true, data: cached.files || parseCachedResult(cached) };
      }
    }

    // 3. 提取项目信息（LLM）
    logger.info('Extracting project info', { url });
    const projectInfo = await extractProjectInfo(url, teamId, acuc?.flags, costTracking, logger);

    // 4. 获取 URL 列表
    const mapLimit = Math.min(effectiveMaxUrls * 3, 15000);
    const mapResult = await getMapResults({
      url,
      teamId,
      limit: mapLimit,
      includeSubdomains: false,
      ignoreSitemap: false,
      includeMetadata: true,
      flags: acuc?.flags,
    });

    if (!mapResult?.links?.length) {
      throw new Error('Failed to map URLs');
    }

    // 5. 优先级筛选
    const allUrls = mapResult.links;
    const selectedUrls = prioritizeUrls(allUrls, effectiveMaxUrls);
    
    const stats = getCoverageStats(allUrls, selectedUrls);
    logger.info('URL prioritization complete', { 
      total: stats.totalUrls, 
      selected: stats.selectedUrls,
      sections: stats.sections.map(s => `${s.name}:${s.selected}/${s.total}`).join(', '),
    });

    // 6. 批量抓取
    const files: FileInfo[] = [];

    for (let i = 0; i < selectedUrls.length; i += 10) {
      const batch = selectedUrls.slice(i, i + 10);
      const results = await Promise.all(batch.map(u => processUrl(u, teamId, acuc?.flags, costTracking, generationId, logger)));
      
      for (const result of results.filter(Boolean)) {
        files.push({
          filename: urlToFilePath(result.url),
          content: result.markdown,
          url: result.url,
          title: result.title,
          section: categorizeUrl(result.url).section,
          description: result.description,
        });
      }

      // 进度更新
      const indexText = formatLlmsTxtIndex({ ...projectInfo, files });
      await updateGeneratedLlmsTxt(generationId, { 
        status: 'processing', 
        generatedText: indexText,
      });
    }

    // 7. 生成两种格式
    const llmsTxt = formatLlmsTxtIndex({ ...projectInfo, files });
    const llmsFullTxt = formatLlmsTxtFull({ ...projectInfo, files });

    // 8. 保存缓存
    await saveLlmsTextToCache(url, llmsTxt, llmsFullTxt, effectiveMaxUrls, files);
    
    await updateGeneratedLlmsTxt(generationId, { 
      status: 'completed', 
      generatedText: llmsTxt,
    });

    // 9. 计费
    await logLlmsTxt({ /* ... */ });
    billTeam(teamId, undefined, files.length, undefined, { endpoint: 'llms_txt', jobId: generationId }, logger).catch(() => {});

    return { 
      success: true, 
      data: {
        projectName: projectInfo.name,
        summary: projectInfo.summary,
        files,
        llmsTxt,
        llmsFullTxt,
      } 
    };

  } catch (error: any) {
    logger.error('Generation failed', { error });
    await updateGeneratedLlmsTxt(generationId, { status: 'failed', error: error.message });
    throw error;
  }
}

// 辅助函数：处理单个 URL
async function processUrl(
  url: string, 
  teamId: string, 
  flags: TeamFlags | null, 
  costTracking: CostTracking, 
  generationId: string, 
  logger: Logger
) {
  try {
    const doc = await scrapeDocument({ url, teamId, origin: 'llmstxt', timeout: 30000, isSingleUrl: true, flags });
    if (!doc?.markdown) return null;

    const { extract } = await generateCompletions({
      logger,
      model: getModel('gpt-4o-mini', 'openai'),
      options: {
        schema: z.object({ title: z.string(), description: z.string() }),
        prompt: `Generate for this page:\n${doc.metadata?.url}\n\nReturn:\n- title: 2-4 words\n- description: 8-10 words`,
      },
      markdown: doc.markdown,
      costTrackingOptions: { costTracking, metadata: { module: 'llmstxt', method: 'pageDescription' } },
      metadata: { teamId, functionId: 'llmstxt-page', llmsTxtId: generationId },
    });

    return { title: extract.title, url: doc.metadata?.url, description: extract.description, markdown: doc.markdown };
  } catch {
    return null;
  }
}
```

### 6. CLI 实现

```typescript
// llmstxt.ts

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { Config } from '../utils/config.js';
import { handleError } from '../utils/error.js';

type OutputType = 'index' | 'full' | 'both';

export const llmstxtCommand = new Command('llmstxt')
  .description('Generate LLMs.txt documentation package for a website')
  .argument('<url>', 'URL to generate documentation from')
  .option('-o, --output <path>', 'Output directory or file')
  .option('-t, --type <type>', 'Output type: index, full, or both', 'index')
  .option('-m, --max-urls <n>', 'Maximum URLs to process', parseInt, 100)
  .option('--no-cache', 'Disable cache')
  .option('--no-detect', 'Skip existing /llms.txt detection')
  .action(async (url, options, command) => {
    const globalOptions = command.parent.opts();
    const config: Config = {
      apiUrl: globalOptions.apiUrl,
      apiKey: globalOptions.apiKey,
      verbose: globalOptions.verbose,
    };

    const type = options.type as OutputType;
    if (!['index', 'full', 'both'].includes(type)) {
      console.error(`Invalid type: ${type}. Must be: index, full, or both`);
      process.exit(1);
    }

    try {
      const headers: any = {};
      if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;

      if (config.verbose) console.log(`Starting LLMs.txt generation for ${url}...`);

      const response = await axios.post(`${config.apiUrl}/v1/llmstxt`, {
        url,
        maxUrls: options.maxUrls,
        cache: options.cache !== false,
        detectExisting: options.detect !== false,
      }, { headers });

      const jobId = response.data.id;
      if (config.verbose) console.log(`Job ID: ${jobId}, waiting for completion...`);

      // 轮询等待完成
      let result = null;
      let status = 'pending';
      while (status === 'pending' || status === 'processing') {
        await new Promise(r => setTimeout(r, 2000));
        const statusRes = await axios.get(`${config.apiUrl}/v1/llmstxt/${jobId}`, { headers });
        status = statusRes.data.status;
        result = statusRes.data;
      }

      if (status === 'failed') {
        console.error('Generation failed:', result.error);
        process.exit(1);
      }

      const data = result.data;
      const outputDir = options.output || `./${data.projectName || 'llms-docs'}`;

      if (type === 'index' || type === 'both') {
        await writeIndexOutput(outputDir, data, config.verbose);
      }

      if (type === 'full' || type === 'both') {
        const fullFile = type === 'both' ? path.join(outputDir, 'llms-full.txt') : outputDir;
        fs.writeFileSync(fullFile, data.llmsFullTxt);
        if (config.verbose) console.log(`Written: ${fullFile}`);
      }

      console.log(`\nGenerated ${data.files?.length || 0} files to ${outputDir}`);

    } catch (error) {
      handleError(error, config.verbose);
    }
  });

async function writeIndexOutput(outputDir: string, data: any, verbose: boolean) {
  const fs = await import('fs');
  const path = await import('path');

  // 创建目录
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 写入 llms.txt
  fs.writeFileSync(path.join(outputDir, 'llms.txt'), data.llmsTxt);
  if (verbose) console.log(`Written: ${path.join(outputDir, 'llms.txt')}`);

  // 写入各个 markdown 文件
  for (const file of data.files || []) {
    const filePath = path.join(outputDir, file.filename);
    const dir = path.dirname(filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 添加 source 元信息
    const content = `# ${file.title}\n\n> Source: ${file.url}\n\n${file.content}`;
    fs.writeFileSync(filePath, content);
    
    if (verbose) console.log(`Written: ${filePath}`);
  }
}
```

---

## 改动文件清单

| 文件 | 改动 |
|------|------|
| `apps/api/src/lib/generate-llmstxt/generate-llmstxt-service.ts` | **重构**：返回结构化文件列表 |
| `apps/api/src/lib/generate-llmstxt/llmstxt-formatter.ts` | **新增**：格式化函数 |
| `apps/api/src/lib/generate-llmstxt/section-rules.ts` | **新增**：分区规则 |
| `apps/api/src/lib/generate-llmstxt/url-prioritizer.ts` | **新增**：URL 优先级策略 |
| `apps/api/src/lib/generate-llmstxt/file-path-utils.ts` | **新增**：URL → 文件路径转换 |
| `apps/api/src/lib/generate-llmstxt/generate-llmstxt-supabase.ts` | 修改：缓存文件列表 |
| `apps/cli/src/commands/llmstxt.ts` | **重构**：新参数 + 文件写入 |
| `apps/cli/src/controllers/v1/types.ts` | 扩展：请求/响应类型 |

---

## 验证标准

| 场景 | 验证点 |
|------|--------|
| **格式合规** | llms.txt 符合规范（H1 + blockquote + H2 分区） |
| **本地链接** | 链接指向 `./path/file.md` 相对路径 |
| **文件可追溯** | 每个 md 文件顶部有 `Source: <url>` |
| **分区覆盖** | 每个分区至少有代表页面 |
| **--type full** | 输出单个 llms-full.txt，内容带 Source |
| **--type both** | 同时输出两种格式 |

---

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 文件名冲突 | URL 包含 query 参数时用 `-` 替代 |
| 目录过深 | 限制最大深度，扁平化处理 |
| 磁盘空间 | 文档大小预估 + 提示用户 |
| 已有文件覆盖 | 检测并提示用户确认 |