# 领域插件接口契约

本文档定义了学习领域插件必须实现的四个标准接口。所有领域（语文、人文社科、未来新增领域）必须严格遵守本契约。

> 变更原则：接口变更必须更新本文档并新增 ADR 记录。

---

## 统一数据模型（Shared Kernel Types）

### Item（一条待复习内容）

```typescript
interface Item {
  id: string;                    // 唯一标识
  domainId: 'chinese' | 'humanities' | string;  // 所属领域
  type: string;                  // 题型（由领域自定义，如 'choice'、'recite'、'essay'）
  prompt: string;                // 题面（题目内容）
  answerRef: string;             // 参考答案 / 标准答案
  tags: string[];                // 知识点标签
  meta?: Record<string, any>;    // 领域自定义扩展字段
  createdAt: number;             // 创建时间戳
  updatedAt: number;             // 更新时间戳
}
```

### AnswerRecord（作答记录）

```typescript
interface AnswerRecord {
  id: string;                    // 唯一标识
  itemId: string;                // 关联的题目 ID
  userId: string;                // 作答用户 ID
  inputMode: 'choice' | 'voice' | 'text' | 'photo';  // 输入方式
  rawInput: {                    // 原始输入材料
    text?: string;               // 打字文本
    audioUrl?: string;           // 语音文件 URL
    imageUrl?: string;           // 拍照图片 URL
    choiceIndex?: number;        // 选择题选中项
  };
  normalizedText: string;        // 归一化后的作答文本（ASR/OCR 转换结果）
  gradeResult?: GradeResult;     // 批改结果（批改后填充）
  createdAt: number;             // 作答时间戳
}
```

### GradeResult（批改结果）

```typescript
interface GradeResult {
  verdict: 'correct' | 'partial' | 'incorrect';  // 判定
  score: number;                 // 得分（0-1，partial 时为小数）
  errorHint?: string;            // 错因提示
  matchedPoints?: string[];      // 命中的得分点
  missedPoints?: string[];       // 遗漏的得分点
  confidence: number;            // 批改置信度（0-1）
  gradedBy: 'rule' | 'llm' | 'hybrid';  // 批改方式
}
```

### KnowledgePoint（知识点）

```typescript
interface KnowledgePoint {
  id: string;                    // 唯一标识
  domainId: string;              // 所属领域
  name: string;                  // 知识点名称
  description?: string;          // 知识点描述
  parentId?: string;             // 父知识点（构建层级关系）
  relatedIds?: string[];         // 关联知识点
  mastery: number;               // 掌握程度（0-1，由作答记录计算）
}
```

---

## 接口一：TemplateProvider（题目模板）

**职责**：定义该领域有哪些题型，以及题面如何渲染。

```typescript
interface TemplateProvider {
  /**
   * 列出该领域支持的所有题型
   */
  listTypes(): QuestionType[];

  /**
   * 根据题目数据渲染题面 UI 描述
   * @param item 题目数据
   * @returns 渲染描述（前端据此渲染）
   */
  renderPrompt(item: Item): PromptRenderDesc;
}

interface QuestionType {
  type: string;                  // 题型标识，如 'choice'、'recite'
  name: string;                  // 题型显示名称
  description: string;           // 题型说明
  supportedInputModes: AnswerRecord['inputMode'][];  // 支持的输入方式
}

interface PromptRenderDesc {
  layout: string;                // 布局类型，如 'single-choice'、'fill-blank'、'essay'
  components: RenderComponent[]; // 渲染组件列表
}

interface RenderComponent {
  type: 'text' | 'image' | 'audio' | 'choice-options' | 'blank';
  content?: string;
  options?: string[];
  meta?: Record<string, any>;
}
```

---

## 接口二：AnswerCollector（作答器）

**职责**：收集用户输入，归一化为统一文本格式。

```typescript
interface AnswerCollector {
  /**
   * 收集并归一化用户作答
   * @param rawInput 原始输入
   * @param item 关联的题目（用于上下文）
   * @returns 归一化后的作答记录
   */
  collect(
    rawInput: AnswerRecord['rawInput'],
    item: Item
  ): Promise<Pick<AnswerRecord, 'normalizedText' | 'inputMode'>>;

  /**
   * 该作答器支持的输入方式
   */
  supportedModes(): AnswerRecord['inputMode'][];
}
```

**实现说明**：
- `choice` 模式：直接返回选中项的文本
- `text` 模式：直接返回打字文本
- `voice` 模式：调用 ASR 服务将语音转文本
- `photo` 模式：调用 OCR 服务识别图片中的文字

---

## 接口三：Grader（批改器）

**职责**：将用户作答与参考答案比对，输出批改结果。

```typescript
interface Grader {
  /**
   * 批改用户作答
   * @param answerRecord 作答记录（含归一化文本）
   * @param item 题目数据（含参考答案）
   * @returns 批改结果
   */
  grade(answerRecord: AnswerRecord, item: Item): Promise<GradeResult>;

  /**
   * 该批改器支持的题型
   */
  supportedTypes(): string[];
}
```

**批改策略**：
- **规则批改**（`rule`）：适用于选择题、填空题等有明确标准答案的题型，使用关键词匹配、编辑距离等算法
- **LLM 批改**（`llm`）：适用于开放题、论述题，调用大模型进行多维度评分
- **混合批改**（`hybrid`）：先规则初筛，再 LLM 精细批改（推荐用于主观题）

---

## 接口四：GraphBuilder（图谱构建器）

**职责**：从题目和作答记录中提取知识点，构建知识图谱。

```typescript
interface GraphBuilder {
  /**
   * 从单条题目中提取知识点
   * @param item 题目数据
   * @returns 知识点列表
   */
  extractFromItem(item: Item): KnowledgePoint[];

  /**
   * 根据作答记录更新知识点掌握程度
   * @param points 当前知识点列表
   * @param records 作答记录
   * @returns 更新后的知识点列表
   */
  updateMastery(
    points: KnowledgePoint[],
    records: AnswerRecord[]
  ): KnowledgePoint[];

  /**
   * 构建知识点之间的关联关系
   * @param points 知识点列表
   * @returns 关联关系（边）列表
   */
  buildRelations(points: KnowledgePoint[]): GraphEdge[];
}

interface GraphEdge {
  source: string;                // 源知识点 ID
  target: string;                // 目标知识点 ID
  relation: 'prerequisite' | 'related' | 'part-of';  // 关系类型
  weight: number;                // 关系权重（0-1）
}
```

---

## 领域注册机制

```typescript
interface DomainPlugin {
  id: string;                    // 领域标识，如 'chinese'、'humanities'
  name: string;                  // 领域显示名称
  templateProvider: TemplateProvider;
  answerCollector: AnswerCollector;
  grader: Grader;
  graphBuilder: GraphBuilder;
}

// 内核注册领域插件
kernel.registerDomain(domainPlugin);
```

---

## 版本与兼容性

- 本契约版本：v1.0
- 兼容性原则：新增字段为向后兼容（使用 `meta` 或可选字段），删除或修改字段为破坏性变更，必须升级主版本号
- 破坏性变更必须：更新本文档版本号、新增 ADR、通知所有领域插件维护者
