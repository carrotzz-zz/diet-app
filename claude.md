\## 项目类型

网页端互动项目（Next.js / React / Vite / GSAP / Framer Motion / PixiJS）



\## 技术栈（不可随意替换）

\- 框架：Next.js 15 + App Router

\- 样式：Tailwind CSS + shadcn/ui

\- 状态：Zustand（禁止 Redux，除非强理由）

\- 动画：GSAP / Framer Motion

\- 测试：Playwright（webapp-testing）



\## 工程纪律（Superpowers 强制执行）

\- 任何交互功能 \*\*必须先 brainstorming\*\*

&#x20; - 必须澄清：手势类型 / 状态机 / 边界 case / 降级方案

\- 必须 writing-plans \*\*拆成可执行的 task list\*\*

\- TDD 强制：

&#x20; - 核心交互逻辑先写测试（拖拽判定 / 状态切换 / 事件泄漏）

&#x20; - 动画可后调，但状态正确性不可妥协

\- 实现完成后 \*\*必须 code-review\*\*

\- /verify 必须在每次 push 前通过



\## Skills 使用规则

\- frontend-design：负责 UI/视觉，\*\*禁止紫渐变、Inter、无意义卡片\*\*

\- webapp-testing：所有交互必须有 Playwright smoke test

\- skill-creator：把重复流程固化为 dev-setup / interaction-dev

\- pua：仅在卡死时手动 `/pua`，不开自动

\- claude-mem：记录架构决策、坑点、手势方案选择



\## 禁止行为

\- 不编造 API

\- 不提交未测试的交互逻辑

\- 不改生产配置

