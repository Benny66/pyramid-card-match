# QA 只读核对报告 · 最终版 README 与 4 张截图

> **报告人**：严过关（Yan，QA 工程师）　**日期**：2026-11-06　**语言**：简体中文
> **核对对象**：`README.md`（137 行）、`docs/screenshots/*.png`（4 张）
> **核对基线**：`docs/readme-benchmark.md`（§4.1 / §4.2 / §4.4 / §4.5 / §5 / §6）、`docs/prd-v3-incremental.md` §3.2、`AGENTS.md` §1/§2/§4.9/§4.10/N6、`frontend/src/{hint.ts, App.vue, game.ts, readings.ts, deal.ts}`、`frontend/package.json`、`frontend/sync.mjs`、`frontend/vite.config.ts`、`index.html`、`.gitignore`
> **执行边界**：**全程只读**。未修改 `README.md` / 截图 / 源码；未执行 `git add` / `commit` / `push` / 发布；未重跑 `npm run build`（也未跑 `npm run verify`）；本轮唯一新建文件即本报告 `docs/qa-readme-review.md`。

---

## 0. 汇总

| 指标 | 结果 |
| --- | --- |
| 检查项总数 | **36** |
| PASS | **36** |
| FAIL | **0** |
| 观察项（非 FAIL，见 §9） | 6 |
| **智能路由** | **ROUTE: NoOne** |

**路由理由**：36 项逐条 PASS。未出现「断言符合 PRD/设计但实现输出错误」的情况（无需回 Engineer 改源码/README），也未出现核对口径本身错误（无需 QA 自修）。截图文件与内容、链接锚点、护栏、免责合规、事实一致性、对标方案落实度、提交范围预检全部达到交付标准 → 发给 NoOne，本轮结束。

---

## 1. 截图文件（6 项）

| # | 检查项 | 结论 | 证据（行号 / 命令输出摘要） |
| --- | --- | --- | --- |
| A1 | 4 张 PNG 都存在且非空 | **PASS** | `ls -la docs/screenshots/`：`01-first-screen.png` 89957 B、`02-hint-highlight.png` 79449 B、`03-modals.png` 155029 B、`04-mobile-375.png` 134939 B，均 > 0 |
| A2 | PNG 头 / IHDR / IEND / CRC / 像素数据合法 | **PASS** | Python 逐 chunk 校验：4 张均 `sig=True IHDR=True ihdrCRC=True`、chunk 序列以 `IEND` 结尾、`CRC_bad=[]`、`eof_ok=True`；IDAT 解压字节数与 `(1+3*w)*h` 精确相等。例：01 `raw=3994640B expected=3994640B pixels_ok=True`；02/03 `raw=3072800B`；04 `raw=3655624B` |
| A3 | 尺寸符合 §6 清单 | **PASS** | `file docs/screenshots/*.png`：01 **1280×1040**（要求 ≥1280×950 ✓，三块面板完整）、02 **1280×800** ✓、03 **1280×800** ✓、04 **750×1624**（= 375×812 @ DPR2 ✓）。`IHDR` 解包与 `file` 结果一致 |
| A4 | 单图体积合理 | **PASS** | 78 KB ~ 151 KB，均 < 200 KB；8-bit RGB 非隔行，无异常膨胀（`file` 输出 `PNG image data, ..., 8-bit/color RGB, non-interlaced`） |
| A5 | README 4 个图片引用路径逐字对应真实文件 | **PASS** | 正则提取：`README.md:7` `docs/screenshots/01-first-screen.png`（`![](...)`）；`:40` `02-hint-highlight.png`、`:42` `03-modals.png`、`:44` `04-mobile-375.png`（`<img src=...>`）。与目录 4 个文件名 1:1 精确匹配，`os.path.exists` 全 OK |
| A6 | 全部相对路径；无外部图床 / 占位图 / AI 图 / GIF | **PASS** | 4 条引用全部为仓库内 `docs/screenshots/*.png` 相对路径；全文 `https?://[^\s)]*\.(png\|jpg\|jpeg\|gif\|svg\|webp)` 命中 **0**；`.gif` / `placeholder` / `unsplash` / `picsum` / `AI 生成` 命中 **0** |

