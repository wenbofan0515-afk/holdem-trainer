# 独立浏览器计时夹具

将 audit-preview.html 复制至项目根，将 audit-preview.tsx 复制至 src；启动 `npm run dev -- --port 5176`，后台打开 `http://127.0.0.1:5176/audit-preview.html?action=call`。可选 action：call/check/bet/raise/fold/allin。结束删除两个复制文件。

注意：此页每次加载会清空该 origin 的 localStorage！仅在独立测试端口使用，不得在用户5173端口打开。用自然合法动作推演到目标局面，界面与正式Game相同。click双rAF时间写入页面底部audit-log；记录不含输入及人工阅读时间，不是正式性能基准。
