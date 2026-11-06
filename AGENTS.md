# AGENTS.md — 给 AI Agent 的项目约定

> 本文件写给在本仓库执行「改代码 / 写文档 / 做 Review / 发版」的 AI Agent；面向人的项目说明见 `README.md`。
> **先读文档、再动源码；先跑验证、再谈交付。** 文档与源码冲突时**以源码为准**并回报，不要按印象改。

> ⚠️ **版本注记（2026-11-06 晚）**：V3 的「构造式发牌」已被**随机洗牌 + 死局过滤**取代——用户试玩发现旧方案「金字塔每一层都能凑 13、手牌成对」，牌面不随机。`docs/architecture-v3.md` §0/§1.2、`docs/prd-v3-incremental.md` P0-1、`docs/qa-v3-delivery-check.md` 中关于「构造式发牌 / 构造性证明 / plan 回放」的描述均为**历史结论**，保留原文不回改；发牌方案一律以本文件 **§4.1** 与 `frontend/src/deal.ts` 源码为准。

---

## 1. 项目定位、技术栈、入口与构建同步机制

| 项 | 内容 |
| --- | --- |
| 定位 | 金字塔配对 · 休闲消牌，纯前端单页休闲小游戏（52 张牌、和为 13 消除、K 单消、7 层金字塔 + 24 张手牌） |
| 技术栈 | Vue 3.5 + Vite 6 + TypeScript 5.7；**零新增依赖**（`vue` / `@vitejs/plugin-vue` / `typescript` / `vite` 沿用） |
| 运行环境 | 纯浏览器本地运行：**零后端、零网络、零大模型**；趣味解答为本地预生成语料确定性查表 |
| 源码目录 | `frontend/src/`、`frontend/scripts/` |
| **唯一对外入口** | **项目根 `index.html` + 根 `assets/`**（可直接打开 / 已发布链接指向这里） |
| 开发入口 | `frontend/index.html`（引用 `/src/main.ts`，**不对外**） |
| 构建同步 | `npm run build` = `vite build && node sync.mjs`：`vite.config.ts` 配 `base:'./'`、`outDir:'dist'`、`assetsDir:'assets'`，先产出 `frontend/dist/`，再由 `frontend/sync.mjs` 复制 `dist/index.html` → 根 `index.html`、`dist/assets/` → 根 `assets/`（先清后拷，**不递归删除项目根其它内容**） |
| **禁止手改根产物** | 根 `index.html` / `assets/**` 是**构建产物**，只由 `npm run build` 生成。**只改 `frontend/src/` 而不 build，对外页面不会变化**；手改会在下次 build 被覆盖 |
| Git | 远端 `git@github.com:Benny66/pyramid-card-match.git`，分支 `main` |

**依赖方向（运行时单向，勿倒置）**：`App.vue` 值导入 `game.ts`（规则）与 `hint.ts`；`hint.ts` 值导入 `game.ts`（规则函数）、`solver.ts`、`deal.ts`；`game.ts` 值导入 `deal.ts`；`deal.ts` 值导入 `solver.ts`；而 `solver.ts` / `deal.ts` 对 `game.ts` **只有 `import type`**（编译期擦除）⇒ 运行时不成环。`game.ts` 是唯一规则真源。细节见 §4.7。

---

## 2. 必读文档顺序与验证命令

按顺序读，不要跳：

1. `README.md` — 玩法、快速开始、目录结构、验收数据、已知问题。
2. `docs/prd-v3-incremental.md` — V3 增量 PRD：需求池 P0-1~P0-7、**§3.2 六档提示**、**§4 不改清单 N1~N9**、§2.2 验收指标 S1~S6。
3. `docs/architecture-v3.md` — 重点：**§1.3 提示不破坏解**、§1.4 松弛等价与状态编码、**§2 文件清单**、**§3.1 接口签名**、**§7 任务列表 T01~T05**、**§8 共享约定**。⚠️ §0/§1.2 的构造式发牌已被随机洗牌方案取代（见本文件 §4.1 与版本注记），只作历史背景读。
4. `docs/class-diagram.mermaid`、`docs/sequence-diagram.mermaid` — 类图与「发牌 → 首屏 → 提示 → 消除 → 判定」时序。
5. 源码逐条核对：`frontend/src/game.ts`（规则真源 + 导出契约）→ `solver.ts` → `deal.ts` → `hint.ts` → `diagnostics.ts` → `App.vue` → `frontend/scripts/verify-deals.mjs`、`frontend/sync.mjs`、`frontend/package.json`。