---

## 2. 截图内容与真实界面一致（5 项）

| # | 检查项 | 结论 | 证据（ViewImage 逐张目视） |
| --- | --- | --- | --- |
| B1 | 01 首屏：无弹窗、无高亮，金字塔 + 手牌堆 + 明牌区完整 | **PASS** | 顶部 HUD「话题 今日心情 剩余 52 张 消除 0 次 用时 0 秒」+「规则/话题/更多」「提示/重新开局」；**7 层 28 张金字塔完整**；「金字塔·7 层」「手牌堆·一次翻一张 [24 点此翻牌]」「明牌区·0 张」**三块面板全部完整可见**（对应主理人要求重截的 1280×1040）；无弹窗、无琥珀高亮。底行 7 张蓝框为「完全露出/可选」默认卡面（见观察项 3） |
| B2 | 02 琥珀高亮两张牌 +「先消金字塔上的这两张」 | **PASS** | 底行 **3♥ 与 10♦ 两张琥珀/橙色描边高亮**（3+10=13，且均在金字塔底行 = 档 1「塔+塔」）；棋盘上方黄色横幅逐字为「**先消金字塔上的这两张**」，与 `hint.ts:130-132` 档 1/2 文案、PRD §3.3 L126 一致；无弹窗 |
| B3 | 03 规则 / 话题弹窗且背景棋盘可见 | **PASS** | 单一「**规则说明**」弹窗，副标题「纯消牌小游戏，规则只有加法。」，9 条规则与 `App.vue:229-239` 的 `rules[]` 逐条吻合（含「52 张全部消除即通关…这局不算，重摆一局」），底部「知道了」；灰色遮罩下金字塔、底行蓝框牌、手牌堆「24 点此翻牌」仍清晰可见；无第二弹窗 |
| B4 | 04 375px 移动端完整、无横向滚动 | **PASS** | 750×1624 物理像素 = 375 CSS px @ DPR2；标题、HUD、5 个按钮、7 层金字塔、「手牌堆·一次翻一张」「明牌区·0 张」**全部完整显示且无左右裁切/溢出**；浅色视觉未换肤，符合 `AGENTS.md §4.9` L124 |
| B5 | 4 张均无地址栏 / 带 sharecode 的 URL / 本地绝对路径 / 开发者工具 / 密钥 | **PASS** | 逐张 ViewImage：均为纯游戏界面，无浏览器 chrome、无 URL 文本、无 devtools 面板、无 `/Users/...` 等本地绝对路径、无密钥/token 字样 |

---

## 3. 相对链接与锚点（3 项）

| # | 检查项 | 结论 | 证据 |
| --- | --- | --- | --- |
| C1 | README 内所有 `](...)` 相对路径（含文档索引 7 条、`index.html`、`AGENTS.md`）指向的文件真实存在 | **PASS** | 共提取 22 个 `](...)`：11 个 `#anchor` + 11 个相对路径（含 4 张图片中的 1 张 markdown 图），`os.path.exists` **全部 OK**：`index.html`、`AGENTS.md`、`docs/qa-v3-delivery-check.md`×2、`docs/architecture-v3.md`×2、`docs/prd-v3-incremental.md`、`docs/class-diagram.mermaid`、`docs/sequence-diagram.mermaid`、`docs/readme-benchmark.md`、`docs/screenshots/01-first-screen.png`。文档索引 `README.md:114-115` 恰 **7 条**（PRD / 架构 / 类图 / 时序图 / QA 报告 / 对标调研 / AGENTS.md），已补齐原漏列的 QA 报告 |
| C2 | TOC 11 个 `#anchor` 都有对应 `<a name="...">` 或等价锚点 | **PASS** | `README.md:21-23` TOC 共 **11** 个：`#disclaimer` `#features` `#screenshots` `#quickstart` `#rules` `#faq` `#quality` `#structure` `#known-issues` `#online` `#license`；全文 12 个 `<a name>`（另多一个 `toc`），11 个逐个命中 `OK`；12 个 `##` 章节各带 1 个 `<a name>`（L11/19/25/38/47/69/83/94/100/117/126/132） |
| C3 | 无失效链接、无外链图片 | **PASS** | 无 `http(s)://` 形式的图片 / 徽章 / 图床链接；唯一 http 字面量是 `README.md:51` 的本地回环静态服务器示例（见观察项 2） |

