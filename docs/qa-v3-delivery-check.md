# V3 交付只读核对与回归验证报告

| 项 | 内容 |
| --- | --- |
| 报告人 | 严过关（Yan）· QA 工程师 |
| 生成时间 | 2026-11-06 16:21:42 CST |
| 项目 | `/Users/bennywen/project/bennywen/pyramid-card-match`（Vue 3.5 + Vite 6 + TS 5.7 单页小游戏） |
| 待验产出 | `README.md`（170 行）、`AGENTS.md`（164 行）、`.gitignore`（29 行） |
| 验证方式 | **只读核对 + 实跑回归**；未修改任何源码/文档，未执行 `git add` / `commit` / `push` / 发布 |
| 本轮唯一新建文件 | `docs/qa-v3-delivery-check.md`（本文件） |
| 环境 | Node **v22.22.2**、npm 10.9.7、Vite 6.4.5、macOS |
| 测试轮次 | **Round 1 完成即收敛**（写核对 → 运行 → 分析 → 路由），未进入 Round 2 |

---

## 一、汇总结论

| 指标 | 数值 |
| --- | --- |
| 检查项总数 | **50** |
| **PASS** | **47** |
| **FAIL** | **1** |
| WARN（非阻断、措辞/采样观察） | 2 |
| 源码 Bug | **0** |
| 回归结果 | `npm run verify -- 1000` 退出码 0；`npm run verify`（默认参数）退出码 0；`npm run build` 退出码 0 |
| 提交范围 | `git add -A --dry-run` 38 条，全部为预期文件；`node_modules` / `dist` / `.DS_Store` / `.workbuddy` / `.wbapp_*.genie` 均被排除 |
| **智能路由判定** | **ROUTE: Engineer**（唯一 FAIL 为 `AGENTS.md` 文档事实性表述错误，需工程师修正；**源码与构建产物零缺陷**） |

> 结论一句话：三份产出与源码、设计、实测的吻合度极高，回归全绿；仅 `AGENTS.md` §4.7 有一处「导入归属文件」写错，以及两处非阻断措辞建议。按分工 QA 不自行改文档，列出精确修正文本回传主理人转工程师。

---

## 二、执行记录（命令与退出码）

| # | 命令 | 退出码 | 结论 |
| --- | --- | --- | --- |
| 1 | `node -v && npm -v` | 0 | `v22.22.2` / `10.9.7`，与 README:51 一致 |
| 2 | `git status --short` | 0 | 8 条 `??`，无任何被忽略文件混入 |
| 3 | `git check-ignore -v frontend/node_modules` | 0 | `.gitignore:14:node_modules/` 命中 |
| 4 | `git check-ignore -v frontend/dist` | 0 | `.gitignore:17:frontend/dist/` 命中 |
| 5 | `git check-ignore -v assets/` | 1 | **未被忽略**（符合预期） |
| 6 | `git check-ignore -v` × `.DS_Store` / `.workbuddy` / `.wbapp_*.genie` | 0 | 三条规则分别命中 `:20` / `:26` / `:29` |
| 7 | `git add -A --dry-run` | 0 | 38 条，见 §六 |
| 8 | `npx tsc --noEmit`（`frontend/`） | **2** | 复现 README 已知问题 `TS2307`（预期内），见 §7 |
| 9 | `npm run verify -- 1000`（`frontend/`） | **0** | 全指标达标，见 §四 |
| 10 | `npm run build`（`frontend/`） | **0** | `vite build && node sync.mjs`，根产物刷新 |
| 11 | `npm run verify`（不传参） | **0** | `total=1000`，验证默认参数 |
| 12 | `du -sh frontend/node_modules` | 0 | `59M`，与 AGENTS:140 一致 |
| 13 | `wc -l README.md AGENTS.md .gitignore` | 0 | `170 / 164 / 29`，与本轮任务描述一致 |
| 14 | build 后复验 `ls assets` / `sed -n '8,9p' index.html` / `shasum` | 0 | 文件名与 build 前完全一致、校验和不变 |

> 仓库状态补充：`git log` 返回 `your current branch 'main' does not have any commits yet`，`git ls-files | wc -l` = **0**，即当前仓库尚无提交、所有文件均为首次待提交状态。因此本轮「提交范围」核对以 `.gitignore` + `check-ignore` + `add -A --dry-run` 为准，**无法用 `git diff` 做历史比对**（环境事实，不判 FAIL）。

---

## 三、逐项核对表

### 1. 命令与脚本（4/4 PASS）

| ID | 检查项 | 结论 | 证据 |
| --- | --- | --- | --- |
| 1.1 | `frontend/package.json` 5 个 script 与 README「快速开始」「其他脚本」一致 | PASS | `package.json:6-12` = `dev` / `build` / `verify` / `corpus` / `preview`；`README:57-59` 列 `dev`/`build`/`verify`，`README:62` 列 `preview`/`corpus`，逐一对应且命令文本一致（`dev` = `vite --host 0.0.0.0`） |
| 1.2 | `npm run verify -- 1000` 不传参数时默认真是 1000 | PASS | `verify-deals.mjs:5` `Number.parseInt(process.argv[2] ?? '1000', 10) \|\| 1000`；**实跑** `npm run verify` 输出 `"total": 1000`，退出码 0 |
| 1.3 | `npm run build` = `vite build && node sync.mjs` | PASS | `package.json:8`；实跑 stdout 首行 `> vite build && node sync.mjs` |
| 1.4 | AGENTS §2 两条必跑命令准确 | PASS | `AGENTS:38-42` 为 `npm run verify -- 1000` 与 `npm run build`；`AGENTS:40` 注「失败退出码 1」对应 `verify-deals.mjs:16-19` `process.exit(1)`；`AGENTS:44` 基线描述与实测一致 |