**改动后必跑的两条命令**：

```bash
cd frontend
npm run verify -- 1000   # 结构 / 双目标可解 / 随机性四指标 / 按提示重放 20 局；失败退出码 1
npm run build            # 构建 + 同步到项目根；确认根 index.html 与 assets/ 被刷新
```

`npm run verify` 用 Node 22 原生 type-stripping 直接加载 `.ts`（22.18+ 默认开启），**必须 Node 22+**，不需要额外安装 tsx / ts-node / vitest。当前实测基线：`structureOk/pyramidSolvable/fullSolvable` 全 1000、`fallbackCount=0`、`failures=[]`、`hintPyramidCleared=20/20`、`degradedCount=0`；随机性指标 `rawSolvableRate≈0.668`、`avgAttempts≈1.50`、`avgRowComplementPairs≈3.46`、`avgStockAdjacentPairs≈1.71`。`VerifyReport.planReplayOk` 已移除（随机发牌不再有构造计划），别再找它。

---

## 3. 红线：不可改（动手前逐条核对）

| # | 红线 | 代码位置 / 判定 |
| --- | --- | --- |
| N1 | 核心消牌规则 | 52 张、A=1…K=13、两张和为 13 消除：`game.ts::createDeck()` / `isPair()` |
| N2 | K 单消，**含「被压住的 K 同样不可选中 / 不可单消」的既有顺序** | `game.ts::selectOrMatch()`：`isPlayable()` 判定必须排在 K 单消之前 |
| N3 | 露出判定 | `game.ts::isExposed()`（下一层相邻两张都消除才完全露出；最底层 `r=6` 恒露出）、`game.ts::isPlayable()` |
| N4 | 明牌常驻可点 | `game.ts::drawOne()`：翻出即入 `waste` 常驻、全部可点、全部可互配；不回收重翻 |
| N5 | 趣味解答语料与生成逻辑 | `frontend/src/readings.ts`（素材池 / `buildReading()`）、`corpus.ts`（`lookupReading()`）、`data/reading-corpus.ts`、`components/ReadingCard.vue`（打字机）、**每局一次** |
| N6 | 免责文案本身 | `DISCLAIMER` / `DICT_DISCLAIMER` / `REPLAY_LINES` **字符串一字不改，只改展示位置**（V3 把常驻横幅移入「更多」弹窗） |
| N7 | 已有对外链接入口 | 保持原样、不删不改；**`legacy/**` 一律不碰**（旧版单文件留存，历史归档，含 Tailwind CDN，不参与构建） |
| N8 | 结果与胜负 | `game.ts::evaluate()` 的 `cleared` / `stuck` 判定、`components/ResultModal.vue` 文案与「再摆一局」流程、`elapsedSeconds()` |
| N9 | 构建与同步机制 | `npm run build` + `sync.mjs` 流程不改，只要求交付前执行一次 |
| 类型 / 导出契约 | **`game.ts` 现有导出与 `Card` / `GameState` 类型签名逐字不变** | `Zone` / `Card` / `GameState` / `SelectResult` / `GameOutcome` 字段一个不加不减；`createGame()` **只换函数体**（委托 `createSolvableGame(createDeck())` + 最外层 `try/catch` 兜底），除 `createGame()` 外的全部导出（12 个函数 + 5 个类型）一行不动；`App.vue` 的 6 个既有 import 与 `Object.assign(game, createGame())` 必须继续可用 |

> 新增能力一律是**加法**：新模块只读复用 `playableCards()` / `isPair()` / `isPlayable()` / `isExposed()`，**不得出现第二份「和为 13 / 露出 / 可点」判定实现**。

---

## 4. V3 架构决策与踩坑清单（最重要，每条都写清「为什么」）

### 4.1 发牌：随机洗牌 + 死局过滤（V3 构造式方案已废弃）

