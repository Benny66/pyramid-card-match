# README 业内对标调研与改写方案

> **文档类型**：研究模式产出（对标调研 + 可直接指导改写的改进方案）
> **作者**：许清楚（产品经理）　**语言**：简体中文　**状态**：可交付工程师执行
> **调研方式**：WebSearch / WebFetch 实时抓取公开页面，逐条核对页面实际内容，未凭印象推断
> **输入材料**：`README.md`（170 行，已通读）、`AGENTS.md`（已通读）、`docs/prd-v3-incremental.md`（已通读）、`docs/architecture-v3.md`（§0/§1 已读）、`docs/` 目录文件清单（已核验）
>
> **本文边界（重要）**：本文**只做调研与方案**，不修改 `README.md`、不修改任何源码、不创建截图、不执行 git / 构建 / 发布。README 改写与截图生成由工程师按 §5、§6 执行。
>
> **不可触碰的约束（复述，改写全程有效）**：
> 1. README **不写死带 sharecode 的分享链接、不写任何密钥**（`AGENTS.md` §4.10、README 第 170 行）；
> 2. **免责声明与「仅休闲娱乐」定位不可弱化**（文案 N6 红线，`AGENTS.md` §3）；
> 3. 根 `index.html` + 根 `assets/` 是**唯一对外入口**，禁止手改根产物（`AGENTS.md` §1）；
> 4. 纯前端、**零后端 / 零网络请求 / 零大模型调用**（README 第 5、14 行）。

---

## 0. 调研方法与证据源

### 0.1 方法

1. 先通读项目现状，确定「本项目有什么、缺什么」的事实基线；
2. 按「官方规范 / 前端项目实例 / 同类小游戏实例 / 最佳实践与模板」四类组合 7 个参考对象，逐一 WebFetch 抓取**原始页面或 raw README**；
3. 逐对象记录「实际具备的要素（打勾）」与「值得借鉴的点」；
4. 归纳出 17 项业内常见要素（E01~E17），横向对比，再结合本项目实际做适用性裁剪，避免照搬大项目模板造成过度工程化。

### 0.2 证据源表（本文所有 `[Rn]` / `[S1]` 引用均指向此表）

| 编号 | 类型 | 来源名称 | 可访问 URL |
| --- | --- | --- | --- |
| R1 | 官方规范 | GitHub Docs — *About the repository README file* | https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes |
| R2 | 前端项目实例 | Vue（`vuejs/core`）README | https://raw.githubusercontent.com/vuejs/core/main/README.md |
| R3 | 前端项目实例 | Vite README | https://raw.githubusercontent.com/vitejs/vite/main/README.md |
| R4 | 前端项目实例 | React（`facebook/react`）README | https://raw.githubusercontent.com/facebook/react/main/README.md |
| R5 | **同类对标**（单页网页小游戏） | 2048 README | https://raw.githubusercontent.com/gabrielecirulli/2048/master/README.md |
| R6 | 最佳实践 / 模板 | Make a README | https://www.makeareadme.com/ |
| R7 | 最佳实践 / 精选清单 | Awesome README | https://github.com/matiassingers/awesome-readme |
| S1 | 补充证据（徽章机制） | Shields.io 首页（Static Badges / Dynamic Badges） | https://shields.io/ |

**本项目现状证据**：本地 `README.md`（170 行，行号见 §3、§7）、`AGENTS.md`、`docs/` 目录。已核验事实：`docs/` 下现有 6 个文件（`prd-v3-incremental.md`、`architecture-v3.md`、`class-diagram.mermaid`、`sequence-diagram.mermaid`、`qa-v3-delivery-check.md`，以及本文）；仓库根**无** `LICENSE*`、`CONTRIBUTING*`、`.github/`、其他 README、`docs/screenshots/`，README 全文**无任何图片引用**。

### 0.3 要素编号（§1、§2 通用）

| 编号 | 要素 | 编号 | 要素 |
| --- | --- | --- | --- |
| E01 | Hero 区 / 一句话价值主张 | E10 | 目录结构 |
| E02 | Badge 徽章 | E11 | 文档索引 |
| E03 | 目录 TOC / 导航 | E12 | FAQ / 求助支持 |
| E04 | 截图 / GIF / 视觉演示 | E13 | 贡献指南 |
| E05 | 功能亮点（前置特性列表） | E14 | License 许可 |
| E06 | 快速开始 / 安装 / 试玩入口 | E15 | 致谢 |
| E07 | 规则 / 用法 / 示例 | E16 | 版本 / 更新日志 |
| E08 | 架构或原理 | E17 | 语言切换（多语言 README） |
| E09 | 测试与验证 | | |

---

## 1. 参考对象逐个体检

> **读表说明**：R1 / R6 / R7 是**规范性文档或精选清单**，其 ✅ 表示「明确推荐 / 支持该要素」，❌ 表示「未提及」，**不代表该页面自身是否含有截图**；R2~R5 是**真实 README 实例**，✅ 表示「实际具备」。