### 2. 路径与入口（4/4 PASS）

| ID | 检查项 | 结论 | 证据 |
| --- | --- | --- | --- |
| 2.1 | 根 `index.html` 引用的 `./assets/index-*.js\|css` 真实存在且与 README 目录树文件名一致 | PASS | `index.html:8-9` 引用 `./assets/index-CYdyF3RC.js` / `./assets/index-CW7HbVi-.css`；`ls -1A assets` 恰为这两个；`README:77-78` 同名；**build 后复验**：`ls assets` 与 `dist/assets` 同名、`shasum` 三文件 build 前后完全一致 |
| 2.2 | `frontend/index.html` 确为 Vite 开发入口 | PASS | `frontend/index.html:11` `<script type="module" src="/src/main.ts">`，无 `assets/` 引用；`README:66` / `AGENTS:17` 描述一致 |
| 2.3 | `sync.mjs` 行为与两份文档描述一致（先清根 assets 再拷 dist/assets） | PASS | `sync.mjs:16` 拷 `dist/index.html` → 根 `index.html`；`:19` `rmSync(rootAssets, {recursive:true,force:true})`；`:20` `mkdirSync`；`:21` `cpSync(dist/assets → rootAssets)`；`:23` 打印「已同步：项目根 index.html + assets/」。与 `README:67`、`AGENTS:18`「先清后拷，不递归删除项目根其它内容」一致 |
| 2.4 | `vite.config.ts` 的 `base/outDir/assetsDir` 与 AGENTS §1 一致 | PASS | `vite.config.ts:9,11,13` = `base:'./'` / `outDir:'dist'` / `assetsDir:'assets'`；`AGENTS:18`、`README:91` 逐字一致 |

### 3. 目录结构（4/4 PASS）

| ID | 检查项 | 结论 | 证据 |
| --- | --- | --- | --- |
| 3.1 | README 目录树列出的每个文件/目录真实存在 | PASS | 逐项比对 `ls -1A`（根 / `assets/` / `docs/` / `frontend/` / `frontend/src/` / `components/` / `data/` / `scripts/` / `dist/` / `legacy/`）与 `git add -A --dry-run` 38 条：目录树全部条目均在，无缺失、无多余命名 |
| 3.2 | `StartPanel.vue` 已删除；`InfoModal.vue` / `TopicModal.vue` / `solver.ts` / `deal.ts` / `hint.ts` / `diagnostics.ts` 均存在 | PASS | `test -e frontend/src/components/StartPanel.vue` → **NO**；`ls frontend/src/components` = FunDictionary / InfoModal / PyramidBoard / ReadingCard / ResultModal / TopicModal（6 个，与 `README:113-119` 完全一致）；4 个 `.ts` 均在 `frontend/src/` |
| 3.3 | `docs/` 下 4 个文档齐全 | PASS | `ls -1A docs` = `architecture-v3.md` / `class-diagram.mermaid` / `prd-v3-incremental.md` / `sequence-diagram.mermaid`，与 `README:82-86` 一致 |
| 3.4 | 三份文档行数与本轮描述一致 | PASS | `wc -l` → README **170**、AGENTS **164**、.gitignore **29** |

### 4. 规则与红线（9 PASS + 1 WARN）

| ID | 检查项 | 结论 | 证据 |
| --- | --- | --- | --- |
| 4.1 | 规则 1：52 张、A=1…K=13 | PASS | `game.ts:44-56` `createDeck()` 4 花色 × 13 rank，`value = i+1`，`RANKS` 到 `'K'` |
| 4.2 | 规则 2：两张和 = 13 消除；K 单消 | PASS | `game.ts:123-125` `isPair()` `a.id!==b.id && a.value+b.value===13`；`:167-172` `card.value===13` 直接 `removeCards` 返回 `'removed'` |
| 4.3 | 规则 3：7 层 28 塔牌 + 24 手牌 | PASS | `deal.ts:173-192` `for r=0..6, c=0..r` 装配 28 张，`stockOrder.length !== 24` 校验（`:168`）；`game.ts:79-91` 兜底同结构；`diagnostics.ts:69-88` 断言 |
| 4.4 | 规则 4：露出判定；**被压住的 K 不可选中/不可单消** | PASS | `game.ts:102-114` `isExposed()` 要求下一层 `c`、`c+1` 两张 `removed` 且 `r>=6` 恒露出；`:116-121` `isPlayable()`；**关键顺序**：`:162` `if (!isPlayable(s, card)) return 'blocked'` **先于** `:167` K 单消，注释 `:164-166` 明确「K 单消规则必须排在完全露出判定之后」 |
| 4.5 | 规则 5：明牌常驻可点、全部可互配；翻完不回收 | PASS | `game.ts:118` `waste` 且 `s.waste.indexOf(card)!==-1`；`:192-199` `drawOne()` `stock.shift()` → `zone='waste'` → `waste.push()`，`stock.length===0` 返回 false；全文无 recycle/回洗逻辑 |
| 4.6 | 规则 6：点选 → 配对消除；选错抖动 | PASS | `game.ts:173-189`：`selected` / `deselected` / `removed` / `shake`，且 `:183` 配对前再次校验 `isPlayable(prev)` |
| 4.7 | 规则 7：52 张全消通关；手牌翻完且无组合 → 死局 | PASS | `game.ts:201-206` `evaluate()`：`remainingCount===0` → `'cleared'`；`stock.length===0 && !hasAvailableMove` → `'stuck'`；与 `README:29,31`、`PRD:53` 的「必要非充分条件」表述一致 |
| 4.8 | AGENTS §3 的 N1~N9 与 `docs/prd-v3-incremental.md` §4 一致 | PASS | 逐条比对 `AGENTS:50-60` ↔ `PRD:210-220`：N1 核心规则、N2 K 单消+被压住 K 顺序、N3 露出、N4 明牌常驻、N5 语料/生成逻辑、N6 免责字符串、N7 外链入口、N8 结果与胜负、N9 构建同步，**9/9 语义一致**；AGENTS 对 N2/N5/N7 补充的代码位置与 `architecture-v3.md:355,312` 及源码一致 |
| 4.9 | `DISCLAIMER` / `DICT_DISCLAIMER` / `REPLAY_LINES` 与 `readings.ts` 一致 | PASS | `readings.ts:14-18` 定义 `DISCLAIMER`（结尾「…也不构成任何建议或决策依据。」）与 `DICT_DISCLAIMER`；`:317-322` `REPLAY_LINES` 4 条；`README:11` 与 `DISCLAIMER` **逐字相同**；`FunDictionary.vue:2,21` 直接渲染 `DICT_DISCLAIMER`（未改字、移入「更多」弹窗 `App.vue:326`）；`App.vue:328` 渲染 `DISCLAIMER`，`:222` `replayLine()` 供结果弹窗 |
| 4.10 | AGENTS §3 末行「其余 13 个导出一行不动」数字精确性 | **WARN** | `game.ts` 共 **18 个导出**（13 函数 + 5 类型 `Zone/Card/GameState/SelectResult/GameOutcome`）；除 `createGame()` 外实为 **12 个函数 + 5 个类型 = 17 个**。`architecture-v3.md:782` 沿用同一「其余 13 个」措辞。语义（导出契约不变）正确，仅数字不精确，非阻断 |

