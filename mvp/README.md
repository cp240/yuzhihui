# 认知知识库 · AI 驱动的自适应学习系统

一个用 **AI 后台调度 + 间隔复习算法** 驱动的学习系统。核心逻辑：

```
抓最新消息 → AI(DeepSeek) 生成知识卡+选择题 → 前端学习/做题
      ↑                                        ↓
      └──────── 正确率·错题喂回，调整复习排期 ←──┘
```

- **零依赖**：纯 Node.js，不需要数据库、不需要构建工具
- **先专有后白话**：每个术语先生严谨学术定义，再给白话比喻
- **间隔复习**：R1(1天)→R2(3天)→R3(7天)→R4(16天)→R5(35天)→R6(90天)→长期(180天)

---

## 目录结构

```
mvp/
├── server.js        # 后端大脑（调度引擎 + DeepSeek 生成 + 反馈闭环 + 静态服务）
├── knowledge.json   # 33 条知识点（七阶课程地图，M/F/C/T/G/P 六类）
├── index.html       # 前端界面（调后端 API）
├── state.json       # 学习进度持久化（运行时自动生成）
├── .env             # 你的 DeepSeek key（已 gitignore）
├── data.js          # ⚠️ 旧版静态页残留，已废弃，可删除
└── scheduler.js     # ⚠️ 旧版静态页残留，已废弃，可删除
```

> 说明：`data.js` 和 `scheduler.js` 是最早"纯静态无后端"版本的遗留文件，已被 `server.js` 取代，本地开发时可直接删除。

---

## 快速开始

### 1. 环境要求

- Node.js 16+（推荐 20+）
- 一个 DeepSeek API Key（[platform.deepseek.com](https://platform.deepseek.com) 申请）

### 2. 配置 key

编辑 `.env` 文件，填入你的 key：

```
DEEPSEEK_API_KEY=sk-你的真实key
PORT=8000
```

### 3. 启动

```bash
cd mvp
node --env-file=.env server.js
```

若 Node 版本 < 20（不支持 `--env-file`），改用：

```bash
export DEEPSEEK_API_KEY=sk-你的真实key
node server.js
```

### 4. 使用

浏览器打开 `http://localhost:8000`，即可学习、做题、触发 AI 生成。

---

## 后端 API 一览

| 接口 | 方法 | 作用 |
|---|---|---|
| `/api/state` | GET | 返回今日到期项、下一个新学、全量进度 |
| `/api/knowledge` | GET | 返回 33 条知识点全表 |
| `/api/learn` | POST | 标记知识点已学，进 R1 队列 |
| `/api/review` | POST | 复习反馈（忘了/记得/能讲），推进 R1-R6 |
| `/api/answer` | POST | 记录对错，答错自动提前复习 + 正确率统计 |
| `/api/generate` | POST | 原始材料 → AI 生成知识卡 + 选择题，入库 |

---

## 核心机制

### 间隔复习（R1-R6）

| 反馈 | 结果 |
|---|---|
| 忘了 | 重置回 R1，下次明天 |
| 记得 | 推进下一档，掌握度 +1 |
| 能讲 | 跳级 + 间隔×1.5，掌握度直达「能讲」 |
| 答错题目 | 下次复习间隔减半（错题强化） |

### AI 生成规则

`/api/generate` 接收一段原始材料，DeepSeek 按两条铁律输出 JSON：

1. **先专有后白话**：专有名词先给严谨定义，再给白话比喻
2. **不编造**：只基于给定材料，不杜撰数字、日期、人名

输出字段：`definition`（专有定义）、`plain`（白话）、`example`（案例）、`antiIntuition`（反直觉点）、`question`（选择题题干）、`options`（选项）、`answer`（正确下标）。

---

## 已知边界 / 待办

1. **自动抓取网上数据**：DeepSeek 不联网，"抓新闻"环节暂空。`generate` 只接收材料、不负责抓。上线前接搜索 API（腾讯混元自带联网 / Tavily / Bing）即可让后端自动跑。
2. **周节奏**：文档里的"周一模型精讲/周二刻意练习/周五刻意练习/周日复习"尚未实现，目前只有「学新 + 复习」两条主线。
3. **前端生成交互**：无内容的知识点目前靠手动贴材料，理想是定时自动抓取→生成→推送。

---

## 安全提醒

- `.env` 已加入 `.gitignore`，不会被提交。
- 若 key 曾在聊天或日志中暴露，建议到 DeepSeek 后台重新生成新 key。