import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 只处理 / 或 /worker，其他都交给静态资源
    if (url.pathname === '/' || url.pathname === '/worker') {
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json;charset=UTF-8',
      };

      // 处理OPTIONS预检请求
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: corsHeaders,
        });
      }

      // 判断Accept头，决定返回HTML还是JSON
      const accept = request.headers.get('Accept') || '';
      const wantHtml = accept.includes('text/html');

      try {
        // 获取请求的IP地址
        const clientIP = request.headers.get('CF-Connecting-IP') || 
                        request.headers.get('X-Forwarded-For') || 
                        request.headers.get('X-Real-IP') || 
                        'unknown';

        // 获取Cloudflare提供的基础信息
        const country = request.headers.get('CF-IPCountry') || 'unknown';
        
        // 初始化地理位置信息
        let geoInfo = {
          ip: clientIP,
          country: country,
          country_name: getCountryName(country),
          region: 'unknown',
          city: 'unknown',
          latitude: 'unknown',
          longitude: 'unknown',
          timezone: 'unknown',
          postal_code: 'unknown',
          metro_code: 'unknown',
          isp: 'unknown',
          organization: 'unknown',
          asn: 'unknown',
          user_agent: request.headers.get('User-Agent') || 'unknown',
          device: '未知',
          browser: '未知',
          query_time: getBeijingTime(),
          cf_visitor: request.headers.get('CF-Visitor') || 'unknown',
        };

        // 解析设备和浏览器
        const uaInfo = parseUA(geoInfo.user_agent);
        geoInfo.device = uaInfo.device;
        geoInfo.browser = uaInfo.browser;

        // 尝试从多个API获取地理位置信息
        if (clientIP !== 'unknown') {
          const geoData = await getGeoDataFromMultipleSources(clientIP);
          if (geoData) {
            geoInfo = { ...geoInfo, ...geoData };
          }
        }

        if (wantHtml) {
          // 返回美观的汉化HTML页面
          return new Response(renderHtml(geoInfo), {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=UTF-8' },
          });
        } else {
          // 返回JSON
          return new Response(JSON.stringify(geoInfo, null, 2), {
            status: 200,
            headers: corsHeaders,
          });
        }
      } catch (error) {
        if (wantHtml) {
          return new Response(`<h1>获取地理位置信息失败</h1><pre>${error.message}</pre>`, {
            status: 500,
            headers: { 'Content-Type': 'text/html; charset=UTF-8' },
          });
        } else {
          return new Response(JSON.stringify({
            error: '获取地理位置信息失败',
            message: error.message,
            timestamp: new Date().toISOString()
          }, null, 2), {
            status: 500,
            headers: corsHeaders,
          });
        }
      }
    } else {
      // 其他路径（如 /index.html、/script.js、/styles.css）都返回静态资源
      try {
        return await getAssetFromKV(
          { request, waitUntil: ctx.waitUntil.bind(ctx) },
          { ASSET_NAMESPACE: env.__STATIC_CONTENT, ASSET_MANIFEST: manifestJSON }
        );
      } catch (e) {
        return new Response('Not found', { status: 404 });
      }
    }
  }
};

