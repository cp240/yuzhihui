// ============================================================
// 认知知识库 —— 种子数据
// 来源：《04-认知.docx》第 4.1 / 7.2 节，逐字真实抄录
// 内容字段：定义/白话 只填文档中已明确给出的，未给出的留空待后续填充
// ============================================================

// —— 七阶课程地图（文档 4.1）——
const COURSE_MAP = [
  { id: 0, name: '模块0 · 思考工具', desc: '冰山模型、比较优势、边际、机会成本、激励与反馈回路、系统思维，以及概率与不确定性、二阶思维、第一性原理等底层思维工具' },
  { id: 1, name: '模块1 · 个体决策', desc: '人在约束与激励下如何做选择：成本、风险、时间偏好、行为偏误' },
  { id: 2, name: '模块2 · 经济运转', desc: '货币、财政、价格、供需、产业链、宏观指标如何驱动经济' },
  { id: 3, name: '模块3 · 社会与国家', desc: '社会结构、组织、制度、治理与公共选择' },
  { id: 4, name: '模块4 · 世界格局', desc: '地缘、能源咽喉、大国博弈、同盟与代理人战争、全球治理' },
  { id: 5, name: '模块5 · 中国运转', desc: '中国的政策形成、五年规划、央地关系、产业与改革逻辑' },
  { id: 6, name: '模块6 · 用于自身', desc: '把全部工具收束到自身：职业路径、考研、财务定投、宣传文化能力建设' },
];

// —— 分类（文档 7.2 编号体系）——
const CATEGORY_META = {
  M: { label: '思维模型', prefix: 'M' },
  F: { label: '分析框架', prefix: 'F' },
  C: { label: '社科经典', prefix: 'C' },
  T: { label: '术语白话卡', prefix: 'T' },
  G: { label: '国际格局与军事', prefix: 'G' },
  P: { label: '国家政策', prefix: 'P' },
};