- **为什么改**：V3 曾用「构造式发牌」——先造 12 组塔内互补配对 + 4 个奇数行 K + 12 对手牌互补对，再倒推摆牌，确实 100% 可解，但**牌面有明显人造规律**：用户试玩一眼看出「金字塔每一层都能凑 13」「翻牌成对」，游戏变成背答案。已按用户要求废弃，不要恢复。
- **现行方案**：`deal.ts::createSolvableGame()` = 纯 Fisher-Yates 洗牌 → 按 `r/c` 装配 28 塔位 + 24 手牌 → `deriveSolverState()` + `isSolvable(goal:'full')` 判一次 → **整副无解就重洗**（`maxAttempts=200`、总预算 120ms、单次求解 50_000 节点 / 40ms）。`'unknown'` 保守视为不可接受，绝不发出未验证牌局；只有超时/异常才退回纯随机牌局（`fallback=true`）并 `console.warn`。`game.ts::createGame()` 外层仍有 `try/catch`，**永不阻塞首屏**。
- **实测（N=1000）**：筛选前随机牌局可解率 **66.8%**（与理论 66.9% 一致，证明牌面是真洗出来的）、平均洗 **1.50** 副命中、`fallbackCount=0`、`avgCreateMs≈0.82ms` / `maxCreateMs≈23ms`；1000/1000 金字塔可解 + 1000/1000 全消可解、按提示 20/20 清空金字塔。
- **随机性护栏（diagnostics.ts / verify-deals.mjs）**：`avgRowComplementPairs`（构造式恒 12 → 现 3.46）、`avgStockAdjacentPairs`（构造式恒 12 → 现 1.71）、`rawSolvableRate`、`avgAttempts` 四个指标进入 `VerifyReport`，`npm run verify -- 1000` 打印并断言 `fallbackCount=0`。**任何改发牌的改动都必须复核这四个数**：若行内互补对或手牌相邻对回到 12，说明又引入了人工构造。
- **不再有参考解**：`replayPlan()` 已删除，`DealMeta.plan` 恒空，`hint.ts::isOnPlan` 基本恒 false，提示完全依赖实时 reachability（§4.5）。`VerifyReport.planReplayOk` 已移除。
- **红线**：只过滤「整副牌无解」，**绝不为了可解去调整单张牌的位置或点数**；否则又回到构造式的老问题。

### 4.2 求解器松弛等价：`projectMove` 的 `draw` 不改变 `(alive, pool)` 是正确行为，不是 bug

- **定理**：把「所有未翻手牌可随时一次性全部翻出」视为已翻出，**不改变可解性**。因为 `drawOne()` 在 `stock` 非空时恒合法且单调、翻出的明牌永久常驻且不遮挡任何塔牌、无手牌上限、也不被强制消除 ⇒ 翻牌只**增加**可用动作；任意真实解都能把其中全部 draw 前置。
- **实测**：**1012 条**松弛解在按真实 `drawOne` / `isExposed` / `isPair` 语义的忠实重放器下 **0 失败**。
- **推论**：状态**不需要 `drawn` 字段**，`pool = count(stock ∪ waste)`；`solver.ts::projectMove()` 里 `draw` 分支**刻意为空**（`alive`、`pool` 都不变），档 6 翻牌因此天然保解。看到这里别「顺手修一下」。

### 4.3 状态编码与记忆化 key

- 编码：`values[28]`（静态塔牌点数）+ `alive`（28 位掩码，`1` = 该塔位牌仍在）+ `pool[14]`（`pool[v]` = 当前可用明牌中点数为 v 的张数，含全部未翻手牌，下标 0 不用）；`pyramidIndex(r,c) = r*(r+1)/2 + c`；`isExposedAt(alive,p)` 是 `game.ts::isExposed` 的位掩码等价实现；`alive` 可达值只有 **1430** 个序理想。
- **踩坑**：一次 `getHint()` 里 hard(`'pyramid'`) 与 soft(`'full'`) **共用同一个 `SolverContext.memo`**，而两种目标的终点判定不同（`'full'` 还要 `wasteBalanced(pool)`）。因此记忆化 key **必须带 `goal` 前缀**（源码：`goal + '|' + alive + '|' + pool.slice(1,13).join('')`）；否则 hard / soft **串缓存**会把「塔可清但全消不可解」的状态误判，提示硬校验随之失真。

