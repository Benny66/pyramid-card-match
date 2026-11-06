# 金字塔配对 · 休闲消牌

> **一句话定位**：用一副 52 张扑克牌摆成 7 层金字塔、两张凑成 13 就消除的单页休闲小游戏，打开页面就能玩。

**技术栈**：Vue 3.5 + Vite 6 + TypeScript 5.7，纯前端单页应用，**零后端、零网络请求、零大模型调用**。

---

## 免责声明

> 本游戏及趣味解答仅休闲娱乐，不作为真实依据，不具备预测、占卜、判断吉凶的作用，也不构成任何建议或决策依据。

- 规则只有加法，不含任何预测、占卜、宜忌、运势或决策建议；局末「趣味解答」是**本地预生成语料的确定性查表**，同一局面永远得到同一段文字。
- 全程在浏览器本地运行：不上传话题或输入内容、不请求任何接口、不调用任何大模型；话题记忆只写 `localStorage`。
- 游戏不限次数、不限天数；隐私模式或禁用存储时静默回落默认话题「今日心情」。

---

## 玩法规则

| # | 规则 |
| --- | --- |
| 1 | 标准 **52 张牌**（无大小王）：A=1，2~10 为面值，J=11，Q=12，K=13。 |
| 2 | **两张点数之和 = 13** 即可一起消除；**K 本身就是 13，单点直接消除**。 |
| 3 | 布局为 **7 层 28 张金字塔**（第 1 层 1 张 …… 第 7 层 7 张）+ **24 张手牌**。 |
| 4 | 一张塔牌被下一层**相邻两张**压住，只有这两张都消除后才算「完全露出」；只有完全露出的牌可选中、可参与组合（最底层恒露出）。**被压住的 K 同样不可选中、不可单消**。 |
| 5 | 手牌**一次翻一张**，翻出即明牌、**常驻明牌区**：逐张摊开、全部可点、全部可互相配对；手牌翻完后不再产生新牌，也不回收重翻。 |
| 6 | 点一张选中、再点另一张：和为 13 则一起消除；选错只轻微抖动、不消除。 |
| 7 | **52 张全部消除 → 通关**；**手牌已翻完且再无任何可消组合 → 死局**，弹出「这局不算，重摆一局」。 |

> 两个概念的关系：清空金字塔（28 张全消）是 52 张全消通关的**必要非充分条件** —— 塔清空后明牌区仍可能无解。

---

## V3 新特性（本次改动）

| 特性 | 说明 |
| --- | --- |
| **构造式可解发牌** | `createGame()` 不再纯随机洗牌，改为「先造合法消除计划、再倒推摆牌」；**每副牌都保证存在清空金字塔、乃至 52 张全消的走法**，不再一开局就注定白玩。 |
| **「提示」按钮** | **6 档优先级**严格递减且**优先推荐金字塔牌**；每个候选都经实时求解器校验，**提示不破坏可解路径**；只高亮 + 一行短文案，**不自动替玩家消除**，不限次、无冷却。 |
| **打开页面直接进游戏** | 首屏即棋盘（`phase='playing'`、默认话题「今日心情」），**0 次点击**即可点第一张牌，没有开局表单和常驻说明面板。 |
| **说明全部弹窗化** | 规则 / 话题 / 趣味词典 / 免责声明收进顶部「规则」「话题」「更多」三个弹窗；单一 `modal` 枚举互斥，杜绝多弹窗叠加。 |
| **375px 小屏适配** | 小屏下页面无横向滚动 / 溢出（棋盘内部保留可横向滚动区）；沿用既有浅色视觉，不换肤。 |

提示的 6 档优先级：**塔+塔 > 塔+明牌 > 塔 K 单消 > 明牌+明牌 > 明牌 K 单消 > 翻一张手牌**。只要前 3 档存在可用走法，就不会推荐 4~5 档。

---

## 快速开始

**环境要求：Node.js 22+**（`npm run verify` 依赖 Node 22 原生 type-stripping 直接加载 `.ts`，不需要额外安装 tsx / ts-node / vitest 之类的转译器或测试框架；本项目实测 Node **v22.22.2**）。

```bash
cd frontend
npm install

npm run dev              # 本地开发：vite --host 0.0.0.0
npm run build            # = vite build && node sync.mjs
npm run verify -- 1000   # 批量验证 1000 副牌（不传参数默认也是 1000）
```

其他脚本：`npm run preview`（预览构建）、`npm run corpus`（重建本地趣味语料）。

**关于入口，务必注意两点：**

1. **唯一对外、可直接打开的入口是项目根 `index.html`**（它引用 `./assets/index-*.js` 与 `./assets/index-*.css`）。`frontend/index.html` 只是 Vite 的开发入口（引用 `/src/main.ts`），**不对外**。
2. `npm run build` 先构建到 `frontend/dist/`，再由 `frontend/sync.mjs` 把 `dist/index.html`、`dist/assets/` 同步到**项目根**的 `index.html` + `assets/`。因此**只改 `frontend/src/` 而不执行 `npm run build`，对外页面不会有任何变化**；根目录产物由脚本生成，**不要手改**（下次 build 会被覆盖）。

---

## 目录结构