// 渲染美观的汉化HTML页面
function renderHtml(data) {
  // 国旗emoji
  const countryFlag = getCountryFlagEmoji(data.country);
  // 查询时间分割
  const [datePart, timePart] = (data.query_time || '').split(' ');
  // 经纬度分割
  const longitude = data.longitude || '';
  const latitude = data.latitude || '';
  // 信息分组
  const leftItems = [
    { label: 'ISP', value: data.isp, icon: '📡' },
    { label: '主机名', value: data.organization || 'N/A', icon: '💻' },
    { label: '系统', value: data.device, icon: '🖥️' },
    { label: '浏览器', value: data.browser, icon: '🌐' },
    { label: 'ASN', value: data.asn, icon: '🔢' },
    { label: '查询时间', value: `<div style='line-height:1.2'><div>${datePart || ''}</div><div>${timePart || ''}</div></div>`, icon: '⏰', isHtml: true },
  ];
  const rightItems = [
    { label: '国家', value: data.country_name, icon: '🌏' },
    { label: '地区/省份', value: data.region, icon: '📍' },
    { label: '城市', value: data.city, icon: '🏙️' },
    { label: '时区', value: data.timezone, icon: '🕒' },
    { label: '邮政编码', value: data.postal_code, icon: '🏷️' },
    { label: '经纬度', value: `<div style='line-height:1.2'><div>经：${longitude}</div><div>纬：${latitude}</div></div>`, icon: '🧭', isHtml: true },
  ];
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ZQ-IpSpeed</title>
  <link rel="icon" type="image/svg+xml" href='data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="%2323284a"/><path d="M32 12a20 20 0 1 1-14.14 5.86" fill="none" stroke="%2300e6ff" stroke-width="4"/><circle cx="32" cy="32" r="6" fill="%2300e6ff"/><rect x="30" y="8" width="4" height="16" rx="2" fill="%23fff"/></svg>' />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
    
    * {
      box-sizing: border-box;
    }
    
    body {
      background: linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 25%, #0a1a1a 50%, #1a1a0a 75%, #0a0a0a 100%);
      min-height: 100vh;
      margin: 0;
      font-family: 'Orbitron', monospace;
      color: #00ffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow-x: hidden;
      position: relative;
    }
    
    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.03) 0%, transparent 50%);
      pointer-events: none;
      z-index: -1;
    }
    
    .outer-flex {
      width: 100vw;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: stretch;
      gap: 24px;
      margin-top: 40px;
      margin-bottom: 0;
      position: relative;
    }
    
    .gauge-side {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      min-width: 240px;
      max-width: 280px;
      min-height: 360px;
      background: linear-gradient(145deg, rgba(0, 0, 0, 0.8), rgba(20, 0, 20, 0.9));
      border: 2px solid #00ffff;
      border-radius: 16px;
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
      padding: 20px 12px 20px 12px;
      gap: 20px;
      position: relative;
      backdrop-filter: blur(5px);
    }
    
    .container {
      background: linear-gradient(145deg, rgba(0, 0, 0, 0.8), rgba(20, 0, 20, 0.9));
      border: 2px solid #00ffff;
      border-radius: 20px;
      box-shadow: 0 0 30px rgba(0, 255, 255, 0.4);
      padding: 32px 16px 28px 16px;
      max-width: 750px;
      width: 98vw;
      display: flex;
      flex-direction: column;
      align-items: center;
      backdrop-filter: blur(5px);
      position: relative;
    }
    
    .title {
      font-size: 2.5rem;
      font-weight: 900;
      margin-bottom: 16px;
      letter-spacing: 4px;
      color: #fff;
      text-shadow: 0 0 10px #00ffff;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .ip-block {
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 12px;
      color: #ffff00;
      display: flex;
      align-items: center;
      gap: 10px;
      text-shadow: 0 0 10px #ffff00;
    }
    
    .gauge-label {
      color: #00ffff;
      font-size: 1.2em;
      margin-bottom: 6px;
      text-align: center;
      font-weight: 700;
      text-shadow: 0 0 8px #00ffff;
      letter-spacing: 1px;
    }
    
    .gauge-value {
      color: #00ffff;
      font-size: 2.4em;
      font-weight: 900;
      margin-top: 4px;
      margin-bottom: 4px;
      text-align: center;
      text-shadow: 0 0 15px #00ffff;
    }
    
    .gauge-unit {
      color: #ffff00;
      font-size: 1.1em;
      margin-left: 6px;
      text-shadow: 0 0 8px #ffff00;
    }
    
    .gauge-svg {
      display: block;
      margin: 0 auto;
      filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.5));
    }
    
    .gauge-desc {
      color: #ffff00;
      font-size: 1em;
      margin-top: 4px;
      text-align: center;
      text-shadow: 0 0 6px #ffff00;
    }
    
    .progress-bar-container {
      width: 100%;
      height: 8px;
      background: rgba(0, 0, 0, 0.6);
      border-radius: 4px;
      margin-top: 10px;
      overflow: hidden;
      border: 1px solid #00ffff;
    }
    
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #00ffff, #00e6ff);
      width: 0%;
      transition: width 0.3s ease;
      border-radius: 4px;
      position: relative;
    }
    
    .progress-text {
      color: #00ffff;
      font-size: 0.9em;
      font-weight: 600;
      margin-top: 6px;
      text-align: center;
      min-height: 16px;
      text-shadow: 0 0 6px #00ffff;
      letter-spacing: 0.5px;
    }
    
    .info-center {
      flex: 2 1 0;
      display: flex;
      flex-direction: row;
      gap: 20px;
      align-items: stretch;
      justify-content: center;
    }
    
    .info-col {
      flex: 1 1 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
      align-items: center;
      justify-content: stretch;
    }
    
    .card {
      background: linear-gradient(145deg, rgba(0, 0, 0, 0.7), rgba(20, 0, 20, 0.8));
      border: 1px solid #00ffff;
      border-radius: 12px;
      box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
      padding: 0 0;
      display: flex;
      align-items: center;
      font-size: 1rem;
      gap: 14px;
      transition: all 0.2s ease;
      min-width: 340px;
      max-width: 340px;
      min-height: 80px;
      max-height: 80px;
      box-sizing: border-box;
      overflow: hidden;
      justify-content: flex-start;
      backdrop-filter: blur(3px);
      position: relative;
    }
    
    .card:hover {
      border-color: #00ffff;
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
      transform: translateY(-1px);
    }
    
    .icon {
      font-size: 1.3em;
      margin-left: 16px;
      margin-right: 12px;
      flex-shrink: 0;
      text-shadow: 0 0 10px currentColor;
    }
    
    .label {
      color: #00ffff;
      min-width: 80px;
      font-weight: 600;
      font-size: 0.95em;
      flex-shrink: 0;
      text-shadow: 0 0 6px #00ffff;
      letter-spacing: 0.5px;
    }
    
    .value {
      color: #fff;
      font-weight: 500;
      word-break: break-all;
      text-align: left;
      flex: 1;
      white-space: pre-line;
      overflow-wrap: break-word;
      font-size: 0.95em;
      max-height: 42px;
      overflow: auto;
      padding-right: 6px;
      scrollbar-width: thin;
      scrollbar-color: #00ffff rgba(0, 0, 0, 0.3);
      text-shadow: 0 0 4px #fff;
    }
    
    .value::-webkit-scrollbar {
      width: 6px;
      background: transparent;
    }
    
    .value::-webkit-scrollbar-thumb {
      background: rgba(0, 255, 255, 0.3);
      border-radius: 3px;
    }
    
    .value::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 255, 255, 0.5);
    }
    
    .flag-emoji {
      vertical-align: middle;
      font-size: 1.3em;
      margin-right: 8px;
      filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.5));
    }
    
    .button-container {
      display: flex;
      width: 100%;
      max-width: 900px;
      margin: 30px auto 40px auto;
      gap: 12px;
      justify-content: center;
    }
    .button-container .cyber-button {
      flex: 1;
      min-width: 0;
    }
    
    .cyber-button {
      background: linear-gradient(145deg, rgba(0, 0, 0, 0.8), rgba(20, 0, 20, 0.9));
      border: 2px solid #00ffff;
      border-radius: 12px;
      color: #00ffff;
      padding: 12px 20px;
      font-family: 'Orbitron', monospace;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
    }
    
    .cyber-button:hover {
      border-color: #ffff00;
      box-shadow: 0 0 20px rgba(255, 255, 0, 0.5);
      color: #ffff00;
      text-shadow: 0 0 6px #ffff00;
      transform: translateY(-2px);
    }
    
    .cyber-button:active {
      transform: translateY(0);
    }
    
    .button-icon {
      margin-right: 0 !important;
      padding: 0 !important;
    }
    
    .button-text {
      margin-left: 0 !important;
      padding: 0 !important;
      display: inline-block;
      vertical-align: middle;
      text-align: center;
      flex: 1;
    }
    
    /* 明暗主题样式 */
    .light-theme {
      background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 25%, #d0d0d0 50%, #c0c0c0 75%, #b0b0b0 100%);
      color: #333;
    }
    
    .light-theme .gauge-side {
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(240, 240, 240, 0.8));
      border-color: #333;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
    }
    
    .light-theme .container {
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(240, 240, 240, 0.8));
      border-color: #333;
      box-shadow: 0 0 30px rgba(0, 0, 0, 0.2);
    }
    
    .light-theme .title {
      color: #333;
      text-shadow: 0 0 10px #666;
    }
    
    .light-theme .gauge-label {
      color: #333;
      text-shadow: 0 0 8px #666;
    }
    
    .light-theme .gauge-value {
      color: #333;
      text-shadow: 0 0 15px #666;
    }
    
    .light-theme .card {
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.8), rgba(240, 240, 240, 0.7));
      border-color: #333;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
    }
    
    .light-theme .card:hover {
      border-color: #666;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
    }
    
    .light-theme .label {
      color: #333;
      text-shadow: 0 0 6px #666;
    }
    
    .light-theme .value {
      color: #333;
      text-shadow: 0 0 4px #666;
    }
    
    .light-theme .cyber-button {
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(240, 240, 240, 0.8));
      border-color: #333;
      color: #333;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
      text-shadow: 0 0 6px #666;
    }
    
    .light-theme .cyber-button:hover {
      border-color: #666;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
      color: #666;
      text-shadow: 0 0 6px #999;
    }
    
    /* 响应式设计 */
    @media (max-width: 900px) {
      .outer-flex {
        flex-direction: column;
        gap: 16px;
        align-items: center;
      }
      .gauge-side {
        flex-direction: row;
        min-width: unset;
        max-width: unset;
        min-height: unset;
        width: 100vw;
        justify-content: center;
        gap: 20px;
        margin: 0 auto;
      }
      .container {
        order: 1;
      }
      #gauge-left, #gauge-right {
        order: 2;
      }
      .gauge-side, .info-center { max-width: 99vw; min-width: 96vw; }
      .info-center { flex-direction: column; gap: 0; }
      .info-col { gap: 10px; }
      .card { min-width: 96vw; max-width: 99vw; min-height: 60px; max-height: 70px; font-size: 0.9rem; }
      .label { min-width: 70px; font-size: 0.85em; }
      .icon { font-size: 1.1em; margin-right: 8px; margin-left: 8px; }
      .value { max-height: 36px; }
      .title { font-size: 2rem; }
      .button-container {
        max-width: 100%;
      }
      .cyber-button {
        padding: 12px 24px;
        font-size: 1rem;
        min-width: 90px;
        max-width: 140px;
        border-radius: 12px;
      }
    }
    
    @media (max-width: 768px) {
      .button-container {
        flex-direction: column;
        gap: 10px;
        width: 100%;
        margin: 20px 0 0 0;
      }
      .button-container .cyber-button {
        width: 100%;
        flex: unset;
      }
    }
    
    @media (max-width: 500px) {
      .gauge-side {
        flex-direction: column;
        align-items: center;
        width: 100vw;
        gap: 10px;
      }
      .title { font-size: 1.5rem; letter-spacing: 2px; }
      .button-container {
        position: static;
        bottom: auto;
        left: auto;
        transform: none;
        margin-top: 30px;
        margin-bottom: 20px;
        justify-content: center;
        flex-direction: row;
        gap: 8px;
        z-index: auto;
        width: 100vw;
        padding: 0 6vw;
        box-sizing: border-box;
      }
      .cyber-button {
        padding: 10px 0;
        font-size: 0.95rem;
        min-width: 70px;
        max-width: 110px;
        width: 100%;
        border-radius: 14px;
        margin: 0 2px;
        white-space: nowrap;
      }
      .button-text {
        font-size: 0.95em;
      }
    }
    footer {
      margin-top: 20px;
      text-align: center;
      color: #00ffff;
      font-size: 16px;
      opacity: 0.85;
    }
  </style>