### 4.4 `DealMeta` 保留模块级单例，但参考解恒为空

- 随机发牌不再构造消除计划：`plannedPartner` / `plannedWastePairs` / `plan` 全部为空，`stats.attempts` 记录本次一共洗了几副牌（供随机性统计）。保留空结构是为了不改动 `hint.ts` 的 import 契约，不要「顺手删字段」而破坏类型。
- `activeDealMeta` 仍是 `deal.ts` 的**模块级普通变量**（不挂 `GameState`、不进 Vue 响应式）：`App.vue` 用 `reactive(createGame())`，`freshGame()` 用 `Object.assign(game, createGame())`，挂到 `GameState` 上会被 Proxy 包住 `Map` 且被 `Object.assign` 整体替换导致丢引用，也违反「不改 `GameState` 形状」。`createGame()` 每次刷新，`getActiveDealMeta()` 只读。

### 4.5 提示 = 实时 reachability 为唯一权威，参考解只作同档排序

- 随机发牌下参考解恒为空，`isOnPlan` 基本不参与排序，**实时 reachability 是唯一权威**。实时求解是无状态纯函数，`deriveSolverState(liveGameState)` 每次从当前真实局面重推，玩家任意偏离后天然自愈，**不需要重放 / 重同步 / 增量求解分支**。
- **三处目标别混用**：发牌筛选默认 `goal:'full'`（同时保证金字塔可解与 52 张全消可解）；提示**硬校验固定 `'pyramid'`**；`'full'` 只作同档**软偏好**；QA 的 S1 按 `'pyramid'` 统计。
- **`'unknown'`（预算 / 超时耗尽）一律乐观视为可用**：hard 判定写 `verdict !== 'unsolvable'`，**绝不出现「有合法走法却报无提示」**（PRD 3.4 / S3）；`'unsolvable'` 是唯一可判「不安全」的值，参考解与同档排序同时兜住质量。
- 预算：一次 `getHint()` **只创建一个** `SolverContext`（`nodeBudget=20_000` / `deadlineMs=12`，所有候选共享 memo 与总预算）；发牌校验 `50_000` / `40`。随机牌局下本机 `npm run verify` 采样 `avgHintMs≈0.21ms` / `maxHintMs≈4.96ms`（比构造式牌局略高，因搜索树更大），**同步执行，不用 Web Worker**（Worker 的 `postMessage` 往返比计算本身还慢，且异步加载态会破坏 S5「0 次点击」）。

### 4.6 6 档优先级严格短路

- 顺序：**塔+塔(1) > 塔+明牌(2) > 塔 K 单消(3) > 明牌+明牌(4) > 明牌 K 单消(5) > 翻一张手牌(6)**；`for tier = 1..6`，某档一找到**保解**候选立即 `return`，只有该档所有候选都 `unsolvable` 或本档无候选才继续 ⇒ **前 3 档有解就绝不推荐 4~5 档**（用户「明牌区有组合的也不组合」）。
- 同档排序：`onPlan desc → soft desc → cardId asc`；随机发牌下 `onPlan` 恒 false（draw 除外），实际按 `soft desc → cardId asc`，全消只是**软偏好**，永不绕过 hard 校验。K 没有互补值，天然只出现在档 3 / 5。

### 4.7 导入风格、循环依赖、零新增依赖

