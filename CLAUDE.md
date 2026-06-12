## 行为规则（最高优先级）

1. **中文思考与交流**：所有思考过程和回复均使用中文，不得使用英文。
2. **禁止自动 git commit**：绝不主动执行 `git commit` 或 `git add` + `git commit`。用户自行管理提交。
3. **禁止描述中添加 emoji（高优先级）**：所有 description、skillDescription 等文本字段不得包含 emoji 字符（如 🔥🧟⚔️ 等），保持纯文字描述。
4. **从根源解决问题（高优先级）**：遇到 bug 或功能异常时，先分析数据流和根本原因，再动手修改。禁止打补丁、硬编码特殊分支、或反复修补同一问题。优先考虑架构层面的统一方案，让后续新增内容自动适配，而非每次手动维护。
5. **保留历史安装包**：禁止删除 `dist/` 目录下的旧版本安装包（exe、tar.gz 等），所有构建产物作为版本历史留存纪念。

## 游戏基础设定

游戏设计规则统一维护在 `游戏基础设定.md`，所有涉及植物机制、尺寸系统、时间流速、描述规范等规则均以该文件为准，新增或修改规则时需同步更新该文件。

## Agent skills

### Issue tracker

Issues live in GitHub Issues for this repo (`gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo — one `CONTEXT.md` + `docs/adr/` at the root. See `docs/agents/domain.md`.