</head>
<body>
  <div class="outer-flex">
    <div class="gauge-side" id="gauge-left">
      <div class="gauge-label">下载速度</div>
      <div id="download-gauge"></div>
      <div class="progress-bar-container">
        <div class="progress-bar-fill" id="download-progress-bar"></div>
      </div>
      <div class="progress-text" id="download-progress-text">准备测试...</div>
      <div class="gauge-label">延迟</div>
      <div class="gauge-value" id="latency-value">--</div>
      <div class="progress-bar-container">
        <div class="progress-bar-fill" id="latency-progress-bar"></div>
      </div>
      <div class="progress-text" id="latency-progress-text">准备测试...</div>
      <div class="gauge-desc">ms</div>
    </div>
    <div class="container">
      <div class="title">ZQ-IpSpeed</div>
      <div class="ip-block"><span class="flag-emoji">${countryFlag}</span><span style="color:#6cf;">${data.ip}</span></div>
      <div class="info-center">
        <div class="info-col">
          ${leftItems.map(item => `<div class="card"><span class="icon">${item.icon}</span><span class="label">${item.label}:</span><span class="value">${item.isHtml ? item.value : (item.value || 'N/A')}</span></div>`).join('')}
        </div>
        <div class="info-col">
          ${rightItems.map(item => `<div class="card"><span class="icon">${item.icon}</span><span class="label">${item.label}:</span><span class="value">${item.isHtml ? item.value : (item.value || 'N/A')}</span></div>`).join('')}
        </div>
      </div>
    </div>
    <div class="gauge-side" id="gauge-right">
      <div class="gauge-label">上传速度</div>
      <div id="upload-gauge"></div>
      <div class="progress-bar-container">
        <div class="progress-bar-fill" id="upload-progress-bar"></div>
      </div>
      <div class="progress-text" id="upload-progress-text">准备测试...</div>
      <div class="gauge-label">抖动</div>
      <div class="gauge-value" id="jitter-value">--</div>
      <div class="progress-bar-container">
        <div class="progress-bar-fill" id="jitter-progress-bar"></div>
      </div>
      <div class="progress-text" id="jitter-progress-text">准备测试...</div>
      <div class="gauge-desc">ms</div>
    </div>
  </div>
  <div class="button-container">
    <button class="cyber-button" id="back-to-top" onclick="scrollToTop()">
      <span class="button-icon">⬆️</span>
      <span class="button-text">返回顶部</span>
    </button>
    <button class="cyber-button" id="theme-toggle" onclick="toggleTheme()">
      <span class="button-icon">🌙</span>
      <span class="button-text">明暗切换</span>
    </button>
    <button class="cyber-button" id="github-link" onclick="openGithub()">
      <span class="button-icon">📦</span>
      <span class="button-text">GitHub</span>
    </button>
    <button class="cyber-button" id="to-index" onclick="location.href='/index.html'">
      <span class="button-icon">🧰</span>
      <span class="button-text">IP 获取</span>
    </button>
  </div>
  <footer>
    <div>© 2025 <a href="https://github.com/BAYUEQI" target="_blank" style="color:#00ffff;text-decoration:underline;">BAYUEQI</a> | MIT License</div>
  </footer>
  <script>
    function renderGauge(id, value, max, color, unit) {
      const percent = Math.min(value / max, 1);
      const angle = percent * 270;
      const r = 60, cx = 70, cy = 70;
      const startAngle = 135, endAngle = 135 + angle;
      const start = polarToCartesian(cx, cy, r, startAngle);
      const end = polarToCartesian(cx, cy, r, endAngle);
      const arcFlag = angle > 180 ? 1 : 0;
      const d = [
        "M", polarToCartesian(cx, cy, r, startAngle).join(" "),
        "A", r, r, 0, arcFlag, 1, end.join(" ")
      ].join(" ");
      document.getElementById(id).innerHTML =
        '<svg width="140" height="140" class="gauge-svg">' +
        '<circle cx="70" cy="70" r="60" fill="none" stroke="#2c355c" stroke-width="16" />' +
        '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="14" stroke-linecap="round" />' +
        '<text x="70" y="80" text-anchor="middle" font-size="2.1em" fill="#6cf" font-weight="bold">' + value.toFixed(1) + '</text>' +
        '<text x="70" y="105" text-anchor="middle" font-size="1em" fill="#b3b3b3">' + unit + '</text>' +
        '</svg>';
    }
    
    function polarToCartesian(cx, cy, r, angle) {
      const rad = (angle-90) * Math.PI / 180.0;
      return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
    }
    
    // 进度控制函数
    function updateAllProgress(percent, text) {
      // 更新所有进度条
      document.getElementById('download-progress-bar').style.width = percent + '%';
      document.getElementById('upload-progress-bar').style.width = percent + '%';
      document.getElementById('latency-progress-bar').style.width = percent + '%';
      document.getElementById('jitter-progress-bar').style.width = percent + '%';
      
      // 更新所有进度文本
      document.getElementById('download-progress-text').textContent = text + ' (' + Math.round(percent) + '%)';
      document.getElementById('upload-progress-text').textContent = text + ' (' + Math.round(percent) + '%)';
      document.getElementById('latency-progress-text').textContent = text + ' (' + Math.round(percent) + '%)';
      document.getElementById('jitter-progress-text').textContent = text + ' (' + Math.round(percent) + '%)';
    }
    
    function updateDownloadProgress(percent, text) {
      document.getElementById('download-progress-bar').style.width = percent + '%';
      document.getElementById('download-progress-text').textContent = text + ' (' + Math.round(percent) + '%)';
    }
    
    function updateUploadProgress(percent, text) {
      document.getElementById('upload-progress-bar').style.width = percent + '%';
      document.getElementById('upload-progress-text').textContent = text + ' (' + Math.round(percent) + '%)';
    }
    
    function updateLatencyProgress(percent, text) {
      document.getElementById('latency-progress-bar').style.width = percent + '%';
      document.getElementById('latency-progress-text').textContent = text + ' (' + Math.round(percent) + '%)';
    }
    
    function updateJitterProgress(percent, text) {
      document.getElementById('jitter-progress-bar').style.width = percent + '%';
      document.getElementById('jitter-progress-text').textContent = text + ' (' + Math.round(percent) + '%)';
    }
    
    function resetProgress() {
      document.getElementById('download-progress-bar').style.width = '0%';
      document.getElementById('upload-progress-bar').style.width = '0%';
      document.getElementById('latency-progress-bar').style.width = '0%';
      document.getElementById('jitter-progress-bar').style.width = '0%';
      document.getElementById('download-progress-text').textContent = '准备测试...';
      document.getElementById('upload-progress-text').textContent = '准备测试...';
      document.getElementById('latency-progress-text').textContent = '准备测试...';
      document.getElementById('jitter-progress-text').textContent = '准备测试...';
      document.getElementById('latency-value').textContent = '--';
      document.getElementById('jitter-value').textContent = '--';
    }
    
    async function cloudflareLikeDownloadTest(url, threadCount = 6, testDuration = 5000) {
      let totalBytes = 0;
      let running = true;

      // 每个线程循环下载，直到时间到
      async function downloadThread() {
        while (running) {
          const resp = await fetch(url + '?bytes=10000000', { cache: 'no-store', mode: 'cors' });
          if (resp.ok) {
            const reader = resp.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              totalBytes += value.length;
            }
          }
        }
      }

      // 启动多线程
      const threads = [];
      for (let i = 0; i < threadCount; i++) {
        threads.push(downloadThread());
      }

      // 计时
      await new Promise(resolve => setTimeout(resolve, testDuration));
      running = false;
      await Promise.all(threads);

      // 计算Mbps
      const mbps = (totalBytes * 8) / (testDuration / 1000) / 1e6;
      return mbps;
    }
    
    async function cloudflareLikePingTest(url, count = 30) {
      const pings = [];
      for (let i = 0; i < count; i++) {
        const start = performance.now();
        await fetch(url, { cache: 'no-store', mode: 'cors' });
        const end = performance.now();
        pings.push(end - start);
        await new Promise(r => setTimeout(r, 100));
      }
      // 去除首包和极端值
      const valid = pings.slice(2).sort((a, b) => a - b);
      const cut = Math.floor(valid.length * 0.1);
      const trimmed = valid.slice(cut, valid.length - cut);
      const latency = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
      // 抖动（标准差）
      const mean = latency;
      const jitter = Math.sqrt(trimmed.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / trimmed.length);
      return { latency, jitter };
    }
    
    async function performSpeedTest() {
      let downloadSpeed = 0;
      let uploadSpeed = 0;
      let latency = 0;
      let jitter = 0;
      
      // 显示进度条
      resetProgress();
      
      try {
        // 1. 延迟测试 (延迟区域显示进度)
        updateLatencyProgress(0, '开始延迟测试');
        updateJitterProgress(0, '等待延迟测试');
        const pingCount = 20;
        const pings = [];
        for (let i = 0; i < pingCount; i++) {
          const pingStart = performance.now();
          await fetch('https://speed.cloudflare.com/__down?bytes=1000', {
            cache: 'no-store',
            mode: 'cors'
          });
          const pingEnd = performance.now();
          pings.push(pingEnd - pingStart);
          await new Promise(resolve => setTimeout(resolve, 120));
          
          // 只更新延迟进度
          const pingProgress = (i + 1) / pingCount * 100;
          updateLatencyProgress(pingProgress, '延迟测试');
        }

        // 延迟测试完成
        updateLatencyProgress(100, '延迟测试完成');
        
        // 开始抖动计算 (抖动区域显示进度)
        updateJitterProgress(0, '开始计算抖动');
        
        // 去除前2个首包
        const validPings = pings.slice(2);
        // 剔除最高最低各10%
        validPings.sort((a, b) => a - b);
        const cut = Math.floor(validPings.length * 0.1);
        const trimmedPings = validPings.slice(cut, validPings.length - cut);

        // 平均延迟
        latency = trimmedPings.reduce((a, b) => a + b, 0) / trimmedPings.length;

        // 抖动：连续两次延迟的绝对差的平均值
        updateJitterProgress(50, '计算抖动值');
        let jitterSum = 0;
        for (let i = 1; i < trimmedPings.length; i++) {
          jitterSum += Math.abs(trimmedPings[i] - trimmedPings[i - 1]);
        }
        jitter = jitterSum / (trimmedPings.length - 1);
        
        // 抖动计算完成
        updateJitterProgress(100, '抖动计算完成');
        
        // 2. 下载测试 (下载区域显示进度)
        updateDownloadProgress(0, '开始下载测试');
        const downloadTests = [
          { size: 25000000, name: '25MB' },
          { size: 50000000, name: '50MB' },
          { size: 100000000, name: '100MB' }
        ];
        
        let totalDownloadSpeed = 0;
        let validTests = 0;
        
        for (let testIndex = 0; testIndex < downloadTests.length; testIndex++) {
          const test = downloadTests[testIndex];
          const downloadProgress = (testIndex + 1) / downloadTests.length * 100;
          updateDownloadProgress(downloadProgress, '下载测试 ' + test.name);
          
          try {
            const startTime = performance.now();
            const response = await fetch('https://speed.cloudflare.com/__down?bytes=' + test.size, {
              cache: 'no-store',
              mode: 'cors'
            });
            
            if (response.ok) {
              const reader = response.body.getReader();
              let receivedBytes = 0;
              
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                receivedBytes += value.length;
              }
              
              const endTime = performance.now();
              const duration = (endTime - startTime) / 1000;
              
              if (duration > 0 && receivedBytes > 0) {
                const speed = (receivedBytes * 8) / (duration * 1000000);
                totalDownloadSpeed += speed;
                validTests++;
              }
            }
          } catch (error) {
            console.log('下载测试失败:', error);
          }
        }
        
        if (validTests > 0) {
          downloadSpeed = totalDownloadSpeed / validTests;
        }
        
        // 下载测试完成
        updateDownloadProgress(100, '下载测试完成');
        
        // 3. 上传测试 (上传区域显示进度)
        updateUploadProgress(0, '开始上传测试');
        const uploadTests = [
          { size: 10000000, name: '10MB' },
          { size: 20000000, name: '20MB' },
          { size: 50000000, name: '50MB' }
        ];
        
        let totalUploadSpeed = 0;
        let validUploadTests = 0;
        
        for (let testIndex = 0; testIndex < uploadTests.length; testIndex++) {
          const test = uploadTests[testIndex];
          const uploadProgress = (testIndex + 1) / uploadTests.length * 100;
          updateUploadProgress(uploadProgress, '上传测试 ' + test.name);
          
          try {
            const startTime = performance.now();
            const response = await fetch('https://speed.cloudflare.com/__up', {
              method: 'POST',
              body: new Uint8Array(test.size),
              cache: 'no-store',
              mode: 'cors'
            });
            
            if (response.ok) {
              const endTime = performance.now();
              const duration = (endTime - startTime) / 1000;
              
              if (duration > 0) {
                const speed = (test.size * 8) / (duration * 1000000);
                totalUploadSpeed += speed;
                validUploadTests++;
              }
            }
          } catch (error) {
            console.log('上传测试失败:', error);
          }
        }
        
        if (validUploadTests > 0) {
          uploadSpeed = totalUploadSpeed / validUploadTests;
        }
        
        // 上传测试完成
        updateUploadProgress(100, '上传测试完成');
        
      } catch (error) {
        console.log('测速失败:', error);
        updateDownloadProgress(100, '测试失败');
        updateUploadProgress(100, '测试失败');
        updateLatencyProgress(100, '测试失败');
        updateJitterProgress(100, '测试失败');
      }
      
      return {
        download: Math.min(downloadSpeed, 1000),
        upload: Math.min(uploadSpeed, 1000),
        latency: Math.round(latency),
        jitter: Math.round(jitter * 100) / 100
      };
    }
    
    async function speedTest() {
      document.getElementById('download-gauge').innerHTML = '<div style="text-align:center;color:#8fa1c7;padding:20px;">测试中...</div>';
      document.getElementById('upload-gauge').innerHTML = '<div style="text-align:center;color:#8fa1c7;padding:20px;">测试中...</div>';
      document.getElementById('latency-value').textContent = '测试中...';
      document.getElementById('jitter-value').textContent = '测试中...';
      
      try {
        const speedData = await performSpeedTest();
        
        renderGauge('download-gauge', speedData.download, 1000, '#00e6ff', 'Mbps');
        renderGauge('upload-gauge', speedData.upload, 1000, '#00ff99', 'Mbps');
        document.getElementById('latency-value').textContent = speedData.latency;
        document.getElementById('jitter-value').textContent = speedData.jitter;
        
        // 清除进度显示
        document.getElementById('download-progress-bar').style.width = '0%';
        document.getElementById('upload-progress-bar').style.width = '0%';
        document.getElementById('latency-progress-bar').style.width = '0%';
        document.getElementById('jitter-progress-bar').style.width = '0%';
        document.getElementById('download-progress-text').textContent = '';
        document.getElementById('upload-progress-text').textContent = '';
        document.getElementById('latency-progress-text').textContent = '';
        document.getElementById('jitter-progress-text').textContent = '';
        
      } catch (error) {
        console.error('测速失败:', error);
        document.getElementById('download-gauge').innerHTML = '<div style="text-align:center;color:#ff6b6b;padding:20px;">测试失败</div>';
        document.getElementById('upload-gauge').innerHTML = '<div style="text-align:center;color:#ff6b6b;padding:20px;">测试失败</div>';
        document.getElementById('latency-value').textContent = '--';
        document.getElementById('jitter-value').textContent = '--';
        
        // 清除进度显示
        document.getElementById('download-progress-bar').style.width = '0%';
        document.getElementById('upload-progress-bar').style.width = '0%';
        document.getElementById('latency-progress-bar').style.width = '0%';
        document.getElementById('jitter-progress-bar').style.width = '0%';
        document.getElementById('download-progress-text').textContent = '测试失败';
        document.getElementById('upload-progress-text').textContent = '测试失败';
        document.getElementById('latency-progress-text').textContent = '测试失败';
        document.getElementById('jitter-progress-text').textContent = '测试失败';
      }
    }
    
    window.addEventListener('DOMContentLoaded', function() {
      setTimeout(speedTest, 1000);
    });
    
    // 按钮功能函数
    function scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
    
    function toggleTheme() {
      const body = document.body;
      const isDark = body.classList.contains('light-theme');
      
      if (isDark) {
        body.classList.remove('light-theme');
        document.getElementById('theme-toggle').querySelector('.button-icon').textContent = '🌙';
        document.getElementById('theme-toggle').querySelector('.button-text').textContent = '明暗切换';
      } else {
        body.classList.add('light-theme');
        document.getElementById('theme-toggle').querySelector('.button-icon').textContent = '☀️';
        document.getElementById('theme-toggle').querySelector('.button-text').textContent = '明暗切换';
      }
    }
    
    function openGithub() {
      window.open('https://github.com/BAYUEQI/ZQ-IpSpeed', '_blank');
    }
  </script>