### 5. 架构踩坑表述（8 PASS + 1 FAIL + 1 WARN）

| ID | 检查项 | 结论 | 证据 |
| --- | --- | --- | --- |
| 5.1 | §4.3 声称 memo key 带 `goal` 前缀 | PASS | `solver.ts:164-168` `const key = goal + '\|' + alive + '\|' + pool.slice(1, 13).join('')`，注释 `:164-165` 说明 hard/soft 共用 memo 必须隔离；与 `AGENTS:88` 括号内的源码串完全一致。（注：`architecture-v3.md:232` 的旧 key 无 goal 前缀，AGENTS 正确记录了实现期修正） |
| 5.2 | §4.2 声称 `projectMove` 的 `draw` 不改变 `(alive, pool)` | PASS | `solver.ts:224-237`：`if (m.kind !== 'draw')` 才改 `alive`/`pool`；`draw` 分支刻意为空，返回 `{ values, alive, pool }`（pool 为等值副本）；文件头 `:3` 与 `:222` 注释同义 |
| 5.3 | §4.4 声称 `activeDealMeta` 是模块级单例且未挂 `GameState` | PASS | `deal.ts:41` `let activeDealMeta: DealMeta = emptyMeta('full')`；`:355 / :373 / :382` 每次 `createSolvableGame()` 刷新；`:387-389` `getActiveDealMeta()` 只读；`game.ts:20-31` `GameState` 11 个字段中**无任何 meta 字段**；`App.vue:27,93` 仍为 `reactive(createGame())` + `Object.assign` |
| 5.4 | §4.5 声称 hard 用 `'pyramid'`、soft 用 `'full'`、`unknown` 乐观 | PASS | `hint.ts:165` `isSolvable(after, {goal:'pyramid'})`；`:166` `if (hard === 'unsolvable') continue`（仅此值判不安全）；`:167` `goal:'full'`；`:170` `soft: softVerdict === 'solvable'`；`solver.ts:157-162` 预算耗尽返回 `'unknown'`；`deal.ts:334` 发牌默认 `goal='full'` |
| 5.5 | §4.6 的 6 档顺序与 `hint.ts` 的档位映射一致 | PASS | `hint.ts:37-43` `tierForPair` 1/2/4；`:56` K 单消 `pyramid?3:5`；`:88` draw = 6；`:159` `for tier=1..6`；`:174-183` 某档有 `scored` 即排序后 `return`（档间严格短路）；`:176-180` `onPlan desc → soft desc → cardId asc`。顺序与 `AGENTS:104`、`README:45`、`PRD:104-111` 完全一致 |
| 5.6a | §4.7：新增 `.ts` 相对导入显式 `.ts` 后缀 | PASS | `solver.ts:4`、`deal.ts:3-4,12`、`hint.ts:3-13`、`diagnostics.ts:3-8`、`game.ts:4`、`verify-deals.mjs:3` 全部带后缀；`tsconfig.json:11` `allowImportingTsExtensions: true` 属实 |
| 5.6b | §4.7：`solver.ts` / `deal.ts` 对 `game.ts` 只有 `import type` | PASS | `solver.ts:4` / `deal.ts:3` 均为 `import type`；`diagnostics.ts:3` 为 `import type` + `:4` 值导入（符合 §4.7 描述） |
| 5.6c | §4.7：`diagnostics.ts` 值导入 `game.ts` 流程函数 | PASS | `diagnostics.ts:4` `import { createGame, evaluate, selectOrMatch, drawOne } from './game.ts'`，与 `AGENTS:111` 列举的四个函数逐字一致；`verify-deals.mjs:3` 从 `diagnostics.ts` 进，Node 22 直跑成功 |
| **5.6d** | **§4.7：「既有 `game.ts` 的 `./readings` / `./corpus` 与 `.vue` 组件导入沿用无后缀写法」** | **FAIL** | **`game.ts` 全文仅 1 个 import：`:4` `import { createSolvableGame } from './deal.ts'`（带后缀），根本不存在 `./readings` / `./corpus` / `.vue` 导入。这些无后缀导入实际位于 `App.vue:11`（`./game`）、`:13`（`./readings`）、`:14`（`./corpus`）、`:3-7`（`./components/*.vue`）。文档把导入归属文件写错，且「game.ts 沿用无后缀」与源码相反。详见 §五 修正文本** |
| 5.6e | §4.7：「`diagnostics.ts` 是**唯一**会值导入 `game.ts` 真实函数的新增模块」 | **WARN** | `hint.ts:4` 同样值导入 `game.ts`（`playableCards/isPair/isPlayable`）；`AGENTS:22` §1 与 `:111` 同段下一句均已承认这一点。括号中列举的 4 个「流程函数」确实只被 `diagnostics.ts` 值导入，故语义可自洽，但「唯一」措辞易误读，非阻断 |