| 编号 | 来源 + URL | 实际具备的要素（逐条打勾） | 值得借鉴的点（对本项目） |
| --- | --- | --- | --- |
| **R1** | GitHub 官方 *About READMEs*<br>https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes | ✅ E01（"what the project does / why the project is useful"）<br>✅ E03（渲染页自动生成 Outline 目录）<br>➖ E04（规定可用**相对图片路径**，未主张必须有截图）<br>✅ E06（"how users can get started"）<br>✅ E11（"Longer documentation is best suited for wikis"）<br>✅ E12（"where users can get help"）<br>✅ E13 / ✅ E14 / ✅ E15（README 与 license、citation、contribution guidelines、code of conduct 并列；"who maintains and contributes"）<br>❌ E02 / E05 / E07 / E09 / E10 / E16 / E17 | ① **README 只放「上手与贡献必要信息」，长文档拆到独立文档** → 本项目已有 `docs/`，应把 PRD / 架构 / QA 细节留在 `docs/`，README 做导航+摘要；② 官方原句 **"Relative links are easier for users who clone your repository. Absolute links may not work in clones"** → **截图必须用仓库内相对路径，不能用外部图床**（§4 截图专题的核心依据）；③ 明确把 license / 贡献指南列为「传达项目预期」的配套文件 → 但需按 §4 做适用性裁剪。 |
| **R2** | Vue `vuejs/core`<br>https://raw.githubusercontent.com/vuejs/core/main/README.md | ✅ E02（3 个 badge：npm 版本 / CI build status / npm 下载量）<br>➖ E06（Getting Started 仅一句 "follow the documentation at vuejs.org"，无命令）<br>✅ E11（文档 / 论坛 / 社区 / issue helper 大量链接）<br>➖ E12（Questions 节 = 求助去哪，非 FAQ）<br>✅ E13（Contribution → `.github/contributing.md`）<br>✅ E14（MIT）<br>✅ E15（Sponsors + "Thank you to all the people who already contributed"）<br>➖ E01（无一句话 tagline）<br>❌ E03 / E04 / E05 / E07 / E08 / E09 / E10 / E16 / E17 | ① **CI badge 有真实来源**：`build status` 指向 `github.com/vuejs/core/actions/workflows/ci.yml/badge.svg` → 反证「没有 CI 就绝不能写 build passing」；② 库类项目 README 可以极短（约 40 行），把重心放在「去哪看文档 / 去哪求助 / 谁维护」→ README 不必什么都塞；③ Sponsors 图片属大型社区项目玩法，本项目不适用。 |
| **R3** | Vite<br>https://raw.githubusercontent.com/vitejs/vite/main/README.md | ✅ E01（`> Next Generation Frontend Tooling`）<br>✅ E02（4 个 badge：npm 版本 / Node 版本 / CI / Discord）<br>✅ E05（**6 条 emoji 功能亮点紧接标题前置**：Instant Server Start / Lightning Fast HMR …）<br>✅ E13（`See [Contributing Guide](CONTRIBUTING.md)` 相对链接）<br>✅ E14（`[MIT](LICENSE)` **相对链接指向仓库内文件**）<br>✅ E15（Sponsors）<br>✅ E16（Packages 表 "Version (click for changelogs)" → `packages/*/CHANGELOG.md`）<br>➖ E04（居中 Logo 作 Hero，`<picture>` 适配深浅色，**非界面截图**）<br>➖ E06 / ➖ E08<br>✅ E11<br>❌ E03 / E07 / E09 / E10 / E12 / E17 | ① **首屏结构最值得抄**：`居中 Logo → badge 行 → H1 + 一句话 tagline → 功能亮点列表 → 简短"是什么" → Read the Docs`；② 证明「**功能亮点应紧贴标题前置**」，而本项目把亮点压到第 35 行；③ **License / Contributing 用相对路径指向仓库内真实文件** → 本项目无 LICENSE 文件，故不能照抄（§4 License 专题）；④ Hero 图可以是 Logo 而非截图，但**游戏类项目用真实界面更直观**。 |
| **R4** | React `facebook/react`<br>https://raw.githubusercontent.com/facebook/react/main/README.md | ✅ E01（"React is a JavaScript library for building user interfaces."）<br>✅ E02（5 个 badge：license / npm 版本 / CI×2 / **`PRs welcome` 静态 badge**）<br>✅ E05（Declarative / Component-Based / Learn Once 三条加粗亮点）<br>✅ E06（Installation）<br>✅ E07（Examples 含可运行 JSX 代码块）<br>✅ E11（Documentation 节列 10+ 文档链接）<br>✅ E13（Contributing + Code of Conduct + Good First Issues）<br>✅ E14（`MIT licensed` → `./LICENSE` 相对路径）<br>➖ E12 / ➖ E15<br>❌ E03 / E04 / E08 / E09 / E10 / E16 / E17 | ① **`PRs welcome` 是 shields.io 纯静态文字徽章，不依赖任何 CI / 状态服务** → 证明「无 CI 也能有真实、不撒谎的徽章」（§4 badge 专题的关键证据）；② License 用 `./LICENSE` 相对路径；③ Code of Conduct / Good First Issues 属大型社区配置，本项目不适用。 |
| **R5** | **2048（同类：单页网页小游戏）**<br>https://raw.githubusercontent.com/gabrielecirulli/2048/master/README.md | ✅ E01（"A small clone of 1024… **Made just for fun.** [Play it here!]"）<br>✅ E04（独立 `### Screenshot` 节，居中 `<img>`）<br>✅ E06（在线试玩链接，网页游戏的最简快速开始）<br>✅ E13（Contributing + 独立 `CONTRIBUTING.md`）<br>✅ E14（MIT + `LICENSE.txt`）<br>✅ E15（Contributions 节逐一点名维护者与贡献者）<br>❌ E02 / E03 / E05 / E07 / E08 / E09 / E10 / E11 / E12 / E16 / E17 | ① **最贴近本项目的对标**：同类休闲网页小游戏，README 极简（约 35 行），把「**Made just for fun + 立刻能玩的入口**」放在最前 → 与本项目「仅休闲娱乐 + 打开页面就能玩」的定位高度同构，证明「休闲游戏 README 不需要长篇架构/验证数据」；② **反面教材（务必避免）**：其截图用了外部图床 `cloud.githubusercontent.com/...png`，且作者原句 **"That screenshot is fake, by the way. I never reached 2048 :smile:"** → 本项目约束「真实截取 / 仓库内 / 相对路径 / 不伪造」正是针对这类做法；③ 致谢与维护者信息对单人项目也不算重，可轻量借鉴。 |
| **R6** | Make a README<br>https://www.makeareadme.com/ | ✅ E01（Name + Description，可含 Features / Background / 差异化）<br>✅ E02（Badges 节，明确推荐 Shields.io）<br>✅ E04（**Visuals 节**："include screenshots or even a video (you'll frequently see GIFs)"）<br>✅ E05 / ✅ E06（Installation + **Requirements 子节**）/ ✅ E07（Usage："use examples liberally"）<br>✅ E09（Contributing 里建议写明 lint / run tests 命令）<br>✅ E11（More Documentation：wiki / 文档站）<br>✅ E12（Support + FAQ）/ ✅ E13 / ✅ E14 / ✅ E15（Authors and acknowledgment）/ ✅ E16（Roadmap + Changelog）<br>➖ E03 / ➖ E08 / ✅ E10（未单列）<br>❌ E17 | ① 原文 **"Every project is different, so consider which of these sections apply to yours."** 与 "Not all of the suggestions here will make sense for every project" → **§4「适用性判断、避免过度堆砌」的直接依据**；② **Project status** 建议：「若项目精力不足，在 README 顶部注明维护状态」→ 支撑本项目加「个人业余项目、维护状态」；③ 明确 Visuals 与 Requirements 子节 → 支撑「截图」与「Node 22+ 环境要求」两处；④ 同时提醒 "too long is better than too short" 但又说太长就拆到独立文档，与 R1 并不矛盾，结论都是「拆」。 |
| **R7** | Awesome README<br>https://github.com/matiassingers/awesome-readme | ✅ E01 / ✅ E02 / ✅ E03 / ✅ E04 / ✅ E05 / ✅ E06 / ✅ E07 / ✅ E08 / ✅ E10 / ✅ E11 / ✅ E12 / ✅ E13 / ✅ E14 / ✅ E15 / ✅ E16<br>➖ E09<br>❌ E17 | ① 原文 **"Elements in beautiful READMEs include, but are not limited to: images, screenshots, GIFs, text formatting, etc."** 与 **"Embedding an animated gif in your README quickly demonstrates what your project does and catches the reader's eye."** → 用户「至少要有截图」的诉求在业内是共识；② 反复出现 **`selected badges that only show relevant information`、`useful badges`、`concise ToC`、`A clearly structured readme…without getting lost in unnecessary details`** → **清单并不主张「越多越好」**，正好支撑 §4 裁剪；③ 明确「架构文档也可以成为 README 的一个 dedicated section」，但同时把架构图/源码地图列为独立 `ARCHITECTURE.md` 范例 → 本项目已有 `docs/architecture-v3.md`，README 只需链接；④ 大量范例强调 Demo screenshot / GIF Demo / TOC / Back to top。 |

---

## 2. 对比矩阵

