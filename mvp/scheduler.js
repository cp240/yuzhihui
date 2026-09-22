// ============================================================
// 认知知识库 —— 间隔复习调度引擎 (R1–R6)
// 依据《04-认知.docx》4.3 遗忘曲线与间隔复习机制
// ============================================================

// 间隔天数序列：R1第1天 / R2第3天 / R3第7天 / R4第16天 / R5第35天 / R6第90天 / 长期半年抽查180天
const INTERVALS = [1, 3, 7, 16, 35, 90, 180];
const ROUND_NAMES = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', '长期'];
const MASTERY_NAMES = ['陌生', '眼熟', '理解', '会用', '能讲'];

const STORAGE_KEY = 'cognition_kb_state_v1';

// —— 日期工具 ——
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
function daysUntil(dateStr) {
  const today = new Date(todayStr() + 'T00:00:00');
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target - today) / 86400000);
}

// —— 状态模型 ——
// state[itemId] = {
//   learned: 'YYYY-MM-DD',   // 首学日期
//   roundIndex: 0,           // 当前轮次索引，等于已用过的间隔档位（对应 ROUND_NAMES/INTERVALS）
//   nextReview: 'YYYY-MM-DD',
//   mastery: 0,              // 0陌生 1眼熟 2理解 3会用 4能讲
// }
function defaultState() {
  const s = {};
  for (const k of KNOWLEDGE) {
    s[k.id] = null; // null = 未学
  }
  return s;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // 合并，保证新加的知识点有占位
      const base = defaultState();
      return Object.assign(base, parsed);
    }
  } catch (e) { /* ignore */ }
  return defaultState();
}
function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// 首次学习一个知识点：记录今天，进入 R1，下次复习 = 明天
function learnItem(state, id) {
  const today = todayStr();
  state[id] = {
    learned: today,
    roundIndex: 0,          // R1 待复习
    nextReview: addDays(today, INTERVALS[0]),
    mastery: 1,             // 眼熟
  };
}

// 复习反馈：grade = 'forgot' | 'remember' | 'know'
function reviewItem(state, id, grade) {
  const s = state[id];
  if (!s) return state;
  const today = todayStr();
  if (grade === 'forgot') {
    // 忘了：重置回 R1，下次明天
    s.roundIndex = 0;
    s.nextReview = addDays(today, INTERVALS[0]);
    s.mastery = 1;
  } else if (grade === 'remember') {
    // 记得：推进到下一档，掌握度+1
    s.roundIndex = Math.min(s.roundIndex + 1, INTERVALS.length - 1);
    s.nextReview = addDays(today, INTERVALS[s.roundIndex]);
    s.mastery = Math.min(s.mastery + 1, 4);
  } else if (grade === 'know') {
    // 能讲：跳级，间隔 × 1.5，掌握度直达能讲
    const skip = s.roundIndex + 2;
    s.roundIndex = Math.min(skip, INTERVALS.length - 1);
    const baseInterval = INTERVALS[s.roundIndex];
    s.nextReview = addDays(today, Math.round(baseInterval * 1.5));
    s.mastery = 4;
  }
  return state;
}

// 今日到期复习项（nextReview <= 今天）
function dueItems(state) {
  const today = todayStr();
  return KNOWLEDGE.filter(k => {
    const s = state[k.id];
    return s && s.nextReview <= today;
  });
}

// 今日新学（沿课程地图顺序，第一个未学的）
function nextNewItem(state) {
  // 按课程地图顺序：模块 0→6，模块内按 data.js 原顺序
  const sorted = [...KNOWLEDGE].sort((a, b) => a.module - b.module);
  for (const k of sorted) {
    if (!state[k.id]) return k;
  }
  return null; // 全部学完
}

// 课程进度统计
function courseProgress(state) {
  const learned = KNOWLEDGE.filter(k => state[k.id]).length;
  const total = KNOWLEDGE.length;
  const mastered = KNOWLEDGE.filter(k => state[k.id] && state[k.id].mastery >= 4).length;
  return { learned, total, mastered };
}