### 6. 数据真实性（3/3 PASS）

| ID | 检查项 | 结论 | 证据 |
| --- | --- | --- | --- |
| 6.1 | README「验收数据」核心指标与实测基线一致 | PASS | `README:133` 声明 `structureOk/pyramidSolvable/fullSolvable/planReplayOk` 全 1000、`fallbackCount=0`、`failures=[]`、`hintPyramidCleared=20/20`、`degradedCount=0`、退出码 0 —— **实跑 `npm run verify -- 1000` 逐项完全一致**（见 §四）；`README:134` build 通过亦复现 |
| 6.2 | README 括号内 `avgCreateMs≈0.027ms` / `maxHintMs≈0.363ms` 是否真实 | PASS | 第一次带参实跑 `avgCreateMs=0.0598ms` / `maxHintMs=0.7783ms`；**第二次 `npm run verify`（默认参数）实跑 `avgCreateMs=0.027161795ms` / `maxHintMs=0.347833ms`**，与 README 的 0.027 / 0.363 高度吻合 ⇒ 数据来源于真实采样、非编造；差异为机器负载波动（README 已用「≈」「本机实测」限定）。建议（非必须）补一句「单次采样、随负载波动」 |
| 6.3 | AGENTS §4.1 的 66.90% / 9.24e-97 / 1012 条重放 / 1000 副双目标 100% 与 `architecture-v3.md` §0 一致 | PASS | `AGENTS:71` 66.90%（N=3000）↔ `arch:31`；`AGENTS:71` 9.24e-97 ↔ `arch:33`；`AGENTS:82` 1012 条 0 失败 ↔ `arch:35`；`AGENTS:76` 1000/1000 双目标 ↔ `arch:36` 100%/100%；另 `AGENTS:74,100` 的 1,724/38,769 节点、≤22 节点、0.172ms/0.734ms 亦与 `arch:34,37,38` 一致 |

### 7. 已知问题（3/3 PASS）

| ID | 检查项 | 结论 | 证据 |
| --- | --- | --- | --- |
| 7.1 | README 写的 `npx tsc --noEmit` 报错真实复现 | PASS | 实跑输出 `src/main.ts:2:17 - error TS2307: Cannot find module './App.vue' or its corresponding type declarations.` / `Found 1 error in src/main.ts:2`，`TSC_EXIT=2`；与 `README:157` `src/main.ts(2,17): error TS2307` 内容一致（仅 pretty 格式差异） |
| 7.2 | `npm run build` 不受该报错影响 | PASS | `BUILD_EXIT=0`；`✓ 32 modules transformed`、`✓ built in 2.15s`、`已同步：项目根 index.html + assets/`；与 `README:161` 说明一致 |
| 7.3 | README 对成因/影响/修复建议的描述属实 | PASS | `tsconfig.json:10` `noEmit:true`、`:12` `types:["vite/client"]`、`:14` include 含 `.vue` 但无 `env.d.ts`（`ls frontend/src` 确认不存在）；Vite 用 esbuild 转译故 build 不受影响，`README:160-162` 描述属实 |

### 8. 提交范围（8/8 PASS，全部 dry-run）

| ID | 检查项 | 结论 | 证据 |
| --- | --- | --- | --- |
| 8.1 | `.gitignore` 6 条规则齐全且路径限定正确 | PASS | `.gitignore:14` `node_modules/`、`:17` `frontend/dist/`、`:20` `.DS_Store`、`:23` `*.log`、`:26` `.workbuddy/`、`:29` `.wbapp_*.genie`；**未写** 无路径限定的 `assets/` 或 `dist/`（`:10` 注释亦明确禁止） |
| 8.2 | `git status --short` 无被忽略产物 | PASS | 仅 8 条 `??`：`.gitignore` / `AGENTS.md` / `README.md` / `assets/` / `docs/` / `frontend/` / `index.html` / `legacy/` |
| 8.3 | `git check-ignore -v frontend/node_modules` 命中 | PASS | `.gitignore:14:node_modules/	frontend/node_modules`；`du -sh` = `59M` |
| 8.4 | `git check-ignore -v frontend/dist` 命中 | PASS | `.gitignore:17:frontend/dist/	frontend/dist` |
| 8.5 | `git check-ignore -v assets/` **不**被忽略 | PASS | 输出 `NOT-IGNORED exit=1`（无匹配规则），符合交付要求 |
| 8.6 | `.DS_Store` / `.workbuddy/` / `.wbapp_*.genie` 被排除 | PASS | 三条 `check-ignore` 分别命中 `:20 / :26 / :29`；`git status` 与 dry-run 中均无这些文件（三者**实际存在于磁盘**，见 `ls -1A` 根目录） |
| 8.7 | `git add -A --dry-run` 只纳入预期文件 | PASS | **38 条**，完整清单见 §六；含根 `index.html`、`assets/` 2 个产物、`README.md`、`AGENTS.md`、`.gitignore`、`docs/` 4 个、`frontend/src/` 全部、`frontend/scripts/` 4 个、`legacy/index.html`；`grep -E 'node_modules\|frontend/dist'` → **NONE (good)** |
| 8.8 | build 后提交范围未劣化 | PASS | build 后重跑 `git status --short` 仍为同样 8 条 `??`；dry-run 仍 38 条；无 `dist` 混入 |