- **新增 `.ts` 之间的相对导入显式写 `.ts` 后缀**（`tsconfig.json` 已开 `allowImportingTsExtensions: true`），目的：让 `verify-deals.mjs` 被 Node 22 原生 type-stripping 直接跑，**不引入 tsx / ts-node / vitest 等新依赖**（Vite 自带的 esbuild 属既有依赖，与此无关）。既有 `App.vue` 的 `./game`、`./readings`、`./corpus` 及 `./components/*.vue` 导入沿用无后缀写法，不要「顺手统一」；而 `game.ts` 内 V3 新增的 `import { createSolvableGame } from './deal.ts'` 必须保留 `.ts` 后缀（否则 `verify-deals.mjs` 无法被 Node 22 原生 type-stripping 直接加载）。
- **真正要防的是运行时循环依赖**：`game.ts` 运行时值导入 `deal.ts`，`deal.ts` 值导入 `solver.ts`；因此 **`solver.ts`、`deal.ts` 对 `game.ts` 只能用 `import type`**（编译期擦除），否则 `game.ts ↔ deal.ts ↔ solver.ts` 成环。
- **易错点（以源码为准）**：`docs/architecture-v3.md` §7 T01 有「`deal.ts`/`solver.ts`/`diagnostics.ts` 对 `game.ts` 只用 `import type`」的概括，但按实际源码，`diagnostics.ts` 是唯一会值导入 `game.ts` **流程函数**（`createGame` / `evaluate` / `selectOrMatch` / `drawOne`）的新增模块（QA 需跑真实路径）；`hint.ts` 值导入的是只读规则函数（`playableCards` / `isPair` / `isPlayable`），属刻意复用规则真源。二者都不在 `game.ts` 的运行时依赖链上、不参与首屏，因此**不构成环**；不要据此把它们改成 type-only，更不要反过来给 `deal.ts` / `solver.ts` 加值导入。
- `frontend/package.json` V3 **只加了一条** `"verify": "node scripts/verify-deals.mjs"`，`dependencies` / `devDependencies` 一字不改。

### 4.8 玩家乱点走出可解集 → `degraded=true`

- 1~6 档都没有「保解」候选，说明玩家自由乱点已把局面走出可解集：`getHint()` 返回 `degraded=true` + **当前最高档合法走法** + 文案「这副牌已经清不掉金字塔了，重新开局可以换一副」。
- **不弹阻塞、不自动作弊、不悄悄换牌、不新增按钮**；`evaluate()` 保持原样（N8），玩家自然走到 `stuck` 结果弹窗。诊断里记录 `degradedCount` 供 QA 观察（当前实测 0）。

### 4.9 UI 决策

- 首屏 `phase='playing'`、`modal='none'`；**单一 `ModalKey` 枚举**（`none | rules | topic | more | result`）杜绝多弹窗叠加 / Esc 不知道关哪个；`'result'` 不可遮罩 / Esc 关闭，只能「再摆一局」；打开任意信息弹窗先 `clearHint()`；`checkOutcome()` 判 `cleared|stuck` 时强制 `modal='result'`。
- 提示高亮用 **`hintIds: number[]` / `hintStock: boolean` / `hintText: string`** 三个 props 下发给 `PyramidBoard.vue`：金字塔区与明牌区**本就在同一个组件内**、`Card.id` 全局唯一，一个 id 数组即可跨区同时高亮，**不需要 provide/inject、不需要事件总线**；档 6 用 `hintStock` 高亮手牌堆按钮。
- 高亮 8s 自动清除 + 任意有效操作 / `freshGame` / 打开弹窗时清除；`busy`（380ms 淡出）期去抖；**不限次、无冷却**；只高亮 + 文案，**不自动替玩家消除**。
- **沿用 `style.css` 浅色视觉，不换肤、不引入 `prefers-color-scheme` 切换**（PRD 要的是「精简」，换肤会扩大回归面）；375px 小屏无页面级横向溢出。

### 4.10 发布（Web link）授权：**每轮重新确认**

- **每次发布 / 上线 / 更新到线上，都需要用户在「本轮」对话里明确说「发布」「上线」「更新到线上」才能执行；之前轮次的同意不沿用、不推断、不「顺手」发布。**
- 发布是**覆盖更新**：分享链接不变，内容替换为最新一次 `npm run build` 同步到项目根 `index.html` + `assets/` 的产物。因此发版前必须先 `npm run build`，且确认根产物已提交。
- **在线体验地址（用户 2026-11-06 本轮明确要求）**：README 可以且应当写入公开分享链接 `https://pyramid-card-game.app.workbuddy.host/?sharecode=ZD67FNJVGC`（覆盖更新时链接不变）；该地址是公开分享入口，不是密钥，线上入口以 README 中的在线体验地址为准。
- **仍严禁写入**任何**密钥 / 账号凭据 / token**，以及 `.wbapp_*.genie` 中 locator 值之类的内部标识；这些内部标识只留在本地应用卡片里，不进任何文档。
- `docs/readme-benchmark.md` §4.4 / §8 Q7 与 `docs/qa-readme-review.md` 中「不写 sharecode」属**改版当时的历史结论，已被本条覆盖**；两份历史文档保留原样不改，后续 Agent 一律以本条为准。

