// ============================================================
// 认知知识库 —— Node 后端（零依赖，自带大脑）
// 职责：
//   1. 服务前端静态文件
//   2. 知识点 + 复习调度状态持久化到 state.json（真存储，非 localStorage）
//   3. 调用 DeepSeek：把「抓取的原始材料」生成为知识点/题目（先专有后白话）
//   4. 收学习反馈（正确率/错题）→ 调整复习排期 → 下次生成时参考薄弱点
// 启动：node server.js
// 需要环境变量：DEEPSEEK_API_KEY
// ============================================================

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;
const ROOT = __dirname;
const STATE_FILE = path.join(ROOT, 'state.json');

// —— 知识库种子（与 data.js 同源）——
const KNOWLEDGE = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'knowledge.json'), 'utf8')
);

// —— 间隔复习参数（R1第1天 / R2第3天 / R3第7天 / R4第16天 / R5第35天 / R6第90天 / 长期180天）——
const INTERVALS = [1, 3, 7, 16, 35, 90, 180];
const ROUND_NAMES = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', '长期'];
const MASTERY_NAMES = ['陌生', '眼熟', '理解', '会用', '能讲'];

// ============ 日期工具 ============
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ============ 状态存取 ============
function defaultState() {
  const s = {};
  for (const k of KNOWLEDGE) s[k.id] = null;
  return s;
}
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf8');
      return Object.assign(defaultState(), JSON.parse(raw).progress || {});
    }
  } catch (e) { console.error('loadState error:', e.message); }
  return defaultState();
}
function saveState(progress) {
  const today = todayStr();
  fs.writeFileSync(STATE_FILE, JSON.stringify({ updated: today, progress }, null, 2));
}

// ============ 调度引擎 ============
function learnItem(state, id) {
  const today = todayStr();
  state[id] = { learned: today, roundIndex: 0, nextReview: addDays(today, INTERVALS[0]), mastery: 1, correctness: [] };
}
function reviewItem(state, id, grade) {
  const s = state[id];
  if (!s) return state;
  const today = todayStr();
  if (grade === 'forgot') {
    s.roundIndex = 0;
    s.nextReview = addDays(today, INTERVALS[0]);
    s.mastery = 1;
  } else if (grade === 'remember') {
    s.roundIndex = Math.min(s.roundIndex + 1, INTERVALS.length - 1);
    s.nextReview = addDays(today, INTERVALS[s.roundIndex]);
    s.mastery = Math.min(s.mastery + 1, 4);
  } else if (grade === 'know') {
    const skip = s.roundIndex + 2;
    s.roundIndex = Math.min(skip, INTERVALS.length - 1);
    s.nextReview = addDays(today, Math.round(INTERVALS[s.roundIndex] * 1.5));
    s.mastery = 4;
  }
  return state;
}

// 记录一道题的作答结果（正确率反馈）
function recordAnswer(state, id, correct) {
  const s = state[id];
  if (!s) return state;
  s.correctness = s.correctness || [];
  s.correctness.push(correct ? 1 : 0);
  // 只保留最近 20 次，滚动
  if (s.correctness.length > 20) s.correctness = s.correctness.slice(-20);
  // 答错：把下次复习提前（更频繁强化）
  if (correct === false) {
    const today = todayStr();
    s.nextReview = addDays(today, Math.max(INTERVALS[0], Math.round(INTERVALS[s.roundIndex] / 2)));
  }
  return state;
}

// 正确率统计
function accuracyOf(item) {
  const c = item.correctness || [];
  if (c.length === 0) return null;
  return c.reduce((a, b) => a + b, 0) / c.length;
}

function dueItems(state) {
  const today = todayStr();
  return KNOWLEDGE.filter(k => { const s = state[k.id]; return s && s.nextReview <= today; });
}
function nextNewItem(state) {
  const sorted = [...KNOWLEDGE].sort((a, b) => a.module - b.module);
  for (const k of sorted) if (!state[k.id]) return k;
  return null;
}

// ============ DeepSeek 大脑 ============
async function callDeepSeek(messages, jsonMode = false) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error('缺少 DEEPSEEK_API_KEY 环境变量');
  const body = {
    model: 'deepseek-chat',
    messages,
    temperature: 0.7,
  };
  if (jsonMode) body.response_format = { type: 'json_object' };
  const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`DeepSeek API ${resp.status}: ${err}`);
  }
  const data = await resp.json();
  return data.choices[0].message.content;
}

