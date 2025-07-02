# 🚀 ZQ-IpSpeed

> 🌐 基于 Cloudflare Workers 的高颜值 IP 查询与网络测速工具箱

---

## ✨ 项目亮点

- 🗺️ **多源 IP 信息查询**：聚合 ipapi.co、ip-api.com、ipinfo.io，展示国家、城市、ISP、经纬度等
- ⚡ **网络测速**：下载、上传、延迟、抖动多项指标，动态仪表盘，测速过程可视化
- 🎨 **赛博 UI & 明暗主题**：一键切换深浅色，响应式布局，移动端体验极佳
- 🔄 **页面互跳**：测速主页与工具箱自由切换
- ☁️ **一键部署**：Cloudflare Workers Sites 支持，永久免费，无服务器、无数据库

---

## 🌈 在线体验

- **测速主页**：[https://你的workers.dev/](https://你的workers.dev/)
- **IP工具箱**：[https://你的workers.dev/index.html](https://你的workers.dev/index.html)

> 你可以将自己的域名绑定到 Cloudflare Workers，体验更佳！

---

## 🖼️ 截图预览

| 测速主页 | IP工具箱 |
| :------: | :------: |
| ![](./screenshot_speed.png) | ![](./screenshot_ip.png) |

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

## 📄 许可证

本项目采用 MIT License，详见 [LICENSE](./LICENSE)。

---

## 💬 联系与反馈

如有建议或问题，欢迎提 [issue](https://github.com/BAYUEQI/ZQ-IpSpeed/issues) 或 PR！

---

> ⭐️ 如果你喜欢本项目，欢迎 Star & Fork！ 