> 全部为 `--dry-run` / 状态查询，**未执行真实 `git add`，未 commit / push / 发布**。

### 9. 回归（4/4 PASS）

| ID | 检查项 | 结论 | 证据 |
| --- | --- | --- | --- |
| 9.1 | `npm run verify -- 1000` 通过 | PASS | `VERIFY_EXIT=0`，完整 JSON 关键字段见 §四 |
| 9.2 | `npm run build` 通过且根目录产物被刷新 | PASS | `BUILD_EXIT=0`；`sync.mjs` 打印「已同步：项目根 index.html + assets/」；build 后 `ls assets` = `index-CW7HbVi-.css` / `index-CYdyF3RC.js`，与 `dist/assets` 同名；`index.html:8-9` 引用真实存在；三文件 `shasum` 与 build 前一致（源码未变 ⇒ 哈希稳定） |
| 9.3 | 默认参数 `npm run verify` 亦通过 | PASS | `VERIFY_DEFAULT_EXIT=0`，`total=1000`、四项计数全 1000、`20/20` |
| 9.4 | 全程未触碰禁止操作 | PASS | 未修改源码/文档（仅新建本报告）、未 `git add`/`commit`/`push`/发布、未手改根产物、未碰 `legacy/**`、未新增依赖 |

---

## 四、回归验证完整输出

### 4.1 `npm run verify -- 1000`（退出码 0）

```json
{
  "total": 1000,
  "structureOk": 1000,
  "pyramidSolvable": 1000,
  "fullSolvable": 1000,
  "planReplayOk": 1000,
  "fallbackCount": 0,
  "avgCreateMs": 0.05982237599999939,
  "maxCreateMs": 2.5386660000000347,
  "avgHintMs": 0.047569212000000735,
  "maxHintMs": 0.7782500000000141,
  "failures": [],
  "hintSamples": 20,
  "hintPyramidCleared": 20,
  "degradedCount": 0
}
```

```
[verify] OK  structureOk=1000 pyramidSolvable=1000 fullSolvable=1000 planReplayOk=1000 fallbackCount=0 hintPyramidCleared=20/20 failures=0
VERIFY_EXIT=0
```

### 4.2 `npm run verify`（不传参，退出码 0）

```json
{ "total": 1000, "structureOk": 1000, "pyramidSolvable": 1000,
  "fullSolvable": 1000, "planReplayOk": 1000, "fallbackCount": 0,
  "avgCreateMs": 0.02716179500000038, "maxCreateMs": 0.9868750000000261,
  "avgHintMs": 0.02183760600000012, "maxHintMs": 0.3478330000000085,
  "failures": [], "hintSamples": 20, "hintPyramidCleared": 20, "degradedCount": 0 }
```

### 4.3 `npm run build`（退出码 0）

```
> vite build && node sync.mjs
vite v6.4.5 building for production...
✓ 32 modules transformed.
dist/index.html                   0.52 kB │ gzip:  0.36 kB
dist/assets/index-CW7HbVi-.css    8.83 kB │ gzip:  2.76 kB
dist/assets/index-CYdyF3RC.js   268.68 kB │ gzip: 56.31 kB
✓ built in 2.15s
已同步：项目根 index.html + assets/
BUILD_EXIT=0
```

### 4.4 `npx tsc --noEmit`（预期失败，退出码 2）

```
src/main.ts:2:17 - error TS2307: Cannot find module './App.vue' or its corresponding type declarations.
Found 1 error in src/main.ts:2
TSC_EXIT=2
```

---

## 五、FAIL / WARN 明细与建议修正文本（QA 不自改文件）

### FAIL-1 · `AGENTS.md:109`（§4.7 第 1 条）—— 导入归属文件写错

**现有原文片段**：

> 既有 `game.ts` 的 `./readings` / `./corpus` 与 `.vue` 组件导入沿用无后缀写法，不要「顺手统一」。

**问题**：`game.ts` 全文只有 `game.ts:4` 一个 import（`from './deal.ts'`，**带 `.ts` 后缀**）；`./readings`、`./corpus`、`./game` 与 `./components/*.vue` 的无后缀导入全部位于 `App.vue:3-14`。按现文，Agent 会去 `game.ts` 找不存在的导入，并可能误把 `game.ts:4` 的 `.ts` 后缀「顺手统一」掉 → **会直接破坏 Node 22 原生 type-stripping 的 `npm run verify`**。属会误导后续改动的事实性错误。

**建议替换为**：

> 既有 `App.vue` 的 `./game`、`./readings`、`./corpus` 及 `./components/*.vue` 导入沿用无后缀写法，不要「顺手统一」；而 `game.ts` 内 V3 新增的 `import { createSolvableGame } from './deal.ts'` 必须保留 `.ts` 后缀（否则 `verify-deals.mjs` 无法被 Node 22 原生 type-stripping 直接加载）。

### WARN-1 · `AGENTS.md:61`（§3 表格末行）—— 导出数量不精确

**现有**：「其余 13 个导出一行不动」
**建议**：「除 `createGame()` 外的全部导出（12 个函数 + 5 个类型）一行不动」
**依据**：`game.ts` 共 18 个导出（13 函数 + `Zone` / `Card` / `GameState` / `SelectResult` / `GameOutcome` 5 个类型）。

### WARN-2 · `AGENTS.md:111`（§4.7 第 3 条）—— 「唯一」措辞有歧义

