# 🚀 ZQ-IpSpeed

> 🌐 基于 Cloudflare Workers 的高颜值 IP 查询与网络测速工具箱

---

## ✨ 项目亮点

- 🗺️ **多源 IP 信息查询**：聚合多个api,展示国家、城市、ISP、经纬度等
- ⚡ **网络测速**：下载、上传、延迟、抖动多项指标，动态仪表盘，测速过程可视化
- 🎨 **赛博 UI & 明暗主题**：一键切换深浅色，响应式布局，移动端体验极佳
- 🔄 **页面互跳**：IP查询与IP获取自由切换
- ☁️ **一键部署**：Cloudflare Workers Sites 支持，永久免费，无服务器、无数据库

---

## 🏆 项目优势

- 🆓 永久免费，无需服务器、无数据库、无后端维护成本
- 🛡️ 数据安全，所有查询实时获取，不存储用户隐私
- 🧩 易于二次开发，代码结构清晰，注释详细
- 🌍 全球加速，依托 Cloudflare 网络，访问速度快
- 🛠️ 支持自定义域名，轻松打造专属测速/工具站

---

## 🌟 应用场景

- 个人/团队测速站点搭建
- 机场/代理服务商测速与IP信息展示
- 个人主页/博客集成网络工具箱
- 内网/局域网环境下的IP与网络测试
- 作为前端练习/Cloudflare Workers 学习项目

---

## 🌈 在线体验

- **测速主页**：[https://ipspeed.520jacky.dpdns.org/]
- **IP工具箱**：[https://ipspeed.520jacky.dpdns.org/index.html]


---

## 🖼️ 截图预览

| IP查询 | IP获取 |
| :------: | :------: |
| ![](/img/screenshot_speed.png) | ![](/img/screenshot_ip.png) |

---

## 🚀 快速部署

### 🛠️ 命令行一键部署（推荐）

```bash
git clone https://github.com/BAYUEQI/ZQ-IpSpeed.git
cd ZQ-IpSpeed
npm install -g wrangler
wrangler login
npm install
wrangler deploy
```

### 🖱️ Cloudflare 控制台导入部署

1. Fork 本项目到你的 GitHub 账号
2. 打开 Cloudflare Workers 控制台，选择"导入 GitHub 仓库"
3. 选择本项目，点击"创建并部署"
4. 绑定自定义域名（可选）

---

## 🛠️ 技术栈

- **前端**：原生 HTML+CSS+JS，赛博风格美化，移动端适配
- **后端**：Cloudflare Workers，多源 IP 查询，测速逻辑全部前端实现
- **部署**：Cloudflare Workers Sites，静态资源与 Worker 脚本一体化
- **安全**：无用户数据存储，所有查询实时获取

---

## ❓ 常见问题（FAQ）

### 1. 🚦 为什么测速结果和本地测速工具不同？
测速逻辑全部前端实现，受限于浏览器、网络环境和 Cloudflare 节点，结果仅供参考。

### 2. 🌏 支持哪些国家/地区？
支持全球绝大多数地区，IP信息聚合多源，准确率高。

### 3. 🛠️ 如何自定义/二次开发？
直接修改 `public/` 或 `worker.js`，前后端均为无依赖原生代码，易于扩展。

### 4. 🆓 是否永久免费？
是，基于 Cloudflare Workers 免费额度，个人/小型站点完全够用。

### 5. 📱 移动端体验如何？
UI 响应式设计，适配主流手机和平板。

---

## 🤝 贡献指南

欢迎任何形式的贡献！

1. Fork 本仓库
2. 新建分支 (`git checkout -b feature-xxx`)
3. 提交更改 (`git commit -m 'feat: 新功能说明'`)
4. 推送分支 (`git push origin feature-xxx`)
5. 提 PR（Pull Request）

如有建议/bug/新想法，欢迎提 [issue](https://github.com/BAYUEQI/ZQ-IpSpeed/issues)！

---

## 🔗 友情链接 & 推荐项目

- [Cloudflare Workers 官方文档](https://developers.cloudflare.com/workers/) 🌩️
- [ipapi.co](https://ipapi.co/) 🌍
- [ipinfo.io](https://ipinfo.io/) 🗺️
- [ipdb API](https://github.com/ymyuuu/IPDB)🧭
- [Speedtest by Ookla](https://www.speedtest.net/) ⚡
- [BAYUEQI 的其他项目](https://github.com/BAYUEQI) ⭐

---

## 📄 许可证

本项目采用 MIT License，详见 [LICENSE](./LICENSE)。

---

## 💬 联系与反馈

如有建议或问题，欢迎提 [issue](https://github.com/BAYUEQI/ZQ-IpSpeed/issues) 或 PR！

---

> ⭐️ 如果你喜欢本项目，欢迎 Star & Fork！ 
