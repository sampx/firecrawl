# Firecrawl CLI 验证方案

## 验证环境准备

```bash
# 1. 确保在 CLI 目录
cd apps/cli

# 2. 重新构建
pnpm build

# 3. 检查帮助信息
fc-cli --help
```

---

## 命令验证清单

### 1. scrape - 单页抓取

**验证目标**: 基本抓取功能、格式选项、输出保存

```bash
# 1.1 基本抓取（默认 markdown）
fc-cli scrape https://openai.com/zh-Hans-CN/index/harness-engineering/

# 1.2 不同格式输出
fc-cli scrape https://openai.com/zh-Hans-CN/index/harness-engineering/ --format html
fc-cli scrape https://openai.com/zh-Hans-CN/index/harness-engineering/ --format markdown
fc-cli scrape https://openai.com/zh-Hans-CN/index/harness-engineering/ --format links

# 1.3 保存到文件
fc-cli scrape https://openai.com/zh-Hans-CN/index/harness-engineering/ -o /tmp/scrape-test.md

```

**预期结果**:
- [ ] 所有格式都能正常返回内容
- [ ] 文件保存成功
- [ ] 无报错

---

### 2. search - 网络搜索

**验证目标**: 搜索功能、结果限制、抓取选项

```bash
# 2.1 基本搜索
fc-cli search "firecrawl"  # 默认 5 个结果

# 2.2 限制结果数量
fc-cli search "firecrawl" --limit 3

```

**预期结果**:
- [ ] 返回搜索结果列表
- [ ] --limit 有效限制结果数
- [ ] --scrape 能抓取结果页面

---

### 3. map - 网站链接发现

**验证目标**: 链接发现、结果限制

```bash
# 3.1 基本映射
fc-cli map https://openai.com/

# 3.2 限制结果
fc-cli map https://www.ignorance.ai/ --limit 10

# 3.4 保存输出
fc-cli map "https://developers.openai.com/api/docs" --limit 200 --filter "agents" -o /tmp/map-result.json
```

**预期结果**:
- [ ] 返回网站链接列表
- [ ] --limit 有效限制数量
- [ ] 各种格式正常输出

---

### 4. crawl - 网站爬取

**验证目标**: 异步爬取、等待模式、目录输出

```bash

# 4.4 非 JSON 格式 + 目录输出（关键功能）
fc-cli crawl "https://deepwiki.com/anomalyco/opencode/" --limit 5 --timeout 60000 --wait -o /tmp/crawl-output

# 4.5 检查目录输出
ls -la /tmp/crawl-output/
```

**预期结果**:
- [ ] 异步模式返回 job ID
- [ ] --wait 等待完成并返回结果
- [ ] 非 JSON 格式创建目录结构
- [ ] markdown 文件按 URL 路径组织

---

### 5. crawl-status - 爬取状态查询

**验证目标**: 状态查询功能

```bash
# 5.1 先启动一个爬取获取 job ID
JOB_ID=$(fc-cli crawl https://openai.com/zh-Hans-CN/index/harness-engineering/ --limit 5 | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# 5.2 查询状态
fc-cli crawl-status "$JOB_ID"

# 5.3 不同格式
fc-cli crawl-status "$JOB_ID" --format json
```

**预期结果**:
- [ ] 能查询到爬取状态
- [ ] 返回状态信息（pending/running/completed）

---

### 6. batch - 批量抓取

**验证目标**: 批量处理、文件输入、等待模式

```bash
# 6.1 创建测试 URL 文件
cat > /tmp/urls.txt << EOF
https://openai.com/zh-Hans-CN/index/harness-engineering/
https://example.org
EOF

# 6.2 启动批量任务（返回 job ID）
fc-cli batch /tmp/urls.txt

# 6.3 等待完成
fc-cli batch /tmp/urls.txt --wait

# 6.4 JSON 数组输入
echo '["https://openai.com/zh-Hans-CN/index/harness-engineering/", "https://example.org"]' > /tmp/urls.json
fc-cli batch /tmp/urls.json --wait

# 6.5 保存结果
fc-cli batch /tmp/urls.txt --wait -o /tmp/batch-result.json
```

**预期结果**:
- [ ] 支持纯文本 URL 列表
- [ ] 支持 JSON 数组格式
- [ ] --wait 等待完成
- [ ] 结果保存成功

---

### 7. batch-status - 批量任务状态

**验证目标**: 批量任务状态查询

```bash
# 7.1 启动批量任务获取 job ID
BATCH_ID=$(fc-cli batch /tmp/urls.txt | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# 7.2 查询状态
fc-cli batch-status "$BATCH_ID"

# 7.3 不同格式
fc-cli batch-status "$BATCH_ID" --format json
```

**预期结果**:
- [ ] 能查询到批量任务状态
- [ ] 显示进度信息

---

### 8. extract - AI 数据提取

**验证目标**: 数据提取、prompt/schema 支持

