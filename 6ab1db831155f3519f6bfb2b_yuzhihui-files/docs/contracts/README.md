# 共享内核四接口契约

领域插件通过以下四个接口接入共享内核。本文件是先于代码的「契约」：共享内核和插件都只认这份定义，谁改谁负责同步。

## 统一数据模型（共享内核持有）

```ts
// 一条待复习的内容（学科无关）
interface Item {
  id: string
  domainId: string          // 归属哪个领域
  type: string              // 题型，由领域定义枚举值
  prompt: string            // 题面 / 卡片正面
  answerRef: string         // 参考答案 / 标答
  tags: string[]            // 知识点标签
  meta: Record<string, unknown>  // 领域自有扩展字段
}

// 一条作答记录（任意输入方式归一化后的结果）
interface AnswerRecord {
  id: string
  itemId: string
  userId: string
  mode: 'tap' | 'type' | 'voice' | 'photo'   // 输入方式
  answerText: string        // 归一化后的文本（语音转写 / 打字 / OCR，非空）
  materialUrl?: string      // 原始材料：图片 / 音频链接，可省略
  createdAt: string
}

// 批改结果
interface GradeResult {
  verdict: 'right' | 'wrong' | 'partial'
  score: number             // 0–1 区间，方便跨领域比较
  errorHint: string         // 错因 / 解析
  confidence: number        // 0–1，低置信度转人工复核
}
```

## 接口一 · 题目模板 TemplateProvider

领域声明自己有哪些题型，以及每种题型如何渲染。

```ts
interface TemplateProvider {
  listTypes(): QuestionType[]        // 领域题型枚举
  render(item: Item): RenderSpec     // 题面如何展示在屏幕上
}
```

## 接口二 · 作答器 AnswerCollector

把任意输入方式的原始输入，归一化成一条 `AnswerRecord`。

```ts
interface AnswerCollector {
  collect(raw: RawInput, item: Item): Promise<AnswerRecord>
  // raw 可以是：点选的选项、打字的文本、语音的原音频、答题卡的照片
}
```

## 接口三 · 批改器 Grader

拿作答记录和参考答案，产出批改结果。可以调基础设施里的 LLM。

```ts
interface Grader {
  grade(record: AnswerRecord, item: Item): Promise<GradeResult>
}
```

## 接口四 · 图谱构建器 GraphBuilder

把该领域的知识点与作答记录，拼成领域自己的图，交给内核的渲染器画出来。

```ts
interface GraphBuilder {
  build(points: KnowledgePoint[], records: AnswerRecord[]): Graph
  // 语文产出「字词-文言-阅读-写作」树；人文社科产出概念关联图
}
```

## 阶段 A 的最小实现

阶段 A 只实现**作答器（点选）**和**批改器（选择判断）**两个最小接口，`题目模板`先写死为「选择 + 概念卡」两类，`图谱构建器`先产出最简单的节点列表。其余能力跑通后再补。