// —— 33 条知识点（文档 7.2.1 全表）——
// 字段：id / name / cat / module / def(专有定义) / plain(白话) / example(案例)
// 说明：def、plain、example 仅文档明确给出的才填，其余留空
const KNOWLEDGE = [
  // ============ M 思维模型（模块0） ============
  { id: 'M01', name: '冰山模型', cat: 'M', module: 0, title: '事件—模式—结构', def: '', plain: '', example: '' },
  { id: 'M02', name: '比较优势', cat: 'M', module: 0, title: '', def: '', plain: '', example: '' },
  { id: 'M03', name: '边际思维', cat: 'M', module: 0, title: '边际成本／边际收益／边际递减／沉没成本', def: '', plain: '', example: '' },
  { id: 'M04', name: '机会成本', cat: 'M', module: 0, title: '', def: '', plain: '', example: '' },
  { id: 'M05', name: '激励与反馈回路', cat: 'M', module: 0, title: '含委托代理、古德哈特定律', def: '', plain: '', example: '' },
  { id: 'M06', name: '系统思维', cat: 'M', module: 0, title: '要素—连接—目标／存量流量／两种回路／滞后／杠杆点', def: '', plain: '', example: '' },

  // ============ F 分析框架（模块0） ============
  { id: 'F01', name: '看经济四象限', cat: 'F', module: 0, title: '供给—需求—政策—预期', def: '', plain: '', example: '' },
  { id: 'F02', name: '政策措辞等级', cat: 'F', module: 0, title: '坚决／积极稳妥／研究探索', def: '', plain: '', example: '' },
  { id: 'F03', name: '读数据：方向 vs 水平', cat: 'F', module: 0, title: '低基数效应', def: '', plain: '', example: '' },
  { id: 'F04', name: '三把刀分析流程', cat: 'F', module: 0, title: '冰山挖深→边际看变→比较优势回到自己', def: '', plain: '', example: '' },
  { id: 'F05', name: '多方叙事辨别', cat: 'F', module: 0, title: '先问"谁说的、为何这么说"', def: '', plain: '', example: '' },
  { id: 'F06', name: '宏观事件六步解剖法', cat: 'F', module: 0, title: '', def: '', plain: '', example: '' },

  // ============ C 社科经典（模块3） ============
  { id: 'C01', name: '差序格局', cat: 'C', module: 3, title: '费孝通《乡土中国》', def: '', plain: '', example: '' },
  { id: 'C02', name: '培根四假象说', cat: 'C', module: 3, title: '族类／洞穴／市场／剧场', def: '', plain: '', example: '' },

  // ============ T 术语白话卡（模块2） ============
  { id: 'T01', name: 'PMI 采购经理指数', cat: 'T', module: 2, title: 'Purchasing Managers\' Index',
    def: 'PMI，采购经理指数（Purchasing Managers\' Index），是通过对企业采购经理的月度调查编制的扩散指数，以 50 为荣枯临界值，高于 50 表示经济扩张、低于 50 表示收缩。',
    plain: '每月问企业一句"这个月比上个月好过吗"，汇总成的一支经济体温计。',
    example: '' },
  { id: 'T02', name: 'CPI / PPI 物价指数', cat: 'T', module: 2, title: '', def: '', plain: '', example: '' },
  { id: 'T03', name: '荣枯线 50', cat: 'T', module: 2, title: '', def: '', plain: '', example: '' },
  { id: 'T04', name: '先行指标', cat: 'T', module: 2, title: 'Leading Indicator', def: '', plain: '', example: '' },
  { id: 'T05', name: '货币 vs 财政政策', cat: 'T', module: 2, title: '逆回购／流动性／超长期特别国债', def: '', plain: '', example: '' },
  { id: 'T06', name: '月度宏观三指标', cat: 'T', module: 2, title: '工业增加值／社零／固定资产投资', def: '', plain: '', example: '' },
  { id: 'T07', name: '账期与现金流循环', cat: 'T', module: 2, title: '买断式逆回购', def: '', plain: '', example: '' },
  { id: 'T08', name: 'K 型分化 / 供强需弱', cat: 'T', module: 2, title: '', def: '', plain: '', example: '' },
  { id: 'T09', name: '美联储 FOMC / 联邦基金利率', cat: 'T', module: 2, title: '基点 bp', def: '', plain: '', example: '' },
  { id: 'T10', name: '央行独立性 / 双重使命', cat: 'T', module: 2, title: '鹰鸽派／点阵图', def: '', plain: '', example: '' },
  { id: 'T11', name: '不可能三角', cat: 'T', module: 2, title: '蒙代尔三元悖论／联系汇率／LPR',
    def: 'LPR，贷款市场报价利率（Loan Prime Rate），是由报价行在中期借贷便利（MLF）利率基础上加点报价、全国银行间同业拆借中心计算公布的贷款定价基准，分 1 年期与 5 年期以上。',
    plain: '银行给各类贷款定价时参考的"批发价基准"，它不动，房贷、企业贷款的利息底盘就基本不动。',
    example: '' },
  { id: 'T12', name: '套利交易 Carry Trade', cat: 'T', module: 2, title: '货币危机／汇率保卫战', def: '', plain: '', example: '' },

  // ============ G 国际格局与军事（模块4） ============
  { id: 'G01', name: '以打促谈', cat: 'G', module: 4, title: '军事行动是谈判筹码', def: '', plain: '', example: '' },
  { id: 'G02', name: '中东两大能源咽喉', cat: 'G', module: 4, title: '霍尔木兹海峡／曼德海峡', def: '', plain: '', example: '' },
  { id: 'G03', name: '纳什均衡', cat: 'G', module: 4, title: '',
    def: '纳什均衡（Nash Equilibrium），是博弈论中在其他参与者策略既定时，任一方都无法通过单方面改变自身策略而获益的策略组合。',
    plain: '各方把账算清后，谁先动手改变现状谁先吃亏，于是形成的一种"谁也不掀桌"的脆弱稳定；账本一变，均衡就破。',
    example: '' },
  { id: 'G04', name: '金砖国家 BRICS', cat: 'G', module: 4, title: '代理人战争·抵抗之弧', def: '', plain: '', example: '' },
  { id: 'G05', name: '海合会 GCC / 全球南方', cat: 'G', module: 4, title: '风险溢价',
    def: '风险溢价，是投资者为承担额外风险而要求的、超出无风险收益的那部分补偿；在油价中体现为对供给中断的恐慌加价。',
    plain: '"担惊受怕费"——风平浪静时这笔钱退回，一有风吹草动就加上去，油价短期大起大落主要是它在伸缩。',
    example: '' },

  // ============ P 国家政策（模块5） ============
  { id: 'P01', name: '「十五五」规划主线', cat: 'P', module: 5, title: '', def: '', plain: '', example: '' },
  { id: 'P02', name: '高校分类改革', cat: 'P', module: 5, title: '研究型／应用型／技能型分赛道', def: '', plain: '', example: '' },
];