---

## 4. 护栏（重点，5 项）

| # | 检查项 | 结论 | 证据 |
| --- | --- | --- | --- |
| D1 | 无 shields.io / 外链图床徽章；用纯文本标签行 | **PASS** | `shields\.io\|img\.shields` 命中 **0**；`README.md:5` 为 `**Vue 3.5 · Vite 6 · TypeScript 5.7　\|　纯前端 · 零后端 · 零网络请求 · 离线可玩　\|　简体中文**`，与 benchmark §4.1 L186 建议文案**逐字一致** |
| D2 | 无 `build passing` / coverage / npm downloads 等伪造动态状态 | **PASS** | 正则 `build passing\|build%20passing\|coverage\|downloads\|CI status\|badge.svg\|actions/workflows` 命中 **0**；项目无 CI、无 npm 发包、无 coverage 服务（benchmark §4.1 L170） |
| D3 | 无虚构 MIT / Apache / LICENSE 链接；末章如实写「尚未指定开源许可证」 | **PASS** | 全文无 MIT/Apache/GPL 授权声明、无 `[MIT](LICENSE)` / `[MIT](./LICENSE)` / `LICENSE.txt` 链接（`noEmit` 中的 "mit" 为大小写不敏感误匹配，见 §9）；`README.md:134` 逐字「本仓库目前**尚未指定开源许可证**（仓库内未包含 `LICENSE` 文件）…」，与 benchmark §4.2 L198 建议文案一致；仓库根确无 `LICENSE*` 文件（benchmark §0.2 L40 已核验） |
| D4 | 无 CONTRIBUTING.md / 多语言 README / CHANGELOG 等过度工程化 | **PASS** | 全文 + 目录扫描：`CONTRIBUTING\|CHANGELOG\|README.en\|README_EN\|English\|语言切换\|i18n\|Sponsor\|Donat\|赞助\|Roadmap\|Code of Conduct\|Deploy\|Packages\|贡献指南\|版本历史\|更新日志\|Outline` 命中 **0**；仓库无上述文件；README 不展开架构章节（仅 `:98`、`:114` 相对链接指向 `docs/architecture-v3.md`） |
| D5 | 全文无 sharecode、无密钥 | **PASS** | 无 sharecode 值 / 分享 URL / 密钥 / api_key / secret / token 值；字面词 `sharecode` 仅出现在 `README.md:130` 的**合规护栏句**内（与旧版 README 原文逐字一致、benchmark §8 Q7 判「不可删」），属「禁止写入」的否定句而非违规内容，详见观察项 1 |

---

## 5. 免责合规（3 项）