**现有**：「`diagnostics.ts` 是**唯一会值导入 `game.ts` 真实函数**……的新增模块」
**建议**：「`diagnostics.ts` 是唯一会值导入 `game.ts` **流程函数**（`createGame` / `evaluate` / `selectOrMatch` / `drawOne`）的新增模块；`hint.ts` 值导入的是只读规则函数（`playableCards` / `isPair` / `isPlayable`），属刻意复用规则真源」
**依据**：`hint.ts:4` 确实也是值导入；与 `AGENTS:22` §1 依赖方向、`:111` 同段下一句互相呼应，改后无歧义。

### 非阻断观察（不计 FAIL / WARN，无需修改）

`README:133` 括号内 `avgCreateMs≈0.027ms` / `maxHintMs≈0.363ms` 为单次采样值；本轮两次实跑分别得到 `0.0598/0.7783` 与 `0.0272/0.3478`，说明会随机器负载波动但量级与来源真实。若工程师愿意可补一句「单次采样，随负载波动」，核心计数（1000/1000/1000/1000、20/20、0）**无需改动**。

---

## 六、`git add -A --dry-run` 完整清单（38 条，仅 dry-run）

```
add '.gitignore'
add 'AGENTS.md'
add 'README.md'
add 'assets/index-CW7HbVi-.css'
add 'assets/index-CYdyF3RC.js'
add 'docs/architecture-v3.md'
add 'docs/class-diagram.mermaid'
add 'docs/prd-v3-incremental.md'
add 'docs/sequence-diagram.mermaid'
add 'frontend/index.html'
add 'frontend/package-lock.json'
add 'frontend/package.json'
add 'frontend/scripts/build-corpus.mjs'
add 'frontend/scripts/corpus-cards.mjs'
add 'frontend/scripts/corpus-topics.mjs'
add 'frontend/scripts/verify-deals.mjs'
add 'frontend/src/App.vue'
add 'frontend/src/components/FunDictionary.vue'
add 'frontend/src/components/InfoModal.vue'
add 'frontend/src/components/PyramidBoard.vue'
add 'frontend/src/components/ReadingCard.vue'
add 'frontend/src/components/ResultModal.vue'
add 'frontend/src/components/TopicModal.vue'
add 'frontend/src/corpus.ts'
add 'frontend/src/data/reading-corpus.ts'
add 'frontend/src/deal.ts'
add 'frontend/src/diagnostics.ts'
add 'frontend/src/game.ts'
add 'frontend/src/hint.ts'
add 'frontend/src/main.ts'
add 'frontend/src/readings.ts'
add 'frontend/src/solver.ts'
add 'frontend/src/style.css'
add 'frontend/sync.mjs'
add 'frontend/tsconfig.json'
add 'frontend/vite.config.ts'
add 'index.html'
add 'legacy/index.html'
```

- 预期内且已确认纳入：根 `index.html` + 根 `assets/` + `README.md` + `AGENTS.md` + `.gitignore` + `docs/` + `frontend/src/` + `frontend/scripts/` + `frontend/package-lock.json` + `legacy/`。
- 预期内且已确认排除：`frontend/node_modules`（59M）、`frontend/dist/`、`.DS_Store`、`.workbuddy/`、`.wbapp_8HxlA50Mylxj52Ja2ZDFdf.genie`。
- 本报告 `docs/qa-v3-delivery-check.md` 落盘后，dry-run 预期由 38 条变为 **39 条**（新增本报告一条），属本轮约定允许的唯一新增文件。

---

## 七、智能路由判定

```
ROUTE: Engineer
```

**判定依据（按 QA 决策规则）**：

1. 断言/核对逻辑本身正确，且所有核对均按 PRD / 架构 / 源码逐条取证据 → **不是 ROUTE: QA**（核对脚本无 bug，无需自修）。
2. `npm run verify -- 1000`、`npm run verify`（默认）、`npm run build` 全部退出码 0，提交范围干净，源码零缺陷 → 但仍有 1 处文档事实性错误 → **不是 ROUTE: NoOne**。
3. FAIL-1 属于 `AGENTS.md` 文档表述与源码不符（会误导后续 Agent 改动 `game.ts` 导入后缀，存在破坏 `verify` 的实际风险），需文档作者（工程师）修正 → **ROUTE: Engineer**。

**给工程师的最小修正清单**（QA 未改任何文件）：

| 优先级 | 文件:行 | 动作 |
| --- | --- | --- |
| 必改 | `AGENTS.md:109` | 按 §五 FAIL-1 替换那句（把 `game.ts` 改为 `App.vue`，并说明 `game.ts:4` 必须带 `.ts` 后缀） |
| 建议 | `AGENTS.md:61` | 按 §五 WARN-1 修正导出数量 |
| 建议 | `AGENTS.md:111` | 按 §五 WARN-2 消除「唯一」歧义 |

**修正后无需重跑源码回归**：以上三处均为纯文档措辞，不触碰 `frontend/src/**`、脚本或构建产物；建议主理人安排一次文档复核（读改后文本即可）。若主理人评估 FAIL-1 可接受为「已记录的轻微瑕疵」，本轮可按 Known Issue 收尾，但按 QA 规则仍如实路由 Engineer。

---

## 八、边界与未覆盖范围（如实声明）

- 本轮为**静态核对 + 命令行回归**，未做浏览器实机走查：375px 小屏无横向溢出、首屏 0 次点击、提示跨区高亮、三个弹窗互斥与 Esc 行为、结果弹窗「再摆一局」流程，均只核对到源码/文档层面（`App.vue:20-27,133-142,244-330`），**未做 UI 实测**。
- PRD S6「改版前基线 0/4」属历史用户实测数据，本轮无历史环境可复现，未验证。
- 仓库当前 **0 commits / 0 tracked files**，无法用 `git diff` 核对「V3 只加了一条 script」「其余导出一行不动」等历史性断言；此类断言以 `architecture-v3.md` §7 与当前 `package.json` 静态一致性为据。
- 未执行任何 `git add`（真实）/ `commit` / `push` / 发布；未手改根 `index.html` 与 `assets/`（build 属约定内的脚本刷新）；未碰 `legacy/**`。
- 报告中所有命令输出均为本机实跑记录，无推断或伪造；`tsc` 失败为预期内并已单独标注。