// 核心：把「抓取的原始材料」生成知识卡（先专有后白话）+ 一道选择题
async function generateContent(rawMaterial, targetId) {
  const target = KNOWLEDGE.find(k => k.id === targetId);
  const sys = `你是「高认知私教」。用户零基础、体制内新人，走政治路线、宣传文化/文件处理方向。
严格遵守两条铁律：
1. 术语铁律：每个专有名词/缩写先给严谨学术定义，再给白话比喻，两者都要。
2. 事实纪律：只基于用户提供的原始材料，不编造任何数字、日期、人名。
输出 JSON。`;

  const user = `请根据下面的原始材料，为知识点「${target ? target.name : targetId}」生成内容：
【原始材料】
${rawMaterial}

请输出 JSON，字段：
{
  "definition": "严谨的专有定义/正式行话（能说出口）",
  "plain": "白话比喻（让人懂本质）",
  "example": "一个结合材料的具体现实案例",
  "antiIntuition": "这个概念的1个反直觉点或最易用错之处",
  "question": "一道考查理解的选择题题干",
  "options": ["A选项","B选项","C选项","D选项"],
  "answer": 0
}
answer 是正确选项下标(0-3)。题目要能区分"背过定义"和"真懂"。`;

  const raw = await callDeepSeek([
    { role: 'system', content: sys },
    { role: 'user', content: user },
  ], true);
  // 剥掉可能的 markdown 代码块包裹
  const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

// ============ HTTP 服务 ============
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function sendJson(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => data += c);
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const route = url.pathname;

  try {
    // ---------- API ----------
    if (route === '/api/state') {
      const state = loadState();
      const props = {};
      for (const k of KNOWLEDGE) {
        const s = state[k.id];
        props[k.id] = s ? Object.assign({}, s, { accuracy: accuracyOf(s) }) : null;
      }
      return sendJson(res, 200, {
        today: todayStr(),
        progress: props,
        due: dueItems(state).map(k => k.id),
        nextNew: nextNewItem(state) ? nextNewItem(state).id : null,
      });
    }

    if (route === '/api/learn' && req.method === 'POST') {
      const { id } = await readBody(req);
      const state = loadState();
      learnItem(state, id);
      saveState(state);
      return sendJson(res, 200, { ok: true, item: state[id] });
    }

    if (route === '/api/review' && req.method === 'POST') {
      const { id, grade } = await readBody(req);
      const state = loadState();
      reviewItem(state, id, grade);
      saveState(state);
      return sendJson(res, 200, { ok: true, item: state[id] });
    }

    if (route === '/api/answer' && req.method === 'POST') {
      const { id, correct } = await readBody(req);
      const state = loadState();
      recordAnswer(state, id, correct);
      saveState(state);
      return sendJson(res, 200, { ok: true, item: state[id], accuracy: accuracyOf(state[id]) });
    }

    // 核心接口：生成推送（攒够原始材料 → DeepSeek 生成 → 入库）
    if (route === '/api/generate' && req.method === 'POST') {
      const { id, rawMaterial } = await readBody(req);
      if (!id || !rawMaterial) return sendJson(res, 400, { error: '需要 id 和 rawMaterial' });
      const content = await generateContent(rawMaterial, id);
      // 将生成的内容回填到知识库（写入 state.json 的 content 区 + 内存）
      const state = loadState();
      state[id] = state[id] || {};
      state[id].content = content;
      saveState(state);
      return sendJson(res, 200, { ok: true, content });
    }

    if (route === '/api/health') {
      return sendJson(res, 200, { ok: true, hasKey: !!process.env.DEEPSEEK_API_KEY, today: todayStr() });
    }

    // ---------- 静态文件 ----------
    let filePath = path.join(ROOT, route === '/' ? 'index.html' : route);
    if (!filePath.startsWith(ROOT)) return sendJson(res, 403, { error: 'forbidden' });
    if (!fs.existsSync(filePath)) return sendJson(res, 404, { error: 'not found' });
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    return fs.createReadStream(filePath).pipe(res);
  } catch (e) {
    console.error('Error:', e);
    return sendJson(res, 500, { error: e.message });
  }
});

server.listen(PORT, () => {
  console.log(`🧠 认知知识库后端已启动: http://localhost:${PORT}`);
  console.log(`   DeepSeek key: ${process.env.DEEPSEEK_API_KEY ? '✅ 已配置' : '❌ 未配置（生成功能不可用）'}`);
});