> 列 = 7 个参考对象 + 本项目现状；行 = 17 项业内常见要素。
> 图例：**✅** 明确具备 / 明确推荐　**➖** 部分具备、弱化或视角不对　**❌** 缺失 / 未提及。
> **证据 URL**：各列对应 §0.2 证据源表 `[R1]`~`[R7]`；本项目列对应本地 `README.md` 行号（§3、§7）；关键单元格脚注见 2.2。

### 2.1 矩阵

| 要素 | R1 官方 | R2 Vue | R3 Vite | R4 React | R5 2048 | R6 MAR | R7 Awesome | **本项目现状** |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| E01 Hero / 一句话价值 | ✅ | ➖ | ✅ | ✅ | ✅ | ✅ | ✅ | **✅** [a] |
| E02 Badge | ❌ | ✅ | ✅ | ✅ [d] | ❌ | ✅ | ✅ | **❌** |
| E03 目录 TOC | ✅ | ❌ | ❌ | ❌ | ❌ | ➖ | ✅ | **❌** |
| E04 截图 / GIF | ➖ [h] | ❌ [b] | ➖ [c] | ❌ | ✅ [e] | ✅ | ✅ | **❌ [f]** ★ |
| E05 功能亮点（前置） | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | **➖** [g] |
| E06 快速开始 / 试玩 | ✅ | ➖ | ➖ | ✅ | ✅ | ✅ | ✅ | **✅** |
| E07 规则 / 用法 | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | **✅** |
| E08 架构 / 原理 | ➖ | ❌ | ➖ | ❌ | ❌ | ➖ | ✅ | **➖** |
| E09 测试与验证 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ➖ | **✅** |
| E10 目录结构 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | **✅** |
| E11 文档索引 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | **✅** |
| E12 FAQ / 支持 | ✅ | ➖ | ❌ | ➖ | ❌ | ✅ | ✅ | **❌** |
| E13 贡献指南 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **❌** |
| E14 License | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **❌** [i] |
| E15 致谢 | ✅ | ✅ | ✅ | ➖ | ✅ | ✅ | ✅ | **❌** |
| E16 版本 / 更新日志 | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | **➖** [g] |
| E17 语言切换 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **❌** |

### 2.2 关键单元格脚注（含证据 URL）

- **[a]** 本项目 E01 ✅ 指「有一句话定位」（`README.md:3`）与技术栈行（`:5`）；**但位置权重不专业**：价值主张之后紧接 `## 免责声明`（`:9`）、`## 玩法规则`（`:19`），直到 `:35` 才出现亮点、`:49` 才出现快速开始。R3 Vite、R4 React 均把 tagline + 亮点放在**标题正下方**（https://raw.githubusercontent.com/vitejs/vite/main/README.md 、https://raw.githubusercontent.com/facebook/react/main/README.md）。见 §3 差距 3。
- **[b]** R2 Vue 仅有 Sponsors / 赞助商图片，无产品界面截图（https://raw.githubusercontent.com/vuejs/core/main/README.md）。
- **[c]** R3 Vite 首屏是居中 Logo（`<picture>` 深浅色适配），**不是界面截图**（https://raw.githubusercontent.com/vitejs/vite/main/README.md）。借鉴点：Hero 图形式可灵活，但对游戏项目，真实界面比 Logo 更能一眼说明「这是什么」。
- **[d]** R4 React 的 `PRs welcome` 徽章为 `img.shields.io/badge/PRs-welcome-brightgreen.svg` 纯静态文字，**不依赖 CI/状态服务**（https://raw.githubusercontent.com/facebook/react/main/README.md）；R2/R3 的 `build status` 则是真实指向 `actions/workflows/ci.yml/badge.svg` 的 CI 徽章 → 见 §4.1。
- **[e]** R5 2048 的截图使用外部图床 `cloud.githubusercontent.com`，且作者自承 **"That screenshot is fake, by the way."**（https://raw.githubusercontent.com/gabrielecirulli/2048/master/README.md）→ **反面教材**，本项目严禁。
- **[f]** 本项目 `README.md` 全文 170 行**无任何 `![]()` 图片引用**，`docs/` 下无 `screenshots/`（已核验）→ 用户「至少要有截图」的诉求当前 100% 未满足，是**最高优先级差距**。
- **[g]** 本项目 E05 / E16 均为 ➖：`## V3 新特性（本次改动）`（`:35`）**内容其实是产品亮点，但用「本次改动 / V3」的 changelog 口吻写给已经了解项目的人**，对首次访客不友好，也并非规范的版本日志。见 §3 差距 9、§4.4。
- **[h]** R1 官方未主张「必须有截图」，但明确规范了**相对图片路径**：原句 "Relative links are easier for users who clone your repository. Absolute links may not work in clones of your repository - we recommend using relative links"（https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes#relative-links-and-image-paths-in-markdown-files）。
- **[i]** 本项目 E14 ❌：仓库根**无 LICENSE 文件**、`README.md` 全文**未提许可**（已核验）。R2/R3/R4/R5 的 `[MIT](LICENSE)` / `[MIT](./LICENSE)` / `LICENSE.txt` 都指向**真实存在的文件**，本项目不得照抄 → 见 §4.2。
- **补充**：7 个参考对象中 **E17 语言切换全为 ❌**，没有任何一个把多语言 README 列为常见/必需要素 → 见 §4.3。

---

## 3. 差距清单（按影响面排序）

> 排序依据：① 用户明确点名的诉求 → ② 首次访客 10 秒内能否看懂并能玩 → ③ 可信度与合规风险 → ④ 阅读负担 → ⑤ 锦上添花。

