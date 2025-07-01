#!/bin/bash

set -e

echo "==== ZQ-IpSpeed 一键安装脚本 ===="

# 1. 克隆仓库
if [ ! -d "ZQ-IpSpeed" ]; then
  git clone https://github.com/BAYUEQI/ZQ-IpSpeed.git
  cd ZQ-IpSpeed
else
  cd ZQ-IpSpeed
fi

# 2. 安装 wrangler（如未安装）
if ! command -v wrangler &> /dev/null; then
  echo "正在安装 wrangler..."
  npm install -g wrangler
fi

# 3. 安装依赖
echo "正在安装依赖..."
npm install

# 4. 自动写入 account_id
if grep -q "^account_id" wrangler.toml; then
  echo "wrangler.toml 已存在 account_id，无需重复填写。"
else
  read -p "请输入你的 Cloudflare account_id: " CFID
  # 如果有 [site] 段，插入到前面，否则插入到文件末尾
  if grep -q "^[[]site[]]" wrangler.toml; then
    sed -i "/^\\[site\\]/i account_id = \"$CFID\"" wrangler.toml
  else
    echo "account_id = \"$CFID\"" >> wrangler.toml
  fi
  echo "已写入 account_id 到 wrangler.toml"
fi

# 5. 登录 Cloudflare
echo "请在弹出的浏览器页面登录你的 Cloudflare 账号..."
wrangler login

# 6. 发布到 Cloudflare Workers