---

## 5. 提交与工程卫生

项目根 `.gitignore` 必须排除：

| 规则 | 原因 |
| --- | --- |
| `node_modules/` | 约 **59MB** 依赖安装产物，不入库 |
| `frontend/dist/` | Vite **构建中间产物**，每次 build 重建 |
| `.DS_Store` | macOS 目录元数据 |
| `*.log` | 本地日志 |
| `.workbuddy/` | WorkBuddy 本地会话 / 应用元数据 |
| `.wbapp_*.genie` | WorkBuddy 应用卡片本地文件（含发布 locator，公开仓库不入库） |

**必须提交（不要忽略）**：**根 `index.html` 与根 `assets/`** —— 这是唯一对外入口、也是已发布链接指向的产物；根 `index.html` 用 `./assets/index-*.js|css` 相对路径引用资源，忽略根 `assets/` 后线上会 404。**注意区分**：`frontend/dist/` 是中间产物（忽略），根 `assets/` 是同步后的交付产物（提交）；因此不要写 `assets/` 或 `dist/` 这种无路径限定的通配规则。`frontend/package-lock.json` 也要提交（依赖锁定）。

Git：远端 `git@github.com:Benny66/pyramid-card-match.git`，分支 `main`。提交前核对**只有预期文件**进入暂存区，`legacy/**` 与根产物未被误改。

---

## 6. 常见任务速查表

| 任务 | 动哪些文件 | 必跑命令 / 验收 |
| --- | --- | --- |
| **改玩法 / 规则 / 发牌 / 提示** | 规则真源 `frontend/src/game.ts`（**红线，慎改**）；发牌 `deal.ts`（**只过滤死局，禁止调整单张牌位置**）、求解 `solver.ts`、提示 `hint.ts`；必要时 `diagnostics.ts` | `npm run verify -- 1000`（结构 / 双目标可解 / 随机性四指标 / 20 局按提示重放全过）+ `npm run build` |
| **改文案**（规则 9 条 / 免责 / 趣味词典 / 话题） | `App.vue` 的 `rules[]`、`readings.ts`（**`DISCLAIMER` / `DICT_DISCLAIMER` / `REPLAY_LINES` 一字不改，只移展示位置**）、`components/FunDictionary.vue`、`components/TopicModal.vue`、`corpus.ts` | `npm run build`；人工走查「规则 / 话题 / 更多」三个弹窗与结果弹窗 |
| **改 UI / 样式 / 响应式** | `App.vue`、`components/*.vue`、`frontend/src/style.css`（浅色视觉不变） | `npm run build`；浏览器走查首屏 0 次点击、375px 无横向溢出、提示跨区高亮、单 `modal` 互斥 |
| **加测试 / 改诊断** | `frontend/src/diagnostics.ts`（新断言加进 `VerifyReport`）、`frontend/scripts/verify-deals.mjs` | `npm run verify -- 1000`：退出码 0、`failures=[]`、`pyramidSolvable=n`、`fallbackCount=0`、随机性四指标未退化 |
| **重建趣味语料** | `frontend/scripts/build-corpus.mjs` / `corpus-cards.mjs` / `corpus-topics.mjs` → `frontend/src/data/reading-corpus.ts`（N5 红线，非必要不动） | `npm run corpus`，再 `npm run build` |
| **发版 / 更新到线上** | 只跑构建让 `sync.mjs` 刷新**根 `index.html` + 根 `assets/`**；提交这两个产物 | `npm run build` → 确认根产物已提交 → **等用户本轮明确说「发布 / 上线 / 更新到线上」** 再发布（覆盖更新，链接不变） |

> 通用收尾：`npm run verify -- 1000` → `npm run build` → 浏览器打开**根 `index.html`** 人工走查 → 核对无红线文件被误改。**禁止手改根产物、禁止碰 `legacy/**`、禁止新增依赖。**
