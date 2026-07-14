# UI Gallery AI Backend — Cloudflare Worker

AI 后端服务，提供自然语言设计对话、主题 DNA 提取和代码生成能力。

## 部署步骤

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

浏览器会打开 Cloudflare 授权页面，点击允许。

### 3. 设置 API Key 密钥

```bash
cd worker
wrangler secret put LLM_API_KEY
# 粘贴你的 LLM API Key（OpenAI / DeepSeek / Moonshot 等）
```

可选：设置其他参数

```bash
# 如果用 DeepSeek
wrangler secret put LLM_BASE_URL
# 输入: https://api.deepseek.com/v1

wrangler secret put LLM_MODEL
# 输入: deepseek-chat
```

### 4. 部署

```bash
wrangler deploy
```

部署后会得到一个地址，类似：
```
https://ui-gallery-ai.your-subdomain.workers.dev
```

### 5. 在前端配置

打开 UI Gallery 网站，点击"与 AI 设计总监对话"，然后点击 ⚙ 设置按钮，输入 Worker 地址：

```
https://ui-gallery-ai.your-subdomain.workers.dev
```

保存后，AI 功能即启用。

## 支持的 LLM 提供商

任何兼容 OpenAI API 格式的提供商：

| 提供商 | LLM_BASE_URL | LLM_MODEL | 备注 |
|--------|-------------|-----------|------|
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` | 默认 |
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` | 便宜，国内可用 |
| Moonshot | `https://api.moonshot.cn/v1` | `moonshot-v1-8k` | 国内，长上下文 |
| 通义千问 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-turbo` | 阿里云 |
| 智谱 | `https://open.bigmodel.cn/api/paas/v4` | `glm-4-flash` | 免费 |

## API 端点

### `GET /api/health`
健康检查，前端用来检测 AI 是否可用。

### `POST /api/chat`
自然语言设计对话。

```json
{
  "message": "金属质感的汽车产品页",
  "context": "已喜欢: awd-cupra",
  "projects": [{ "id": "...", "name": "...", ... }]
}
```

### `POST /api/theme`
从参考 UI 提取主题 DNA。

### `POST /api/generate`
根据主题 DNA 生成可运行 HTML。

## 安全

- API Key 存储在 Cloudflare Workers Secrets 中，永远不会暴露给前端
- Worker 只接受 CORS 请求
- 无数据库、无持久化、无用户数据收集

## 降级模式

- Worker 未部署 → 前端显示"AI 未配置"，本地搜索和浏览功能仍然可用
- Worker 部署但未设置 API Key → `/api/health` 返回 `aiEnabled: false`
- LLM API 调用失败 → 返回错误信息，前端显示错误提示