---

## 六、第 2 轮回归（文档复核）

> **编号说明**：本节按主理人指定标题追加于报告末尾；前文已存在「## 六、`git add -A --dry-run` 完整清单」（第 1 轮内容），两节编号重复仅因沿用指定标题，内容相互独立。**最终路由判定以本节为准**，前文 §七 的 `ROUTE: Engineer` 为第 1 轮历史记录。

| 项 | 内容 |
| --- | --- |
| 复核人 | 严过关（Yan）· QA 工程师 |
| 时间 | 2026-11-06 16:30:13 CST |
| 触发 | 主理人第 2 轮回归指令；工程师已按 §五 建议修完 `AGENTS.md` / `README.md` |
| 范围 | **仅文档文本复核**：`AGENTS.md:109`、`:61`、`:111`、`README.md:133`，及其与 `game.ts` / `App.vue` / `hint.ts` / `diagnostics.ts` / `architecture-v3.md` §7 T01 的一致性 |
| 约束 | **未重跑** `npm run verify` / `npm run build` / `npx tsc --noEmit`（第 1 轮已全绿、本轮未触碰源码）；未修改其它文件；未执行任何 git 操作；未发布 |
| 方法 | 全文读取改后 `AGENTS.md`、`README.md` 相关段，Grep 源码导入行与架构 §7 T01 原文，逐条比对 |

### 汇总

| 指标 | 数值 |
| --- | --- |
| 主检查点 | **6** |
| **PASS** | **6** |
| **FAIL** | **0** |
| WARN | 0 |
| 第 1 轮遗留 FAIL | **1 → 0**（已闭环） |
| 第 1 轮遗留 WARN | **2 → 0**（已闭环） |
| 最终判定 | **ROUTE: NoOne** |

### 逐点核对

| ID | 检查项 | 结论 | 证据 |
| --- | --- | --- | --- |
| R2-1 | `AGENTS.md:109` 是否已改为「既有 `App.vue` 的 `./game` / `./readings` / `./corpus` 及 `./components/*.vue` 沿用无后缀写法」 | **PASS** | 现文：「既有 `App.vue` 的 `./game`、`./readings`、`./corpus` 及 `./components/*.vue` 导入沿用无后缀写法，不要「顺手统一」」；源码 `App.vue:3-7`（5 个 `./components/*.vue`）、`:11`（`from './game'`）、`:13`（`./readings`）、`:14`（`./corpus`）**全部无后缀**；`game.ts` 内已不存在被误指的 `./readings` / `./corpus` 导入 |
| R2-2 | `AGENTS.md:109` 是否补了「`game.ts` 内 `from './deal.ts'` 必须保留 `.ts` 后缀」，且与源码一致 | **PASS** | 现文：「而 `game.ts` 内 V3 新增的 `import { createSolvableGame } from './deal.ts'` 必须保留 `.ts` 后缀（否则 `verify-deals.mjs` 无法被 Node 22 原生 type-stripping 直接加载）」；`game.ts:4` 确为该行且带后缀；`solver.ts:4` / `deal.ts:3-4` / `hint.ts:3-13` / `diagnostics.ts:3-8` 新增 `.ts` 导入全部带后缀；`tsconfig.json:11` `allowImportingTsExtensions: true`；`verify-deals.mjs:3` `../src/diagnostics.ts`。⇒ **第 1 轮 FAIL-1 的风险点（误把 `game.ts:4` 去掉后缀而破坏 verify）已被明确堵住** |
| R2-3 | `AGENTS.md:61` 是否已改为「除 `createGame()` 外的全部导出（12 个函数 + 5 个类型）」 | **PASS** | 现文与 §五 WARN-1 建议逐字一致；`game.ts` 共 **18 个导出** = 13 函数（含 `createGame`）+ 5 类型（`Zone` / `Card` / `GameState` / `SelectResult` / `GameOutcome`），扣除 `createGame()` 后正是 **12 + 5** ✓ |
| R2-4 | `AGENTS.md:111` 是否消除「唯一会值导入 `game.ts` 真实函数」歧义、同段不再自相矛盾 | **PASS** | 现文把「唯一」限定为「`game.ts` **流程函数**（`createGame` / `evaluate` / `selectOrMatch` / `drawOne`）」，并明写「`hint.ts` 值导入的是只读规则函数（`playableCards` / `isPair` / `isPlayable`），属刻意复用规则真源」；与 `diagnostics.ts:4`、`hint.ts:4`、`AGENTS.md:22` §1 依赖方向三者互相印证；同段不再出现「唯一值导入真实函数」与「hint.ts 也值导入」的冲突。⇒ WARN-2 闭环 |
| R2-5 | `AGENTS.md:111` 新增的「架构 §7 T01 概括与源码差异」标注是否属实、表述无误 | **PASS** | ① `architecture-v3.md:786` 原文确为「所有新增 `.ts` 相对导入**显式 `.ts` 后缀**；`deal.ts`/`solver.ts`/`diagnostics.ts` 对 `game.ts` 只用 `import type`」，AGENTS 的引述**逐字一致** ✓；② 源码实际：`deal.ts:3`、`solver.ts:4` 确为纯 `import type`，但 `diagnostics.ts:3` 是 `import type` 且 `:4` 另有值导入 ⇒ **差异真实存在**，标注成立 ✓；③ 「二者都不在 `game.ts` 的运行时依赖链上…因此不构成环」与 `game.ts:4 → deal.ts:3-4 → solver.ts`（`solver.ts` 对 game.ts 仅 type）一致，`hint.ts` / `diagnostics.ts` 均不被该链反向引用 ✓；④ 「不要据此把它们改成 type-only，更不要反过来给 `deal.ts` / `solver.ts` 加值导入」与 `verify-deals.mjs:3`、`hint.ts:4` 的可用性一致 ✓。另 `architecture-v3.md:782` 的「其余 13 个导出」属同类历史概括，已由 R2-3 修正并以源码为准，二者无残留冲突 |
| R2-6 | `README.md:133` 若补「单次采样，随负载波动」，核心计数是否未变 | **PASS** | 现文括号末尾新增「，单次采样，随负载波动」；核心计数 `structureOk=1000` / `pyramidSolvable=1000` / `fullSolvable=1000` / `planReplayOk=1000` / `fallbackCount=0` / `failures=[]` / `hintPyramidCleared=20/20` / `degradedCount=0` / 退出码 0 **逐字未变** ✓；与第 1 轮两次实跑（`0.0598/0.7783` 与 `0.0272/0.3478`）的波动事实相符 ✓；`wc -l` 复核 README 仍 **170** 行、AGENTS 仍 **164** 行、`.gitignore` 仍 **29** 行 |