| # | 检查项 | 结论 | 证据 |
| --- | --- | --- | --- |
| E1 | 主免责句 + 3 条 bullet **逐字**保留（与 `readings.ts` 的 `DISCLAIMER`、旧版 README 对齐） | **PASS** | Python 逐字比对（`git show HEAD:README.md`）：主句「本游戏及趣味解答仅休闲娱乐，不作为真实依据，不具备预测、占卜、判断吉凶的作用，也不构成任何建议或决策依据。」与 `readings.ts:14-15` 的 `DISCLAIMER` 常量 **True**、与旧版 **True**；3 条 bullet 去掉 `> ` 引用块前缀后与旧版 **True / True / True**（新 README `L15`「规则只有加法…确定性查表」、`L16`「不上传话题或输入内容…不调用任何大模型」、`L17`「游戏不限次数、不限天数…今日心情」）。排版改为引用块，符合 benchmark §5 L239「仅排版为引用块」 |
| E2 | Hero 一句话与 FAQ 是否都带「仅休闲娱乐 / 无预测无占卜 / 不上传 / 不调大模型」 | **PASS** | `L3` Hero「**仅休闲娱乐**，打开页面就能玩，不用注册、不用联网」；`L15-16` 免责块「不含任何预测、占卜…」「**不上传话题或输入内容、不请求任何接口、不调用任何大模型**」；`L87` FAQ「**无预测、无占卜、无判断吉凶、无任何决策建议**…仅休闲娱乐」；`L88` FAQ「**不上传话题或输入内容、不请求任何接口、不调用任何大模型**」。关键词命中：`仅休闲娱乐`→L3/13/87；`无预测`/`无占卜`→L87；`不上传`→L16/88；`不调用任何大模型`→L16/88 |
| E3 | 有无弱化 | **PASS** | `## 免责声明` 位于 `L11 / 137 行 = 8.0%`，仍在文档前 1/4（benchmark §4.5 L226）；Hero 与 FAQ 共新增 3 处定位强化，覆盖面向外扩散，符合 §4.5「信息覆盖面反而扩大，不是弱化」 |

---

## 6. 事实一致性（8 项）