```text
pyramid-card-match/
├── index.html                  # ★ 唯一对外入口（构建产物，勿手改，需提交）
├── assets/                     # ★ 交付产物 JS/CSS（勿手改，需提交）
│   ├── index-*.js              # 文件名含构建 hash，随每次 build 变化
│   └── index-*.css
├── README.md                   # 本文件：面向人的项目说明与上手方式
├── AGENTS.md                   # 面向 AI Agent 的项目约定与踩坑清单
├── .gitignore
├── docs/
│   ├── prd-v3-incremental.md   # V3 增量 PRD
│   ├── architecture-v3.md      # V3 系统设计与任务分解
│   ├── class-diagram.mermaid
│   └── sequence-diagram.mermaid
├── frontend/
│   ├── index.html              # Vite 开发入口（引用 /src/main.ts，不对外）
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.ts          # base:'./'，outDir:'dist'，assetsDir:'assets'
│   ├── tsconfig.json
│   ├── sync.mjs                # 把 dist 产物同步到项目根
│   ├── dist/                   # ← 构建中间产物（.gitignore 排除）
│   ├── scripts/                # QA 与语料生成脚本
│   │   ├── verify-deals.mjs
│   │   ├── build-corpus.mjs
│   │   ├── corpus-cards.mjs
│   │   └── corpus-topics.mjs
│   └── src/
│       ├── main.ts
│       ├── App.vue
│       ├── style.css
│       ├── game.ts             # 规则真源：Card / GameState 与全部规则函数
│       ├── solver.ts           # 同步求解器（28 位 alive 掩码 + pool[14]）
│       ├── deal.ts             # 构造式可解发牌 + 模块级 DealMeta
│       ├── hint.ts             # 6 档提示引擎
│       ├── diagnostics.ts      # verifyDeals() 批量验证
│       ├── readings.ts         # 免责 / 话题 / 趣味解答素材（红线）
│       ├── corpus.ts           # 预生成语料查表
│       ├── data/
│       │   └── reading-corpus.ts
│       └── components/
│           ├── PyramidBoard.vue
│           ├── InfoModal.vue
│           ├── TopicModal.vue
│           ├── FunDictionary.vue
│           ├── ResultModal.vue
│           └── ReadingCard.vue
└── legacy/
    └── index.html              # ← 旧版单文件留存（历史归档，不参与构建，勿碰）
```

> - `legacy/index.html` 是**旧版单文件留存**（含 Tailwind CDN 外链，不参与构建、不对外），一律不碰。
> - `frontend/dist/` 是 Vite **构建中间产物**，被 `.gitignore` 排除；**根 `assets/` 是同步后的最终交付产物，必须提交**。

---

## 验收数据（本机 Node v22.22.2 实测）

| 命令 | 结果 |
| --- | --- |
| `npm run verify -- 1000` | `structureOk=1000`、`pyramidSolvable=1000`、`fullSolvable=1000`、`planReplayOk=1000`、`fallbackCount=0`、`failures=[]`；**跟提示走 `hintPyramidCleared=20/20`**、`degradedCount=0`；退出码 0。（本机 `avgCreateMs≈0.027ms`、`maxHintMs≈0.363ms`，单次采样，随负载波动） |
| `npm run build` | **通过**（`vite build && node sync.mjs`），根 `index.html` 与 `assets/` 刷新成功，引用的资源真实存在。 |

含义：1000 副牌结构全部合法、全部「金字塔可解」且全部「52 张全消可解」、消除计划全部可回放、零兜底、零失败；连续 20 局全程只按提示操作均清空金字塔、零降级。

---

## 文档索引

| 文档 | 内容 |
| --- | --- |
| `docs/prd-v3-incremental.md` | V3 增量 PRD：需求池、6 档提示定义、UI 设计稿、**不改红线 N1~N9**、验收指标 S1~S6 |
| `docs/architecture-v3.md` | 系统设计与任务分解：§0 结论速览、§1.2 构造式发牌、§1.3 提示、§1.4 求解器、§2 文件清单、§3.1 接口签名、§7 任务列表 T01~T05、§8 共享约定 |
| `docs/class-diagram.mermaid` | 类图（独立文件） |
| `docs/sequence-diagram.mermaid` | 发牌 → 首屏 → 提示 → 消除 → 判定时序图（独立文件） |
| `AGENTS.md` | 面向 AI Agent 的项目约定、红线与本次协作踩坑清单 |

---

## 已知问题

全量类型检查 `cd frontend && npx tsc --noEmit` 会报：

```text
src/main.ts(2,17): error TS2307: Cannot find module './App.vue' or its corresponding type declarations.
```

- **原因**：项目缺 `*.vue` 模块类型声明（`env.d.ts` / `shims-vue.d.ts`），`tsconfig.json` 只配了 `types: ["vite/client"]`；这是**改动前既有**的问题，不是 V3 引入的。
- **影响**：**不影响运行与交付**。Vite 用 esbuild 转译且 `noEmit: true`，`npm run build` 正常通过；新增 / 改动的 5 个 `.ts`（`solver.ts`、`deal.ts`、`hint.ts`、`diagnostics.ts`、`game.ts`）单独 `tsc` 检查**全部通过**。
- 若要消除该报错，可新增 `frontend/src/env.d.ts` 声明 `declare module '*.vue'`（本轮未做，避免触碰既有文件）。

---

## 线上版本

线上版本由 **WorkBuddy 已发布的应用**（应用名：金字塔消牌）承载，内容就是同一份项目根 `index.html` + `assets/` 静态产物；发布为**覆盖更新**，分享链接保持不变。

> 本仓库为**公开仓库**，因此 README **不写入任何带 sharecode 的分享链接，也不含任何密钥**。请以 WorkBuddy 应用卡片或项目维护者提供的入口为准。
