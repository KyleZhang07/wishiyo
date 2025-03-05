# Vercel 部署说明

## API 功能部署

本项目包含一个 Vercel 无服务器函数 `api/generate-image-texts.js`，该函数用于生成图像的文本描述。以下是部署到 Vercel 的步骤：

### 1. 设置环境变量

在 Vercel 部署中，你需要设置以下环境变量：

- `OPENAI_API_KEY`：你的 OpenAI API 密钥，用于访问 GPT 模型

设置方法：

1. 在 Vercel 控制面板中，选择你的项目
2. 点击 "Settings" 选项卡
3. 在左侧菜单中选择 "Environment Variables"
4. 添加变量名 `OPENAI_API_KEY` 和对应的值
5. 保存更改

### 2. 部署项目

使用 Vercel CLI 或通过 GitHub 集成部署项目：

```bash
# 使用 Vercel CLI 部署
vercel
```

或者通过 GitHub 集成，推送代码到连接到 Vercel 的仓库。

### 3. 测试 API 端点

部署完成后，你可以测试 API 端点是否工作正常：

```
POST https://你的域名/api/generate-image-texts
```

请求体示例：

```json
{
  "prompts": [
    {
      "question": "描述一个特别的时刻",
      "prompt": "两个人在海滩上散步的场景"
    }
  ],
  "tone": "Heartfelt",
  "personName": "小明",
  "personAge": "25",
  "questionsAndAnswers": [
    {
      "question": "他喜欢什么户外活动？",
      "answer": "徒步旅行和摄影"
    }
  ]
}
```

## 从 Supabase 迁移到 Vercel 的主要变化

1. 使用 Node.js 环境而不是 Deno
2. 使用 `process.env` 访问环境变量而不是 `Deno.env`
3. 使用 axios 发送 HTTP 请求
4. 使用 Express 风格的 `req` 和 `res` 对象处理请求和响应 