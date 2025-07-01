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