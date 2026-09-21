# 余旺个人作品集

一个纯静态的个人作品与在线简历网站，包含动态开场、作品主页、项目详情，以及可直接使用的本地工具中心。

## 修改内容

- 个人介绍和示例项目：`assets/js/data.js`
- 经历与首页工具入口：`assets/js/app.js`
- 工具中心与四个本地工具：`tools.html`、`assets/js/tools/`
- 页面视觉：`assets/css/styles.css`
- 联系方式：`index.html` 中的 `contact` 区域

## 本地预览

在此目录运行任意静态文件服务器，并访问 `index.html`。ES Modules 不能通过双击文件方式完整运行。

## 发布到 GitHub Pages

1. 在 GitHub 创建公开仓库。如果希望网址为 `用户名.github.io`，仓库名称需与该网址一致。
2. 将本目录中的文件推送到仓库默认分支的根目录。
3. 在仓库 Settings → Pages 中选择从默认分支根目录发布。
4. 等待部署完成后访问 GitHub 提供的网址。

发布前请在 `assets/js/data.js` 和 `index.html` 中替换示例项目、经历与联系方式。工具中心的文本、JSON、时间戳和密码处理均在访问者的浏览器本地完成。
