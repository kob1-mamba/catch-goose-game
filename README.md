# 抓大鹅 - 网页版

一个纯前端、离线可玩的《抓大鹅》风格找物消除小游戏。

## 本地游玩

直接用浏览器打开 `index.html` 即可。

如果浏览器限制本地文件，也可以在项目目录运行任意静态文件预览工具，但不要把项目改成依赖后端。

## 玩法

1. 点击没有被遮挡的物品。
2. 物品会进入底部 7 格收集槽。
3. 3 个相同物品会自动消除。
4. 清空全部物品并保持收集槽为空，即通关。
5. 收集槽满了或倒计时结束，则失败。

## GitHub Pages 部署

1. 新建 GitHub 仓库。
2. 上传本目录下所有文件。
3. 进入仓库 `Settings -> Pages`。
4. Source 选择 `Deploy from a branch`。
5. Branch 选择 `main / root`。
6. 等待 GitHub 生成访问地址。

## 文件结构

```text
catch-goose-game/
├── index.html
├── style.css
├── main.js
└── README.md
```