```bash
# 8.1 基本提取
fc-cli extract https://openai.com/zh-Hans-CN/index/harness-engineering/ --prompt "Extract the title and description"

# 8.2 多 URL 提取
fc-cli extract https://openai.com/zh-Hans-CN/index/harness-engineering/ https://example.org --prompt "Extract main heading"

# 8.3 使用 prompt 文件
echo "Extract all links" > /tmp/prompt.txt
fc-cli extract https://openai.com/zh-Hans-CN/index/harness-engineering/ --prompt-file /tmp/prompt.txt

# 8.4 使用 JSON schema
cat > /tmp/schema.json << 'EOF'
{
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "description": { "type": "string" }
  }
}
EOF
fc-cli extract https://openai.com/zh-Hans-CN/index/harness-engineering/ --prompt "Extract page info" --schema /tmp/schema.json

# 8.5 保存结果
fc-cli extract https://openai.com/zh-Hans-CN/index/harness-engineering/ --prompt "Extract title" -o /tmp/extract-result.json
```

**预期结果**:
- [ ] 单 URL 提取成功
- [ ] 多 URL 提取成功
- [ ] prompt 文件读取成功
- [ ] JSON schema 验证成功

---

### 9. llmstxt - LLMs.txt 生成

**验证目标**: LLMs.txt 生成功能

```bash
# 9.1 基本生成
fc-cli llmstxt https://openai.com/zh-Hans-CN/index/harness-engineering/

# 9.2 不同格式输出
fc-cli llmstxt https://openai.com/zh-Hans-CN/index/harness-engineering/ --format json

# 9.3 保存结果
fc-cli llmstxt https://openai.com/zh-Hans-CN/index/harness-engineering/ -o /tmp/llmstxt-result.md
```

**预期结果**:
- [ ] 返回 LLMs.txt 内容
- [ ] 包含网站结构和关键页面

---

## 全局功能验证

### 10. 全局选项

```bash
# 10.1 API URL 覆盖
fc-cli --api-url http://localhost:3002 scrape https://openai.com/zh-Hans-CN/index/harness-engineering/


# 10.3 详细日志
fc-cli --verbose scrape https://openai.com/zh-Hans-CN/index/harness-engineering/

```

### 11. 交互模式

```bash
# 11.1 启动交互模式
fc-cli --interactive

# 在 REPL 中测试：
# > scrape https://openai.com/zh-Hans-CN/index/harness-engineering/
# > search "test"
# > help
# > exit
```

---

## 快速验证脚本

一次性验证所有命令（需要 API 正常运行）：

```bash
#!/bin/bash
set -e

echo "=== Firecrawl CLI 快速验证 ==="

CLI="fc-cli"
TEST_URL="https://openai.com/zh-Hans-CN/index/harness-engineering/"

echo "1. Testing scrape..."
$CLI scrape $TEST_URL --format json > /dev/null && echo "✓ scrape"

echo "2. Testing search..."
$CLI search "test" --limit 2 --format json > /dev/null && echo "✓ search"

echo "3. Testing map..."
$CLI map $TEST_URL --limit 5 --format json > /dev/null && echo "✓ map"

echo "4. Testing crawl..."
CRAWL_ID=$($CLI crawl $TEST_URL --limit 2 2>/dev/null | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
if [ -n "$CRAWL_ID" ]; then echo "✓ crawl (ID: $CRAWL_ID)"; else echo "✗ crawl"; fi

echo "5. Testing crawl-status..."
if [ -n "$CRAWL_ID" ]; then
  $CLI crawl-status "$CRAWL_ID" --format json > /dev/null && echo "✓ crawl-status"
else
  echo "⊗ crawl-status (skipped)"
fi

echo "6. Testing batch..."
echo -e "https://openai.com/zh-Hans-CN/index/harness-engineering/\nhttps://example.org" > /tmp/test-urls.txt
BATCH_ID=$($CLI batch /tmp/test-urls.txt 2>/dev/null | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
if [ -n "$BATCH_ID" ]; then echo "✓ batch (ID: $BATCH_ID)"; else echo "✗ batch"; fi

echo "7. Testing batch-status..."
if [ -n "$BATCH_ID" ]; then
  $CLI batch-status "$BATCH_ID" --format json > /dev/null && echo "✓ batch-status"
else
  echo "⊗ batch-status (skipped)"
fi

echo "8. Testing extract..."
$CLI extract $TEST_URL --prompt "Extract title" --format json > /dev/null && echo "✓ extract"

echo "9. Testing llmstxt..."
$CLI llmstxt $TEST_URL --format json > /dev/null && echo "✓ llmstxt"

echo ""
echo "=== 验证完成 ==="
```

---

## 验证结果记录

| 命令 | 状态 | 备注 |
|------|------|------|
| scrape | ⬜ | |
| search | ⬜ | |
| map | ⬜ | |
| crawl | ⬜ | |
| crawl-status | ⬜ | |
| batch | ⬜ | |
| batch-status | ⬜ | |
| extract | ⬜ | |
| llmstxt | ⬜ | |

**验证日期**: ___________
**验证人**: ___________
**CLI 版本**: ___________
**API 端点**: ___________