| # | 检查项 | 结论 | 证据 |
| --- | --- | --- | --- |
| F1 | 快速开始命令与 `frontend/package.json` 的 5 个 script 一致 | **PASS** | `package.json:6-11` = `dev` / `build` / `verify` / `corpus` / `preview`；`README.md:61` `npm run dev # vite --host 0.0.0.0`、`:62` `npm run build # = vite build && node sync.mjs`、`:63` `npm run verify -- 1000 # …默认也是 1000`、`:55` `npm run preview`（预览构建）/ `npm run corpus`（重建本地趣味语料），**5/5 覆盖且语义一致**；`verify-deals.mjs:5` `Number.parseInt(process.argv[2] ?? '1000', 10) \|\| 1000` 印证默认参数 |
| F2 | 「唯一对外入口是根 `index.html` + `assets/`」与 `sync.mjs` / `vite.config.ts` / `index.html` 一致 | **PASS** | 根 `index.html:8-9` 引用 `./assets/index-CYdyF3RC.js` / `./assets/index-CW7HbVi-.css`，两文件均 `EXISTS`；`frontend/index.html:11` 引用 `/src/main.ts`（开发入口，不对外）；`vite.config.ts` `base:'./'`、`outDir:'dist'`、`assetsDir:'assets'`；`AGENTS.md §1` 明确「唯一对外入口」 |
| F3 | `npm run build = vite build && node sync.mjs` | **PASS** | `package.json:8` 逐字一致；`sync.mjs` 实测逻辑：`cpSync(distIndex, root/index.html)` + `rmSync(rootAssets)` + `cpSync(dist/assets, rootAssets)`；`README.md:62/67` 描述一致 |
| F4 | 「只改 `src` 不 build 对外不变」 | **PASS** | `AGENTS.md §1`「只改 `frontend/src/` 而不 build，对外页面不会变化」；根产物仅由 build 刷新。本轮根 `index.html` / `assets/*` mtime 仍为 **16:18**，而 README 为 17:15 → 确未重跑 build |
| F5 | 「Node 22+」 | **PASS** | `AGENTS.md:44`「**必须 Node 22+**…不需要额外安装 tsx / ts-node / vitest」；`verify-deals.mjs:3` 直接 `import { verifyDeals } from '../src/diagnostics.ts'` 依赖 Node 22 原生 type-stripping；本机 `node --version` = `v22.22.2` |
| F6 | 玩法 7 条与 `game.ts` 一致 | **PASS** | `L73`↔`createDeck()`（52 张、A=1…K=13）；`L74`↔`isPair()`(`a.value+b.value===13`) + `selectOrMatch():167` K 单消；`L75`↔7 层 28 塔 + 24 手牌（`game.ts:79-91`、`deal.ts:1`）；`L76`↔`isExposed():102-113`（下一层相邻两张都消除才露出、r=6 恒露出）+ `isPlayable()` + `selectOrMatch():162` blocked 判定排在 K 单消之前 ⇒ **被压住的 K 不可选中/不可单消**；`L77`↔`drawOne():192-199` 一次一张、常驻 `waste`、不回收；`L78`↔`selectOrMatch()` `'shake'` + `App.vue:164-166`；`L79`↔`evaluate():201-206` `cleared`/`stuck`（`stock.length===0 && !hasAvailableMove()`）+ `ResultModal.vue:25`「这局不算，重摆一局」；`L81`「必要非充分条件」↔ PRD §2.2.1 L42 |
| F7 | FAQ 6 问答案与 `App.vue`（localStorage 话题记忆 / 提示只高亮不代消 / 8s 清除）、`game.ts`（死局判定）、`evaluate()` 一致 | **PASS** | `L89` 换设备↔`App.vue:63` `localStorage.getItem('pyramid-topic')`、`:215` `setItem`、`:62-67` try/catch 静默回落 mood；`L90` 提示不代消↔`App.vue:133-142` 只写 `hintIds/hintStock/hintText`、`window.setTimeout(() => clearHint(), 8000)`（**8 秒**）、`clearHint()` 在有效操作/开弹窗/重开局时触发（`:110/:150/:181/:105`）；`L91` 死局↔`evaluate()` stuck + `ResultModal.vue:25/47`「再摆一局」；`L87/L88/L92` 与 `readings.ts`、`AGENTS.md §1` 一致。FAQ 共 **6 问**（`L87-92`） |
| F8 | 第 36 行「前 3 档有保解走法不会推荐 4~5 档；第 6 档翻牌只在前 5 档都无保解走法且手牌未空时提示」与 PRD §3.2 / `hint.ts` 一致 | **PASS** | 档序 `塔+塔 > 塔+明牌 > 塔 K 单消 > 明牌+明牌 > 明牌 K 单消 > 翻一张手牌` ↔ `hint.ts:37-43,53-92` tier 1~6 ↔ PRD §3.2 `L106-111`，三者完全一致；「前 3 档有保解走法 → 不推荐 **4~5 档**（明牌区内部组合）」↔ PRD `L115`「只要 1~3 档存在可用走法，不得推荐 4~5 档」+ `hint.ts:159-183` 逐档严格短路 + `isSolvable(after,{goal:'pyramid'})` 硬校验（P0-3 保解）；「第 6 档只在前 5 档都无保解、且手牌未翻完时提示」↔ `hint.ts:86` `if (s.stock.length > 0)` + 短路至 tier 6 + PRD `L111/L133/§9 Q9`。**「4~5 档」口径与旧版 README（原句）、PRD、hint.ts 一致**，修正到位 |

---

## 7. 对标方案落实度（4 项）

