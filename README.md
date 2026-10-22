# 德州扑克学习训练器

本地运行的中文新手学习软件，包含「跟着学」「针对练」「模拟比赛」三个入口。

## 启动

```bash
cd /Users/admin/Documents/DMP/holdem-trainer
npm install
npm run dev
```

浏览器访问 `http://127.0.0.1:5173/`。开发服务器只监听本机地址，不依赖远程服务。

## 模拟规则

9 人桌，每人 1000 筹码，60 分钟；盲注依次为 20/10、40/20、80/40、100/50，前三名积分 30/20/10。前注、最后一手结算和同筹码排名属于待确认项，开始模拟前必须勾选训练假设。

比赛进度和练习错题保存在浏览器 `localStorage`，刷新页面可恢复比赛。

## 校验

`npm test` 运行规则核心测试，`npm run build` 构建生产文件。

## 其他电脑使用

安装 Node.js 22.12 或更新的 LTS 和 Git，然后执行：

```bash
git clone https://github.com/wenbofan0515-afk/holdem-trainer.git
cd holdem-trainer
npm ci
npm run dev
```

训练记录仅保存在当前电脑和当前浏览器，不通过 GitHub 同步。

## Codex Skill

将仓库的 `skills/holdem-trainer` 文件夹复制到 `~/.codex/skills/`，重新开启 Codex 会话，然后输入 `$holdem-trainer 启动训练器`。

## 当前原型限制

当前只有 5 道练习。完整下注规则、边池、摊牌派奖、淘汰与多手赛程尚未完成，现有 6 个测试与构建成功不代表全部比赛规则通过验收。此版本用于学习界面预览，不应作为严格比赛裁判或胜率工具。