### 附带改动核对（工程师本轮顺带修正，不计入 6 个主检查点，均无问题）

| 位置 | 改动 | 结论 | 证据 |
| --- | --- | --- | --- |
| `AGENTS.md:44` | 「不需要 esbuild / tsx / ts-node / vitest」→「不需要额外安装 tsx / ts-node / vitest」 | PASS | `package.json` 无这些依赖；Vite 6 自带 esbuild，原写法易被误读，改后更准确 |
| `AGENTS.md:100` | 区分「架构原型实测 0.172ms / 0.734ms（保守估计、无共享 memo）」与「本机采样 `maxHintMs≈0.363ms`」 | PASS | `architecture-v3.md:38` 明写「无共享 memo 的保守估计」、`:248`「共享 memo 后只会更低」；README:133 的 0.363 为另一次采样，二者不矛盾 |
| `AGENTS.md:109,110` | 补「Vite 自带的 esbuild 属既有依赖，与此无关」；补「否则 `game.ts ↔ deal.ts ↔ solver.ts` 成环」 | PASS | 与 `AGENTS.md:22` §1 依赖方向、源码导入链一致 |

### 附带观察（非阻断、可选优化，不计 PASS/FAIL，不影响本轮交付）

- **O-1**：`AGENTS.md:111` 末句「二者都…不参与首屏」按字面理解略宽松 —— `diagnostics.ts` 确实只被 `verify-deals.mjs:3` 引用、不进首屏 bundle；但 `hint.ts` 被 `App.vue:12` 值导入，随首屏 bundle 加载（只是 `getHint()` 仅在点击「提示」时由 `App.vue:133-142` 调用，首屏初始化不执行求解、不阻塞首屏）。若追求逐字精确，可改为「二者都不在 `game.ts` 的运行时依赖链上；`diagnostics.ts` 不进首屏 bundle，`hint.ts` 随首屏加载但首屏初始化不执行求解」。**当前表述在「不参与首屏计算 / 不构成环」的语境下语义成立，不判 FAIL。**
- **O-2**：`AGENTS.md:109` 列举 `App.vue` 无后缀导入时未列出 `./hint.ts`（`App.vue:12`，V3 新增、带 `.ts` 后缀）。该行符合 §4.7 首句「新增 `.ts` 之间的相对导入显式写后缀」，文档未列举不构成矛盾；可选补一句以免后续 Agent 误以为 `App.vue` 全部导入都无后缀。
- **O-3**：本轮仅 `AGENTS.md` / `README.md` 被修改，`architecture-v3.md` §7 T01 的历史概括（`:782`「其余 13 个导出」、`:786`「`diagnostics.ts` 只用 `import type`」）保持原样；`AGENTS.md:61` 与 `:111` 已分别以「以源码为准」的方式修正 / 标注，符合 `AGENTS.md:4` 的约定，无需回改架构文档。
- 源码未被本轮改动：`ls -l` 显示 `game.ts` / `App.vue` / `hint.ts` / `diagnostics.ts` 的 mtime 均早于第 1 轮报告生成时间，与「本轮未触碰源码」一致。

### 最终判定

```
ROUTE: NoOne
```

**依据**：

1. 第 1 轮唯一 FAIL（`AGENTS.md:109` 导入归属写错）已按 §五 建议修正，且与 `game.ts:4` / `App.vue:3-14` 源码一致 → 缺陷闭环。
2. 两条 WARN（导出数量、措辞歧义）已分别修正 → 闭环。
3. 本轮 6 个检查点全部 PASS、**FAIL 0**；未发现新增事实性错误；工程师附带改动亦全部属实。
4. 按 SOP「最多 2 轮」：**第 2 轮为最后一轮，不再进入第 3 轮**；无遗留 Known Issues。
5. 未重跑 `verify` / `build` / `tsc` 属主理人明确授权（本轮未触碰 `frontend/src/**`、脚本、配置与构建产物；第 1 轮三项命令结果仍有效：verify 退出码 0、build 退出码 0、tsc 预期内 `TS2307` 且不影响 build）。

**给主理人的交付建议**：三份文档 + 根产物 + 源码已具备提交条件；`git add -A --dry-run` 预期 39 条（含本报告），无 `node_modules` / `dist` / `.DS_Store` / `.workbuddy` / `.wbapp_*.genie`。**发布仍需按 `AGENTS.md` §4.10 由用户在本轮对话明确说「发布 / 上线 / 更新到线上」后才可执行**（QA 未执行任何 git 操作与发布动作）。