| # | 检查项 | 结论 | 证据 |
| --- | --- | --- | --- |
| G1 | 与 benchmark §5 的 12 个章节逐项对照：全部覆盖且顺序合理 | **PASS** | README 12 个 `##` 与 §5 `L239-250` 一一对应且同序：① 免责声明 L11 ② 目录 L19 ③ 功能亮点 L25 ④ 界面预览 L38 ⑤ 快速开始 L47 ⑥ 玩法规则 L69 ⑦ 常见问题 L83 ⑧ 验证与质量 L94 ⑨ 项目结构与文档 L100 ⑩ 已知问题 L117 ⑪ 线上版本 L126 ⑫ 许可·维护·反馈 L132。头部 Hero 区亦与 §5 `L238` 一致：`L1` H1 → `L3` 一句话（含「仅休闲娱乐」「打开页面就能玩」）→ `L5` 纯文本标签行 → `L7` Hero 图 → `L9` 图注 |
| G2 | §4.0 判「不适用」的项确实没加 | **PASS** | 无 Sponsors / Donations / 贡献者头像墙 / 应用商店链接 / Deploy button / Code of Conduct / Roadmap / Packages 表；无独立 `CONTRIBUTING.md`、多语言 README、`CHANGELOG.md`；README 内不展开架构（仅相对链接）；未用 shields.io badge；显式 TOC 存在而非依赖 Outline；「README 越长越好」未采纳（170 → 137 行） |
| G3 | §6 的 4 张截图按清单落位 | **PASS** | `01` 作 Hero（`L7`，位于免责声明 `L11` 之前）；`02/03/04` 在「界面预览」（`L40/L42/L44`）；4 张均配 `alt` + 独立一行图注（`L9/L41/L43/L45`）；文件名为英文小写连字符 + 两位序号；`04` 用 `width="375"` 以逻辑宽度展示移动端 |
| G4 | 篇幅在建议区间附近（约 125~145 行）且不牺牲信息 | **PASS** | `wc -l README.md` = **137**；较旧版 170 行瘦身 33 行，同时新增 Hero 图 / TOC / 界面预览 / 6 问 FAQ / 许可章；7 条规则、必要非充分条件说明、验收结论、`docs/qa-v3-delivery-check.md` 与 `architecture-v3.md` 链接、文档索引 7 条、TS2307 已知问题（`<details>` 折叠 `L119-124`）、线上版本护栏句（`L130`，与旧版逐字一致）**全部保留**；内部采样数字 `avgCreateMs` / `maxHintMs` 已按 §5 §8 删除（命中 0） |

---

## 8. 提交范围预检（只读，2 项）

| # | 检查项 | 结论 | 证据 |
| --- | --- | --- | --- |
| H1 | `git status --short` 显示 `M README.md`、`?? docs/readme-benchmark.md`、`?? docs/screenshots/`、以及 QA 报告本身 | **PASS** | 写报告前：` M README.md` / `?? docs/readme-benchmark.md` / `?? docs/screenshots/`（3 条，与预期一致）。写报告后复核见 §9「写报告后 git status 复核」。全程**未执行 `git add`**；`git diff --stat README.md` = `86 insertions(+), 119 deletions(-)`（为工程师重写的既有差异，非本轮改动） |
| H2 | `.gitignore` 未误伤 `docs/screenshots/*.png`；`node_modules/`、`frontend/dist/` 仍被忽略 | **PASS** | `git check-ignore -v` 对 4 张 PNG 全部返回 `rc=1` 且无输出 = **未被忽略**；`.gitignore` 全文无 PNG / `docs/screenshots` 规则（仅有 `node_modules/` L14、`frontend/dist/` L17、`.DS_Store` L20、`*.log` L23、`.workbuddy/` L26、`.wbapp_*.genie` L29）；`frontend/node_modules/ → .gitignore:14`、`frontend/dist/ → .gitignore:17` 均 `rc=0`（仍忽略）；`git ls-files` 确认 `README.md` / `index.html` / `assets/*` 已跟踪 |

---

## 9. 观察项（均判 PASS，非 FAIL）与命令执行说明

