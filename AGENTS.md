# 项目规则（所有 AI 必读）

## 项目

个人作品集网站，基于 Houmahani Kane 的 Atmospheric Depth Gallery（MIT 协议）复刻。

技术栈：Vite + Three.js + GLSL。已有代码是基础，不要推翻重做。

部署：push 到 main 后由 GitHub Actions 自动部署到 lincan-portfolio.work。

保留 LICENSE 文件和原作者署名。

## 角色

- Claude Code：总管。写 PLAN.md、拆任务卡、合并结果、最终验收
- Codex：执行逻辑类任务；审查别人的代码
- Antigravity：前端视觉、图片处理、浏览器实测
- DeepSeek：批量、重复性工作（文案、翻译、文档）

## 工作规则

1. 只做自己任务卡里写的事，不改"不要做"里列出的文件
2. 开工前只读：AGENTS.md + 自己的 tasks/Txx.md + 卡里点名的文件
3. 做完写 handoff/Txx.md（不超过 200 字），然后 git commit，提交信息以 Txx 开头
4. 不确定的地方写进交接单的"问题"里，不要自己猜
5. 更新 STATUS.md 里自己那一行

## 规范

- raw/ 是原始作品文件，只读，不要修改、移动或删除，也不要提交到 git
- 网页用图放 images/，长边不超过 2400px，单张尽量小于 500KB，优先用 webp
- 代码变量用英文，注释用中文
- 回复和文档用中文

## 禁止

- 不删除别人的文件
- 不把密钥、密码、私人信息写进任何文件（仓库是公开的）
