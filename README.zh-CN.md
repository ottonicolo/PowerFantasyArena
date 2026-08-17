# 万象局 / Power Fantasy Arena

[English](README.md) | [简体中文](README.zh-CN.md)

万象局是一个本地运行的 AI 桌游。六种原创爽文主角共享同一个世界，从 18 岁走到 28 岁。每个月，他们各抽一件事，各做各的决定。十年后，是联手收场，还是把旧账一次算清，得看这一路究竟结下了什么。

它不是给几张人物卡套上聊天框。每个主角都有自己的价值观、盲点、决策规矩、记忆和运气。碰上同一件事，小楚会找翻盘的台阶，小顾先看退路，小沈则会琢磨能不能把偶然变成制度。

![万象局首页](docs/images/arena-home.png)

## 一局怎么走

先选 2 至 6 名主角，再定一个随机种子。整局固定 120 个月。

- 每个人每月抽到的事件不同。
- 主角由 DeepSeek V4 Flash 代为决策，全局只有一名 DeepSeek V4 Pro 裁判负责结算。
- 事件池有 30 个网文母题，每个母题分成 4 档强度，共 120 种事件。
- 主角光环会改变好运、坏事和混合事件的抽取概率。
- 第 40 个月开始可能相遇，第 80 个月后碰面的机会增加，第 120 个月一定会合。
- 每 6 个月整理一次上下文。人物设定始终保留，近期经历和真正留下来的记忆分开存放。

![主角名册中的价值观、决策规则与盲点](docs/images/character-roster.png)

## 本地运行

Windows 下最省事的办法是双击 `start-game.cmd`。脚本会启动本地服务并打开浏览器；玩完后关掉命令窗口即可。

也可以用命令行：

1. 把 `.env.example` 复制为 `.env.local`。
2. 在 `.env.local` 中填入 DeepSeek API 密钥。
3. 运行 `npm install`。
4. 运行 `npm run dev`。
5. 打开 `http://localhost:3000`。

需要 Node.js 22.13 或更高版本。

```env
DEEPSEEK_API_KEY=your_key_here
```

密钥只由本地 API 路由读取，不会进入浏览器代码，也不会写进对局档案。Git 已忽略 `.env.local`。

![人数、随机种子与本局人物设置](docs/images/run-setup.png)

## 对局会留下什么

每局都会写入独立的 `runs/<run-id>/` 文件夹：

- `report.md` 是适合阅读的对局报告，也方便拿去做视频脚本。
- `timeline.json` 保存逐月发生的完整记录。
- `summary.json` 只放结局和最终数值。

档案会记录角色公开给出的理由、引用过的记忆、放弃的方案、风险估计和裁判依据。隐藏思维链既不请求，也不保存。

## 开发命令

```bash
npm run dev
npm run build
npm test
npm run lint
npm run db:generate
```

项目使用 React 19、TypeScript、Vinext、Vite、Drizzle ORM 和 Cloudflare Vite 插件。事件分类、资料来源和模型接口核对写在 [RESEARCH.md](RESEARCH.md) 中。

## 许可

[MIT](LICENSE)