| # | 影响面 | 差距 | 现状证据 | 业内依据 | 建议动作（对应 §5/§6/§7） |
| --- | --- | --- | --- | --- | --- |
| 1 | **极高** | **截图 / Hero 图完全缺失**：用户原话「至少要有截图」，当前 0 张 | 全文无图片引用；`docs/` 无 `screenshots/` | R5 有独立 Screenshot 节；R6 Visuals；R7 "images, screenshots, GIFs"、"Demo screenshot"（[R5](https://raw.githubusercontent.com/gabrielecirulli/2048/master/README.md) / [R6](https://www.makeareadme.com/) / [R7](https://github.com/matiassingers/awesome-readme)） | 新增 4 张真实截图，1 张作头部 Hero，其余进「界面预览」；落盘 `docs/screenshots/`、相对路径引用（§6） |
| 2 | **高** | **价值主张与功能亮点不够前置**：一句话定位后立刻是免责声明 + 7 条规则表，亮点在 `:35`、快速开始在 `:49` | `README.md:3~49` | R3 Vite / R4 React 把 tagline + 亮点紧贴标题；R1 "what the project does / why it is useful" 排在首位（[R3](https://raw.githubusercontent.com/vitejs/vite/main/README.md) / [R4](https://raw.githubusercontent.com/facebook/react/main/README.md) / [R1](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)） | 重排首屏：Hero（标题+一句话+Hero 图+文本标签）→ 免责声明 → 目录 → 功能亮点 → 界面预览 → 快速开始。**免责声明一字不改、仍在文档前 1/4**（§4.5 Q3、§5） |
| 3 | **高** | **无目录 TOC / 导航**：170 行、13+ 个 `##` 章节却没有任何锚点目录 | `README.md` 全文 | R7 反复强调 `TOC for easy navigation` / `concise ToC` / `Back to top`；R1 亦提供 Outline 自动生成（[R7](https://github.com/matiassingers/awesome-readme) / [R1](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)） | 新增 TOC（锚点链接，10 行内），放在免责声明之后 |
| 4 | **高** | **无 License 说明**：仓库无 LICENSE 文件，README 全文不提许可；公开仓库 ≠ 已授权，是合规与可信度缺口 | 已核验无 `LICENSE*`；README 全文 | R1/R2/R3/R4/R5/R6/R7 **7/7 全部有 License 章节**（这是矩阵中唯一全 ✅ 的行）（[R1](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes) / [R4](https://raw.githubusercontent.com/facebook/react/main/README.md)） | 新增「许可 · 维护 · 反馈」章节，写明**尚未指定 License**，不虚构 MIT/Apache（§4.2） |
| 5 | **中高** | **验收数据堆在中部且过度内部化**：`structureOk=1000`、`avgCreateMs≈0.027ms`、`maxHintMs≈0.363ms` 等采样参数对普通访客是噪音 | `README.md:129~136` | R1 "A README should only contain information necessary for developers to get started… Longer documentation is best suited for wikis"；R7 "without getting lost in unnecessary details"（[R1](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes) / [R7](https://github.com/matiassingers/awesome-readme)） | 精简为 2~3 行结论 + 相对链接指向 `docs/qa-v3-delivery-check.md`，并下沉到靠后「验证与质量」章节 |
| 6 | **中高** | **目录结构树过长（约 50 行逐文件注释）**，喧宾夺主 | `README.md:71~125` | R7 `source code maps` 归 `ARCHITECTURE.md`；R2 Vue README 仅约 40 行（[R7](https://github.com/matiassingers/awesome-readme) / [R2](https://raw.githubusercontent.com/vuejs/core/main/README.md)） | 精简到 6~8 行关键路径（或 `<details>` 折叠），与「文档索引」合并为一章 |
| 7 | **中** | **「已知问题」排查说明过于内部化**：TS2307 报错栈、成因、绕行方案占 11 行，且位置靠后却语气很重 | `README.md:152~162` | R6 FAQ / Support；R7 FAQ 与折叠块（`Spoilers to reduce visual cluttering`）（[R6](https://www.makeareadme.com/) / [R7](https://github.com/matiassingers/awesome-readme)） | 保留诚实信息但压成 2~3 行并折叠 / 并入 FAQ，明确「不影响运行与交付」结论 |
| 8 | **中** | **「V3 新特性（本次改动）」是版本增量口吻，不是产品亮点** | `README.md:35~45` | R3/R4 的功能亮点是**常驻特性**而非「本次改了什么」（[R3](https://raw.githubusercontent.com/vitejs/vite/main/README.md) / [R4](https://raw.githubusercontent.com/facebook/react/main/README.md)） | 改写为「功能亮点 / 这个游戏特别在哪」，去掉「V3」「本次改动」字样，前置（§4.4） |
| 9 | **中** | **无 FAQ / 求助入口**：玩家最可能问的「会不会上传我输入的内容」「换设备话题还在吗」「是不是占卜/预测」散落在免责声明与线上版本里 | 全文无 FAQ 章节 | R1 "where users can get help"；R6 Support + FAQ；R7 FAQ（[R1](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes) / [R6](https://www.makeareadme.com/)） | 新增 4~6 问 FAQ，同时**强化「仅休闲娱乐 / 无预测占卜 / 不上传」**的定位（不弱化免责，反而扩散到 FAQ） |
| 10 | **中** | **文档索引漏列 QA 报告**：`docs/` 原有 5 个文件（不含本文），README 文档索引表格共 5 行却只有 4 行是 `docs/` 文件（另 1 行是 `AGENTS.md`），漏了 `qa-v3-delivery-check.md` | `README.md:140~148` 对照已核验的 `docs/` 清单 | R7 "Links to comprehensive documentation"（[R7](https://github.com/matiassingers/awesome-readme)） | 索引补齐 QA 报告（相对路径），并核对类图 / 时序图链接；是否收录本文见 §8 Q10 |
| 11 | **中** | **无维护状态 / 反馈入口 / 致谢**：访客不知道谁维护、是否还在更新、去哪反馈 | 全文无 | R1 "who maintains and contributes" + "where users can get help"；R6 **Project status**（建议顶部注明维护状态）；R2/R5 致谢（[R1](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes) / [R6](https://www.makeareadme.com/)） | 在末章写「个人业余项目 / 维护状态 + GitHub Issues 反馈入口 + 一行致谢 Vue·Vite」 |
| 12 | **低** | **无静态 badge / 技术栈标识行**：技术栈以纯文本写在第 5 行，缺少一眼可扫的标签 | `README.md:5` | R2/R3/R4 均有 badge；R4 证明静态文字徽章可行（[R4](https://raw.githubusercontent.com/facebook/react/main/README.md)） | **不建议外链 badge**，改用纯文本标签行（§4.1）；此项为观感优化，优先级最低 |
| 13 | **低** | **线上版本章节偏啰嗦**（`:166~170`），但**「不写 sharecode 链接 / 不含密钥」的护栏本身正确** | `README.md:166~170`、`AGENTS.md` §4.10 | — | 压缩为 2~3 行，**护栏一句不删**（合规要求，非可删项） |

> 说明：差距 12（badge）与「无多语言 README / 无 CHANGELOG / 无 CONTRIBUTING.md」**未列为高优先级缺口**，属**经适用性判断后判定为不适用或需改造**的项，见 §4，避免为了「对齐矩阵」而过度堆砌。

---

## 4. 适用性判断（重点：避免过度堆砌）

> 结论先行：**业内做法不能逐格照抄**。R6 明确 "Every project is different, so consider which of these sections apply to yours."，R7 反复强调 `selected badges that only show relevant information`（[R6](https://www.makeareadme.com/) / [R7](https://github.com/matiassingers/awesome-readme)）。本项目是**单人维护、公开仓库、纯前端、零网络、已交付的中文休闲小游戏**，不是持续发版的框架 / 库 / 社区项目。

### 4.0 逐条适用性总表

| 业内做法 | 判定 | 理由与落地 |
| --- | --- | --- |
| Hero 区 / 一句话价值主张 | ✅ **适用** | 保留并强化，最前置（R3/R4/R5 均如此） |
| **截图 / GIF** | ✅ **适用（强制）** | 用户点名诉求；但**只做静态 PNG、不做 GIF**（见 4.4） |
| 目录 TOC | ✅ **适用** | 170 行文档必需，10 行内 |
| 功能亮点前置 | ✅ **适用（需改造）** | 由「V3 新特性」改写为常驻亮点，去版本词 |
| 快速开始 / 试玩 | ✅ **适用** | 拆分「打开即玩」与「本地开发」两层 |
| 规则 / 用法 | ✅ **适用** | 7 条表保留、措辞精简 |
| 文档索引 | ✅ **适用** | 保留并补齐 QA 报告，全部相对路径 |
| FAQ | ✅ **适用（轻量）** | 4~6 问，顺带强化「仅休闲娱乐」定位 |
| 验证与质量 | ✅ **适用（需改造）** | 精简为结论 + 链接，下沉靠后 |
| 目录结构 | ✅ **适用（需改造）** | 精简 / 折叠，与文档索引合并 |
| 架构 / 原理 | ➖ **不适用（README 内不展开）** | 已有 `docs/architecture-v3.md` + 类图 / 时序图，README 只给相对链接（R1「长文档放 wiki」、R7「架构图归 ARCHITECTURE.md」） |
| **Badge** | ➖ **需严格改造** | 见 4.1 |
| **License** | ➖ **需严格改造** | 见 4.2 |
| **贡献指南 / 多语言 / 更新日志** | ❌ **不适用** | 见 4.3 |
| 致谢 / 维护状态 / Issues | ✅ **适用（极简）** | 合并为末章 3~5 行 |
| Sponsors / Donations / 贡献者头像墙 / 应用商店链接 / Deploy button / Code of Conduct / Roadmap / Packages 表 | ❌ **不适用** | R2/R3/R5 属大型社区或商业化项目、R4 属大厂社区、R3 Packages 表属 monorepo；与单人休闲游戏无关 |
| 自动生成的 Outline 目录 | ➖ **不替代显式 TOC** | R1 的 Outline 是 GitHub 侧边栏，仓库内 clone 后本地阅读无此功能；仍需显式 TOC |
| 「README 越长越好」（R6） | ❌ **不采纳** | 与 R1「README 只放上手必要信息、长文档拆出去」相冲突时，**以 R1 为准**：本项目已有 `docs/`，细节应拆出去 |

### 4.1 Badge 专题

**事实基线**：本项目**无 CI、无 npm 发包、无测试框架 UI、无 coverage 服务**（`README.md:51` 明确说明 `verify` 依赖 Node 22 原生 type-stripping，不装 vitest/tsx；`AGENTS.md` §2）。

| 类别 | 具体徽章 | 判定 | 依据 |
| --- | --- | --- | --- |
| **动态状态徽章** | `build passing`、CI status、coverage%、npm downloads、stars、last commit | ❌ **严禁** | R2 Vue / R3 Vite / R4 React 的 `build status` 都真实指向 `github.com/<org>/<repo>/actions/workflows/ci.yml/badge.svg`（[R2](https://raw.githubusercontent.com/vuejs/core/main/README.md) / [R3](https://raw.githubusercontent.com/vitejs/vite/main/README.md) / [R4](https://raw.githubusercontent.com/facebook/react/main/README.md)）。本项目没有任何这些数据源，**写了就是伪造状态**，比不写更伤可信度。 |
| **真实可核的静态徽章** | `Vue 3.5`、`Vite 6`、`TypeScript 5.7`、`Node 22+`（开发环境要求）、`纯前端 / 零后端`、`零网络请求`、`离线可玩`、`52 张牌 · 和为 13`、`简体中文` | ✅ **内容可用** | 全部可由 `README.md:5`、`:51`、`AGENTS.md` §1 与源码核实；R4 的 `PRs welcome` 证明 shields.io 静态文字徽章无需任何状态服务（[R4](https://raw.githubusercontent.com/facebook/react/main/README.md)）。 |

**是否建议用 shields.io 静态 badge？**

- 机制（[S1](https://shields.io/)）：静态徽章 URL 形如 `https://img.shields.io/badge/Vue-3.5-42b883`（官网示例 `https://img.shields.io/badge/any%20text-you%20like-blue`），GitHub 可正常渲染；但它是 **`img.shields.io` 外链图片**，渲染 README 时**必须发起一次网络请求**（官网另提供 "Host your own instance" 的 docker 镜像，反证默认走外部服务）。
- **与「离线 / 零网络」定位是否自相矛盾？分两层判断**：
  1. **事实层不矛盾**：游戏运行时零网络（`README.md:5`、`:14`、`AGENTS.md` §1）；badge 是 **GitHub 渲染 README 时**的请求，不发生在游戏里；clone 到本地后 badge 不显示也不影响离线打开根 `index.html` 玩游戏。
  2. **观感 / 品牌层有张力**：一个把「零网络请求」写进定位的项目，README 首屏却挂一排外链图片，容易被较真读者挑刺；且内网 / 离线 / 代理环境下会显示为破图。R1 官方亦明确「相对链接更利于 clone，绝对链接在 clone 中可能失效」（[R1](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes#relative-links-and-image-paths-in-markdown-files)）。
- **默认建议（结论）**：**不使用 shields.io，也不使用任何外链图床徽章**。改用**纯 Markdown 文本标签行**表达同一信息，零外链、离线可读、与定位完全一致，例如：

  ```markdown
  **Vue 3.5 · Vite 6 · TypeScript 5.7　|　纯前端 · 零后端 · 零网络请求 · 离线可玩　|　简体中文**
  ```

  放在 Hero 的一句话定位下方即可（对应 §5 头部）。
- **次选（若主理人坚持要徽章观感）**：最多 3 个 shields.io **静态**徽章、不含任何动态状态，并在 README 补一句「徽章仅为静态标签；游戏本身不发起任何网络请求」。**不推荐**，因为它为了满足观感而引入一条外链，与本项目最核心的卖点相冲。

### 4.2 License 专题

- **事实**：仓库根**无 `LICENSE` / `LICENSE.txt` / `COPYING` 等任何许可文件**，`README.md` 全文未提许可（已核验）。R1 把 README 与「repository license」并列为传达项目预期的配套文件（[R1](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)）；矩阵中 **E14 是 7/7 全 ✅ 的唯一一行**，说明这是业内最普遍的要素，必须回应。
- ❌ **严禁**：虚构 `MIT` / `Apache-2.0` / `GPL`；照抄 R3 的 `[MIT](LICENSE)` 或 R4 的 `[MIT](./LICENSE)`（[R3](https://raw.githubusercontent.com/vitejs/vite/main/README.md) / [R4](https://raw.githubusercontent.com/facebook/react/main/README.md)）——它们指向真实存在的文件，本项目照抄会 404 且构成不实陈述；也**不能写「暂无 License，可随意使用」**（公开可见 ≠ 已授予许可，这是常见法律误区）。
- ✅ **本次改写落地**：在末章「许可 · 维护 · 反馈」写明，建议文案：

  > **许可**：本仓库目前**尚未指定开源许可证**（仓库内未包含 `LICENSE` 文件）。代码虽公开可见，但不代表已授予使用、修改或再分发的许可；如有此类需求，请先通过 GitHub Issues 联系维护者。

- ✅ **更优解（列为建议，不属本次改写动作）**：建议维护者在 GitHub 上通过 `Add file → Create new file → LICENSE` 选定许可证（可用 R6 推荐的 https://choosealicense.com/），补上后再把 README 改成相对链接 `[MIT](LICENSE)`。**默认：本次改写先写「尚未指定」，同时把「是否补 LICENSE」列入 §8 待确认问题 Q1**，不阻塞改写。

### 4.3 贡献指南 / 多语言 README / 更新日志专题

| 项 | 判定 | 理由 |
| --- | --- | --- |
| **独立 `CONTRIBUTING.md` + Code of Conduct + Good First Issues + PR/Issue 模板** | ❌ **不做** | R4 React 那套服务于大型社区协作（[R4](https://raw.githubusercontent.com/facebook/react/main/README.md)）；本项目单人维护、无 CI、无测试框架，引入后是纯维护负担。R6 也只说「Just having a 'Contributing' section in your README is a good start」（[R6](https://www.makeareadme.com/)）。 |
| **轻量贡献 / 反馈入口** | ✅ **做（极简）** | 在末章写一句「发现规则或显示问题，欢迎在 GitHub Issues 反馈」+ 公开仓库的 Issues 相对/绝对链接即可，满足 R1「where users can get help」「who maintains and contributes」，零额外文件。 |
| **多语言 README（`README.en.md` / 语言切换）** | ❌ **不做** | ① 项目从 PRD（`Language: 简体中文`）、UI、话题、趣味解答语料到本文档全中文，目标用户明确；② 需持续双份同步，单人维护下极易漂移；③ **矩阵 E17 在 7 个参考对象中全是 ❌**，无一家把多语言列为常见/必需；④ R6「只选适用的章节」。若未来真有需求，另开议题评估。 |
| **独立 `CHANGELOG.md` / 「版本历史」章节 / Roadmap** | ❌ **不做** | R3 Packages 表链接 CHANGELOG、R6 建议 Changelog，都是给**持续发版的库 / 框架 / monorepo** 用的（[R3](https://raw.githubusercontent.com/vitejs/vite/main/README.md) / [R6](https://www.makeareadme.com/)）；本项目是已交付的单页游戏，版本演进交给 Git 提交历史即可。 |
| **「V3 新特性（本次改动）」现有章节** | ✅ **需改造** | 它是**披着「功能亮点」内容的 changelog 口吻**。去掉「V3」「本次改动」等版本词，改写成常驻的「功能亮点 / 这个游戏特别在哪」，放到目录之后第 1 章；真正的版本信息如需保留，压成末章一句话。详见 §5 第 3 章、§7。 |

### 4.4 截图专题（硬性约束）

| 约束 | 结论 | 依据 |
| --- | --- | --- |
| 必须**真实截取本地游戏界面** | ✅ 打开**根 `index.html`**（唯一对外入口）或 `npm run dev` 后截图；必须是当前真实界面，不得是设计稿 / mock / 手绘 | 用户诉求 + `AGENTS.md` §1 |
| 必须**落盘仓库内** `docs/screenshots/`，README 用**相对路径** `docs/screenshots/*.png` 引用 | ✅ | R1 官方「relative image paths」「Absolute links may not work in clones」（[R1](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes#relative-links-and-image-paths-in-markdown-files)）；且相对路径离线 / clone 后可正常显示，与零网络定位一致 |
| ❌ **外部图床 / 占位图 / AI 生成图 / 伪造界面** | **严禁** | R5 2048 用 `cloud.githubusercontent.com` 外链且作者自承 "That screenshot is fake"（[R5](https://raw.githubusercontent.com/gabrielecirulli/2048/master/README.md)）→ 直接反面教材；本项目主打「零网络」，README 首屏挂外链图床更显自相矛盾 |
| 截图内容**不得出现**带 sharecode 的分享链接 / 任何密钥 / 含本地绝对路径的敏感面板 | ✅ 只截游戏界面，不截含发布 URL 的浏览器地址栏；不截开发者工具 | `AGENTS.md` §4.10、README `:170` |
| 格式与命名 | PNG；英文小写连字符（如 `01-first-screen.png`）；每张配 `alt` + 一行图注 | R7 强调视觉素材应服务于理解；`AGENTS.md` §4.9 沿用浅色视觉、**不换肤**，截图不得为了好看改配色 |
| **是否做 GIF / 动图** | ❌ **本次不做** | R6 Visuals、R7 "Embedding an animated gif…" 都表述为「可以」而非「必须」（[R6](https://www.makeareadme.com/) / [R7](https://github.com/matiassingers/awesome-readme)）；录制/生成有成本、体积大、单人维护不划算，**3~5 张静态图足够** |

### 4.5 关于「免责声明不可弱化」的处理护栏

- 业内 R3/R4 把价值主张前置，并不意味本项目可删除或稀释免责声明。
- **默认方案**：免责声明**整段保留、文案一字不改**（N6 红线），仅从 `:9` 后移一格到 **Hero 之后、目录之前**，仍在文档前 1/4；同时在 Hero 的一句话定位里**就带上「仅休闲娱乐」**，并在新增 FAQ 中再次明确「无预测 / 占卜 / 决策建议、不上传输入、不调大模型」——**信息覆盖面反而扩大，不是弱化**。
- **保守备选**：若主理人判定「任何位移都算弱化」，则**免责声明位置完全不动**，只在其**之前**插入 Hero 区（标题 + 一句话 + Hero 图 + 文本标签行），即 Hero 成为新的最前内容、免责原封不动留在原处。两案都不删字、不改文案。见 §8 Q3。

---

## 5. 建议的 README 章节结构

> 目标：从现有 170 行**瘦身到约 125~135 行**，但把「一眼看懂 + 一眼看到界面 + 一键开始玩」的信息全部前置。
> **截图位置**：**头部 Hero 区放第 1 张**（标题 + 一句话定位之后、免责声明之前）；**§4「界面预览」放其余 3 张**。**共 4 张截图**（1 Hero + 3 预览，落在要求的 3~5 张区间内）。详见 §6。

| 序 | 章节名 | 放什么 | 预计篇幅 |
| --- | --- | --- | --- |
| — | **头部 Hero 区**（不编号） | ① H1 标题；② 一句话价值主张（含「仅休闲娱乐」「打开页面就能玩」）；③ **纯文本技术栈/定位标签行**（替代 badge，见 §4.1）；④ **★ Hero 截图 `01-first-screen.png` + 一行图注** | ~8 行 |
| 1 | **免责声明** | 现有 3 条 bullet **整段保留、文案一字不改**；仅排版为引用块。可加一句「详见「常见问题」」 | ~8 行 |
| 2 | **目录** | 锚点 TOC，链接到 §3~§11 | ~10 行 |
| 3 | **功能亮点 / 这个游戏特别在哪** | 由「V3 新特性」改写，去版本词：① 构造式可解发牌（每副牌保证有清空金字塔的走法）② 金字塔优先 6 档「提示」（只高亮不代消）③ 0 次点击直入游戏 ④ 说明全部弹窗化 ⑤ 375px 小屏适配 ⑥ 纯前端 / 零网络 / 离线可玩 | ~12 行 |
| 4 | **界面预览**（★ 截图组） | 其余 3 张截图 + 图注：`02-hint-highlight.png`、`03-modals.png`、`04-mobile-375.png` | ~15 行 |
| 5 | **快速开始** | 拆两层：**「立即试玩」**（打开页面即玩；线上入口说明，**不写 sharecode 链接**，见 §4.4）+ **「本地开发」**（Node 22+、`cd frontend && npm install` → `npm run dev` / `build` / `verify -- 1000`）。**必须保留**「唯一对外入口是根 `index.html` + `assets/`」「根产物由 `npm run build` 生成、勿手改」两条关键说明，但压缩为 2~3 行 | ~20 行 |
| 6 | **玩法规则** | 现有 7 条表保留、措辞精简；保留「清空金字塔是 52 张全消的必要非充分条件」那句 | ~15 行 |
| 7 | **常见问题** | 新增 4~6 问：是否占卜/预测、是否上传输入、话题记忆存哪、换设备还在吗、牌翻完没组合怎么办、为什么提示不自动消除。**顺带强化「仅休闲娱乐」定位** | ~12 行 |
| 8 | **验证与质量** | 由「验收数据」精简为 2~3 行结论（1000 副牌 100% 可解、按提示 20/20、构建通过）+ 相对链接 `docs/qa-v3-delivery-check.md`；**删除** `avgCreateMs` / `maxHintMs` 等内部采样 | ~6 行 |
| 9 | **项目结构与文档** | 合并原「目录结构」+「文档索引」：树精简到 6~8 行关键路径（或 `<details>` 折叠），文档索引**补齐漏列的 `docs/qa-v3-delivery-check.md`**、核对类图 / 时序图链接，全部相对路径 | ~18 行 |
| 10 | **已知问题** | 压成 2~3 行 + 折叠，保留「TS2307 既有问题、不影响运行与交付」结论 | ~4 行 |
| 11 | **线上版本** | 压缩为 2~3 行；**「不写带 sharecode 链接、不含任何密钥」护栏一句不删** | ~4 行 |
| 12 | **许可 · 维护 · 反馈**（新增合并章） | ① **尚未指定 License** 的声明（§4.2 文案）；② 维护状态「个人业余项目，随缘更新」；③ GitHub Issues 反馈入口；④ 一行致谢（Vue / Vite） | ~6 行 |

**合计约 128 行**（含空行与表格），较现状更短，但首屏信息密度与专业度显著提升。

---

## 6. 截图清单（工程师直接照做）

> 共 **4 张必做**（1 张 Hero + 3 张预览），PNG，全部落盘 `docs/screenshots/`，README 用相对路径引用。
> 表内「对应章节」对应 §5 的章节序号。

| # | 文件名 | 拍什么内容 | 建议视口 | 图注文案（建议） | 对应章节 | Hero？ |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `01-first-screen.png` | **桌面首屏金字塔全貌**：`phase='playing'` 默认话题「今日心情」、7 层 28 张塔牌、手牌堆 `[24]`、明牌区、精简 HUD（剩余/消除/用时 + 话题标签）、顶部「规则/话题/更多」与「提示/重新开局」按钮；画面干净、无弹窗、无高亮 | 1280×800（或 1440×900），DPR 2 | 「打开页面即进入游戏：7 层金字塔 + 手牌区，0 次点击即可开始消牌」 | 头部 Hero 区 | ★ **首选 Hero** |
| 2 | `02-hint-highlight.png` | **点击「提示」后的状态**：一对（或单张 K）卡片高亮描边 + 棋盘上方一行短文案（如「先消金字塔上的这两张」），体现「金字塔优先、只高亮不代消」 | 1280×800，DPR 2 | 「点『提示』：优先高亮金字塔上的可消组合，并给出一句话引导（只高亮，不自动消除）」 | §4 界面预览（亦可呼应 §3 亮点） | 次选 Hero |
| 3 | `03-modals.png` | **「规则」弹窗打开态**（或「话题」弹窗）：体现「说明全部弹窗化、首屏不堆长文」；弹窗内容完整可读、背景棋盘可见 | 1280×800，DPR 2 | 「规则 / 话题 / 免责等说明收进顶部弹窗，想看时点开、不看时不占屏幕」 | §4 界面预览 | 否 |
| 4 | `04-mobile-375.png` | **375px 移动端首屏**：完整棋盘、无页面级横向滚动 / 溢出（棋盘内部横向滚动区可保留），HUD 不溢出 | 375×812，DPR 2~3 | 「375px 小屏同样无页面级横向滚动，棋盘完整可见」 | §4 界面预览（佐证 §3 的 375px 适配亮点） | 否 |

**Hero 判定**：**建议用 `01-first-screen.png` 作 Hero** —— 信息最完整、一眼就能说明「这是个金字塔消牌游戏」，与 R5 2048 / R7 Demo screenshot 的做法一致。若主理人更想突出「智能提示」这一差异化卖点，可改用 `02-hint-highlight.png` 作 Hero，但首屏全貌对首次访客更稳妥。

**可选第 5 张（不强制，不得超过 5 张）**：`05-result-modal.png`（通关 / 死局结果弹窗 + 趣味解答打字机）。仅在时间充裕时补，默认不做。

### 6.1 通用拍摄规范（逐条遵守）

1. **来源真实**：从**根 `index.html`**（唯一对外入口）打开，或 `cd frontend && npm run dev` 后截图；截的是**当前真实界面**，不是设计稿、不是 mock、不是手绘。
2. **不改源码**：截图任务本身不修改 `frontend/src/**`、不改配色（沿用浅色视觉，`AGENTS.md` §4.9 不换肤）；如需构建，按 `AGENTS.md` §2 走 `npm run build` 让 `sync.mjs` 刷新根产物。
3. **不泄露**：不截含发布 URL 的浏览器地址栏（可能带 sharecode）、不截开发者工具 / 含密钥或本地绝对路径的面板。
4. **落盘与引用**：PNG → `docs/screenshots/`；README 用 `![图注](docs/screenshots/01-first-screen.png)` 相对路径，**不得用外部图床 / 占位图 / AI 生成图 / 伪造界面**（R5 2048 为反面教材，见 §4.4）。
5. **每张配 `alt` + 一行图注**；文件名英文小写连字符、两位序号前缀便于排序。
6. **不做 GIF**（§4.4），数量控制在 3~5 张。

---

## 7. 改写前后对照表

> 处理方式：**保留 / 前置 / 精简 / 合并 / 新增 / 删除 / 改写**。行号指现有 `README.md`（170 行）。

| 现有章节（行号） | 处理方式 | → 目标章节（§5） | 理由与依据 |
| --- | --- | --- | --- |
| 标题 + 一句话定位 + 技术栈（`:1~5`） | **保留 + 强化（前置）** | 头部 Hero 区 | 内容本身合规且准确；补 Hero 截图与文本标签行，形成完整首屏（R3/R4/R5 首屏结构） |
| `## 免责声明`（`:9~15`） | **保留（一字不改）+ 轻微后移一格** | §1 免责声明 | **N6 红线，不可弱化**；移到 Hero 之后、目录之前，仍在文档前 1/4；保守备选见 §4.5 / §8 Q3 |
| `## 玩法规则`（`:19~31`） | **保留 + 精简 + 后移** | §6 玩法规则 | 7 条表是核心内容、质量高，保留；但不应压在首屏之前，措辞可略压缩；保留「必要非充分条件」说明 |
| `## V3 新特性（本次改动）`（`:35~45`） | **改写 + 前置** | §3 功能亮点 | 内容是产品亮点但用了 changelog 口吻；去「V3 / 本次改动」字样，改成常驻特性并前置（R3/R4 亮点前置，§4.3） |
| `## 快速开始`（`:49~67`） | **保留 + 重组 + 前置** | §5 快速开始 | 拆分「立即试玩 / 本地开发」；压缩「入口务必注意两点」但**红线内容一句不删**；由 `:49` 前置到亮点之后（R1 "how users can get started" 应靠前） |
| `## 目录结构`（`:71~125`，约 50 行树） | **精简 + 合并** | §9 项目结构与文档 | 逐文件注释过长，喧宾夺主；压到 6~8 行关键路径或 `<details>` 折叠，与文档索引合并（R1 长文档拆出去、R7 源码地图归架构文档） |
| `## 验收数据`（`:129~136`） | **精简 + 下沉** | §8 验证与质量 | **删除** `avgCreateMs≈0.027ms` / `maxHintMs≈0.363ms` 等内部采样；只留 2~3 行结论 + 相对链接到 `docs/qa-v3-delivery-check.md`，从「堆在中部」移到靠后（R1 "only information necessary… Longer documentation is best suited for wikis"） |
| `## 文档索引`（`:140~148`） | **保留 + 补齐 + 合并** | §9 项目结构与文档 | 现状已有且做得不错；**补齐漏列的 `docs/qa-v3-delivery-check.md`**（已核验 `docs/` 原有 5 文件，索引 5 行中仅 4 行是 `docs/` 文件 + 1 行 `AGENTS.md`）；全部用相对路径（R1） |
| `## 已知问题`（`:152~162`，11 行） | **精简**（不删信息） | §10 已知问题 / 并入 §7 FAQ | 保留诚实性与「不影响运行与交付」结论，压成 2~3 行 + 折叠；排查细节交给 `AGENTS.md`（R7 `Spoilers to reduce visual cluttering`） |
| `## 线上版本`（`:166~170`） | **保留 + 压缩** | §11 线上版本 | 压缩为 2~3 行；**「不写带 sharecode 链接、不含任何密钥」护栏一句不删**（`AGENTS.md` §4.10，合规项） |
| —（缺失） | **新增** | 头部 Hero 区：截图 `01` | 用户明确诉求；R5/R6/R7 共识（§3 差距 1） |
| —（缺失） | **新增** | §2 目录 TOC | 170 行长文档缺导航；R7 `concise ToC`、R1 Outline（§3 差距 3） |
| —（缺失） | **新增** | §4 界面预览：截图 `02/03/04` | 同上，展示提示 / 弹窗 / 移动端三个卖点 |
| —（缺失） | **新增** | §7 常见问题 | R1 "where users can get help"、R6 FAQ/Support；并借 FAQ 强化「仅休闲娱乐」定位（§3 差距 9） |
| —（缺失） | **新增** | §12 许可 · 维护 · 反馈 | E14 矩阵 7/7 全 ✅；**必须写「尚未指定 License」**（§4.2），加维护状态 + Issues + 一行致谢（R1 / R6 Project status） |
| —（缺失） | **新增** | 头部：纯文本技术栈标签行 | 替代 badge 的观感，零外链（§4.1） |
| 「V3 / 本次改动」版本口吻 | **删除**（内容改写保留） | — | 面向首次访客不做增量日志（§4.3） |
| 验收数据里的内部性能采样数字 | **删除** | → `docs/qa-v3-delivery-check.md` | 细节归 QA 文档（R1/R7） |
| 目录树中的逐文件长注释 | **删除 / 折叠** | — | 降低阅读负担，细节已在 `AGENTS.md` 与 `docs/architecture-v3.md` |
| 贡献指南文件 / 多语言 README / CHANGELOG.md / Sponsors / Donations / Code of Conduct / Roadmap | **不新增（判定不适用）** | — | §4.3 适用性判断，避免过度工程化 |

---

## 8. 待确认问题（含默认建议，不停下来等答复）

| # | 问题 | 默认建议（不阻塞改写） |
| --- | --- | --- |
| Q1 | 是否补 `LICENSE` 文件？ | **本次改写不新建**；README 写「尚未指定 License，如需使用请先联系维护者」（§4.2）。同时建议维护者后续在 GitHub 用 choosealicense.com 补一个许可证，补上后再改为相对链接。 |
| Q2 | 是否使用 shields.io 静态 badge？ | **不用**（默认），改纯文本标签行，避免外链与「零网络」定位相冲（§4.1）。若坚持要徽章观感：≤3 个静态徽章、零动态状态、并加一句「徽章为静态标签，游戏不发起网络请求」——次选。 |
| Q3 | 免责声明可否从 `:9` 后移一格到 Hero 之后？ | **可，但一字不改、仍在文档前 1/4、Hero 一句话已含「仅休闲娱乐」、FAQ 再次强化**（§4.5）。**保守备选**：位置完全不动，只在其之前插入 Hero 区。两案都不删字、不改文案，由主理人择一。 |
| Q4 | 截图几张？是否做 GIF / 第 5 张？ | **4 张必做**（1 Hero `01` + 3 预览 `02/03/04`），**不做 GIF**、不做第 5 张；如时间充裕可补 `05-result-modal.png`，总数不超过 5（§6）。Hero 默认 `01-first-screen.png`。 |
| Q5 | 是否加英文 README / 语言切换 / CHANGELOG / CONTRIBUTING.md？ | **全部不加**（§4.3）。仅在末章加一句 Issues 反馈入口。 |
| Q6 | 「已知问题 TS2307」是否整段删除？ | **不删**，压成 2~3 行 + 折叠并保留「不影响运行与交付」结论；诚实信息是加分项，只是不该占 11 行。 |
| Q7 | 「线上版本」里「不写 sharecode / 不含密钥」的说明是否可删？ | **不可删**，压缩为一句即可（`AGENTS.md` §4.10 合规护栏）。 |
| Q8 | 是否彻底去掉 README 中的「V3」字样？ | **去掉**（面向访客，改为常驻「功能亮点」）；版本演进信息交给 Git 提交历史与 `docs/`，如需保留仅压成末章一句（§4.3）。 |
| Q9 | 截图目录命名 `docs/screenshots/` 是否合适？ | **合适**：`docs/` 已存在且 README 已有文档索引；相对路径 `docs/screenshots/*.png` 在 GitHub 与本地 clone 均可渲染（R1）。不新增根目录顶层目录，减少对现有结构的扰动。 |
| Q10 | 本文（`docs/readme-benchmark.md`）是否要列入 README 文档索引？ | **默认不列**：它是本轮改写的过程性调研文档，面向团队而非玩家/开发者；如主理人希望公开透明，可在 §9 文档索引末尾加一行「README 对标调研」。 |

---

## 附：本文结论一句话总结

**用户「至少要有截图」的诉求在业内是共识（R5/R6/R7），但真正让 README 变专业的不是「把 17 项要素补齐」，而是「把 4 张真实截图 + 一句话价值 + 功能亮点前置到首屏，把 50 行目录树、性能采样、TS 报错排查瘦身并下沉到 `docs/`，同时诚实回应『无 CI 就不写 build passing』『无 LICENSE 就不虚构 MIT』『单人休闲游戏不做多语言 / CHANGELOG / 贡献指南』」——即按 R1「README 只放上手必要信息」与 R6「只选适用章节」做加法也做减法。**