</body>
</html>`;
}

// 国旗emoji辅助函数
function getCountryFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode.toUpperCase().split('').map(c =>  127397 + c.charCodeAt());
  const emoji = String.fromCodePoint(...codePoints);
  // 如果emoji渲染为2字母，说明不支持，降级为国家简称
  if (/^[A-Z]{2}$/.test(emoji)) {
    return countryCode.toUpperCase();
  }
  return emoji;
}

// 从多个数据源获取地理位置信息
async function getGeoDataFromMultipleSources(ip) {
  const sources = [
    { name: 'ipapi.co', url: `https://ipapi.co/${ip}/json/` },
    { name: 'ip-api.com', url: `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,query` },
    { name: 'ipinfo.io', url: `https://ipinfo.io/${ip}/json` }
  ];

  for (const source of sources) {
    try {
      console.log(`尝试从 ${source.name} 获取数据...`);
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; IP-Geo-Worker/1.0)'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const geoData = parseGeoData(data, source.name);
        if (geoData && (geoData.latitude !== 'unknown' || geoData.city !== 'unknown')) {
          console.log(`成功从 ${source.name} 获取数据`);
          return geoData;
        }
      }
    } catch (error) {
      console.log(`从 ${source.name} 获取数据失败:`, error.message);
      continue;
    }
  }

  console.log('所有数据源都失败了');
  return null;
}