1. **`sharecode` 字面词**：`README.md:130` 含「**不写入任何带 sharecode 的分享链接，也不含任何密钥**」。该句与 `git show HEAD:README.md` 末段**逐字一致**，且 benchmark §8 Q7 / §3 差距 13 / `AGENTS.md §4.10` L130 均判定「护栏一句不删」。全文无 sharecode 值或分享 URL，故 D5 判 PASS；若删此句反而违反护栏。
2. **唯一 http 字面量**：`README.md:51` 的 `http://127.0.0.1:8899/index.html` 是本地回环静态服务器命令示例（`python3 -m http.server 8899`），非外链图床 / 徽章 / 已发布分享链接，且同句已说明 `file://` 会被 ES module CORS 拦截，事实正确 → A6 / C3 / D1 判 PASS。
3. **01「无高亮」判定**：01/02/03/04 四张图中，金字塔底行 7 张牌均带**蓝色描边**，这是 `完全露出 / 可选` 的默认卡面样式（明牌区 0 张、无选中牌时同样存在）；02 中 3♥、10♦ 的**琥珀/橙色描边**才是「提示高亮」。因此 01 无提示高亮，B1 判 PASS。
4. **文档索引收录 `docs/readme-benchmark.md`**：benchmark §8 Q10 默认「不列」，但同格明确允许「如主理人希望公开透明，可在 §9 文档索引末尾加一行」。该链接有效、文件存在、非过度工程化内容 → G2 判 PASS，仅记录。
5. **篇幅**：benchmark §5 目标约 128 行 / 125~135 行，实际 137 行；落在主理人本轮给定的 **125~145 行**区间内，与 12 章节全覆盖不冲突 → G4 判 PASS。
6. **Hero 与 FAQ 的分工**：Hero 一句话（L3）只带「仅休闲娱乐」，其余三项由紧随其后的免责声明块（L15-16）与 FAQ（L87-88）承担。这正符合 benchmark §4.5 L226 的设计「Hero 带定位 + FAQ 再次明确」，且主免责句与 3 条 bullet 逐字保留 → E2/E3 判 PASS。

**命令失败如实记录**：本机 shell `grep` 为 `toybox 0.8.13` shim（`/Applications/WorkBuddy.app/.../brokered-bin/grep`），不支持 BRE 的 `\|` 交替，以下组合查询返回空输出或退出码 1：`grep -n "3.2\|保解\|档..." docs/prd-v3-incremental.md`、`grep -n "sharecode\|密钥\|公开仓库" README.md`、`grep -n "^## " AGENTS.md`、`grep -n "4\.9\|4\.10..." AGENTS.md`。这些结果**未被当作 PASS**；已全部改用 Python 正则（`re`）与专用 Grep 工具复核并取得上表中的行号证据，结论不受影响。其余命令（Python 校验、`file`、`wc -l`、`git status/show/check-ignore/ls-files`、`node --version`、ViewImage）均正常返回。

**写报告后 git status 复核**：见本报告末尾「附：复核记录」。

---

## 10. 路由判定

```
ROUTE: NoOne
```

- **理由**：36/36 PASS、0 FAIL。所有断言（PRD §3.2 / benchmark §4~§6 / `AGENTS.md` 红线 / 源码事实）得到的实际输出均正确，不存在「期望正确但实现错误」→ 不回 Engineer；核对口径本身也无误 → 不需 QA 自修；无遗留问题需列入 Known Issues。
- **本轮未做任何改动**：未改 `README.md`、未改 4 张截图、未改源码，未 `git add` / `commit` / `push` / 发布，未重跑 `npm run build`。
- **精确修正建议文本**：无。本轮 0 FAIL，无需提供修正建议；若主理人后续希望调整上述 6 条观察项，属可选优化而非缺陷修复。

---

## 附：复核记录

写报告后再次执行 `git status --short`（只读），输出恰为预期的 4 条：

```text
 M README.md
?? docs/qa-readme-review.md
?? docs/readme-benchmark.md
?? docs/screenshots/
```

- `docs/qa-readme-review.md` 已落盘（159 行），是本轮**唯一新建文件**。
- 复核 `git check-ignore -v docs/screenshots/01-first-screen.png` → `rc=1`（无输出，未被忽略）。
- 未执行 `git add`；`M README.md` 仅为工程师本轮重写的既有差异（`git diff --stat`：86 insertions / 119 deletions）。
- 未执行 `npm run build` / `npm run verify` / 发布；根 `index.html` 与 `assets/*` mtime 仍为 16:18。

**最终结论：36 PASS / 0 FAIL，ROUTE: NoOne。**
