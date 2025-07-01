# ZQ-IpSpeed

ZQ-IpSpeed 是一个基于 Cloudflare Workers 的高颜值 IP 查询与网络测速工具箱，支持多源地理信息聚合、测速、明暗主题切换、移动端适配，并可一键部署到 Cloudflare Workers，永久免费、无服务器、无数据库。

---

## 功能特色

- **IP 信息查询**  
  - 支持多源聚合（ipapi.co、ip-api.com、ipinfo.io）
  - 展示国家、地区、城市、经纬度、时区、ISP、ASN、组织等详细信息
  - 自动识别设备类型与浏览器
  - 支持自定义 IP 列表导入与批量查询

- **网络测速**  
  - 下载、上传、延迟、抖动多项指标
  - 多线程测速，结果精准
  - 动态仪表盘与进度条，测速过程可视化

- **美观 UI 与明暗主题**  
  - 赛博风格深色主题+浅色主题一键切换
  - 响应式布局，移动端体验优秀
  - 按钮、卡片、进度条等细节精致

- **页面互相跳转**  
  - 工具箱与测速主页可一键切换，互不干扰

- **一键部署**  
  - 支持 Cloudflare Workers Sites，静态资源与 Worker 脚本一体化部署
  - 无需服务器、数据库，永久免费

---

## 在线演示

- **测速主页（Worker 页面）**  
  [https://你的workers.dev/](https://你的workers.dev/)

- **IP工具箱（静态页面）**  
  [https://你的workers.dev/index.html](https://你的workers.dev/index.html)

> 你可以将自己的域名绑定到 Cloudflare Workers，体验更佳。

---

## 截图预览

> 你可以在这里插入页面截图，示例：

| 测速主页 | IP工具箱 |
| :------: | :------: |
| ![](./screenshot_speed.png) | ![](./screenshot_ip.png) |

---

## 快速部署

### 方式一：一键脚本自动部署（推荐）

#### Windows 用户

1. 打开命令提示符（CMD），输入：
   ```cmd
@echo off
setlocal enabledelayedexpansion

echo ==== ZQ-IpSpeed 一键安装脚本（Windows CMD）====

REM 1. 克隆仓库
if not exist ZQ-IpSpeed (
    git clone https://github.com/BAYUEQI/ZQ-IpSpeed.git
    cd ZQ-IpSpeed
) else (
    cd ZQ-IpSpeed
)

REM 2. 检查 wrangler 是否已安装
where wrangler >nul 2>nul
if errorlevel 1 (
    echo 正在安装 wrangler...
    npm install -g wrangler
)

REM 3. 安装依赖
echo 正在安装依赖...
npm install

REM 4. 自动写入 account_id
findstr /B /C:"account_id" wrangler.toml >nul
if errorlevel 1 (
    set /p CFID=请输入你的 Cloudflare account_id:
    REM 判断 [site] 是否存在
    findstr /B /C:"[site]" wrangler.toml >nul
    if errorlevel 1 (
        echo account_id = "%CFID%" >> wrangler.toml
    ) else (
        REM 插入到 [site] 前面
        (for /f "delims=" %%i in (wrangler.toml) do (
            echo %%i|findstr /B /C:"[site]" >nul
            if not errorlevel 1 (
                echo account_id = "%CFID%"
            )
            echo %%i
        )) > wrangler_new.toml
        move /y wrangler_new.toml wrangler.toml >nul
    )
    echo 已写入 account_id 到 wrangler.toml
) else (
    echo wrangler.toml 已存在 account_id，无需重复填写。
)

REM 5. 登录 Cloudflare
echo 请在弹出的浏览器页面登录你的 Cloudflare 账号...
wrangler login

REM 6. 发布到 Cloudflare Workers
echo 正在发布到 Cloudflare Workers...
wrangler publish

echo ==== 部署完成！====
echo 访问你的 Workers 地址查看效果。

pause
   ```
   或者直接下载 `install.cmd`，双击运行。

#### Linux/macOS 用户

1. 打开终端，输入：
   ```bash
   curl -fsSL https://raw.githubusercontent.com/BAYUEQI/ZQ-IpSpeed/master/install.sh | bash
   ```

2. 按提示输入 Cloudflare `account_id`，自动完成依赖安装、登录、部署。

---

### 方式二：手动部署

1. **克隆项目**
    ```bash
    git clone https://github.com/BAYUEQI/ZQ-IpSpeed.git
    cd ZQ-IpSpeed
    ```

2. **安装依赖**
    ```bash
    npm install
    ```

3. **配置 wrangler.toml**
    - 填写你的 `account_id`（在 Cloudflare 后台获取）
    - 保持如下结构：

    ```
    .
    ├── public/
    │   ├── index.html
    │   ├── script.js
    │   └── styles.css
    ├── worker.js
    ├── wrangler.toml
    ├── README.md
    └── LICENSE
    ```

    **示例 wrangler.toml：**
    ```toml
    name = "ip-speed"
    main = "worker.js"
    compatibility_date = "2024-05-01"
    workers_dev = true
    account_id = "你的account_id"

    [site]
    bucket = "./public"
    ```

4. **登录 Cloudflare**
    ```bash
    wrangler login
    ```

5. **发布到 Cloudflare Workers**
    ```bash
    wrangler publish
    ```

---

## 常见问题

### Q: 为什么访问 `/index.html` 和 `/` 是两个不同页面？
A: `/` 是 Worker 动态页面（测速主页），`/index.html` 是静态工具箱页面。你可以通过底部按钮互相跳转。

### Q: 如何自定义测速/查询API源？
A: 你可以在 `worker.js` 里修改 `getGeoDataFromMultipleSources` 函数，添加或替换 API 源。

### Q: 如何绑定自定义域名？
A: 在 Cloudflare 后台添加自定义域名，并在 wrangler.toml 里配置 `route` 和 `zone_id`。

### Q: 支持哪些浏览器和设备？
A: 支持所有现代浏览器，移动端自适应，推荐 Chrome/Edge/Firefox。

---

## 技术细节

- **前端**：原生 HTML+CSS+JS，无依赖，赛博风格美化，移动端适配
- **后端**：Cloudflare Workers，支持多源 IP 查询，测速逻辑全部前端实现
- **部署**：Cloudflare Workers Sites，静态资源与 Worker 脚本一体化
- **安全**：无用户数据存储，所有查询实时获取

---

## 鸣谢

- [Cloudflare Workers](https://workers.cloudflare.com/)
- [ipapi.co](https://ipapi.co/)
- [ip-api.com](http://ip-api.com/)
- [ipinfo.io](https://ipinfo.io/)
- [Font Awesome](https://fontawesome.com/)
- 以及所有开源贡献者

---

## 许可证

本项目采用 MIT License，详见 [LICENSE](./LICENSE)。

---

## 联系

如有建议或问题，欢迎提 [issue](https://github.com/BAYUEQI/ZQ-IpSpeed/issues) 或 PR！ 