// 解析不同API返回的地理位置数据
function parseGeoData(data, source) {
  const geoData = {
    data_source: source,
    region: 'unknown',
    city: 'unknown',
    latitude: 'unknown',
    longitude: 'unknown',
    timezone: 'unknown',
    postal_code: 'unknown',
    isp: 'unknown',
    organization: 'unknown',
    asn: 'unknown',
    proxy: '未知',
  };

  try {
    switch (source) {
      case 'ipapi.co':
        geoData.region = data.region || data.region_code || 'unknown';
        geoData.city = data.city || 'unknown';
        geoData.latitude = data.latitude || 'unknown';
        geoData.longitude = data.longitude || 'unknown';
        geoData.timezone = data.timezone || 'unknown';
        geoData.postal_code = data.postal || 'unknown';
        geoData.isp = data.org || 'unknown';
        geoData.organization = data.org || 'unknown';
        geoData.asn = data.asn || 'unknown';
        break;

      case 'ip-api.com':
        if (data.status === 'success') {
          geoData.region = data.regionName || data.region || 'unknown';
          geoData.city = data.city || 'unknown';
          geoData.latitude = data.lat || 'unknown';
          geoData.longitude = data.lon || 'unknown';
          geoData.timezone = data.timezone || 'unknown';
          geoData.postal_code = data.zip || 'unknown';
          geoData.isp = data.isp || 'unknown';
          geoData.organization = data.org || 'unknown';
          geoData.asn = data.as || 'unknown';
          if (typeof data.proxy === 'boolean') geoData.proxy = data.proxy ? '是' : '否';
          else geoData.proxy = '未知';
        }
        break;

      case 'ipinfo.io':
        geoData.region = data.region || 'unknown';
        geoData.city = data.city || 'unknown';
        geoData.latitude = data.loc ? data.loc.split(',')[0] : 'unknown';
        geoData.longitude = data.loc ? data.loc.split(',')[1] : 'unknown';
        geoData.timezone = data.timezone || 'unknown';
        geoData.postal_code = data.postal || 'unknown';
        geoData.isp = data.org || 'unknown';
        geoData.organization = data.org || 'unknown';
        geoData.asn = data.asn || 'unknown';
        break;
    }
  } catch (error) {
    console.log(`解析 ${source} 数据时出错:`, error.message);
  }

  return geoData;
}

// 国家代码到国家名称的映射
function getCountryName(countryCode) {
  const countryNames = {
    'CN': '中国',
    'US': '美国',
    'JP': '日本',
    'KR': '韩国',
    'GB': '英国',
    'DE': '德国',
    'FR': '法国',
    'CA': '加拿大',
    'AU': '澳大利亚',
    'BR': '巴西',
    'IN': '印度',
    'RU': '俄罗斯',
    'IT': '意大利',
    'ES': '西班牙',
    'NL': '荷兰',
    'SE': '瑞典',
    'CH': '瑞士',
    'NO': '挪威',
    'DK': '丹麦',
    'FI': '芬兰',
    'PL': '波兰',
    'CZ': '捷克',
    'AT': '奥地利',
    'BE': '比利时',
    'IE': '爱尔兰',
    'PT': '葡萄牙',
    'GR': '希腊',
    'HU': '匈牙利',
    'RO': '罗马尼亚',
    'BG': '保加利亚',
    'HR': '克罗地亚',
    'SI': '斯洛文尼亚',
    'SK': '斯洛伐克',
    'LT': '立陶宛',
    'LV': '拉脱维亚',
    'EE': '爱沙尼亚',
    'MT': '马耳他',
    'CY': '塞浦路斯',
    'LU': '卢森堡',
    'IS': '冰岛',
    'LI': '列支敦士登',
    'MC': '摩纳哥',
    'SM': '圣马力诺',
    'VA': '梵蒂冈',
    'AD': '安道尔',
    'HK': '香港',
    'TW': '台湾',
    'MO': '澳门',
    'SG': '新加坡',
    'MY': '马来西亚',
    'TH': '泰国',
    'VN': '越南',
    'PH': '菲律宾',
    'ID': '印度尼西亚',
    'unknown': '未知'
  };
  
  return countryNames[countryCode] || countryCode;
}

// UA解析函数
function parseUA(ua) {
  if (!ua || ua === 'unknown') return { device: '未知', browser: '未知' };
  ua = ua.toLowerCase();
  // 设备判断
  let device = 'PC';
  if (/android|iphone|ipad|ipod|mobile|phone|blackberry|iemobile|opera mini|windows phone/.test(ua)) {
    device = '移动设备';
  } else if (/macintosh|mac os x/.test(ua)) {
    device = 'Mac';
  } else if (/windows/.test(ua)) {
    device = 'Windows';
  } else if (/linux/.test(ua)) {
    device = 'Linux';
  }
  // 浏览器判断
  let browser = '未知';
  if (/chrome\/\d+/.test(ua) && !/edge|edg\//.test(ua)) {
    browser = 'Chrome';
  } else if (/edg\//.test(ua)) {
    browser = 'Edge';
  } else if (/firefox\//.test(ua)) {
    browser = 'Firefox';
  } else if (/safari\//.test(ua) && !/chrome\//.test(ua)) {
    browser = 'Safari';
  } else if (/msie|trident/.test(ua)) {
    browser = 'IE';
  } else if (/opera|opr\//.test(ua)) {
    browser = 'Opera';
  }
  return { device, browser };
}

// 获取北京时间字符串
function getBeijingTime() {
  const now = new Date();
  // 北京时间 = UTC+8
  const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000 - now.getTimezoneOffset() * 60 * 1000);
  const pad = n => n.toString().padStart(2, '0');
  return `${beijing.getFullYear()}-${pad(beijing.getMonth() + 1)}-${pad(beijing.getDate())} ${pad(beijing.getHours())}:${pad(beijing.getMinutes())}:${pad(beijing.getSeconds())}`;
} 
