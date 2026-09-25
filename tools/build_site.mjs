#!/usr/bin/env node
/**
 * build_site.mjs —— TypeSafe 中文文档的自托管静态站点生成器
 * ---------------------------------------------------------------------------
 * 把 Mintlify 格式的文档仓库（docs.json + 无 front-matter 的 *.md + MDX 组件）
 * 构建成一套纯静态 HTML，可脱离 Mintlify 云服务直接部署到任意静态服务器。
 *
 * 用法：
 *   node tools/build_site.mjs [--base /typesafe/] [--out dist] [--site-name "名称"]
 *
 * 依赖（全部 vendored，无需 npm install / 全局安装）：
 *   tools/vendor/marked.umd.js   marked v15.0.7  UMD 构建
 *                                https://unpkg.com/marked@15.0.7/lib/marked.umd.js
 *                                来源 https://github.com/markedjs/marked  许可证 MIT
 *   tools/vendor/fonts/inter-latin-wght-normal.woff2          Inter 可变字重（OFL）
 *   tools/vendor/fonts/jetbrains-mono-latin-wght-normal.woff2 JetBrains Mono 可变字重（OFL）
 *                               代码字体用 JetBrains Mono 顶替原站的 paperMono（Mintlify 品牌字体，
 *                               不再分发）；拿到授权后替换字体栈首项即可，详见 STYLE_CSS 顶部注释。
 *   tools/vendor/mermaid.min.js  mermaid v10.9.1 UMD 构建（仅在含 mermaid 的页面按需加载）
 *                                https://unpkg.com/mermaid@10.9.1/dist/mermaid.min.js
 *                                来源 https://github.com/mermaid-js/mermaid  许可证 MIT
 *
 * 图标来自 lucide（ISC 许可证，https://github.com/lucide-icons/lucide），
 * 以 SVG path 字符串内联在本文件里，构建时不发任何外部请求。
 *
 * 视觉规格 = docs.typesafe.ai（Mintlify sequoia 主题）实测 computed style，见 _orig/SPEC.md。
 * 中文可读性基线参考 clreq + WCAG 2.2 AA：正文 18px / 行高 1.75 / 每行 ≤40 汉字 /
 * 文字对比度 ≥5:1（最低 4.5:1）、可点击目标 ≥24px。
 * ---------------------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const REPO_ROOT = path.resolve(__dirname, '..');

/* ------------------------------------------------------------------ 图标 */

const ICONS = {
  "arrow-left": "<path d=\"m12 19-7-7 7-7\" /><path d=\"M19 12H5\" />",
  "arrow-right": "<path d=\"M5 12h14\" /><path d=\"m12 5 7 7-7 7\" />",
  "arrow-up-down": "<path d=\"m21 16-4 4-4-4\" /><path d=\"M17 20V4\" /><path d=\"m3 8 4-4 4 4\" /><path d=\"M7 4v16\" />",
  "badge-check": "<path d=\"M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z\" /><path d=\"m9 12 2 2 4-4\" />",
  "binary": "<rect x=\"14\" y=\"14\" width=\"4\" height=\"6\" rx=\"2\" /><rect x=\"6\" y=\"4\" width=\"4\" height=\"6\" rx=\"2\" /><path d=\"M6 20h4\" /><path d=\"M14 10h4\" /><path d=\"M6 14h2v6\" /><path d=\"M14 4h2v6\" />",
  "blocks": "<rect width=\"7\" height=\"7\" x=\"14\" y=\"3\" rx=\"1\" /><path d=\"M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3\" />",
  "book-open": "<path d=\"M12 5v16\" /><path d=\"M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z\" />",
  "chef-hat": "<path d=\"M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z\" /><path d=\"M6 17h12\" />",
  "braces": "<path d=\"M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1\" /><path d=\"M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1\" />",
  "brain-circuit": "<path d=\"M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z\" /><path d=\"M9 13a4.5 4.5 0 0 0 3-4\" /><path d=\"M6.003 5.125A3 3 0 0 0 6.401 6.5\" /><path d=\"M3.477 10.896a4 4 0 0 1 .585-.396\" /><path d=\"M6 18a4 4 0 0 1-1.967-.516\" /><path d=\"M12 13h4\" /><path d=\"M12 18h6a2 2 0 0 1 2 2v1\" /><path d=\"M12 8h8\" /><path d=\"M16 8V5a2 2 0 0 1 2-2\" /><circle cx=\"16\" cy=\"13\" r=\".5\" /><circle cx=\"18\" cy=\"3\" r=\".5\" /><circle cx=\"20\" cy=\"21\" r=\".5\" /><circle cx=\"20\" cy=\"8\" r=\".5\" />",
  "chart-no-axes-combined": "<path d=\"M12 16v5\" /><path d=\"M16 14v7\" /><path d=\"M20 10v11\" /><path d=\"m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15\" /><path d=\"M4 18v3\" /><path d=\"M8 14v7\" />",
  "chart-spline": "<path d=\"M3 3v16a2 2 0 0 0 2 2h16\" /><path d=\"M7 16c.5-2 1.5-7 4-7 2 0 2 3 4 3 2.5 0 4.5-5 5-7\" />",
  "check": "<path d=\"M20 6 9 17l-5-5\" />",
  "chevron-left": "<path d=\"m15 18-6-6 6-6\" />",
  "chevron-down": "<path d=\"m6 9 6 6 6-6\" />",
  "chevron-right": "<path d=\"m9 18 6-6-6-6\" />",
  "circle-check": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><path d=\"m9 12 2 2 4-4\" />",
  "clipboard-check": "<rect width=\"8\" height=\"4\" x=\"8\" y=\"2\" rx=\"1\" ry=\"1\" /><path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\" /><path d=\"m9 14 2 2 4-4\" />",
  "code": "<path d=\"m16 18 6-6-6-6\" /><path d=\"m8 6-6 6 6 6\" />",
  "copy": "<rect width=\"14\" height=\"14\" x=\"8\" y=\"8\" rx=\"2\" ry=\"2\" /><path d=\"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2\" />",
  "database-zap": "<ellipse cx=\"12\" cy=\"5\" rx=\"9\" ry=\"3\" /><path d=\"M3 5V19A9 3 0 0 0 15 21.84\" /><path d=\"M21 5V8\" /><path d=\"M21 12L18 17H22L19 22\" /><path d=\"M3 12A9 3 0 0 0 14.59 14.87\" />",
  "external-link": "<path d=\"M15 3h6v6\" /><path d=\"M10 14 21 3\" /><path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\" />",
  "flask-conical": "<path d=\"M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2\" /><path d=\"M6.453 15h11.094\" /><path d=\"M8.5 2h7\" />",
  "gamepad-2": "<line x1=\"6\" x2=\"10\" y1=\"11\" y2=\"11\" /><line x1=\"8\" x2=\"8\" y1=\"9\" y2=\"13\" /><line x1=\"15\" x2=\"15.01\" y1=\"12\" y2=\"12\" /><line x1=\"18\" x2=\"18.01\" y1=\"10\" y2=\"10\" /><path d=\"M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z\" />",
  "gauge": "<path d=\"m12 14 4-4\" /><path d=\"M3.34 19a10 10 0 1 1 17.32 0\" />",
  "github": "<path d=\"M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4\" /><path d=\"M9 18c-4.51 2-5-2-7-2\" />",
  "globe": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><path d=\"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20\" /><path d=\"M2 12h20\" />",
  "hash": "<line x1=\"4\" x2=\"20\" y1=\"9\" y2=\"9\" /><line x1=\"4\" x2=\"20\" y1=\"15\" y2=\"15\" /><line x1=\"10\" x2=\"8\" y1=\"3\" y2=\"21\" /><line x1=\"16\" x2=\"14\" y1=\"3\" y2=\"21\" />",
  "headset": "<path d=\"M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z\" /><path d=\"M21 16v2a4 4 0 0 1-4 4h-5\" />",
  "info": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><path d=\"M12 16v-4\" /><path d=\"M12 8h.01\" />",
  "landmark": "<line x1=\"3\" x2=\"21\" y1=\"22\" y2=\"22\" /><line x1=\"6\" x2=\"6\" y1=\"18\" y2=\"11\" /><line x1=\"10\" x2=\"10\" y1=\"18\" y2=\"11\" /><line x1=\"14\" x2=\"14\" y1=\"18\" y2=\"11\" /><line x1=\"18\" x2=\"18\" y1=\"18\" y2=\"11\" /><polygon points=\"12 2 20 7 4 7\" />",
  "lightbulb": "<path d=\"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5\" /><path d=\"M9 18h6\" /><path d=\"M10 22h4\" />",
  "list": "<path d=\"M3 12h.01\" /><path d=\"M3 18h.01\" /><path d=\"M3 6h.01\" /><path d=\"M8 12h13\" /><path d=\"M8 18h13\" /><path d=\"M8 6h13\" />",
  "megaphone": "<path d=\"m3 11 18-5v12L3 14v-3z\" /><path d=\"M11.6 16.8a3 3 0 1 1-5.8-1.6\" />",
  "menu": "<line x1=\"4\" x2=\"20\" y1=\"12\" y2=\"12\" /><line x1=\"4\" x2=\"20\" y1=\"6\" y2=\"6\" /><line x1=\"4\" x2=\"20\" y1=\"18\" y2=\"18\" />",
  "messages-square": "<path d=\"M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z\" /><path d=\"M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1\" />",
  "monitor": "<rect width=\"20\" height=\"14\" x=\"2\" y=\"3\" rx=\"2\" /><line x1=\"8\" x2=\"16\" y1=\"21\" y2=\"21\" /><line x1=\"12\" x2=\"12\" y1=\"17\" y2=\"21\" />",
  "moon": "<path d=\"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401\" />",
  "network": "<rect x=\"16\" y=\"16\" width=\"6\" height=\"6\" rx=\"1\" /><rect x=\"2\" y=\"16\" width=\"6\" height=\"6\" rx=\"1\" /><rect x=\"9\" y=\"2\" width=\"6\" height=\"6\" rx=\"1\" /><path d=\"M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3\" /><path d=\"M12 12V8\" />",
  "panel-left": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" /><path d=\"M9 3v18\" />",
  "pen-tool": "<path d=\"M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z\" /><path d=\"m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18\" /><path d=\"m2.3 2.3 7.286 7.286\" /><circle cx=\"11\" cy=\"11\" r=\"2\" />",
  "repeat-2": "<path d=\"m2 9 3-3 3 3\" /><path d=\"M13 18H7a2 2 0 0 1-2-2V6\" /><path d=\"m22 15-3 3-3-3\" /><path d=\"M11 6h6a2 2 0 0 1 2 2v10\" />",
  "route": "<circle cx=\"6\" cy=\"19\" r=\"3\" /><path d=\"M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15\" /><circle cx=\"18\" cy=\"5\" r=\"3\" />",
  "scale": "<path d=\"m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z\" /><path d=\"m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z\" /><path d=\"M7 21h10\" /><path d=\"M12 3v18\" /><path d=\"M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2\" />",
  "search": "<circle cx=\"11\" cy=\"11\" r=\"8\" /><path d=\"m21 21-4.3-4.3\" />",
  "shield": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\" />",
  "shield-check": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\" /><path d=\"m9 12 2 2 4-4\" />",
  "split": "<path d=\"M16 3h5v5\" /><path d=\"M8 3H3v5\" /><path d=\"M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3\" /><path d=\"m15 9 6-6\" />",
  "store": "<path d=\"m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7\" /><path d=\"M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8\" /><path d=\"M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4\" /><path d=\"M2 7h20\" /><path d=\"M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7\" />",
  "sun": "<circle cx=\"12\" cy=\"12\" r=\"4\" /><path d=\"M12 2v2\" /><path d=\"M12 20v2\" /><path d=\"m4.93 4.93 1.41 1.41\" /><path d=\"m17.66 17.66 1.41 1.41\" /><path d=\"M2 12h2\" /><path d=\"M20 12h2\" /><path d=\"m6.34 17.66-1.41 1.41\" /><path d=\"m19.07 4.93-1.41 1.41\" />",
  "triangle-alert": "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3\" /><path d=\"M12 9v4\" /><path d=\"M12 17h.01\" />",
  "user-round-search": "<circle cx=\"10\" cy=\"8\" r=\"5\" /><path d=\"M2 21a8 8 0 0 1 10.434-7.62\" /><circle cx=\"18\" cy=\"18\" r=\"3\" /><path d=\"m22 22-1.9-1.9\" />",
  "users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\" /><circle cx=\"9\" cy=\"7\" r=\"4\" /><path d=\"M22 21v-2a4 4 0 0 0-3-3.87\" /><path d=\"M16 3.13a4 4 0 0 1 0 7.75\" />",
  "wrench": "<path d=\"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z\" />",
  "x": "<path d=\"M18 6 6 18\" /><path d=\"m6 6 12 12\" />",
  "zap": "<path d=\"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z\" />",
};

const FALLBACK_ICON = 'info';

/**
 * 内联一个 lucide 图标。
 * @param {string} name  ICONS 里的图标名
 * @param {string} cls   class（.ic 是基础类，.ic-sm=16px / .ic-lg=18px 控制尺寸）
 * @param {number} [stroke] 描边宽度。默认 1.75；原站顶栏 tab 图标是 CSS mask 加载的
 *                          lucide 原文件（stroke-width=2），要那些位置传 2 才能对齐。
 */
function icon(name, cls = 'ic', stroke = 1.75) {
  const body = ICONS[name] || ICONS[FALLBACK_ICON] || '';
  return '<svg class="' + cls + '" viewBox="0 0 24 24" width="18" height="18" fill="none" ' +
    'stroke="currentColor" stroke-width="' + stroke + '" stroke-linecap="round" stroke-linejoin="round" ' +
    'aria-hidden="true" focusable="false">' + body + '</svg>';
}

/* ------------------------------------------------------------ 命令行参数 */

function parseArgs(argv) {
  const opts = { base: '/', out: 'dist', siteName: null, quiet: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const eq = a.indexOf('=');
    const key = eq > -1 ? a.slice(0, eq) : a;
    const inlineVal = eq > -1 ? a.slice(eq + 1) : null;
    const next = () => (inlineVal !== null ? inlineVal : argv[++i]);
    switch (key) {
      case '--base': opts.base = next(); break;
      case '--out': opts.out = next(); break;
      case '--site-name': case '--siteName': opts.siteName = next(); break;
      case '--quiet': opts.quiet = true; break;
      case '--help': case '-h': opts.help = true; break;
      default:
        if (key.startsWith('--')) throw new Error('未知参数：' + key);
    }
  }
  if (opts.help) return opts;
  let base = String(opts.base || '/').trim();
  if (!base.startsWith('/')) base = '/' + base;
  if (!base.endsWith('/')) base += '/';
  base = base.replace(/\/{2,}/g, '/');
  opts.base = base;
  opts.out = path.resolve(process.cwd(), opts.out || 'dist');
  return opts;
}

/* ------------------------------------------------------------------ 工具 */

const HTML_ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => HTML_ESC[c]);
const escText = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function stripTags(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function collapseWs(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }

/** 去掉 markdown 行内标记，得到用于 slug / TOC / 搜索的纯文本 */
function stripInlineMarkdown(s) {
  return String(s || '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\\([\\`*_{}\[\]()#+\-.!])/g, '$1')
    .trim();
}

/** 生成锚点 id：保留中日韩文字，其余按 GitHub 风格处理 */
function slugify(text) {
  const base = stripInlineMarkdown(stripTags(text))
    .toLowerCase()
    .replace(/[\s\u3000]+/g, '-')
    .replace(/[^\p{L}\p{N}_-]+/gu, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'section';
}

function mkdirp(dir) { fs.mkdirSync(dir, { recursive: true }); }

function writeFileEnsured(file, content) {
  mkdirp(path.dirname(file));
  fs.writeFileSync(file, content, 'utf8');
}

/* ------------------------------------------------------------ JSX 辅助 */

/**
 * 从 src[i]（必须是 '<'）读出一个标签，返回 { name, attrsRaw, selfClosing, end }。
 * 正确处理引号、花括号嵌套（example={{...}}）与自闭合斜杠。
 */
function readTag(src, i) {
  if (src[i] !== '<') return null;
  let j = i + 1;
  if (!/[A-Za-z]/.test(src[j] || '')) return null;
  let name = '';
  while (j < src.length && /[A-Za-z0-9_$.:-]/.test(src[j])) name += src[j++];
  let depth = 0, quote = null, attrsRaw = '';
  while (j < src.length) {
    const c = src[j];
    if (quote) {
      if (c === '\\') { attrsRaw += c + (src[j + 1] || ''); j += 2; continue; }
      if (c === quote) quote = null;
      attrsRaw += c; j++; continue;
    }
    if (c === '"' || c === "'") { quote = c; attrsRaw += c; j++; continue; }
    if (c === '{') { depth++; attrsRaw += c; j++; continue; }
    if (c === '}') { depth--; attrsRaw += c; j++; continue; }
    if (c === '>' && depth <= 0) break;
    attrsRaw += c; j++;
  }
  let selfClosing = false;
  if (/\/\s*$/.test(attrsRaw)) { selfClosing = true; attrsRaw = attrsRaw.replace(/\/\s*$/, ''); }
  return { name, attrsRaw, selfClosing, end: Math.min(j + 1, src.length) };
}

/** 解析 JSX 属性串 -> 普通对象；无值属性为 true */
function parseAttrs(attrsRaw) {
  const attrs = {};
  let i = 0;
  const s = attrsRaw;
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i])) i++;
    if (i >= s.length) break;
    let name = '';
    while (i < s.length && /[A-Za-z0-9_$.:-]/.test(s[i])) name += s[i++];
    if (!name) { i++; continue; }
    while (i < s.length && /\s/.test(s[i])) i++;
    if (s[i] !== '=') { attrs[name] = true; continue; }
    i++;
    while (i < s.length && /\s/.test(s[i])) i++;
    let value = '';
    if (s[i] === '"' || s[i] === "'") {
      const q = s[i++];
      while (i < s.length && s[i] !== q) {
        if (s[i] === '\\' && s[i + 1] === q) { value += q; i += 2; continue; }
        value += s[i++];
      }
      i++;
      attrs[name] = value;
    } else if (s[i] === '{') {
      let depth = 0;
      let buf = '';
      while (i < s.length) {
        const c = s[i];
        if (c === '{') { depth++; if (depth === 1) { i++; continue; } }
        else if (c === '}') { depth--; if (depth === 0) { i++; break; } }
        buf += c; i++;
      }
      attrs[name] = buf.trim();
    } else {
      while (i < s.length && !/\s/.test(s[i])) value += s[i++];
      attrs[name] = value;
    }
  }
  return attrs;
}

/** 把 JSX 的 style={{ ... }} 对象字面量转成 CSS 文本 */
function jsxStyleToCss(objSrc) {
  const parts = splitTopLevel(objSrc, ',');
  const out = [];
  for (const part of parts) {
    const idx = part.indexOf(':');
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim().replace(/^["']|["']$/g, '');
    let val = part.slice(idx + 1).trim().replace(/,\s*$/, '').trim();
    if (!key || !val) continue;
    if (val.startsWith('{')) continue;
    const q = val[0];
    if (q === '"' || q === "'") {
      const end = val.lastIndexOf(q);
      if (end > 0) val = val.slice(1, end);
    }
    const cssKey = key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
    out.push(cssKey + ':' + val);
  }
  return out.join(';');
}

/** 按顶层分隔符切分（忽略括号/引号内的分隔符） */
function splitTopLevel(src, sep) {
  const out = [];
  let depth = 0, quote = null, buf = '';
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      buf += c;
      if (c === '\\') { buf += src[++i] || ''; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; buf += c; continue; }
    if (c === '{' || c === '(' || c === '[') depth++;
    if (c === '}' || c === ')' || c === ']') depth--;
    if (c === sep && depth === 0) { out.push(buf); buf = ''; continue; }
    buf += c;
  }
  out.push(buf);
  return out;
}

/** 去掉每行公共缩进 */
function dedent(text) {
  const lines = String(text).replace(/\r\n?/g, '\n').split('\n');
  let min = Infinity;
  for (const l of lines) {
    if (!l.trim()) continue;
    const m = l.match(/^[ \t]*/)[0].length;
    if (m < min) min = m;
  }
  if (!isFinite(min) || min === 0) return lines.join('\n');
  return lines.map((l) => (l.trim() ? l.slice(min) : '')).join('\n');
}


/* ==================================================================== *
 *  第一部分：MDX 预处理
 *  把 Mintlify 的 MDX（17 种组件 + 原始 JSX/HTML）转成普通 HTML，
 *  再交给 marked 渲染 markdown。
 * ==================================================================== */

const CALLOUTS = {
  Note: { icon: 'info', cls: 'note' },
  Info: { icon: 'info', cls: 'info' },
  Tip: { icon: 'lightbulb', cls: 'tip' },
  Warning: { icon: 'triangle-alert', cls: 'warning' },
};

const BLOCK_COMPONENTS = new Set([
  'Accordion', 'AccordionGroup', 'Card', 'CardGroup', 'CodeGroup', 'Columns',
  'Expandable', 'Frame', 'Info', 'Note', 'ParamField', 'ResponseField',
  'SdkSignature', 'Step', 'Steps', 'Tab', 'Tabs', 'Tip', 'TypesafeExample', 'Warning',
  'ConfidenceExplorer', 'ScoreExplorer',
]);

/** 明确知道无法在静态站里跑的交互式组件 —— 给出说明而不是吐裸标签 */
const JS_RUNTIME_COMPONENTS = {
  ConfidenceExplorer: '概率 / 置信度交互探索器',
  ScoreExplorer: 'Score 答案交互探索器',
};

const LANG_LABEL = {
  bash: 'Shell', sh: 'Shell', shell: 'Shell', zsh: 'Shell', console: 'Shell',
  js: 'JavaScript', javascript: 'JavaScript', ts: 'TypeScript', typescript: 'TypeScript',
  tsx: 'TSX', jsx: 'JSX', json: 'JSON', jsonc: 'JSON', yaml: 'YAML', yml: 'YAML',
  py: 'Python', python: 'Python', text: 'Text', plaintext: 'Text', txt: 'Text',
  html: 'HTML', css: 'CSS', md: 'Markdown', markdown: 'Markdown', sql: 'SQL',
  go: 'Go', rust: 'Rust', java: 'Java', ruby: 'Ruby', php: 'PHP', diff: 'Diff',
  ini: 'INI', toml: 'TOML', xml: 'XML', http: 'HTTP', graphql: 'GraphQL',
  mermaid: 'Mermaid',
};

function prettyLang(lang) {
  if (!lang) return '';
  return LANG_LABEL[lang.toLowerCase()] || lang;
}

/* ------------------------------------------------------- 实体 / JS 字符串 */

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…',
  mdash: '—', ndash: '–', times: '×', laquo: '«', raquo: '»', copy: '©', reg: '®',
};

function decodeEntities(s) {
  return String(s == null ? '' : s).replace(/&(#x?[0-9A-Fa-f]+|[A-Za-z][A-Za-z0-9]*);/g, (m, body) => {
    if (body[0] === '#') {
      const hex = body[1] === 'x' || body[1] === 'X';
      const code = parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
      if (Number.isFinite(code)) { try { return String.fromCodePoint(code); } catch (e) { return m; } }
      return m;
    }
    const named = NAMED_ENTITIES[body];
    return named === undefined ? m : named;
  });
}

/** 解析 JS 字符串字面量里的转义；换行先变成占位符，避免后续空白规整吃掉它 */
const NL_SENTINEL = '\u0001';
function decodeJsString(raw) {
  return String(raw)
    .replace(/\\n/g, NL_SENTINEL)
    .replace(/\\t/g, '    ')
    .replace(/\\(["'`\\/])/g, '$1')
    .replace(/\\u([0-9a-fA-F]{4})/g, (m, h) => String.fromCharCode(parseInt(h, 16)));
}

/* --------------------------------------------------------------- ESM 剥离 */

/**
 * 删掉 MDX 顶层的 export / import 语句块（例如 export function SdkSignature() { ... }）。
 * 逐行扫描并跟踪三反引号围栏，避免误删代码块里的 import 语句。
 */
function stripEsmBlocks(text) {
  const lines = text.split('\n');
  const out = [];
  let inFence = false;
  let i = 0;
  let removed = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^[ \t]*(`{3,}|~{3,})/.test(line)) { inFence = !inFence; out.push(line); i++; continue; }
    if (!inFence && /^(export|import)\s/.test(line)) {
      let depth = 0, started = false;
      while (i < lines.length) {
        const l = lines[i];
        for (const ch of l) {
          if (ch === '{') { depth++; started = true; }
          else if (ch === '}') depth--;
        }
        const isBlockEnd = started && depth <= 0 && /^}/.test(l);
        const isSimpleEnd = !started && /;\s*$/.test(l);
        i++;
        if (isBlockEnd || isSimpleEnd) break;
      }
      removed++;
      continue;
    }
    out.push(line);
    i++;
  }
  if (removed) out.push('');
  return out.join('\n');
}

/* ------------------------------------------------------------- 代码块围栏 */

function parseFenceInfo(info) {
  const tokens = [];
  let i = 0;
  const s = String(info || '').trim();
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i])) i++;
    if (i >= s.length) break;
    let tok = '';
    while (i < s.length && !/\s/.test(s[i])) {
      if (s[i] === '=' && (s[i + 1] === '"' || s[i + 1] === "'")) {
        const q = s[i + 1];
        tok += s[i] + s[i + 1];
        i += 2;
        while (i < s.length && s[i] !== q) tok += s[i++];
        if (i < s.length) tok += s[i++];
        continue;
      }
      tok += s[i++];
    }
    tokens.push(tok);
  }
  const FLAGS = new Set(['wrap', 'expandable', 'actions', 'lines', 'focus', 'highlight', 'copy', 'editable']);
  let lang = null, title = null;
  for (const tok of tokens) {
    const kv = tok.match(/^([A-Za-z-]+)=(.*)$/);
    if (kv) {
      let v = kv[2];
      if ((v[0] === '"' && v.endsWith('"')) || (v[0] === "'" && v.endsWith("'"))) v = v.slice(1, -1);
      if (kv[1] === 'title' && !title) title = v;
      continue;
    }
    if (FLAGS.has(tok.toLowerCase())) continue;
    if (lang === null && /^[A-Za-z0-9_+#.-]+$/.test(tok)) { lang = tok; continue; }
    if (title === null) title = tok;
  }
  return { lang: lang ? lang.toLowerCase() : null, title };
}

/* --------------------------------------------------------------- 语法高亮 */

/* 配色取自原站 shiki 的 dark-plus / github-light-default 两套主题（见 .tk-* 规则） */
const HL_KW = {
  js: 'const let var function return if else for while do break continue new class extends import from export default async await try catch finally throw typeof instanceof this super null undefined true false switch case delete in of yield static get set interface type enum implements public private protected readonly declare namespace module as satisfies keyof infer',
  py: 'def class return if elif else for while break continue import from as pass raise try except finally with lambda yield global nonlocal assert del in is not and or None True False async await self match case',
  sh: 'if then else elif fi for while until do done case esac function return export local source alias unset readonly declare echo cd set curl wget sudo apt brew pip npm npx docker git',
  json: 'true false null',
  yaml: 'true false null yes no on off',
  toml: 'true false',
  sql: 'SELECT FROM WHERE INSERT INTO VALUES UPDATE DELETE SET JOIN LEFT RIGHT INNER OUTER ON GROUP BY ORDER HAVING LIMIT OFFSET CREATE TABLE INDEX VIEW DROP ALTER ADD PRIMARY KEY FOREIGN REFERENCES NOT NULL DEFAULT AS AND OR IN LIKE BETWEEN IS DISTINCT UNION ALL CASE WHEN THEN END',
  go: 'func package import var const type struct interface return if else for range go defer chan map make new nil true false switch case select break continue',
  rust: 'fn let mut const struct enum impl trait pub use mod match if else loop while for in return self Self true false async await move ref where crate super',
  java: 'public private protected class interface extends implements void int long double float boolean char String new return if else for while static final abstract try catch finally throw throws import package null true false this super',
  css: 'important media supports keyframes import charset',
};
const HL_KWSET = {};
for (const key of Object.keys(HL_KW)) HL_KWSET[key] = new Set(HL_KW[key].split(/\s+/));

const HL_COMMENT = {
  js: ['//', '/*'], py: ['#'], sh: ['#'], yaml: ['#'], toml: ['#'], json: [], jsonc: ['//'],
  sql: ['--'], css: ['/*'], html: ['<!--'], go: ['//', '/*'], rust: ['//', '/*'], java: ['//', '/*'],
};

function hlFamily(lang) {
  const l = String(lang || '').toLowerCase();
  if (!l) return null;
  if (['js', 'javascript', 'ts', 'typescript', 'jsx', 'tsx', 'mjs', 'cjs', 'node'].indexOf(l) > -1) return 'js';
  if (l === 'jsonc') return 'jsonc';
  if (l === 'json') return 'json';
  if (['py', 'python'].indexOf(l) > -1) return 'py';
  if (['bash', 'sh', 'shell', 'zsh', 'console', 'curl'].indexOf(l) > -1) return 'sh';
  if (['yaml', 'yml'].indexOf(l) > -1) return 'yaml';
  if (['toml', 'ini', 'conf'].indexOf(l) > -1) return 'toml';
  if (l === 'sql') return 'sql';
  if (l === 'go') return 'go';
  if (l === 'rust') return 'rust';
  if (l === 'java') return 'java';
  if (l === 'css') return 'css';
  if (['html', 'xml', 'svg'].indexOf(l) > -1) return 'html';
  if (['http', 'https'].indexOf(l) > -1) return 'http';
  return null;
}

/** HTTP 报文：按行着色（方法名 + 头字段名） */
function highlightHttp(code) {
  return String(code).split('\n').map(function (line) {
    if (line.charAt(0) === '#') return '<span class="tk-c">' + escText(line) + '</span>';
    const m = line.match(/^([A-Z]{3,7})(\s+)([\s\S]*)$/);
    if (m) return '<span class="tk-k">' + escText(m[1]) + '</span>' + escText(m[2]) + escText(m[3]);
    const h = line.match(/^([A-Za-z][A-Za-z0-9-]*)(:\s*)([\s\S]*)$/);
    if (h) return '<span class="tk-p">' + escText(h[1]) + '</span>' + escText(h[2]) + escText(h[3]);
    return escText(line);
  }).join('\n');
}

/**
 * 轻量语法高亮：词法级着色，逐段转义后输出，绝不改动原文一个字符。
 * 覆盖站内出现的全部语言族；识别不了的语言直接原样输出。
 */
function highlightCode(code, lang) {
  const text = String(code == null ? '' : code);
  const fam = hlFamily(lang);
  if (!fam) return escText(text);
  if (fam === 'http') return highlightHttp(text);
  const kw = HL_KWSET[fam] || HL_KWSET.js;
  const commentHeads = HL_COMMENT[fam] || [];
  const n = text.length;
  let out = '';
  let buf = '';
  let i = 0;
  const flush = () => { if (buf) { out += escText(buf); buf = ''; } };
  const emit = (cls, s) => { flush(); out += '<span class="' + cls + '">' + escText(s) + '</span>'; };
  const isWord = (ch) => /[A-Za-z0-9_$]/.test(ch);
  while (i < n) {
    const c = text[i];
    let hit = null;
    for (const h of commentHeads) { if (text.startsWith(h, i)) { hit = h; break; } }
    if (hit) {
      let j;
      if (hit === '/*') { const k = text.indexOf('*/', i + 2); j = k === -1 ? n : k + 2; }
      else if (hit === '<!--') { const k = text.indexOf('-->', i + 4); j = k === -1 ? n : k + 3; }
      else { j = text.indexOf('\n', i); if (j === -1) j = n; }
      emit('tk-c', text.slice(i, j));
      i = j;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n) {
        if (text[j] === '\\') { j += 2; continue; }
        if (text[j] === c) { j++; break; }
        if (text[j] === '\n') break;
        j++;
      }
      const raw = text.slice(i, j);
      let k = j;
      while (k < n && (text[k] === ' ' || text[k] === '\t')) k++;
      const isKey = (fam === 'json' || fam === 'jsonc' || fam === 'yaml') && text[k] === ':';
      emit(isKey ? 'tk-p' : 'tk-s', raw);
      i = j;
      continue;
    }
    if (c >= '0' && c <= '9' && !isWord(text[i - 1] || '')) {
      let j = i;
      while (j < n && /[0-9a-fA-FxX._]/.test(text[j])) j++;
      emit('tk-n', text.slice(i, j));
      i = j;
      continue;
    }
    if (fam === 'sh' && c === '-' && !isWord(text[i - 1] || '') && /[A-Za-z-]/.test(text[i + 1] || '')) {
      let j = i + 1;
      while (j < n && /[A-Za-z0-9-]/.test(text[j])) j++;
      emit('tk-k', text.slice(i, j));
      i = j;
      continue;
    }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i;
      while (j < n && isWord(text[j])) j++;
      const word = text.slice(i, j);
      let cls = '';
      if (kw.has(word)) cls = 'tk-k';
      else if (fam === 'sh' && c === '$') cls = 'tk-p';
      else {
        let k = j;
        while (k < n && text[k] === ' ') k++;
        if (text[k] === '(') cls = 'tk-f';
        else if (/^[A-Z]/.test(word) && fam !== 'sh' && fam !== 'sql') cls = 'tk-t';
      }
      if (cls) emit(cls, word); else buf += word;
      i = j;
      continue;
    }
    buf += c;
    i++;
  }
  flush();
  return out;
}

function copyButtonHtml(label) {
  return '<button class="code-copy" type="button" data-copy aria-label="' + esc(label || '复制代码') + '" ' +
    'title="' + esc(label || '复制代码') + '">' +
    icon('copy', 'ic ic-copy') + icon('check', 'ic ic-copied') +
    '<span class="code-copy-text">' + esc(label || '复制代码') + '</span></button>';
}

function codeBlockHtml(code, info, ctx) {
  const parsed = parseFenceInfo(info);
  const lang = parsed.lang, title = parsed.title;
  if (lang === 'mermaid') {
    ctx.hasMermaid = true;
    const src = String(code).replace(/\s+$/, '');
    // 原站的 mermaid 区块是无边框、无标题栏的裸图（图本身由 mermaid 画白底）
    return '<div class="code-block mermaid-block" data-mermaid-block>' +
      '<div class="code-bar">' + copyButtonHtml('复制图表源码') + '</div>' +
      '<div class="mermaid" data-src="' + esc(src) + '">' + escText(src) + '</div>' +
      '</div>';
  }
  // 原站只在围栏显式写了 title= 时才显示标题栏；单纯给了语言名不显示（只有右上角复制按钮）
  const label = title || '';
  const hasTitle = !!label;
  return '<div class="code-block' + (hasTitle ? ' has-title' : '') + '"' +
    (lang ? ' data-lang="' + esc(lang) + '"' : '') + '>' +
    '<div class="code-bar">' +
    (hasTitle ? '<span class="code-lang">' + esc(label) + '</span>' : '') +
    copyButtonHtml('复制代码') +
    '</div>' +
    '<pre tabindex="0"><code' + (lang ? ' class="language-' + esc(lang) + '"' : '') + '>' +
    highlightCode(code, lang) + '</code></pre>' +
    '</div>';
}

/**
 * 从左到右单趟扫描，把「代码围栏 / 行内代码 / MDX 组件」三类结构就地替换成占位符。
 *
 * 必须放在同一趟扫描里：围栏里可能出现组件名（不能被当成组件），
 * 组件里也经常嵌代码块（不能被外层当成顶层围栏吃掉）。
 * 谁先出现谁先被消费，天然解决了这两种嵌套。
 */
function fenceStartAt(text, i) {
  let j = i;
  while (j > 0 && text[j - 1] !== '\n') {
    if (text[j - 1] !== ' ' && text[j - 1] !== '\t') return null;
    j--;
  }
  const m = text.slice(i).match(/^(`{3,}|~{3,})([^\n]*)/);
  if (!m) return null;
  return { indent: text.slice(j, i), fence: m[1], info: m[2].trim(), lineEnd: i + m[0].length };
}

function maskBlocks(text, store, ctx) {
  const BT = '`';
  let out = '';
  let i = 0;
  while (i < text.length) {
    const c = text[i];

    // 反斜杠转义：原样跳过两个字符
    if (c === '\\') { out += text.slice(i, i + 2); i += 2; continue; }

    if (c === BT) {
      const f = fenceStartAt(text, i);
      if (f) {
        const fenceChar = f.fence[0];
        const fenceLen = f.fence.length;
        const nl = text.indexOf('\n', f.lineEnd);
        const bodyStart = nl === -1 ? text.length : nl + 1;
        const closeRe = new RegExp('^[ \\t]*' + (fenceChar === BT ? BT : '~') + '{' + fenceLen + ',}[ \\t]*$', 'gm');
        closeRe.lastIndex = 0;
        const rest = text.slice(bodyStart);
        const cm = closeRe.exec(rest);
        const body = cm ? rest.slice(0, cm.index) : rest;
        const next = cm ? bodyStart + cm.index + cm[0].length : text.length;
        if (!cm) ctx.warnings.push('代码围栏未闭合（' + ctx.page + '）');
        const id = store.length;
        store.push(codeBlockHtml(dedent(body.replace(/\n$/, '')), f.info, ctx));
        out += f.indent + '<div data-dsh-block="' + id + '"></div>';
        i = next;
        continue;
      }
      // 行内代码
      let n = 0;
      while (text[i + n] === BT) n++;
      const opener = BT.repeat(n);
      const closer = text.indexOf(opener, i + n);
      if (closer > -1) {
        let inner = text.slice(i + n, closer);
        if (inner.length > 2 && inner[0] === ' ' && inner[inner.length - 1] === ' ' && inner.trim()) {
          inner = inner.slice(1, -1);
        }
        out += '<code>' + escText(inner) + '</code>';
        i = closer + n;
        continue;
      }
      out += c;
      i++;
      continue;
    }

    if (c === '<') {
      const tag = readTag(text, i);
      if (tag && BLOCK_COMPONENTS.has(tag.name)) {
        const attrs = parseAttrs(tag.attrsRaw);
        let inner = '';
        let endI = tag.end;
        if (!tag.selfClosing) {
          const close = findMatchingClose(text, tag);
          if (close.missing) ctx.warnings.push('<' + tag.name + '> 缺少闭合标签（' + ctx.page + '）');
          inner = text.slice(tag.end, close.start);
          endI = close.end;
        }
        const html = renderComponent(tag.name, attrs, dedent(inner), ctx);
        const id = store.length;
        store.push(html);
        const lineStart = text.lastIndexOf('\n', i - 1);
        const before = text.slice(lineStart + 1, i);
        const indent = before.trim() === '' ? (/^[ \t]*/.exec(before) || [''])[0] : '';
        out += '\n\n' + indent + '<div data-dsh-block="' + id + '"></div>\n\n';
        i = endI;
        continue;
      }
      out += c;
      i++;
      continue;
    }

    out += c;
    i++;
  }
  return out.replace(/\n{3,}/g, '\n\n');
}

/* --------------------------------------------------------------- 子节点切分 */

function findMatchingClose(src, tag) {
  let depth = 1;
  let i = tag.end;
  const openRe = new RegExp('<' + tag.name + '(?=[\\s/>])', 'g');
  const closeRe = new RegExp('</' + tag.name + '\\s*>', 'g');
  while (i < src.length) {
    openRe.lastIndex = i;
    closeRe.lastIndex = i;
    const om = openRe.exec(src);
    const cm = closeRe.exec(src);
    if (!cm) return { start: src.length, end: src.length, missing: true };
    if (om && om.index < cm.index) {
      const t = readTag(src, om.index);
      if (t && !t.selfClosing) depth++;
      i = t && t.end > om.index ? t.end : om.index + 1;
    } else {
      depth--;
      if (depth === 0) return { start: cm.index, end: cm.index + cm[0].length };
      i = cm.index + cm[0].length;
    }
  }
  return { start: src.length, end: src.length, missing: true };
}

/** 把一段内容按顶层子组件切开，得到 text / child 节点数组 */
function splitChildren(src, names) {
  const set = new Set(names);
  const out = [];
  let i = 0, textStart = 0;
  while (i < src.length) {
    if (src[i] !== '<') { i++; continue; }
    const tag = readTag(src, i);
    if (!tag || !set.has(tag.name)) { i++; continue; }
    if (i > textStart) {
      const raw = src.slice(textStart, i);
      if (raw.trim()) out.push({ type: 'text', raw });
    }
    if (tag.selfClosing) {
      out.push({ type: 'child', name: tag.name, attrs: parseAttrs(tag.attrsRaw), innerRaw: '' });
      i = tag.end;
    } else {
      const close = findMatchingClose(src, tag);
      out.push({
        type: 'child', name: tag.name, attrs: parseAttrs(tag.attrsRaw),
        innerRaw: src.slice(tag.end, close.start),
      });
      i = close.end;
    }
    textStart = i;
  }
  if (textStart < src.length) {
    const raw = src.slice(textStart);
    if (raw.trim()) out.push({ type: 'text', raw });
  }
  return out;
}

function renderChildrenHtml(nodes, ctx, childRenderer) {
  return nodes.map((n) => {
    if (n.type === 'text') return renderMarkdown(dedent(n.raw), ctx);
    return childRenderer(n);
  }).join('');
}

/** 去掉最外层的一个 p 元素，用于卡片描述这类行内语境 */
function unwrapParagraph(html) {
  const s = String(html).trim();
  const m = s.match(/^<p>([\s\S]*)<\/p>$/);
  return m ? m[1].trim() : s;
}

/* ==================================================================== *
 *  交互式演示：ScoreExplorer / ConfidenceExplorer
 *  ------------------------------------------------------------------
 *  这两个组件的定义（连数据）内联在 primitives/score.md 与 confidence.md 里，
 *  是上游唯一的真源，所以构建期**从 md 源码解析**，不在生成器里另抄一份：
 *    · ScoreExplorer      —— `const examples = [...]`（合法 JSON）
 *    · ConfidenceExplorer —— `const options = [...]`、useState 初值、
 *                            以及预设按钮的 setProbabilities([...]) 数值
 *  解析失败 → 退回原来的说明块并给出警告（见 renderComponent）。
 *
 *  渲染策略（无 JS 也不能是空白）：
 *    · 第一个示例 / 默认分布在构建期直接渲染成静态标记 —— 这就是无 JS 的降级版本
 *    · 其余示例写进 <template>，由 assets/app.js 在点击时整块换进 DOM
 *  这样 HTML 里没有重复数据，运行时只做 DOM 交换和算术。
 * ==================================================================== */

/* --------------------------------------------- 从 md 源码里解析组件数据 */

/** 取 src[i]（开括号）起的配对括号片段（含两端括号），忽略字符串里的括号 */
function readBalanced(src, i, open, close) {
  if (src[i] !== open) return null;
  let depth = 0, quote = null;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (quote) {
      if (c === '\\') { j++; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '\u0060') { quote = c; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return src.slice(i, j + 1); }
  }
  return null;
}

/**
 * 取出 `export function 名称(...)` 开头的那一段组件源码（切到下一个 export function 为止）。
 * 这里**不做花括号配对**：组件体里是 JSX，文本节点里会出现英文撇号（option's），
 * 还会有嵌套插值的模板串，任何简易的括号扫描器都会跑偏。
 * 我们只需要在这段范围里定位 const 数组字面量，所以按 export 边界切片就够了。
 */
function exportedFunctionRegion(md, name) {
  const m = new RegExp('export\\s+function\\s+' + name + '\\s*\\(').exec(md);
  if (!m) return null;
  const rest = md.slice(m.index + 1);
  const next = /export\s+function\s+/.exec(rest);
  return md.slice(m.index, next ? m.index + 1 + next.index : md.length);
}

/** 取 `const 名称 = [ … ]` 的数组字面量文本 */
function findConstArrayLiteral(src, name) {
  const m = new RegExp('const\\s+' + name + '\\s*=\\s*\\[').exec(src);
  if (!m) return null;
  return readBalanced(src, src.indexOf('[', m.index), '[', ']');
}

/** 只做四则运算的极简求值：md 里写的是 100 / 3 这类表达式 */
function evalNumericExpr(text) {
  const s = String(text).trim();
  if (!s || !/^[-+*/().\d\s]+$/.test(s)) return null;
  let value;
  try { value = new Function('return (' + s + ');')(); } catch (e) { return null; }
  return typeof value === 'number' && isFinite(value) ? value : null;
}

/** 解析 [90, 6, 4] / [100 / 3, 100 / 3, 100 / 3] 这类数值数组 */
function parseNumberArrayLiteral(src, at) {
  const lit = readBalanced(src, at, '[', ']');
  if (!lit) return null;
  const inner = lit.slice(1, -1).trim();
  if (!inner) return [];
  const out = [];
  for (const part of splitTopLevel(inner, ',')) {
    const v = evalNumericExpr(part);
    if (v === null) return null;
    out.push(v);
  }
  return out;
}

/** ScoreExplorer 的数据 = primitives/score.md 里的 const examples = [...]（合法 JSON） */
function parseScoreExplorer(md) {
  const body = exportedFunctionRegion(md, 'ScoreExplorer');
  if (!body) return null;
  const lit = findConstArrayLiteral(body, 'examples');
  if (!lit) return null;
  let list = null;
  try { list = JSON.parse(lit); } catch (e) { return null; }
  if (!Array.isArray(list) || !list.length) return null;
  for (const ex of list) {
    if (!ex || typeof ex !== 'object') return null;
    if (typeof ex.label !== 'string' || typeof ex.question !== 'string' || typeof ex.state !== 'string') return null;
    if (!Array.isArray(ex.levels) || ex.levels.length < 2) return null;
    if (!ex.levels.every((l) => typeof l === 'string')) return null;
    if (!Array.isArray(ex.shortLevels) || ex.shortLevels.length !== ex.levels.length) return null;
    if (!ex.shortLevels.every((l) => typeof l === 'string')) return null;
    const a = ex.answer;
    if (!a || typeof a.score !== 'number' || typeof a.confidence !== 'number' || !a.probabilities) return null;
    for (let level = 0; level < ex.levels.length; level++) {
      if (typeof a.probabilities[String(level)] !== 'number') return null;
    }
  }
  return list;
}

/** ConfidenceExplorer 的数据 = confidence.md 里的 options / useState 初值 / 预设按钮 */
function parseConfidenceExplorer(md) {
  const body = exportedFunctionRegion(md, 'ConfidenceExplorer');
  if (!body) return null;
  const optLit = findConstArrayLiteral(body, 'options');
  if (!optLit) return null;
  let options = null;
  try { options = JSON.parse(optLit); } catch (e) { return null; }
  if (!Array.isArray(options) || options.length < 3) return null;
  if (!options.every((o) => typeof o === 'string' && o)) return null;
  const um = /const\s*\[\s*probabilities\s*,\s*setProbabilities\s*\]\s*=\s*useState\s*\(/.exec(body);
  if (!um) return null;
  const initial = parseNumberArrayLiteral(body, body.indexOf('[', um.index + um[0].length));
  if (!initial || initial.length !== options.length || !initial.every((v) => v >= 0 && v <= 100)) return null;
  const presets = [];
  const re = /setProbabilities\s*\(\s*\[/g;
  let pm;
  while ((pm = re.exec(body))) {
    const values = parseNumberArrayLiteral(body, body.indexOf('[', pm.index + pm[0].length - 1));
    if (!values || values.length !== options.length) continue;
    const after = body.slice(body.indexOf('[', pm.index + pm[0].length - 1));
    const tagEnd = after.indexOf('>');
    const btnEnd = after.indexOf('</button>');
    if (tagEnd < 0 || btnEnd < tagEnd) continue;
    const label = collapseWs(after.slice(tagEnd + 1, btnEnd));
    if (!label) continue;
    presets.push({ label: label, values: values });
  }
  if (!presets.length) return null;
  return { options: options, initial: initial, presets: presets };
}

/** 页面级预解析：把 md 里内联定义的组件数据挂到 ctx（缺失/解析失败 = null） */
function attachExplorerData(md, ctx) {
  const has = (name) => new RegExp('export\\s+function\\s+' + name + '\\s*\\(').test(md);
  ctx.explorers = {
    ScoreExplorer: has('ScoreExplorer') ? parseScoreExplorer(md) : null,
    ConfidenceExplorer: has('ConfidenceExplorer') ? parseConfidenceExplorer(md) : null,
  };
}

/* -------------------------------------------------- ScoreExplorer 渲染 */

/** 每个示例的派生量：最高档位、各档位概率/百分比、柱状图 aria-label */
function scoreExampleStats(ex) {
  const topLevel = ex.levels.length - 1;
  const probabilities = ex.levels.map((_, level) => ex.answer.probabilities[String(level)]);
  const percents = probabilities.map((p) => Number((p * 100).toFixed(2)));
  const summary = ex.levels.map((_, level) =>
    'level ' + level + ', ' + ex.shortLevels[level] + ': ' + percents[level] + '%').join('; ');
  return {
    topLevel: topLevel,
    probabilities: probabilities,
    percents: percents,
    score: ex.answer.score,
    confidence: ex.answer.confidence,
    chartLabel: 'Probability of each level: ' + summary + '. Score ' + ex.answer.score.toFixed(2),
  };
}

const scorePosition = (value, topLevel) => (value / topLevel) * 100 + '%';

/** 档位名的定位：两端贴边、中间居中（原组件的 tickNameStyle） */
function tickNameStyle(level, topLevel) {
  if (level === 0) return 'left:0;text-align:left;max-width:calc(50% - 8px)';
  if (level === topLevel) return 'right:0;text-align:right;max-width:calc(50% - 8px)';
  return 'left:' + (level / topLevel * 100) + '%;transform:translateX(-50%);text-align:center;max-width:calc(' +
    (100 / topLevel) + '% - 8px)';
}

/** 问题 + 档位清单 + State 框（示例间会变的部分之一） */
function scorePanelTopHtml(ex) {
  let levels = '';
  ex.levels.forEach((description, level) => {
    levels += '<div class="ex-level" role="listitem">' +
      '<span class="ex-level-num">' + level + '</span> ' + esc(description) + '</div>';
  });
  return '<div class="ex-qblock">' +
    '<div class="ex-q">' + esc(ex.question) + '</div>' +
    '<div class="ex-levels" role="list" aria-label="Levels">' + levels + '</div>' +
    '</div>' +
    '<div class="ex-state" role="region" aria-label="Example state" tabindex="0">' +
    '<div class="ex-eyebrow">State (content to evaluate)</div>' +
    '<p class="ex-state-text">' + esc(ex.state) + '</p>' +
    '</div>';
}

/** 柱状图 + 口径说明（示例间会变的部分之二） */
function scorePanelRestHtml(ex, d) {
  const pos = (value) => scorePosition(value, d.topLevel);
  let grid = '';
  for (const tick of [50, 100]) {
    grid += '<div class="ex-gridline" style="bottom:' + tick + '%"></div>';
  }
  let bars = '';
  ex.levels.forEach((_, level) => {
    bars += '<div class="ex-bar" style="left:' + pos(level) + ';height:' + d.percents[level] + '%">' +
      '<span class="ex-bar-val">' + d.percents[level] + '%</span></div>';
  });
  let ticks = '', numbers = '', names = '';
  ex.levels.forEach((_, level) => {
    const left = pos(level);
    ticks += '<div class="ex-tick" style="left:' + left + '"></div>';
    numbers += '<div class="ex-ticknum" style="left:' + left + '">' + level + '</div>';
    const end = level === 0 || level === d.topLevel;
    names += '<div class="ex-tickname' + (end ? '' : ' ex-tickname-mid') + '" style="' +
      tickNameStyle(level, d.topLevel) + '">' + esc(ex.shortLevels[level]) + '</div>';
  });
  const formula = d.probabilities.map((p, level) => level + ' \u00d7 ' + p).join(' + ') +
    ' \u2248 ' + d.score.toFixed(2);
  return '<div class="ex-chart" role="img" aria-label="' + esc(d.chartLabel) + '">' +
    '<div class="ex-plot" aria-hidden="true">' + grid + bars + '</div>' +
    '<div class="ex-axis" aria-hidden="true">' +
    '<div class="ex-axis-line"></div>' + ticks + numbers + names +
    '<div class="ex-score-pin" style="left:' + pos(d.score) + '"></div>' +
    '</div></div>' +
    '<details class="ex-details">' +
    '<summary>How the score and confidence are calculated</summary>' +
    '<div class="ex-details-h">Score:</div>' +
    '<p class="ex-details-p">Multiply each level number by its probability, then add the results:</p>' +
    '<div class="ex-details-formula">' + esc(formula) + '</div>' +
    '<div class="ex-details-h">Confidence:</div>' +
    '<p class="ex-details-p">TypeSafe computes this from how the probability is spread across the levels. ' +
    'All of it on one level gives 1.0; the more evenly it spreads, the lower the confidence.</p>' +
    '</details>';
}

function scoreExplorerHtml(examples) {
  const stats = examples.map(scoreExampleStats);
  let buttons = '';
  examples.forEach((ex, index) => {
    buttons += '<button class="ex-tab" type="button" data-ex-index="' + index + '" aria-pressed="' +
      (index === 0 ? 'true' : 'false') + '" data-ex-confidence="' + stats[index].confidence.toFixed(2) +
      '" data-ex-score="' + stats[index].score.toFixed(2) + '">' + esc(ex.label) + '</button>';
  });
  let templates = '';
  examples.forEach((ex, index) => {
    if (index === 0) return; // 第一个示例直接内联 = 无 JS 时的静态版本
    templates += '<template data-ex-top="' + index + '">' + scorePanelTopHtml(ex) + '</template>' +
      '<template data-ex-rest="' + index + '">' + scorePanelRestHtml(ex, stats[index]) + '</template>';
  });
  return '<section class="ex-section" aria-label="Explore Score examples" data-ex-score-explorer>' +
    '<div class="ex-eyebrow">Example Score question</div>' +
    '<div class="ex-tabs" role="group" aria-label="Example questions">' + buttons + '</div>' +
    '<p class="ex-nojs">这个演示需要 JavaScript 才能切换示例，下面显示的是第一个示例的静态结果。</p>' +
    '<div data-ex-top-host>' + scorePanelTopHtml(examples[0]) + '</div>' +
    '<div class="ex-answer">' +
    '<div class="ex-answer-head">' +
    '<div><div class="ex-eyebrow">Answer</div>' +
    '<div class="ex-answer-sub">Probability of each level</div></div>' +
    '<div class="ex-status" role="status" aria-live="polite" aria-atomic="true">' +
    '<div class="ex-status-label">Confidence</div>' +
    '<output class="ex-confidence" aria-label="Confidence">' + stats[0].confidence.toFixed(2) + '</output>' +
    '</div></div>' +
    '<div class="ex-score-row" aria-live="polite">' +
    '<span class="ex-diamond" aria-hidden="true"></span>score ' +
    '<span data-ex-score-value>' + stats[0].score.toFixed(2) + '</span></div>' +
    '<div data-ex-rest-host>' + scorePanelRestHtml(examples[0], stats[0]) + '</div>' +
    '</div>' +
    templates +
    '</section>';
}

/* --------------------------------------------- ConfidenceExplorer 渲染 */

/** 与原组件一致：confidence = (n × 最大概率占比 − 1) / (n − 1) */
function choiceConfidence(values) {
  const count = values.length;
  const peak = Math.max.apply(null, values) / 100;
  return Math.max(0, Math.min(1, (count * peak - 1) / (count - 1)));
}

function formatProbability(value) {
  if (Math.abs(value - 100 / 3) < 0.000001) return '33\u2153%';
  return Number(value.toFixed(1)) + '%';
}

function probabilityWinners(options, values) {
  const maximum = Math.max.apply(null, values);
  return options.filter((_, i) => Math.abs(values[i] - maximum) < 0.000001);
}

function probabilitySelection(options, values) {
  const winners = probabilityWinners(options, values);
  return winners.length === 1 ? 'Option ' + winners[0] : 'Tie: ' + winners.join(', ');
}

/** 可见那行的文案：唯一胜出者写 Selected: Option X，并列时直接写 Tie: ...（照原组件） */
function probabilitySelectionLine(options, values) {
  const winners = probabilityWinners(options, values);
  return winners.length === 1 ? 'Selected: Option ' + winners[0] : 'Tie: ' + winners.join(', ');
}

function confidenceExplorerHtml(cfg) {
  const values = cfg.initial;
  const confidence = choiceConfidence(values);
  const winners = probabilityWinners(cfg.options, values);
  const winner = winners.length === 1 ? winners[0] : null;
  const chartLabel = 'Probability distribution: ' +
    cfg.options.map((o, i) => o + ' ' + formatProbability(values[i])).join(', ') + '. ' +
    probabilitySelection(cfg.options, values) + '.';
  let rows = '';
  cfg.options.forEach((option, i) => {
    rows += '<label class="ex-cf-row">' +
      '<span class="ex-cf-opt">' + esc(option) + '</span>' +
      '<input type="range" min="0" max="100" step="1" value="' + values[i] + '" data-ex-option="' + esc(option) +
      '" aria-label="Probability of ' + esc(option) + '" aria-valuetext="' +
      esc(formatProbability(values[i])) + '">' +
      '<output class="ex-out">' + esc(formatProbability(values[i])) + '</output>' +
      '</label>';
  });
  let presets = '';
  cfg.presets.forEach((p) => {
    presets += '<button class="ex-tab" type="button" data-ex-preset="' + p.values.join(',') + '">' +
      esc(p.label) + '</button>';
  });
  let grid = '';
  for (const tick of [0, 50, 100]) {
    grid += '<div class="ex-cf-grid" style="bottom:' + tick + '%"><span>' + tick + '%</span></div>';
  }
  let bars = '';
  cfg.options.forEach((option, i) => {
    bars += '<div class="ex-col' + (winner === option ? ' is-winner' : '') + '" style="height:' + values[i] + '%">' +
      '<span class="ex-col-val">' + esc(formatProbability(values[i])) + '</span>' +
      '<div class="ex-col-bar"></div>' +
      '<span class="ex-col-name">' + esc(option) + '</span></div>';
  });
  return '<section class="ex-section" aria-label="Explore probabilities and confidence" data-ex-confidence-explorer>' +
    '<div class="ex-cf-head">' +
    '<div><div class="ex-eyebrow">Choice question with three options</div>' +
    '<div class="ex-cf-title">See how probability distribution changes confidence</div></div>' +
    '<div class="ex-status" role="status" aria-live="polite" aria-atomic="true">' +
    '<div class="ex-status-label">Confidence</div>' +
    '<output class="ex-confidence ex-confidence-accent">' + confidence.toFixed(2) + '</output>' +
    '</div></div>' +
    '<div class="ex-cf-chart" role="img" aria-label="' + esc(chartLabel) + '">' +
    '<div class="ex-cf-chart-label">Probability</div>' +
    '<div class="ex-cf-plot" aria-hidden="true">' + grid +
    '<div class="ex-cf-bars">' + bars + '</div></div>' +
    '</div>' +
    '<p class="ex-nojs">这个演示需要 JavaScript 才能拖动滑块，下面显示的是默认分布：' +
    esc(cfg.options.map((o, i) => o + ' ' + formatProbability(values[i])).join(' / ')) + '。</p>' +
    '<div class="ex-cf-controls ex-interactive">' + rows + '</div>' +
    '<p class="ex-cf-hint ex-interactive">Move a slider to change an option\u2019s probability. ' +
    'The other probabilities adjust to keep the total at 100%.</p>' +
    '<div class="ex-cf-presets ex-interactive" aria-label="Example distributions">' + presets + '</div>' +
    '<div class="ex-cf-selected" aria-live="polite">' + esc(probabilitySelectionLine(cfg.options, values)) + '</div>' +
    '<details class="ex-details"><summary>How this demo calculates Confidence</summary>' +
    '<p class="ex-details-p">TypeSafe computes confidence from how the probability is spread across the options. ' +
    'All of it on one option gives 1.0; the more evenly it spreads, the lower the confidence. This demo uses ' +
    '<code>(3 \u00d7 largest probability \u2212 1) / 2</code> to approximate confidence for three options.</p>' +
    '</details>' +
    '</section>';
}

/* ------------------------------------------------------------- 组件渲染 */

function calloutHtml(cls, iconName, bodyHtml, title) {
  return '<div class="callout callout-' + cls + '">' +
    '<span class="callout-ic" aria-hidden="true">' + icon(iconName, 'ic') + '</span>' +
    '<div class="callout-body">' +
    (title ? '<p class="callout-title">' + esc(title) + '</p>' : '') +
    bodyHtml +
    '</div></div>';
}

/** 组件数据解析失败时的降级说明块（明确告诉读者/构建日志哪里出了问题） */
function explorerFallbackHtml(name, ctx, reason) {
  ctx.warnings.push('交互式组件 <' + name + ' /> 数据解析失败，退回说明块：' + reason + '（' + ctx.page + '）');
  return '<div class="runtime-notice">' +
    '<span class="runtime-ic" aria-hidden="true">' + icon('braces', 'ic') + '</span>' +
    '<div><p class="runtime-title">交互式演示：' + esc(JS_RUNTIME_COMPONENTS[name] || name) + '</p>' +
    '<p class="runtime-text">这个区块在原站里是一个交互式组件，' + esc(reason) + '。' +
    '因此这里显示占位说明。其余正文与代码示例不受影响。</p></div>' +
    '</div>';
}

function renderComponent(name, attrs, innerRaw, ctx, env) {
  env = env || {};
  const kids = () => renderMarkdown(dedent(innerRaw), ctx);

  switch (name) {
    case 'Note': case 'Tip': case 'Warning': case 'Info': {
      const c = CALLOUTS[name];
      const title = typeof attrs.title === 'string' ? attrs.title : null;
      return calloutHtml(c.cls, c.icon, kids(), title);
    }

    case 'Card': {
      const title = typeof attrs.title === 'string' ? attrs.title : '';
      const body = unwrapParagraph(kids());
      const ic = typeof attrs.icon === 'string' ? attrs.icon : '';
      const href = typeof attrs.href === 'string' ? attrs.href : '';
      const typeCls = typeof attrs.type === 'string' ? ' card-' + attrs.type.replace(/[^a-z]/gi, '') : '';
      const inner = (ic ? '<span class="card-ic" aria-hidden="true">' + icon(ic, 'ic ic-lg') + '</span>' : '') +
        '<span class="card-text">' +
        (title ? '<span class="card-title">' + esc(title) + '</span>' : '') +
        (body ? '<span class="card-body">' + body + '</span>' : '') +
        '</span>' +
        (href ? '<span class="card-arrow" aria-hidden="true">' + icon('arrow-right', 'ic ic-sm') + '</span>' : '');
      const cls = 'card' + typeCls;
      return href
        ? '<a class="' + cls + '" href="' + esc(href) + '">' + inner + '</a>'
        : '<div class="' + cls + '">' + inner + '</div>';
    }

    case 'CardGroup': case 'Columns': {
      const cols = Number(attrs.cols) || 2;
      const nodes = splitChildren(innerRaw, ['Card', 'Columns', 'Frame']);
      const inner = renderChildrenHtml(nodes, ctx, (n) => renderComponent(n.name, n.attrs, n.innerRaw, ctx));
      return '<div class="grid grid-' + Math.max(1, Math.min(4, cols)) + '">' + inner + '</div>';
    }

    case 'Tabs': {
      const nodes = splitChildren(innerRaw, ['Tab']);
      const tabs = nodes.filter((n) => n.type === 'child');
      if (!tabs.length) return kids();
      const gid = ctx.uid();
      let nav = '<div class="tab-nav" role="tablist">';
      let panels = '';
      tabs.forEach((t, idx) => {
        const title = typeof t.attrs.title === 'string' ? t.attrs.title : ('标签 ' + (idx + 1));
        const active = idx === 0;
        nav += '<button class="tab-btn' + (active ? ' is-active' : '') + '" type="button" role="tab" ' +
          'id="tt-' + gid + '-' + idx + '" aria-controls="tp-' + gid + '-' + idx + '" ' +
          'aria-selected="' + (active ? 'true' : 'false') + '" tabindex="' + (active ? '0' : '-1') + '">' +
          esc(title) + '</button>';
        panels += '<div class="tab-panel' + (active ? ' is-active' : '') + '" role="tabpanel" ' +
          'id="tp-' + gid + '-' + idx + '" aria-labelledby="tt-' + gid + '-' + idx + '"' +
          '' + '>' + renderMarkdown(dedent(t.innerRaw), ctx) + '</div>';
      });
      nav += '</div>';
      return '<div class="tabs" data-tabs>' + nav + '<div class="tab-panels">' + panels + '</div></div>';
    }

    case 'Tab':
      return '<div class="tab-panel is-active">' + kids() + '</div>';

    case 'Accordion': {
      const title = typeof attrs.title === 'string' ? attrs.title : '详情';
      const ic = typeof attrs.icon === 'string' ? attrs.icon : '';
      return '<details class="accordion">' +
        '<summary class="accordion-sum">' +
        (ic ? '<span class="accordion-ic" aria-hidden="true">' + icon(ic, 'ic ic-sm') + '</span>' : '') +
        '<span class="accordion-title">' + esc(title) + '</span>' +
        '<span class="accordion-chev" aria-hidden="true">' + icon('chevron-right', 'ic ic-sm') + '</span>' +
        '</summary>' +
        '<div class="accordion-body">' + kids() + '</div></details>';
    }

    case 'AccordionGroup': {
      const nodes = splitChildren(innerRaw, ['Accordion']);
      return '<div class="accordion-group">' +
        renderChildrenHtml(nodes, ctx, (n) => renderComponent(n.name, n.attrs, n.innerRaw, ctx)) + '</div>';
    }

    case 'Expandable': {
      const title = typeof attrs.title === 'string' ? attrs.title : '展开';
      return '<details class="expandable">' +
        '<summary class="expandable-sum"><span class="expandable-title">' + esc(title) + '</span>' +
        '<span class="accordion-chev" aria-hidden="true">' + icon('chevron-right', 'ic ic-sm') + '</span>' +
        '</summary><div class="expandable-body">' + kids() + '</div></details>';
    }

    case 'Steps': {
      const nodes = splitChildren(innerRaw, ['Step']);
      const steps = nodes.filter((n) => n.type === 'child');
      let n = 0;
      const inner = steps.map((s) => renderComponent('Step', s.attrs, s.innerRaw, ctx, { index: ++n })).join('');
      return '<ol class="steps">' + inner + '</ol>';
    }

    case 'Step': {
      const title = typeof attrs.title === 'string' ? attrs.title : '';
      const idx = env.index || 1;
      return '<li class="step"><div class="step-head">' +
        '<span class="step-num" aria-hidden="true">' + idx + '</span>' +
        (title ? '<h3 class="step-title">' + esc(title) + '</h3>' : '') +
        '</div><div class="step-body">' + kids() + '</div></li>';
    }

    case 'Frame': {
      const cap = typeof attrs.caption === 'string' ? attrs.caption : '';
      return '<figure class="frame">' + kids() +
        (cap ? '<figcaption>' + esc(cap) + '</figcaption>' : '') + '</figure>';
    }

    case 'CodeGroup': {
      const blocks = [];
      const lines = dedent(innerRaw).split('\n');
      let i = 0;
      while (i < lines.length) {
        const m = lines[i].match(/^(`{3,}|~{3,})(.*)$/);
        if (!m) { i++; continue; }
        const body = [];
        const info = m[2].trim();
        i++;
        while (i < lines.length && !/^(`{3,}|~{3,})[ \t]*$/.test(lines[i])) { body.push(lines[i]); i++; }
        i++;
        blocks.push({ info: info, code: body.join('\n') });
      }
      if (!blocks.length) return kids();
      const gid = ctx.uid();
      let nav = '<div class="tab-nav" role="tablist">';
      let panels = '';
      blocks.forEach((b, idx) => {
        const parsed = parseFenceInfo(b.info);
        const label = parsed.title || prettyLang(parsed.lang) || ('片段 ' + (idx + 1));
        const active = idx === 0;
        nav += '<button class="tab-btn' + (active ? ' is-active' : '') + '" type="button" role="tab" ' +
          'id="cg-' + gid + '-' + idx + '" aria-controls="cp-' + gid + '-' + idx + '" ' +
          'aria-selected="' + (active ? 'true' : 'false') + '" tabindex="' + (active ? '0' : '-1') + '">' +
          esc(label) + '</button>';
        const html = codeBlockHtml(b.code, b.info, ctx)
          .replace('<div class="code-block', '<div class="code-block code-block-flat"');
        panels += '<div class="tab-panel' + (active ? ' is-active' : '') + '" role="tabpanel" ' +
          'id="cp-' + gid + '-' + idx + '" aria-labelledby="cg-' + gid + '-' + idx + '"' +
          '' + '>' + html + '</div>';
      });
      nav += '</div>';
      return '<div class="tabs codegroup" data-tabs>' + nav + '<div class="tab-panels">' + panels + '</div></div>';
    }

    case 'ResponseField': case 'ParamField': {
      const fieldName = typeof attrs.name === 'string' ? attrs.name
        : (typeof attrs.body === 'string' ? attrs.body
          : (typeof attrs.query === 'string' ? attrs.query
            : (typeof attrs.path === 'string' ? attrs.path
              : (typeof attrs.header === 'string' ? attrs.header : ''))));
      const type = typeof attrs.type === 'string' ? decodeEntities(attrs.type) : '';
      const required = attrs.required === true || attrs.required === 'true';
      const defaultValue = typeof attrs.default === 'string' ? attrs.default : '';
      const body = innerRaw.trim() ? kids() : '';
      // Mintlify 会为每个字段生成 param-<名> / response-<名> 锚点，重复出现时补 -1、-2
      const idBase = (name === 'ParamField' ? 'param-' : 'response-') + slugify(fieldName);
      const seen = ctx.fieldIds.get(idBase) || 0;
      ctx.fieldIds.set(idBase, seen + 1);
      const fieldId = seen === 0 ? idBase : idBase + '-' + seen;
      return '<div class="field" id="' + esc(fieldId) + '">' +
        '<div class="field-head">' +
        (fieldName ? '<code class="field-name">' + esc(fieldName) + '</code>' : '') +
        (type ? '<span class="field-type">' + esc(type) + '</span>' : '') +
        (required ? '<span class="field-req">必需</span>' : '<span class="field-opt">可选</span>') +
        (defaultValue ? '<span class="field-default">默认 ' + esc(defaultValue) + '</span>' : '') +
        '</div>' +
        (body ? '<div class="field-body">' + body + '</div>' : '') +
        '</div>';
    }

    case 'SdkSignature': {
      const code = sdkSignatureSource(innerRaw, ctx);
      return '<div class="sdk-signature">' + copyButtonHtml('复制签名') +
        '<pre tabindex="0" aria-label="SDK 签名"><code>' + code + '</code></pre></div>';
    }

    case 'TypesafeExample':
      return typesafeExampleHtml(attrs, ctx);

    case 'ScoreExplorer': {
      const data = ctx.explorers && ctx.explorers.ScoreExplorer;
      if (!data) return explorerFallbackHtml(name, ctx, '未能从 primitives/score.md 的 const examples = [...] 里解析出示例数据');
      return scoreExplorerHtml(data);
    }

    case 'ConfidenceExplorer': {
      const data = ctx.explorers && ctx.explorers.ConfidenceExplorer;
      if (!data) return explorerFallbackHtml(name, ctx, '未能从 confidence.md 的 options / useState 初值 / 预设按钮里解析出数据');
      return confidenceExplorerHtml(data);
    }

    default:
      if (JS_RUNTIME_COMPONENTS[name]) return explorerFallbackHtml(name, ctx, '该组件没有可用的内联数据');
      ctx.warnings.push('未知组件 <' + name + '>（' + ctx.page + '）');
      return kids();
  }
}

/** SdkSignature 内部是 JSX 化的高亮片段，这里还原成纯文本 + span */
function sdkSignatureSource(innerRaw, ctx) {
  let s = String(innerRaw);
  s = s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  s = s.replace(/\{\s*"((?:[^"\\]|\\.)*)"\s*\}/g, (m, g) => decodeJsString(g));
  s = s.replace(/\{\s*'((?:[^'\\]|\\.)*)'\s*\}/g, (m, g) => decodeJsString(g));
  s = s.replace(/\{\s*([0-9]+)\s*\}/g, '$1');
  s = s.replace(/\{[^{}]*\}/g, '');
  s = s.replace(/\bclassName=/g, 'class=');
  s = s.replace(/>\s+</g, '><');
  s = s.replace(/\s*\n\s*/g, '');
  s = s.replace(/[ \t]{2,}/g, ' ');
  s = s.split(NL_SENTINEL).join('\n');
  s = rewriteLinks(s, ctx.base);
  return s.trim();
}

/* --------------------------------------------------------------- LZ-string */

const LZ_KEY_URI_SAFE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$';

/**
 * compressToEncodedURIComponent —— 逐字移植自 primitives/score.md 里 TypesafeExample
 * 内联的那份实现（lz-string 的 URI-safe 变体）。构建期就把请求压好，页面里只出现
 * 最终的 <a href>；不解压、不发任何外部请求。
 */
function compressToEncodedURIComponent(input) {
  if (input == null) return '';
  return lzCompress(input, 6, (a) => LZ_KEY_URI_SAFE.charAt(a));
}

function lzCompress(uncompressed, bitsPerChar, getCharFromInt) {
  if (uncompressed == null) return '';
  var i, value, context_dictionary = {}, context_dictionaryToCreate = {}, context_c = '', context_wc = '', context_w = '', context_enlargeIn = 2, context_dictSize = 3, context_numBits = 2, context_data = [], context_data_val = 0, context_data_position = 0, ii;
  for (ii = 0; ii < uncompressed.length; ii += 1) {
    context_c = uncompressed.charAt(ii);
    if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
      context_dictionary[context_c] = context_dictSize++;
      context_dictionaryToCreate[context_c] = true;
    }
    context_wc = context_w + context_c;
    if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
      context_w = context_wc;
    } else {
      if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
        if (context_w.charCodeAt(0) < 256) {
          for (i = 0; i < context_numBits; i++) {
            context_data_val = context_data_val << 1;
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
          }
          value = context_w.charCodeAt(0);
          for (i = 0; i < 8; i++) {
            context_data_val = context_data_val << 1 | value & 1;
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        } else {
          value = 1;
          for (i = 0; i < context_numBits; i++) {
            context_data_val = context_data_val << 1 | value;
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = 0;
          }
          value = context_w.charCodeAt(0);
          for (i = 0; i < 16; i++) {
            context_data_val = context_data_val << 1 | value & 1;
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        delete context_dictionaryToCreate[context_w];
      } else {
        value = context_dictionary[context_w];
        for (i = 0; i < context_numBits; i++) {
          context_data_val = context_data_val << 1 | value & 1;
          if (context_data_position == bitsPerChar - 1) {
            context_data_position = 0;
            context_data.push(getCharFromInt(context_data_val));
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = value >> 1;
        }
      }
      context_enlargeIn--;
      if (context_enlargeIn == 0) {
        context_enlargeIn = Math.pow(2, context_numBits);
        context_numBits++;
      }
      context_dictionary[context_wc] = context_dictSize++;
      context_w = String(context_c);
    }
  }
  if (context_w !== '') {
    if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
      if (context_w.charCodeAt(0) < 256) {
        for (i = 0; i < context_numBits; i++) {
          context_data_val = context_data_val << 1;
          if (context_data_position == bitsPerChar - 1) {
            context_data_position = 0;
            context_data.push(getCharFromInt(context_data_val));
            context_data_val = 0;
          } else {
            context_data_position++;
          }
        }
        value = context_w.charCodeAt(0);
        for (i = 0; i < 8; i++) {
          context_data_val = context_data_val << 1 | value & 1;
          if (context_data_position == bitsPerChar - 1) {
            context_data_position = 0;
            context_data.push(getCharFromInt(context_data_val));
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = value >> 1;
        }
      } else {
        value = 1;
        for (i = 0; i < context_numBits; i++) {
          context_data_val = context_data_val << 1 | value;
          if (context_data_position == bitsPerChar - 1) {
            context_data_position = 0;
            context_data.push(getCharFromInt(context_data_val));
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = 0;
        }
        value = context_w.charCodeAt(0);
        for (i = 0; i < 16; i++) {
          context_data_val = context_data_val << 1 | value & 1;
          if (context_data_position == bitsPerChar - 1) {
            context_data_position = 0;
            context_data.push(getCharFromInt(context_data_val));
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = value >> 1;
        }
      }
      context_enlargeIn--;
      if (context_enlargeIn == 0) {
        context_enlargeIn = Math.pow(2, context_numBits);
        context_numBits++;
      }
      delete context_dictionaryToCreate[context_w];
    } else {
      value = context_dictionary[context_w];
      for (i = 0; i < context_numBits; i++) {
        context_data_val = context_data_val << 1 | value & 1;
        if (context_data_position == bitsPerChar - 1) {
          context_data_position = 0;
          context_data.push(getCharFromInt(context_data_val));
          context_data_val = 0;
        } else {
          context_data_position++;
        }
        value = value >> 1;
      }
    }
    context_enlargeIn--;
    if (context_enlargeIn == 0) {
      context_enlargeIn = Math.pow(2, context_numBits);
      context_numBits++;
    }
  }
  value = 2;
  for (i = 0; i < context_numBits; i++) {
    context_data_val = context_data_val << 1 | value & 1;
    if (context_data_position == bitsPerChar - 1) {
      context_data_position = 0;
      context_data.push(getCharFromInt(context_data_val));
      context_data_val = 0;
    } else {
      context_data_position++;
    }
    value = value >> 1;
  }
  while (true) {
    context_data_val = context_data_val << 1;
    if (context_data_position == bitsPerChar - 1) {
      context_data.push(getCharFromInt(context_data_val));
      break;
    } else context_data_position++;
  }
  return context_data.join('');
}

/**
 * TypesafeExample 的分享链接（移植自 score.md 里同一个组件的 buildHref）：
 * 把这次请求压进 console.typesafe.ai 的 decode 页，打开就是同一个请求。
 */
function buildShareHref(ex) {
  const documentText = ex.state === undefined ? ''
    : (typeof ex.state === 'string' ? ex.state : JSON.stringify(ex.state, null, 2));
  return 'https://console.typesafe.ai/decode#share/' + compressToEncodedURIComponent(JSON.stringify({
    apiVersion: 'v1',
    documentText,
    promptsText: JSON.stringify(ex.questions, null, 2),
    selectedModels: ex.selectedModels,
  }));
}

/** TypesafeExample 还原为「请求 JSON」代码块 */
function typesafeExampleHtml(attrs, ctx) {
  const title = typeof attrs.title === 'string' ? attrs.title : 'request';
  const display = typeof attrs.display === 'string' ? attrs.display : 'request';
  let ex = null;
  if (typeof attrs.example === 'string') {
    try {
      ex = new Function('return (' + attrs.example + ');')();
    } catch (err) {
      ctx.warnings.push('TypesafeExample 的 example 解析失败（' + ctx.page + '）：' + err.message);
      ex = null;
    }
  }
  if (!ex || typeof ex !== 'object') {
    return '<div class="runtime-notice"><div><p class="runtime-title">示例请求</p>' +
      '<p class="runtime-text">该示例由原站的 React 组件渲染，自托管构建无法解析其数据。</p></div></div>';
  }
  let shown;
  if (display === 'questions') shown = { questions: ex.questions };
  else if (ex.state === undefined) shown = { questions: ex.questions };
  else shown = { state: ex.state, questions: ex.questions };
  const code = JSON.stringify(shown, null, 2);
  return '<div class="example-block">' +
    codeBlockHtml(code, 'json ' + JSON.stringify(title), ctx) +
    '<p class="example-hint">想直接运行这段请求？' +
    '<a href="' + esc(buildShareHref(ex)) + '" target="_blank" rel="noreferrer noopener">在 TypeSafe Playground 中打开 →</a></p>' +
    '</div>';
}

function substituteBlocks(html, store) {
  let out = String(html).replace(/<p>\s*(<div data-dsh-block="(\d+)"><\/div>)\s*<\/p>/g, '$1');
  out = out.replace(/<div data-dsh-block="(\d+)"><\/div>/g, (m, n) => {
    const v = store[Number(n)];
    return v === undefined ? '' : v;
  });
  return out;
}

/* ------------------------------------------------------- 原始 HTML 规整 */

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr']);
const HTML_TAGS = new Set(['a', 'abbr', 'address', 'article', 'aside', 'audio', 'b', 'bdi', 'bdo',
  'blockquote', 'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup', 'data',
  'datalist', 'dd', 'del', 'details', 'dfn', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset',
  'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr',
  'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'link', 'main', 'mark',
  'menu', 'meta', 'meter', 'nav', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p',
  'param', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'section', 'select',
  'slot', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup', 'svg', 'table',
  'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track',
  'u', 'ul', 'var', 'video', 'wbr', 'path', 'rect', 'circle', 'g', 'defs', 'line', 'polyline',
  'polygon', 'text', 'tspan']);
const ATTR_RENAME = {
  classname: 'class', colspan: 'colspan', rowspan: 'rowspan',
  htmlfor: 'for', readonly: 'readonly', autocomplete: 'autocomplete', maxlength: 'maxlength',
  srcset: 'srcset', strokewidth: 'stroke-width', strokelinecap: 'stroke-linecap',
  strokelinejoin: 'stroke-linejoin', fillrule: 'fill-rule',
  viewbox: 'viewBox', preserveaspectratio: 'preserveAspectRatio',
};
const DROP_ATTR = new Set(['key', 'ref']);
const JSX_ONLY = /^on[A-Z]/;

function normalizeRawHtml(text, ctx) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    if (text[i] !== '<') { out += text[i++]; continue; }
    if (text.startsWith('<div data-dsh-block=', i)) {
      const e = text.indexOf('>', i);
      out += text.slice(i, e + 1);
      i = e + 1;
      continue;
    }
    const tag = readTag(text, i);
    if (!tag || !HTML_TAGS.has(tag.name.toLowerCase())) { out += text[i++]; continue; }
    const lower = tag.name.toLowerCase();
    const rawAttrs = parseAttrs(tag.attrsRaw);
    const parts = [];
    for (const k of Object.keys(rawAttrs)) {
      const v0 = rawAttrs[k];
      const kLower = k.toLowerCase();
      if (DROP_ATTR.has(kLower) || JSX_ONLY.test(k)) continue;
      const outName = ATTR_RENAME[kLower] || (k.indexOf('-') > -1 ? k : kLower);
      if (v0 === true) { parts.push(outName); continue; }
      let v = String(v0);
      if (outName === 'style') {
        v = jsxStyleToCss(v.replace(/^\{/, '').replace(/\}$/, ''));
        if (!v) continue;
        parts.push('style="' + esc(v) + '"');
        continue;
      }
      if (v.startsWith('{') && v.endsWith('}')) continue;
      v = decodeEntities(v);
      if (outName === 'class') {
        v = v.replace(/\bdark:hidden\b/g, 'only-light').replace(/\bdark:block\b/g, 'only-dark');
        v = v.split(/\s+/).filter((t) => t && t !== 'block' && t !== 'hidden').join(' ');
        if (!v) continue;
      }
      parts.push(outName + '="' + esc(v) + '"');
    }
    if (lower === 'img' && !rawAttrs.loading && !rawAttrs.decoding) {
      parts.push('loading="lazy"', 'decoding="async"');
    }
    const attrStr = parts.length ? ' ' + parts.join(' ') : '';
    if (VOID_TAGS.has(lower)) out += '<' + lower + attrStr + '>';
    else if (tag.selfClosing) out += '<' + lower + attrStr + '></' + lower + '>';
    else out += '<' + lower + attrStr + '>';
    i = tag.end;
  }
  return out;
}

/* ------------------------------------------------------------- 链接重写 */

/** 站内根绝对链接按 --base 重写；外部链接、锚点、相对链接保持原样 */
function rewriteLinks(text, base) {
  let s = String(text);
  s = s.replace(/\]\(\s*<\/([^>\s]*)/g, (m, p) => '](<' + base + p);
  s = s.replace(/\]\(\s*\/(?!\/)/g, () => '](' + base);
  s = s.replace(/(\s(?:href|src|action|poster|data-src)=)(["'])\/(?!\/)/g,
    (m, attr, q) => attr + q + base);
  s = s.replace(/(\{\s*["'])\/(?!\/)/g, (m, q) => q + base);
  return s;
}


/* ==================================================================== *
 *  第二部分：marked 接入 + 页面级后处理
 * ==================================================================== */

const markedPath = path.join(__dirname, 'vendor', 'marked.umd.js');
if (!fs.existsSync(markedPath)) {
  throw new Error('缺少 vendored 渲染器：' + markedPath + '（见 tools/README-build.md）');
}
const markedPkg = require(markedPath);
const marked = markedPkg.marked || markedPkg;

function newPageContext(opts, pagePath, base) {
  let uid = 0;
  return {
    base,
    page: pagePath,
    // 相对站点根的路径前缀（页面越深 ../ 越多），用于本地产物资源引用
    rel: '../'.repeat(pagePath.split('/').length),
    hasMermaid: false,
    warnings: [],
    fieldIds: new Map(),
    uid: () => 'dsh' + (++uid),
  };
}

function markedParse(text, ctx) {
  const renderer = new marked.Renderer();
  renderer.code = function (token) {
    return codeBlockHtml(token.text, token.lang || '', ctx) + '\n';
  };
  renderer.heading = function (token) {
    const inner = this.parser ? this.parser.parseInline(token.tokens) : escText(token.text);
    return '<h' + token.depth + '>' + inner + '</h' + token.depth + '>\n';
  };
  return marked.parse(text, {
    renderer,
    gfm: true,
    breaks: false,
    pedantic: false,
    async: false,
    silent: true,
  });
}

/**
 * markdown + MDX -> HTML。
 * 顺序很关键：先遮蔽代码（围栏 / 行内），再抽组件，最后才交给 marked。
 */
function renderMarkdown(source, ctx) {
  const store = [];
  let text = String(source == null ? '' : source).replace(/\r\n?/g, '\n');
  text = stripEsmBlocks(text);
  text = maskBlocks(text, store, ctx);
  text = text.replace(/^[ \t]*skip:\s*\S+[ \t]*$/gm, '');
  text = text.replace(/^[ \t]*\{\}[ \t]*$/gm, '');
  text = unescapeMdPunctuation(text);
  text = rewriteLinks(text, ctx.base);
  text = normalizeRawHtml(text, ctx);
  const html = markedParse(text, ctx);
  return substituteBlocks(html, store);
}

/** MDX 里为了绕开 markdown 而写的反斜杠转义（多出现在原始 HTML 块中） */
function unescapeMdPunctuation(text) {
  return String(text).replace(/\\([[\]_])/g, '$1');
}

/* --------------------------------------------------------- 标题 / 目录 */

function uniqueId(base, used) {
  let id = base, n = 1;
  while (used.has(id)) { id = base + '-' + n; n++; }
  used.add(id);
  return id;
}

/**
 * 给 h1..h6 补 id 与锚点链接，并抽出 h2/h3 目录。
 * 已经带 id 的原始 HTML 标题（mkdocstrings 生成的）保持原 id 不变。
 */
// Mintlify 的自定义锚点语法：## 标题 {#custom-id}
// https://www.mintlify.com/docs/create/text —— "Custom heading IDs"
// 中文标题 slug 化之后会和英文原文的锚点对不上，站内 `](#english-anchor)` 就会点不动，
// 所以译文用这个语法把原锚点固定下来；生成器必须认它，否则会把 {#id} 当字面量吐出来。
// 标题里出现 CJK 时不套用原站的负字距（会把汉字挤在一起）
const HAS_CJK = /[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/;

const CUSTOM_HEADING_ID_RE = /\s*\{#([^{}\s]+)\}\s*$/;

function processHeadings(html) {
  const used = new Set();
  const toc = [];
  String(html).replace(/<h[1-6]\b[^>]*\bid="([^"]+)"/g, (m, id) => { used.add(id); return m; });
  const out = String(html).replace(/<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/g, (m, depth, attrs, rawInner) => {
    const d = Number(depth);
    if (/step-title/.test(attrs)) return m;

    // 先摘掉标题末尾的 {#custom-id}，它不参与渲染，只决定 id
    let inner = rawInner;
    let customId = '';
    const cm = inner.match(CUSTOM_HEADING_ID_RE);
    if (cm) {
      customId = cm[1];
      inner = inner.slice(0, inner.length - cm[0].length);
    }

    let id = '';
    const idMatch = attrs.match(/\bid="([^"]*)"/);
    if (idMatch) id = idMatch[1];
    if (!id && customId) {
      id = uniqueId(customId, used);
      attrs += ' id="' + esc(id) + '"';
    }
    if (!id) {
      id = uniqueId(slugify(inner), used);
      attrs += ' id="' + esc(id) + '"';
    }
    const text = collapseWs(stripInlineMarkdown(stripTags(inner)));
    // 中文标题不吃原站的负字距（-0.04em 会把汉字挤在一起）
    const cjk = HAS_CJK.test(text) ? ' data-cjk="1"' : '';
    const anchor = (d >= 2 && d <= 4)
      ? '<a class="heading-anchor" href="#' + esc(id) + '" aria-label="本节链接" tabindex="-1">#</a>'
      : '';
    let body = inner;
    let tail = '';
    const trimmed = body.replace(/\s+$/, '');
    tail = body.slice(trimmed.length);
    body = trimmed + anchor + tail;
    if ((d === 2 || d === 3) && text) toc.push({ id, text, depth: d });
    return '<h' + d + attrs + cjk + '>' + body + '</h' + d + '>';
  });
  return { html: out, toc };
}

/* ----------------------------------------------------------- 搜索索引 */

/** 抽纯文本前先剔掉 UI 噪声：复制按钮、锚点 #、代码块语言标签 */
function plainFromHtml(html) {
  return collapseWs(stripTags(String(html)
    .replace(/<button[\s\S]*?<\/button>/g, ' ')
    .replace(/<a class="heading-anchor"[\s\S]*?<\/a>/g, ' ')));
}

function buildSearchEntries(html, page, title) {
  const marks = [];
  const re = /<h([23])\b[^>]*\bid="([^"]*)"[^>]*>([\s\S]*?)<\/h\1>/g;
  let m;
  while ((m = re.exec(html))) {
    marks.push({ index: m.index, end: re.lastIndex, id: m[2], text: plainFromHtml(m[3]) });
  }
  const entries = [];
  const head = marks.length ? html.slice(0, marks[0].index) : html;
  const lead = plainFromHtml(head).slice(0, 600);
  entries.push({ path: page.path, title: title, heading: title, anchor: '', text: lead, tab: page.tab });
  for (let i = 0; i < marks.length; i++) {
    const mk = marks[i];
    const stop = i + 1 < marks.length ? marks[i + 1].index : html.length;
    const body = plainFromHtml(html.slice(mk.end, stop)).slice(0, 600);
    entries.push({
      path: page.path, title: title, heading: mk.text, anchor: mk.id,
      text: body, tab: page.tab,
    });
  }
  return entries.filter((e) => e.heading || e.text);
}

/* ----------------------------------------------------- 产物自检 */

const MDX_LEFTOVER_RE = /<\/?(Accordion|AccordionGroup|Card|CardGroup|CodeGroup|Columns|Expandable|Frame|Info|Note|ParamField|ResponseField|SdkSignature|Step|Steps|Tab|Tabs|Tip|TypesafeExample|Warning|ConfidenceExplorer|ScoreExplorer)\b/;

function auditRenderedHtml(html) {
  const problems = [];
  const leftover = html.match(MDX_LEFTOVER_RE);
  if (leftover) problems.push('残留 MDX 标签：' + leftover[0]);
  if (/className=/.test(html)) problems.push('残留 className 属性');
  if (/data-dsh-block=/.test(html)) problems.push('残留占位符 data-dsh-block');
  if (/\{\/\*/.test(html)) problems.push('残留 JSX 注释');
  const openDivs = (html.match(/<div\b/g) || []).length;
  const closeDivs = (html.match(/<\/div>/g) || []).length;
  if (openDivs !== closeDivs) problems.push('div 标签不配对：' + openDivs + ' / ' + closeDivs);
  return problems;
}


/* ==================================================================== *
 *  第三部分：样式表
 *  设计基线：正文 16px / 行高 1.75 / 每行 ≤40 汉字（640px）/
 *  文字对比度 ≥5:1 / 间距落在 4px 网格 / 字号取自固定模数阶。
 * ==================================================================== */

const STYLE_CSS = String.raw`
/* =====================================================================
 *  TypeSafe 中文文档 · 样式表
 *  视觉规格来源：docs.typesafe.ai（Mintlify "sequoia" 主题）实测 computed style
 *  调色板 / 排版尺度 / 布局几何 见 _orig/SPEC.md
 *
 *  字体自持：assets/fonts/ 下的 woff2 由 tools/build_site.mjs 从
 *  tools/vendor/fonts/ 拷贝，不发任何外部字体请求。
 *
 *  ── 关于等宽字体 ──────────────────────────────────────────────────
 *  原站使用 Mintlify 自有品牌字体 "paperMono"。该字体为 Mintlify 版权，
 *  随本站再分发存在法律风险，因此这里以同为 OFL 许可、几何风格的
 *  JetBrains Mono 顶替。若站主自行取得 paperMono 的再分发授权：
 *    1) 把 PaperMono_Variable.woff2 放进 tools/vendor/fonts/
 *    2) 在 build_site.mjs 的 copyAssets() 里加入该文件名
 *    3) 把下面 --font-mono 的第一项 "JetBrains Mono" 换成 "paperMono"
 *  即可完全还原原站字形。
 *  ─────────────────────────────────────────────────────────────────
 * ===================================================================== */

/* --- 字体（本地自持，font-display: swap） ---------------------------- */
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("fonts/inter-latin-wght-normal.woff2") format("woff2");
}
@font-face {
  font-family: "JetBrains Mono";
  font-style: normal;
  font-weight: 100 800;
  font-display: swap;
  src: url("fonts/jetbrains-mono-latin-wght-normal.woff2") format("woff2");
}

/* --- 设计令牌 -------------------------------------------------------- */
:root {
  /* 品牌色：原站 --primary = 229 81 186 */
  --primary: #E551BA;
  --primary-light: #E551BA;

  /* Mintlify 灰阶（带暖紫偏色，非中性灰） */
  --gray-50: #F9F5F8;
  --gray-100: #F5F0F3;
  --gray-200: #E5E0E4;
  --gray-300: #D5D0D3;
  --gray-400: #A5A0A4;
  --gray-500: #767275;
  --gray-600: #565255;
  --gray-700: #454144;
  --gray-800: #2C272B;
  --gray-900: #1D191C;
  --gray-950: #110C0F;
  --background-dark: #0D0A0F;
  --background-light: #FFFFFF;
  --codeblock-dark: #0B0C0E;

  /* 字体栈：拉丁走 Inter，中文回退系统 CJK，末尾保留 system-ui / sans-serif */
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
    "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC",
    "Source Han Sans SC", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, "Liberation Mono", "Courier New", monospace;

  /* 正文排印：中文可读性优先 —— 每行 ≤ 40 汉字、行高 ≥ 1.7
     18px × 40 = 720px 正文栏宽；行高 1.75 保证中文不挤压 */
  --prose-size: 18px;
  --prose-lh: 1.75;
  --prose-max: 720px;

  /* 布局几何（与原站 docs.typesafe.ai 同构）：
       左侧栏 288 固定  +  正文列居中（有上限）  +  右侧 TOC 288 固定
     正文列 = 720 正文栏 + 左右各 24 内边距 = 768。
     原站的正文列是 816（正文 768），但那是按拉丁排版定的：本站正文是中文，
     口径「每行 ≤ 40 汉字」→ 18px × 40 = 720 就是硬上限，所以列宽收窄 48px。
     收窄的是**宽度上限**，不是定位方式：宽屏下侧栏右缘与 TOC 左缘之间那块空白
     由正文列两侧均分（原站 ml/mr 也是均分），不再全部堆在右边。 */
  --content-w: 768px;
  --page-pad: 24px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
  --header-h: 96px;
  --sidebar-w: 288px;
  --toc-w: 288px;
}

html[data-theme="light"] {
  --bg: var(--background-light);
  --fg: var(--gray-700);
  --h1-fg: var(--gray-900);
  --heading-fg: #111827;
  --lead-fg: var(--gray-700);
  --muted: var(--gray-500);
  --faint: var(--gray-500);
  --border: var(--gray-100);
  --border-strong: var(--gray-200);
  --hairline: rgba(0, 0, 0, .1);
  --row-border: var(--gray-100);
  --header-bg: #FFFFFF;
  --tabrow-bg: var(--gray-50);
  --sidebar-link: var(--gray-700);
  --sidebar-active-bg: var(--gray-100);
  --sidebar-active-fg: var(--primary);
  --toc-fg: var(--gray-600);
  --link: var(--primary);
  --inline-code-bg: var(--gray-100);
  --inline-code-fg: #1F2937;
  --inline-code-bd: rgba(0, 0, 0, .06);
  --cb-bg: #FFFFFF;
  --cb-tinted-bg: var(--gray-50);
  --cb-border: rgba(0, 0, 0, .1);
  --cb-fg: #1F2328;
  --cb-title: var(--gray-700);
  --cb-chip-bg: rgba(0, 0, 0, .04);
  --search-bg: var(--gray-50);
  --search-bd: var(--gray-100);
  --search-kbd-bg: #FFFFFF;
  --search-kbd-fg: var(--gray-600);
  --pill-bg: rgba(120, 113, 108, .12);
  --pill-fg: #57534E;
  --req-bg: rgba(254, 226, 226, .6);
  --req-fg: #DC2626;
  --hdr-icon: rgba(29, 25, 28, .5);
  --sel: rgba(229, 81, 186, .18);
  --scroll-thumb: var(--gray-200);
  --shadow: 0 1px 2px rgba(0, 0, 0, .05);
  --shadow-pop: 0 10px 38px rgba(15, 12, 15, .16), 0 2px 8px rgba(15, 12, 15, .08);
  --overlay: rgba(24, 20, 24, .32);
  /* 主题偏好菜单（实测原站 theme-preference-menu-content） */
  --menu-bg: #FFFFFF;                 /* bg-white */
  --menu-bd: var(--gray-200);         /* border-gray-200 */
  --menu-fg: rgba(17, 12, 15, .7);    /* text-gray-950/70 */
  --menu-item-fg: var(--gray-800);    /* text-gray-800 */
  --menu-item-fg-hover: rgba(17, 12, 15, .75);
  --menu-item-hover: rgba(13, 10, 15, .03);
  --menu-item-hi: rgba(13, 10, 15, .05);
}
html[data-theme="dark"] {
  --bg: var(--background-dark);
  --fg: var(--gray-400);
  --h1-fg: var(--gray-200);
  --heading-fg: rgba(249, 245, 248, .7);
  --lead-fg: var(--gray-400);
  --muted: var(--gray-400);
  --faint: var(--gray-500);
  --border: var(--gray-800);
  --border-strong: var(--gray-700);
  --hairline: rgba(255, 255, 255, .1);
  --row-border: rgba(44, 39, 43, .5);
  --header-bg: var(--background-dark);
  --tabrow-bg: var(--gray-900);
  --sidebar-link: var(--gray-400);
  --sidebar-active-bg: rgba(44, 39, 43, .6);
  --sidebar-active-fg: var(--primary);
  --toc-fg: var(--gray-400);
  --link: var(--primary);
  --inline-code-bg: rgba(44, 39, 43, .6);
  --inline-code-fg: var(--gray-200);
  --inline-code-bd: rgba(165, 160, 164, .15);
  --cb-bg: var(--codeblock-dark);
  --cb-tinted-bg: rgba(255, 255, 255, .05);
  --cb-border: rgba(255, 255, 255, .1);
  --cb-fg: #D4D4D4;
  --cb-title: var(--gray-300);
  --cb-chip-bg: rgba(255, 255, 255, .06);
  --search-bg: var(--gray-900);
  --search-bd: var(--gray-800);
  --search-kbd-bg: var(--gray-950);
  --search-kbd-fg: var(--gray-400);
  --pill-bg: rgba(255, 255, 255, .05);
  --pill-fg: #E7E5E4;
  --req-bg: rgba(248, 113, 113, .1);
  --req-fg: #FCA5A5;
  --hdr-icon: rgba(255, 255, 255, .5);
  --sel: rgba(229, 81, 186, .28);
  --scroll-thumb: var(--gray-800);
  --shadow: 0 1px 2px rgba(0, 0, 0, .05);
  --shadow-pop: 0 16px 48px rgba(0, 0, 0, .6), 0 2px 8px rgba(0, 0, 0, .5);
  --overlay: rgba(6, 4, 7, .66);
  --menu-bg: var(--gray-950);            /* dark:bg-gray-950 = #110C0F */
  --menu-bd: rgba(255, 255, 255, .1);    /* dark:border-white/10 */
  --menu-fg: rgba(255, 255, 255, .7);    /* dark:text-white/70 */
  --menu-item-fg: var(--gray-300);       /* dark:text-gray-300 */
  --menu-item-fg-hover: rgba(255, 255, 255, .75);
  --menu-item-hover: rgba(255, 255, 255, .03);
  --menu-item-hi: rgba(255, 255, 255, .05);
}

/* --- 基础 ----------------------------------------------------------- */
*, *::before, *::after { box-sizing: border-box; }
html {
  -webkit-text-size-adjust: 100%;
  scroll-behavior: smooth;
  scroll-padding-top: calc(var(--header-h) + 16px);
  background: var(--bg);
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: .001ms !important; transition-duration: .001ms !important; }
}
body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 24px;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
a { color: inherit; text-decoration: none; }
img { max-width: 100%; height: auto; }
:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; border-radius: 3px; }
.ic { flex: none; display: block; }
.ic-sm { width: 16px; height: 16px; }
.ic-lg { width: 18px; height: 18px; }
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
.skip-link {
  position: absolute; left: 12px; top: -60px; z-index: 200;
  background: var(--primary); color: #fff; padding: 8px 16px; border-radius: 8px;
  font-size: 14px; font-weight: 500;
}
.skip-link:focus { top: 12px; }
.only-light, .only-dark { display: block; }
html[data-theme="dark"] .only-light { display: none !important; }
html[data-theme="light"] .only-dark { display: none !important; }

/* --- 顶栏（两行 96px） ---------------------------------------------- */
.topbar {
  position: sticky; top: 0; z-index: 60;
  height: var(--header-h);
  background: var(--header-bg);
  border-bottom: 1px solid var(--border);
}
.topbar-row1 {
  height: 48px; display: flex; align-items: center;
  padding: 0 var(--page-pad); gap: 16px;
}
.topbar-row2 {
  height: 48px; display: flex; align-items: center;
  background: var(--tabrow-bg); padding: 0 var(--page-pad);
}
.tb-left { flex: 1 1 0; display: flex; align-items: center; gap: 16px; min-width: 0; height: 100%; padding-right: 8px; }
.tb-center { flex: 1 1 0; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0 8px; min-width: 0; }
.tb-right { flex: 1 1 0; display: flex; align-items: center; justify-content: flex-end; gap: 8px; height: 100%; }

.brand { display: inline-flex; align-items: center; min-width: 0; }
.brand-logo { height: 22px; width: auto; display: block; }
.brand-logo.on-dark { display: none; }
html[data-theme="dark"] .brand-logo.on-light { display: none; }
html[data-theme="dark"] .brand-logo.on-dark { display: block; }

/* 居中搜索框：256×32、直角、gray 底 */
.search-btn {
  display: flex; align-items: center; width: 256px; height: 32px; min-width: 0;
  padding: 0 8px; gap: 4px; cursor: pointer; font: inherit;
  background: var(--search-bg); border: 1px solid var(--search-bd);
  border-radius: 0; color: var(--gray-500);
}
.search-btn:hover { background: var(--gray-100); border-color: var(--gray-200); }
html[data-theme="dark"] .search-btn:hover { background: var(--gray-800); border-color: var(--gray-800); }
.search-btn .ic { width: 16px; height: 16px; color: var(--gray-500); }
.search-btn .search-label { flex: 1 1 auto; text-align: left; font-size: 14px; line-height: 20px; color: var(--gray-500); padding-left: 4px; }
.search-btn kbd {
  flex: none; font-family: var(--font-sans); font-size: 12px; line-height: 16px; font-weight: 500;
  color: var(--search-kbd-fg); background: var(--search-kbd-bg);
  padding: 2px 6px; border-radius: 6px;
}
/* 实心洋红按钮 */
.btn-primary {
  display: inline-flex; align-items: center; height: 32px; padding: 6px 12px;
  background: var(--primary); color: #fff; font-size: 14px; line-height: 20px;
  font-weight: 500; white-space: nowrap; border-radius: 0; box-shadow: var(--shadow);
}
.btn-primary:hover { opacity: .9; }
.icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; padding: 8px; border: 0; background: none;
  color: var(--hdr-icon); cursor: pointer; border-radius: 0;
}
.icon-btn:hover { color: var(--fg); }
html[data-theme="dark"] .icon-btn:hover { color: var(--gray-100); }
/* 主题偏好菜单（三态）：触发按钮 32×32，菜单 min-w 128px / p-1 / rounded-2xl
   实测原站 #theme-preference-menu-trigger 32×32、#theme-preference-menu-content 128×118（3×36 + 8 + 2 边框） */
.theme-menu-wrap { position: relative; display: inline-flex; }
/* 触发按钮图标随偏好显隐：三个都在 DOM 里，只显示当前偏好对应的那个（同原站机制） */
.theme-trigger-icon { display: none; }
html[data-theme-preference="system"] .theme-trigger-icon[data-theme-preference-icon="system"],
html[data-theme-preference="light"] .theme-trigger-icon[data-theme-preference-icon="light"],
html[data-theme-preference="dark"] .theme-trigger-icon[data-theme-preference-icon="dark"] { display: block; }
.theme-ic { display: inline-flex; }
.theme-menu {
  position: absolute; top: calc(100% + 2px); right: 0; z-index: 120;
  min-width: 128px; max-height: 384px; overflow-y: auto; padding: 4px;
  background: var(--menu-bg); border: 1px solid var(--menu-bd);
  border-radius: var(--radius-2xl); box-shadow: var(--shadow-pop);
  color: var(--menu-fg);
}
.theme-menu[hidden] { display: none; }
.theme-menu button {
  display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%;
  padding: 8px; border: 0; border-radius: var(--radius-xl); background: none;
  font: inherit; font-size: 14px; line-height: 20px; font-weight: 400;
  color: var(--menu-item-fg); text-align: left; cursor: pointer; white-space: nowrap;
}
.theme-menu-main { display: flex; align-items: center; gap: 8px; min-width: 0; white-space: nowrap; }
.theme-menu button .ic { width: 16px; height: 16px; }
/* 选中项右侧的对勾（原站 size-3.5=14px，未选中时 text-primary/0 全透明） */
.theme-menu-check { display: inline-flex; color: transparent; }
.theme-menu-check .ic { width: 14px; height: 14px; }
.theme-menu button[aria-checked="true"] .theme-menu-check { color: var(--primary); }
.theme-menu button:hover { background: var(--menu-item-hover); color: var(--menu-item-fg-hover); }
.theme-menu button:focus { background: var(--menu-item-hi); color: var(--menu-item-fg-hover); }
.theme-menu button:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; }
.theme-menu button[aria-checked="true"] { color: var(--primary); font-weight: 500; }
@media (prefers-reduced-motion: no-preference) {
  .theme-menu:not([hidden]) { animation: theme-menu-in .1s ease-out; }
}
@keyframes theme-menu-in { from { opacity: 0; transform: scale(.95); } }
.menu-btn { display: none; }
html:not([data-js="on"]) .search-btn, html:not([data-js="on"]) #theme-preference-menu-trigger { display: none; }

/* 第二行 tabs */
.top-tabs { display: flex; align-items: center; gap: 0 24px; height: 100%; overflow-x: auto; scrollbar-width: none; }
.top-tabs::-webkit-scrollbar { display: none; }
.top-tab {
  position: relative; display: flex; align-items: center; gap: 8px;
  height: 48px; font-size: 14px; line-height: 20px; font-weight: 500;
  color: var(--gray-600); white-space: nowrap;
}
html[data-theme="dark"] .top-tab { color: var(--gray-400); }
.top-tab:hover { color: var(--gray-800); }
html[data-theme="dark"] .top-tab:hover { color: var(--gray-300); }
.top-tab .ic { width: 16px; height: 16px; }
.top-tab.is-active {
  /* 实测原站激活项不变色，只用 [text-shadow:-0.2px_0_0_currentColor,0.2px_0_0_currentColor] 伪粗体 */
  color: var(--gray-600);
  text-shadow: -0.2px 0 0 currentColor, 0.2px 0 0 currentColor;
}
html[data-theme="dark"] .top-tab.is-active { color: var(--gray-400); }
.top-tab.is-active::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: 0;
  height: 2px; background: var(--primary);
}

/* --- 布局 ----------------------------------------------------------- */
.layout { margin-left: var(--sidebar-w); display: flex; align-items: flex-start; }
.sidebar {
  position: fixed; left: 0; top: var(--header-h); z-index: 40;
  width: var(--sidebar-w);
  height: calc(100vh - var(--header-h));
  overflow-y: auto; overflow-x: hidden;
  border-right: 1px solid var(--hairline);
  background: var(--bg);
  padding: 0 8px 32px;
}
.sidebar::-webkit-scrollbar { width: 8px; }
.sidebar::-webkit-scrollbar-thumb { background: var(--scroll-thumb); border-radius: 4px; }
/* 中间列：吃掉侧栏与 TOC 之间的全部剩余宽度，正文列在它内部水平居中。
   原站的等价做法是给 #content-area 上 max-width:816px + 随视口变化的左右外边距
   （xl:ml-[max(0px,calc(50vw-348px-18rem))]）；这里用
   width:100% + max-width:var(--content-w) + margin:0 auto 得到同样的几何，
   且窄到装不下时自动退化成撑满，不会溢出。 */
.main { flex: 1 1 auto; min-width: 0; }
.main-inner {
  width: 100%; max-width: var(--content-w); margin: 0 auto;
  padding: var(--page-pad) var(--page-pad) 0;
}

/* --- 侧栏导航 ------------------------------------------------------- */
.sb-group { margin: 0; }
.sb-group-title {
  margin: 0 0 0 16px; padding: 32px 0 8px;
  font-size: 11px; line-height: 16px; font-weight: 500;
  letter-spacing: .09em; text-transform: uppercase;
  color: rgba(249, 245, 248, .7);
}
html[data-theme="light"] .sb-group-title { color: var(--gray-500); }
.sb-link {
  display: flex; align-items: flex-start; gap: 12px;
  width: 100%; min-height: 32px; padding: 6px 12px 6px 16px;
  font-size: 14px; line-height: 20px; font-weight: 400;
  color: var(--sidebar-link); overflow-wrap: anywhere;
}
.sb-link:hover { color: var(--primary); }
.sb-link.is-active { color: var(--sidebar-active-fg); background: var(--sidebar-active-bg); }
.sb-sub { margin: 0; }
.sb-sub > summary {
  display: flex; align-items: flex-start; gap: 12px; cursor: pointer; list-style: none;
  min-height: 32px; padding: 6px 12px 6px 16px;
  font-size: 14px; line-height: 20px; color: var(--sidebar-link);
}
.sb-sub > summary::-webkit-details-marker { display: none; }
.sb-sub > summary:hover { color: var(--primary); }
.sb-sub > summary { gap: 6px; }
.sb-sub > summary > span:first-child { flex: 0 1 auto; min-width: 0; overflow-wrap: anywhere; }
.sb-sub > summary .accordion-chev { flex: none; width: 14px; height: 14px; margin-top: 3px; color: var(--gray-500); transition: transform .15s ease; }
.sb-sub > summary .accordion-chev .ic { width: 14px; height: 14px; }
.sb-sub[open] > summary .accordion-chev { transform: rotate(90deg); }
.sb-sub-body { padding-left: 16px; }
.sb-sub-body .sb-group-title { margin-left: 0; }

/* --- 页头：面包屑 + H1 + Copy page ---------------------------------- */
.page-head { margin-top: 2px; }
.page-breadcrumb {
  height: 20px; margin: 0 0 4px;
  font-size: 11px; line-height: 16px; font-weight: 700;
  letter-spacing: .09em; text-transform: uppercase;
  color: rgba(249, 245, 248, .7);
}
html[data-theme="light"] .page-breadcrumb { color: var(--gray-500); }
.page-title-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
.page-title-row > h1 { flex: 1 1 auto; min-width: 0; }
.page-actions { flex: none; display: none; align-items: center; justify-content: flex-end; min-width: 156px; }
html[data-js="on"] .page-actions { display: flex; }
.page-lead { margin: 8px 0 0; font-size: var(--prose-size); line-height: 30px; color: var(--lead-fg); }

.copy-group { display: inline-flex; align-items: center; }
/* 原站实测（computed style）：Copy page 按钮 122×34 / padding 6px 12px / 图标 16px stroke 1.5，
   站点自定义 CSS（styles.css）对 #page-context-menu button 强制 border-radius:0，
   所以渲染出来是直角胶囊；展开按钮 34×34，箭头 12×12 stroke 2（chevron-right 旋转 90°）。 */
.copy-page {
  display: inline-flex; align-items: center; gap: 8px;
  height: 34px; padding: 6px 12px; cursor: pointer; font: inherit;
  font-size: 14px; line-height: 20px; font-weight: 500;
  color: var(--gray-300); background: var(--bg);
  border: 1px solid var(--gray-200); border-right: 0;
  border-radius: 0;
}
html[data-theme="dark"] .copy-page { border-color: rgba(255, 255, 255, .07); }
html[data-theme="light"] .copy-page { color: var(--gray-700); border-color: var(--gray-200); }
.copy-page:hover { background: rgba(165, 160, 164, .08); }
.copy-page .ic { width: 16px; height: 16px; }
.copy-page-more {
  display: inline-flex; align-items: center; justify-content: center;
  height: 34px; width: 34px; padding: 0; cursor: pointer;
  color: var(--gray-400); background: var(--bg);
  border: 1px solid var(--gray-200);
  border-radius: 0;
}
html[data-theme="dark"] .copy-page-more { border-color: rgba(255, 255, 255, .07); color: rgba(255, 255, 255, .5); }
html[data-theme="light"] .copy-page-more { border-color: var(--gray-200); color: var(--gray-500); }
.copy-page-more:hover { background: rgba(165, 160, 164, .08); }
.copy-page-more .ic { width: 12px; height: 12px; transition: transform .15s ease; }
/* 原站展开时把箭头旋转 180°（rotate-90 → rotate-[270deg]） */
.copy-page-more[aria-expanded="true"] .ic { transform: rotate(180deg); }
/* 下拉：实测原站 177×90 / padding 4px / 直角 / border-gray-200 dark:border-white/[0.07] /
   底色 bg-background-light dark:bg-background-dark；菜单项 8px 12px、16px/1.5 */
.copy-menu {
  position: absolute; z-index: 90; min-width: 156px; padding: 4px;
  background: var(--bg); border: 1px solid var(--gray-200); border-radius: 0;
  box-shadow: var(--shadow-pop);
}
html[data-theme="dark"] .copy-menu { border-color: rgba(255, 255, 255, .07); }
.copy-menu[hidden] { display: none; }
.copy-menu button {
  display: block; width: 100%; text-align: left; padding: 8px 12px;
  background: none; border: 0; border-radius: 0; cursor: pointer;
  font: inherit; font-size: 16px; line-height: 24px; color: var(--fg);
  white-space: nowrap;
}
.copy-menu button:hover, .copy-menu button:focus {
  background: rgba(86, 82, 85, .05); outline-offset: -2px;
}
html[data-theme="dark"] .copy-menu button:hover,
html[data-theme="dark"] .copy-menu button:focus { background: rgba(229, 224, 228, .05); }

/* --- 正文 ----------------------------------------------------------- */
.prose {
  margin: 32px 0 56px;
  font-size: var(--prose-size);
  line-height: var(--prose-lh);
  color: var(--fg);
}
.prose > * { max-width: var(--prose-max); }
.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
  color: var(--heading-fg); font-weight: 500; scroll-margin-top: calc(var(--header-h) + 16px);
}
.prose h1, .page-title-row h1 {
  font-size: 61.6px; line-height: .95; letter-spacing: -.04em; padding-bottom: 3.2px;
  margin: 0; color: var(--h1-fg); font-weight: 500; overflow-wrap: anywhere;
}
.prose h1[data-cjk], .page-title-row h1[data-cjk],
.prose h2[data-cjk], .prose h3[data-cjk], .prose h4[data-cjk] { letter-spacing: 0; }
h1.h1-plain { font-size: 40px; line-height: 1.15; }
.prose h2 { font-size: 24px; line-height: 32px; letter-spacing: -.025em; margin: 0; padding: 32px 0 8px; }
.prose h3 { font-size: 20px; line-height: 28px; letter-spacing: -.025em; margin: 0; padding: 32px 0 8px; }
.prose h4 { font-size: 17px; line-height: 26px; margin: 0; padding: 24px 0 8px; }
.prose h5, .prose h6 { font-size: 16px; line-height: 24px; margin: 0; padding: 20px 0 8px; }
.prose p { margin: 0 0 20px; }
.prose ul, .prose ol { margin: 20px 0; padding-left: 32px; }
.prose li { margin: 8px 0; }
.prose ul li::marker { color: var(--gray-600); }
.prose li > ul, .prose li > ol { margin: 8px 0; }
.prose hr { border: 0; border-top: 1px solid var(--row-border); margin: 32px 0; }
.prose blockquote {
  margin: 20px 0; padding: 2px 0 2px 16px;
  border-left: 3px solid var(--gray-700); color: var(--muted);
}
.prose blockquote p:last-child { margin-bottom: 0; }
.prose strong { font-weight: 600; color: #F9F5F8; }
html[data-theme="light"] .prose strong { color: #111827; }
.prose em { font-style: italic; }
.prose a { color: inherit; text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 1px; }
.prose a:hover { color: var(--primary); }
.prose a code { color: inherit; }

/* 行内 code：洋红主题下的圆角小胶囊 */
.prose code {
  font-family: var(--font-mono); font-size: 14px; line-height: 21px; font-weight: 500;
  background: var(--inline-code-bg); color: var(--inline-code-fg);
  border: 1px solid var(--inline-code-bd);
  border-radius: 6px; padding: 2px 8px; overflow-wrap: anywhere;
}

/* 表格：仅横向分隔线 */
.prose table { border-collapse: collapse; width: 100%; font-size: 14px; line-height: 20px; margin: 20px 0; }
.table-scroll { overflow-x: auto; margin: 20px 0; }
.table-scroll > table { margin: 0; }
.prose th, .prose td {
  text-align: left; vertical-align: top; border: 0;
  padding: 8px 8px 8px 0; border-bottom: 1px solid var(--row-border);
}
.prose thead th { font-weight: 600; color: #FFFFFF; padding: 0 8px 8px 0; }
html[data-theme="light"] .prose thead th { color: #111827; }
.prose tbody tr:last-child td { border-bottom: 0; }
.prose td[data-numeric] { font-variant-numeric: tabular-nums; }
.prose img { border-radius: 8px; }
.heading-anchor {
  margin-left: 8px; color: var(--gray-500); font-weight: 400; text-decoration: none;
  opacity: 0; transition: opacity .12s ease;
}
.prose h2:hover > .heading-anchor, .prose h3:hover > .heading-anchor,
.prose h4:hover > .heading-anchor, .heading-anchor:focus-visible { opacity: .9; }
.heading-anchor:hover { color: var(--primary); text-decoration: none; }

/* --- 提示块 callout -------------------------------------------------- */
.callout {
  display: flex; gap: 12px; margin: 16px 0; padding: 16px 20px;
  border: 1px solid var(--gray-200); background: var(--gray-50);
  border-radius: var(--radius-2xl); overflow: hidden; color: var(--fg);
}
html[data-theme="dark"] .callout { border-color: var(--gray-800); background: rgba(44, 39, 43, .35); }
.callout-ic { flex: none; margin-top: 4px; line-height: 1; color: var(--gray-500); }
html[data-theme="dark"] .callout-ic { color: var(--gray-400); }
.callout-body { min-width: 0; flex: 1 1 auto; font-size: 16px; line-height: 28px; }
.callout-body > *:last-child { margin-bottom: 0; }
.callout-body p { max-width: none; margin: 0 0 12px; }
.callout-title { font-weight: 600; }
.callout-note, .callout-info {
  border-color: #BFDBFE; background: #EFF6FF;
}
.callout-note .callout-ic, .callout-info .callout-ic { color: #1D4ED8; }
html[data-theme="dark"] .callout-note, html[data-theme="dark"] .callout-info {
  border-color: #1E3A8A; background: rgba(37, 99, 235, .2);
}
html[data-theme="dark"] .callout-note .callout-ic, html[data-theme="dark"] .callout-info .callout-ic { color: #93C5FD; }
.callout-tip { border-color: #A7F3D0; background: #ECFDF5; }
.callout-tip .callout-ic { color: #047857; }
html[data-theme="dark"] .callout-tip { border-color: #064E3B; background: rgba(16, 185, 129, .12); }
html[data-theme="dark"] .callout-tip .callout-ic { color: #6EE7B7; }
.callout-warning { border-color: #FDE68A; background: #FFFBEB; }
.callout-warning .callout-ic { color: #B45309; }
html[data-theme="dark"] .callout-warning { border-color: #78350F; background: rgba(245, 158, 11, .12); }
html[data-theme="dark"] .callout-warning .callout-ic { color: #FCD34D; }

/* --- 卡片 / 分栏 ---------------------------------------------------- */
.grid { display: grid; gap: 16px; margin: 8px 0 24px; max-width: none; }
.grid-1 { grid-template-columns: minmax(0, 1fr); }
.grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.card {
  display: block; position: relative; padding: 20px 24px;
  border: 1px solid var(--hairline); border-radius: var(--radius-2xl);
  background: var(--bg); color: var(--fg); overflow: hidden;
}
a.card:hover { border-color: var(--gray-300); }
html[data-theme="dark"] a.card:hover { border-color: var(--gray-700); }
.card-ic { display: block; margin-bottom: 16px; color: var(--primary); }
.card-ic .ic { width: 20px; height: 20px; }
.card-text { display: block; }
.card-title { display: block; font-size: 16px; line-height: 24px; font-weight: 600; color: var(--heading-fg); }
.card-body { display: block; margin-top: 8px; font-size: 16px; line-height: 28px; color: var(--fg); }
.card-body p { margin: 0; max-width: none; }
.card-text > .card-body code { font-size: 13px; }
.card-arrow { display: none; }
.card-note, .card-tip, .card-warning { border-left: 3px solid var(--primary); }

/* --- Tabs（内容区） ------------------------------------------------- */
.tabs { margin: 0 0 24px; max-width: var(--prose-max); }
.tab-nav {
  display: flex; gap: 0 24px; margin: 0 0 24px; padding: 0 0 1px;
  border-bottom: 1px solid var(--gray-200); overflow-x: auto; overflow-y: hidden;
  scrollbar-width: none;
}
html[data-theme="dark"] .tab-nav { border-bottom-color: rgba(229, 224, 228, .1); }
.tab-nav::-webkit-scrollbar { display: none; }
.tab-btn {
  appearance: none; background: none; border: 0; margin: 0 0 -1px; cursor: pointer;
  padding: 12px 0 10px; border-bottom: 1px solid transparent;
  font: inherit; font-size: 14px; line-height: 24px; font-weight: 600;
  color: var(--gray-900); white-space: nowrap; max-width: max-content;
}
html[data-theme="dark"] .tab-btn { color: var(--gray-200); }
.tab-btn:hover { border-bottom-color: var(--gray-300); }
html[data-theme="dark"] .tab-btn:hover { border-bottom-color: var(--gray-700); }
.tab-btn.is-active { color: var(--primary); border-bottom-color: currentColor; }
.tab-panels { padding-top: 0; }
html[data-js="on"] .tab-panel { display: none; }
html[data-js="on"] .tab-panel.is-active { display: block; }
html:not([data-js="on"]) .tab-nav { display: none; }
html:not([data-js="on"]) .tab-panel { display: block; }
html:not([data-js="on"]) .tab-panel + .tab-panel { border-top: 1px dashed var(--border); margin-top: 16px; padding-top: 8px; }
.tab-panel > *:last-child { margin-bottom: 0; }

/* --- 折叠面板 ------------------------------------------------------- */
.accordion-group { margin: 0 0 24px; max-width: var(--prose-max); }
.accordion {
  display: block; margin: 0 0 12px; overflow: hidden; cursor: default;
  border: 1px solid var(--hairline); border-radius: var(--radius-2xl);
  background: var(--cb-bg); max-width: var(--prose-max);
}
.accordion-sum, .expandable-sum {
  display: flex; align-items: center; gap: 12px; cursor: pointer; list-style: none;
  padding: 14px 20px; font-size: 16px; line-height: 28px; font-weight: 400; color: var(--fg);
}
.accordion-sum::-webkit-details-marker, .expandable-sum::-webkit-details-marker { display: none; }
.accordion-sum:hover, .expandable-sum:hover { background: var(--gray-100); }
html[data-theme="dark"] .accordion-sum:hover, html[data-theme="dark"] .expandable-sum:hover { background: var(--gray-800); }
.accordion-title, .expandable-title { flex: 1 1 auto; font-weight: 500; color: var(--heading-fg); }
.accordion-ic { color: var(--primary); }
.accordion-chev { color: var(--gray-500); transition: transform .15s ease; flex: none; }
details[open] > summary > .accordion-chev { transform: rotate(90deg); }
.accordion-body { padding: 0 20px 20px; }
.accordion-body > *:last-child { margin-bottom: 0; }
.expandable {
  display: block; margin: 16px 0 0; border: 1px solid var(--hairline);
  border-radius: var(--radius-xl); max-width: var(--prose-max); background: transparent;
}
.expandable-sum { padding: 12px 14px; font-size: 14px; line-height: 20px; color: var(--gray-300); }
html[data-theme="light"] .expandable-sum { color: var(--gray-700); }
.expandable-body { padding: 0 20px 20px; }
.expandable-body > *:last-child { margin-bottom: 0; }

/* --- Steps ---------------------------------------------------------- */
.steps { list-style: none; margin: 20px 0; padding: 0; max-width: var(--prose-max); }
.step { position: relative; padding: 0 0 24px 40px; margin: 0; border-left: 0; }
.step:last-child { padding-bottom: 0; }
.step-head { display: flex; align-items: center; gap: 12px; margin: 0 0 8px; }
.step-num {
  position: absolute; left: 0; top: 0; width: 28px; height: 28px; border-radius: 50%;
  background: var(--primary); color: #fff; font-size: 14px; font-weight: 600;
  display: inline-flex; align-items: center; justify-content: center;
}
.step-title { font-size: 18px; line-height: 28px; margin: 0; padding: 0; }
.step-body > *:last-child { margin-bottom: 0; }

/* --- Frame ---------------------------------------------------------- */
.frame {
  margin: 20px 0; padding: 2px; border: 1px solid var(--hairline);
  border-radius: var(--radius-2xl); background: var(--cb-tinted-bg);
  max-width: var(--prose-max);
}
.frame img, .frame iframe, .frame video { display: block; width: 100%; border-radius: 14px; }
.frame iframe { aspect-ratio: 16 / 9; border: 0; }
.frame figcaption { font-size: 14px; color: var(--muted); padding: 10px 12px; }

/* --- 代码块 --------------------------------------------------------- */
.code-block {
  position: relative; margin: 20px 0 32px; max-width: var(--prose-max);
  border: 1px solid var(--cb-border); border-radius: var(--radius-2xl);
  background: var(--cb-bg); overflow: hidden;
}
.code-block.has-title { padding: 2px; background: var(--cb-tinted-bg); }
.code-bar {
  display: flex; align-items: center; justify-content: space-between; gap: 6px;
  min-height: 34px; padding: 4px 10px 4px 16px;
}
.code-block.has-title .code-bar {
  background: transparent; border: 0; border-radius: 14px 14px 0 0;
}
.code-block:not(.has-title) .code-bar {
  position: absolute; top: 0; right: 0; padding: 12px 16px 0 0;
  min-height: 0; border: 0; background: none; z-index: 2;
}
.code-lang {
  display: inline-flex; align-items: center; gap: 6px; min-width: 0;
  font-size: 11px; line-height: 24px; font-weight: 700;
  letter-spacing: .09em; text-transform: uppercase; color: var(--cb-title);
}
.code-copy {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; padding: 0; border: 0; border-radius: 6px;
  background: none; color: var(--gray-400); font: inherit; cursor: pointer;
}
.code-copy:hover { background: var(--cb-chip-bg); color: var(--fg); }
.code-copy .ic { width: 16px; height: 16px; }
.code-copy .code-copy-text { display: none; }
.code-copy .ic-copied, .code-copy[data-copied="true"] .ic-copy { display: none; }
.code-copy[data-copied="true"] .ic-copied { display: block; color: #34D399; }
html:not([data-js="on"]) .code-copy { display: none; }
.code-block pre {
  margin: 0; padding: 14px 16px; overflow-x: auto;
  font-family: var(--font-mono); font-size: 14px; line-height: 24px;
  background: var(--cb-bg); color: var(--cb-fg); border-radius: 14px;
  scrollbar-width: none;
}
.code-block pre::-webkit-scrollbar { display: none; }
.mermaid-block .mermaid::-webkit-scrollbar { display: none; }
.mermaid-block .mermaid { scrollbar-width: none; }
.code-block.has-title pre { border-radius: 14px; }
.code-block pre code { background: none; border: 0; padding: 0; font-size: inherit; color: inherit; font-weight: 400; border-radius: 0; }
.code-block-flat { border: 0; border-radius: 0; margin: 0; max-width: none; }
.tabs.codegroup { max-width: var(--prose-max); }
.tabs.codegroup .tab-panel { border: 1px solid var(--cb-border); border-radius: var(--radius-2xl); overflow: hidden; }
.tabs.codegroup .tab-panel .code-block { margin: 0; }

/* 语法高亮（VS Code Dark+ / GitHub Light） */
.tk-k { color: #C586C0; }
.tk-s { color: #CE9178; }
.tk-n { color: #B5CEA8; }
.tk-c { color: #6A9955; font-style: italic; }
.tk-f { color: #DCDCAA; }
.tk-t { color: #4EC9B0; }
.tk-p { color: #9CDCFE; }
.tk-o { color: #D4D4D4; }
html[data-theme="light"] .tk-k { color: #CF222E; }
html[data-theme="light"] .tk-s { color: #0A3069; }
html[data-theme="light"] .tk-n { color: #0550AE; }
html[data-theme="light"] .tk-c { color: #6E7781; }
html[data-theme="light"] .tk-f { color: #8250DF; }
html[data-theme="light"] .tk-t { color: #953800; }
html[data-theme="light"] .tk-p { color: #0550AE; }
html[data-theme="light"] .tk-o { color: #1F2328; }

/* mermaid：与原站一致 —— 无边框、无标题栏，图形自带白底 */
.code-block.mermaid-block {
  border: 0; border-radius: 0; background: transparent; overflow: visible;
}
.mermaid-block .code-bar {
  top: 0; right: 0; padding: 8px 8px 0 0; position: absolute;
  min-height: 0; border: 0; background: none; z-index: 2;
}
.mermaid-block .mermaid {
  padding: 0; overflow-x: auto; font-family: var(--font-mono);
  font-size: 14px; line-height: 24px; white-space: pre; color: var(--cb-fg);
}
.mermaid-block .mermaid[data-processed="true"] {
  white-space: normal; font-family: var(--font-sans); color: var(--fg);
  text-align: center; padding: 20px 16px; background: transparent;
}
.mermaid-block .mermaid[data-processed="true"] svg { max-width: 100%; height: auto; }
.mermaid-error { color: #FCD34D; font-size: 13px; }

/* --- API 字段 ------------------------------------------------------- */
.field {
  display: block; margin: 10px 0; padding: 10px 0 20px;
  border-bottom: 1px solid var(--row-border); max-width: var(--prose-max); background: none;
}
.field-head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.field-name {
  font-family: var(--font-mono); font-size: 14px; line-height: 20px; font-weight: 600;
  color: var(--primary); background: none; border: 0; padding: 0; border-radius: 0;
  overflow-wrap: anywhere;
}
.field-type, .field-default {
  font-family: var(--font-mono); font-size: 12px; line-height: 20px; font-weight: 500;
  background: var(--pill-bg); color: var(--pill-fg);
  border-radius: 6px; padding: 2px 8px;
}
.field-req {
  font-size: 12px; line-height: 20px; font-weight: 500; text-transform: uppercase;
  letter-spacing: .04em; background: var(--req-bg); color: var(--req-fg);
  border-radius: 6px; padding: 2px 8px;
}
.field-opt {
  font-size: 12px; line-height: 20px; font-weight: 500;
  background: var(--pill-bg); color: var(--pill-fg); border-radius: 6px; padding: 2px 8px;
}
.field-body { margin-top: 12px; }
.field-body > *:last-child { margin-bottom: 0; }
.field .field { margin: 10px 0; }

/* --- SDK 签名 ------------------------------------------------------- */
.sdk-signature {
  position: relative; margin: 20px 0; max-width: var(--prose-max);
  border: 1px solid var(--cb-border); border-radius: var(--radius-2xl);
  background: var(--cb-bg); overflow: hidden;
}
.sdk-signature .code-bar {
  display: flex; justify-content: flex-end; padding: 4px 10px 0 16px; min-height: 0;
}
.sdk-signature pre {
  margin: 0; padding: 14px 16px; overflow-x: auto;
  font-family: var(--font-mono); font-size: 14px; line-height: 24px; color: var(--cb-fg);
}
.sdk-signature code { background: none; border: 0; padding: 0; white-space: pre-wrap; overflow-wrap: anywhere; font-weight: 400; }
.sdk-signature .n, .sdk-signature .nn { color: #4EC9B0; }
.sdk-signature .p, .sdk-signature .o { color: var(--cb-fg); }
.sdk-signature .kc { color: #C586C0; }
.sdk-signature .s, .sdk-signature .s1, .sdk-signature .s2 { color: #CE9178; }
.sdk-signature .nf, .sdk-signature .fm { color: #DCDCAA; }
.sdk-signature .mi, .sdk-signature .mf { color: #B5CEA8; }

/* --- 降级说明 / 示例 ------------------------------------------------ */
.runtime-notice {
  display: flex; gap: 12px; margin: 16px 0; padding: 16px 20px; max-width: var(--prose-max);
  border: 1px dashed var(--border-strong); border-radius: var(--radius-2xl);
  background: var(--cb-tinted-bg);
}
.runtime-ic { color: var(--gray-500); flex: none; margin-top: 4px; }
.runtime-title { font-weight: 600; margin: 0 0 4px; color: var(--heading-fg); }
.runtime-text { margin: 0; color: var(--muted); font-size: 15px; line-height: 26px; }
.example-block { margin: 20px 0 32px; max-width: var(--prose-max); }
.example-hint { font-size: 14px; line-height: 22px; color: var(--muted); margin: 10px 0 0; }

/* --- 交互式演示（ScoreExplorer / ConfidenceExplorer） ---------------- *
 *  组件与数据都内联在 primitives/score.md、confidence.md 的 JSX 里。
 *  下面的尺寸照那段实现的实测值落到本站令牌上：主色 --primary、灰阶 --gray-*、
 *  亮/暗两套主题各自取值；间距一律 4px 网格、字号取站内既有档位
 *  （11/12/14/16/30px 在站内已有用例）。
 * ------------------------------------------------------------------- */
.ex-section {
  /* 原组件的 text-zinc-600 / dark:text-zinc-400 映射到站内灰阶（比 --muted 深一档，
     放在 State 框的 gray-100 底上仍有 6.6:1，过 AA） */
  --ex-muted: var(--gray-600);
  margin: 24px 0; padding: 20px;
  border: 1px solid var(--border-strong); border-radius: var(--radius-2xl);
  max-width: var(--prose-max); color: var(--h1-fg);
}
@media (min-width: 640px) { .ex-section { padding: 24px; } }
html[data-theme="dark"] .ex-section { --ex-muted: var(--gray-400); }
.ex-eyebrow {
  font-size: 11px; line-height: 16px; font-weight: 700;
  letter-spacing: .08em; text-transform: uppercase; color: var(--ex-muted);
}
.ex-tabs { display: none; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
html[data-js="on"] .ex-tabs { display: flex; }
.ex-tab {
  appearance: none; background: none; cursor: pointer; margin: 0;
  padding: 8px 12px; border: 1px solid var(--gray-500);
  font: inherit; font-size: 14px; line-height: 22px; text-align: left; color: inherit;
}
.ex-tab:hover { background: var(--gray-100); }
html[data-theme="dark"] .ex-tab:hover { background: var(--gray-800); }
.ex-tab[aria-pressed="true"] {
  border-color: var(--primary);
  box-shadow: inset 0 0 0 1px var(--primary);
  background: color-mix(in srgb, var(--primary) 10%, transparent);
}
.ex-nojs { margin: 12px 0 0; font-size: 14px; line-height: 22px; color: var(--ex-muted); }
html[data-js="on"] .ex-nojs { display: none; }
.ex-interactive { display: none; }
html[data-js="on"] .ex-interactive { display: block; }
html[data-js="on"] .ex-cf-presets { display: flex; }
.ex-qblock { margin-top: 24px; min-height: 152px; }
.ex-q { margin-top: 8px; font-size: 16px; line-height: 24px; font-weight: 600; }
.ex-levels { margin-top: 12px; font-size: 14px; line-height: 22px; }
.ex-level + .ex-level { margin-top: 4px; }
.ex-level-num { font-weight: 600; font-variant-numeric: tabular-nums; }
.ex-state {
  margin-top: 20px; height: 128px; overflow-y: auto;
  padding: 12px 16px; background: var(--gray-100);
}
html[data-theme="dark"] .ex-state { background: var(--gray-900); }
@media (max-width: 639px) { .ex-state { height: 160px; } }
.ex-state-text { margin: 0; font-size: 14px; line-height: 22px; }
.ex-answer { margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border); }
.ex-answer-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.ex-answer-sub { margin-top: 12px; font-size: 14px; line-height: 22px; font-weight: 600; }
.ex-status { flex: none; text-align: right; }
.ex-status-label { font-size: 14px; line-height: 22px; color: var(--ex-muted); }
.ex-confidence {
  display: block; font-size: 30px; line-height: 36px; font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.ex-confidence-accent { color: var(--primary); }
.ex-score-row {
  margin-top: 4px; display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  font-size: 12px; line-height: 18px; color: var(--ex-muted);
}
.ex-diamond { display: inline-block; width: 10px; height: 10px; background: var(--primary); transform: rotate(45deg); }
.ex-chart { padding: 0 28px; }
.ex-plot { position: relative; height: 150px; margin-top: 36px; }
.ex-gridline {
  position: absolute; left: 0; right: 0; border-top: 1px dashed;
  border-color: color-mix(in srgb, currentColor 30%, transparent);
}
.ex-bar { position: absolute; bottom: 0; width: 56px; transform: translateX(-50%); background: var(--gray-500); }
.ex-bar-val {
  position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%);
  white-space: nowrap; font-size: 14px; line-height: 22px; font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.ex-axis { position: relative; height: 72px; }
.ex-axis-line { position: absolute; left: 0; right: 0; top: 0; height: 2px; background: var(--gray-500); }
.ex-tick { position: absolute; top: 0; width: 2px; height: 10px; transform: translateX(-50%); background: var(--gray-500); }
.ex-ticknum {
  position: absolute; top: 14px; transform: translateX(-50%);
  font-size: 14px; line-height: 22px; font-weight: 600; font-variant-numeric: tabular-nums;
}
.ex-tickname { position: absolute; top: 36px; font-size: 12px; line-height: 18px; color: var(--ex-muted); }
.ex-tickname-mid { display: none; }
@media (min-width: 640px) { .ex-tickname-mid { display: block; } }
.ex-score-pin {
  position: absolute; top: 1px; width: 14px; height: 14px; background: var(--primary);
  transform: translate(-50%, -50%) rotate(45deg); box-shadow: 0 0 0 2px #FFFFFF;
}
html[data-theme="dark"] .ex-score-pin { box-shadow: 0 0 0 2px #000000; }
.ex-details { margin-top: 20px; font-size: 14px; line-height: 22px; color: var(--ex-muted); }
.ex-details > summary { cursor: pointer; }
.ex-details-h { margin-top: 12px; font-weight: 600; color: var(--h1-fg); }
.ex-details-p { margin: 4px 0 0; }
.ex-details-formula { margin-top: 8px; font-family: var(--font-mono); font-size: 14px; line-height: 22px; overflow-wrap: anywhere; }
.ex-details code {
  font-family: var(--font-mono); font-size: 13px; font-weight: 500;
  background: var(--inline-code-bg); color: var(--inline-code-fg);
  border: 1px solid var(--inline-code-bd); border-radius: 6px; padding: 2px 6px;
}
.ex-cf-head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 16px; }
.ex-cf-title { margin-top: 8px; font-size: 16px; line-height: 24px; font-weight: 600; }
.ex-cf-chart { margin: 24px 0; }
.ex-cf-chart-label { font-size: 12px; line-height: 18px; color: var(--ex-muted); }
.ex-cf-plot { position: relative; height: 180px; margin: 36px 0 36px 44px; }
.ex-cf-grid {
  position: absolute; width: 100%; border-bottom: 1px solid;
  border-color: color-mix(in srgb, currentColor 18%, transparent);
}
.ex-cf-grid > span { position: absolute; right: calc(100% + 8px); transform: translateY(-50%); font-size: 12px; line-height: 18px; }
.ex-cf-bars { position: absolute; inset: 0; display: flex; justify-content: space-around; align-items: flex-end; }
.ex-col { position: relative; width: 21%; }
.ex-col-bar { height: 100%; background: currentColor; opacity: .45; }
.ex-col.is-winner .ex-col-bar { background: var(--primary); opacity: 1; }
.ex-col-val {
  position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%);
  white-space: nowrap; font-size: 14px; line-height: 22px; font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.ex-col-name { position: absolute; top: calc(100% + 8px); left: 50%; transform: translateX(-50%); font-size: 14px; line-height: 22px; }
.ex-cf-controls > label { display: flex; align-items: center; gap: 12px; font-size: 14px; line-height: 22px; }
.ex-cf-controls > label + label { margin-top: 12px; }
.ex-cf-opt { width: 20px; font-weight: 600; }
.ex-cf-row input[type="range"] { min-width: 0; flex: 1 1 auto; min-height: 44px; margin: 0; font-size: 14px; cursor: pointer; accent-color: var(--primary); }
.ex-out { width: 64px; text-align: right; font-variant-numeric: tabular-nums; }
.ex-cf-hint { margin: 12px 0 0; font-size: 14px; line-height: 22px; color: var(--ex-muted); }
.ex-cf-presets { margin-top: 16px; flex-wrap: wrap; gap: 8px; }
.ex-cf-selected { margin-top: 16px; font-size: 14px; line-height: 22px; }

/* --- 右侧目录 ------------------------------------------------------- *
 *  与原站同构：288 固定宽的独立栏，贴住视口右缘（不参与正文列的居中计算），
 *  吸顶滚动（原站实测 TOC 内容 223 宽 = 288 - 32 padding - 1 border + ...）。
 *  正文列居中只发生在「侧栏右缘 → TOC 左缘」这段里，所以 TOC 不会被推走、
 *  也不会在宽屏下消失；<1280 时整栏收起（见文末响应式）。
 * ------------------------------------------------------------------- */
.toc {
  flex: none; width: var(--toc-w); position: sticky; top: var(--header-h);
  height: calc(100vh - var(--header-h)); overflow-y: auto;
  padding: 16px 32px 0; border-left: 1px solid var(--border);
}
.toc::-webkit-scrollbar { width: 8px; }
.toc::-webkit-scrollbar-thumb { background: var(--scroll-thumb); border-radius: 4px; }
.toc-title {
  margin: 0 0 12px; font-size: 14px; line-height: 24px; font-weight: 500; color: var(--gray-500);
}
.toc-list { list-style: none; margin: 0; padding: 0; }
.toc-item a {
  display: block; padding: 4px 0; font-size: 14px; line-height: 24px; font-weight: 400;
  color: var(--toc-fg); overflow-wrap: anywhere;
}
.toc-item a:hover { color: var(--gray-900); }
html[data-theme="dark"] .toc-item a:hover { color: var(--gray-100); }
.toc-item.is-active a { color: var(--primary); }
.toc-item.depth-3 a { padding-left: 16px; }
.toc-item.depth-4 a { padding-left: 32px; }

/* --- 上一页 / 下一页 ------------------------------------------------ */
.pager {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px; margin: 0 0 0; max-width: var(--content-w);
}
.pager-link {
  display: flex; align-items: center; min-width: 0; padding: 12px 16px;
  border: 1px solid var(--border-strong); border-radius: var(--radius-xl);
  color: var(--fg);
}
html[data-theme="dark"] .pager-link { border-color: rgba(44, 39, 43, .7); }
.pager-link:hover { border-color: var(--gray-300); }
html[data-theme="dark"] .pager-link:hover { border-color: var(--gray-700); }
.pager-col { min-width: 0; max-width: 100%; display: flex; flex-direction: column; gap: 4px; }
.pager-link.next .pager-col { align-items: flex-end; text-align: right; }
.pager-dir {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 14px; line-height: 20px; font-weight: 500; color: var(--gray-500);
}
.pager-dir .ic { width: 10px; height: 10px; }
.pager-title { font-size: 16px; line-height: 24px; font-weight: 500; color: var(--heading-fg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
.pager-spacer { display: block; }

/* --- 页脚 ----------------------------------------------------------- */
.site-footer {
  display: flex; gap: 48px; justify-content: space-between; align-items: flex-start;
  margin: 0; padding: 40px 0 112px; max-width: var(--content-w);
  border-top: 1px solid var(--row-border); font-size: 16px; line-height: 24px; color: var(--fg);
}
.site-footer-links { display: flex; gap: 24px; flex-wrap: wrap; }
.site-footer-links a { display: inline-flex; color: var(--gray-400); }
html[data-theme="light"] .site-footer-links a { color: var(--gray-400); }
.site-footer-links a:hover { color: var(--gray-500); }
html[data-theme="dark"] .site-footer-links a:hover { color: var(--gray-400); }
.site-footer-links .ic { width: 20px; height: 20px; }
.site-footer-note { font-size: 14px; line-height: 20px; color: var(--gray-500); text-align: right; }
.site-footer-note strong { color: var(--gray-400); font-weight: 500; }

/* --- 搜索弹窗 ------------------------------------------------------- */
.search-overlay {
  position: fixed; inset: 0; z-index: 120; background: var(--overlay);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 10vh 16px 16px;
}
.search-overlay[hidden] { display: none; }
.search-panel {
  width: 100%; max-width: 640px; max-height: 70vh;
  display: flex; flex-direction: column; overflow: hidden;
  background: var(--bg); border: 1px solid var(--border);
  border-radius: var(--radius-xl); box-shadow: var(--shadow-pop);
}
.search-field {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px; border-bottom: 1px solid var(--border);
}
.search-field .ic { color: var(--gray-500); }
.search-field input {
  flex: 1 1 auto; min-width: 0; border: 0; background: none; color: var(--fg);
  font: inherit; font-size: 16px; line-height: 24px; outline: none;
}
.search-field input::placeholder { color: var(--gray-500); }
.search-hint { font-size: 12px; color: var(--gray-500); white-space: nowrap; }
.search-results { list-style: none; margin: 0; padding: 8px; overflow-y: auto; }
.search-result a {
  display: block; padding: 10px 12px; border-radius: 8px; color: var(--fg); min-height: 24px;
}
.search-result a:hover, .search-result.is-active a { background: var(--sidebar-active-bg); }
.search-result .sr-head { display: block; font-size: 13px; line-height: 18px; color: var(--primary); }
.search-result .sr-title { display: block; font-size: 15px; line-height: 22px; font-weight: 500; color: var(--heading-fg); }
.search-result .sr-text {
  display: block; font-size: 14px; line-height: 20px; color: var(--muted);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.search-result mark { background: var(--sel); color: inherit; border-radius: 3px; padding: 0 2px; }
.search-empty { padding: 28px 16px; text-align: center; color: var(--muted); font-size: 14px; }

/* --- 响应式 --------------------------------------------------------- *
 *  断点（与原站对齐，覆盖 2560 / 1920 / 1440 / 1280 / 1024 / 768 / 375）：
 *    ≥1280   三栏：侧栏 288 固定 | 正文列（上限 768，居中） | TOC 288 固定
 *    ≤1279   收 TOC（原站 xl 以下没有右侧目录），侧栏保留，正文列照常居中
 *    ≤1023   侧栏收成抽屉（原站 lg 以下），正文列拿到整幅宽度
 *    ≤899    移动版式：字号 / 栅格 / 页脚改单列
 *    ≤600    顶栏中段（搜索框）让位
 *  任何断点都不放大 --content-w / --prose-max，只是「装不下就撑满」，
 *  所以每行汉字数始终 ≤ 40，窄屏也不会被侧栏挤压出横向滚动。
 * ------------------------------------------------------------------- */
@media (max-width: 1279px) {
  .toc { display: none; }
}
@media (max-width: 1023px) {
  /* 侧栏改抽屉：布局不再给它留 288，正文列占满视口 */
  .menu-btn { display: inline-flex; }
  .layout { margin-left: 0; }
  .sidebar {
    position: fixed; inset: var(--header-h) auto 0 0; width: 300px; height: auto;
    background: var(--bg); border-right: 1px solid var(--border);
    padding: 0 8px 32px; transform: translateX(-100%); transition: transform .18s ease; z-index: 70;
  }
  .sidebar.is-open { transform: none; }
  .tb-left { flex: none; }
  .tb-center { flex: 1 1 auto; }
  .search-btn { width: 100%; max-width: 256px; }
}
@media (max-width: 899px) {
  /* 移动版式：字号降到 17px，正文栏同步收到 17 × 40 = 680，
     列宽 = 680 + 左右各 16 内边距 = 712，仍然守住「每行 ≤ 40 汉字」。 */
  :root { --header-h: 96px; --prose-size: 17px; --prose-max: 680px; --content-w: 712px; }
  .main-inner { padding: 16px 16px 0; }
  .prose > * { max-width: 100%; }
  .prose { margin-top: 24px; }
  .prose h1 { font-size: 40px; line-height: 1.05; }
  .prose h2 { font-size: 22px; }
  .grid-2, .grid-3, .grid-4 { grid-template-columns: minmax(0, 1fr); }
  .pager { grid-template-columns: minmax(0, 1fr); }
  .site-footer { flex-direction: column; gap: 24px; padding-bottom: 64px; }
  .site-footer-note { text-align: left; }
  .page-actions { display: none !important; }
}
@media (max-width: 600px) {
  .tb-center { display: none; }
  .btn-primary { display: none; }
}`;


/* ==================================================================== *
 *  第四部分：客户端脚本（原生 JS，无框架、无构建）
 * ==================================================================== */

const APP_JS = String.raw`
(function () {
  'use strict';
  var d = document;
  var root = d.documentElement;

  /* ---- 主题偏好：三态 system / light / dark（对齐 docs.typesafe.ai） ----
     偏好写在 <html data-theme-preference>，实际生效的主题写在 <html data-theme>；
     system 时跟随 prefers-color-scheme，并且系统主题变化时实时跟随。 */
  var THEME_KEY = 'tsd-theme-preference';
  var forcedTheme = (location.search.match(/[?&]theme=(dark|light)/) || [])[1] || null;
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function normalizePref(v) {
    return (v === 'dark' || v === 'light' || v === 'system') ? v : 'system';
  }
  function currentPref() { return normalizePref(root.getAttribute('data-theme-preference')); }
  function resolveTheme(pref) {
    if (pref === 'system') return (mq && mq.matches) ? 'dark' : 'light';
    return pref;
  }
  function currentTheme() { return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }

  function applyPreference(pref, persist) {
    pref = normalizePref(pref);
    var theme = resolveTheme(pref);
    root.setAttribute('data-theme-preference', pref);
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    var items = d.querySelectorAll('.theme-menu [role="menuitemradio"]');
    for (var i = 0; i < items.length; i++) {
      items[i].setAttribute('aria-checked',
        items[i].getAttribute('data-theme-preference') === pref ? 'true' : 'false');
    }
    if (persist) { try { localStorage.setItem(THEME_KEY, pref); } catch (e) { /* 隐私模式忽略 */ } }
    try { d.dispatchEvent(new CustomEvent('tsd:themechange', { detail: { preference: pref, theme: theme } })); } catch (e) {}
  }

  /* ---- 主题偏好菜单：Esc 关闭 / 方向键移动 / 点外关闭 ------------------ */
  var themeMenu = d.getElementById('theme-preference-menu');
  var themeTrigger = d.getElementById('theme-preference-menu-trigger');
  function themeItems() {
    return themeMenu ? themeMenu.querySelectorAll('[role="menuitemradio"]') : [];
  }
  function themeMenuOpen() { return !!(themeMenu && !themeMenu.hidden); }
  function openThemeMenu() {
    if (!themeMenu || !themeTrigger) return;
    var items = themeItems();
    for (var i = 0; i < items.length; i++) items[i].setAttribute('tabindex', '-1');
    themeMenu.hidden = false;
    themeTrigger.setAttribute('aria-expanded', 'true');
    // 原站 base-ui 打开时把高亮放在第一项上（data-highlighted），这里保持一致
    if (items.length) items[0].focus();
  }
  function closeThemeMenu(refocus) {
    if (!themeMenuOpen()) return;
    themeMenu.hidden = true;
    if (themeTrigger) {
      themeTrigger.setAttribute('aria-expanded', 'false');
      if (refocus) themeTrigger.focus();
    }
  }

  if (themeMenu && themeTrigger) {
    applyPreference(currentPref(), false);
    themeTrigger.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (themeMenuOpen()) closeThemeMenu(false); else openThemeMenu();
    });
    themeTrigger.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowDown' || ev.key === 'Down') { ev.preventDefault(); openThemeMenu(); }
    });
    themeMenu.addEventListener('click', function (ev) {
      var item = ev.target.closest ? ev.target.closest('[role="menuitemradio"]') : null;
      if (!item) return;
      forcedTheme = null;              // 用户显式选择后不再受 ?theme= 约束
      applyPreference(item.getAttribute('data-theme-preference'), true);
      closeThemeMenu(true);
    });
    themeMenu.addEventListener('keydown', function (ev) {
      var items = themeItems();
      if (!items.length) return;
      var cur = -1;
      for (var i = 0; i < items.length; i++) if (items[i] === d.activeElement) cur = i;
      var next = null;
      if (ev.key === 'ArrowDown' || ev.key === 'Down') next = (cur + 1) % items.length;
      else if (ev.key === 'ArrowUp' || ev.key === 'Up') next = (cur - 1 + items.length) % items.length;
      else if (ev.key === 'Home') next = 0;
      else if (ev.key === 'End') next = items.length - 1;
      else if (ev.key === 'Escape') { ev.preventDefault(); closeThemeMenu(true); return; }
      else if (ev.key === 'Tab') { closeThemeMenu(false); return; }
      if (next === null) return;
      ev.preventDefault();
      items[next].focus();
    });
    d.addEventListener('click', function (ev) {
      if (!themeMenuOpen()) return;
      var t = ev.target;
      if (t.closest && (t.closest('#theme-preference-menu') || t.closest('#theme-preference-menu-trigger'))) return;
      closeThemeMenu(false);
    });
    d.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') closeThemeMenu(true);
    });
    if (mq) {
      var onSchemeChange = function () { if (currentPref() === 'system') applyPreference('system', false); };
      if (mq.addEventListener) mq.addEventListener('change', onSchemeChange);
      else if (mq.addListener) mq.addListener(onSchemeChange);
    }
  } else {
    applyPreference(currentPref(), false);
  }

  /* ---- 移动端侧栏 -------------------------------------------------- */
  d.addEventListener('click', function (ev) {
    var t = ev.target.closest ? ev.target.closest('[data-menu-toggle]') : null;
    if (!t) return;
    var sb = d.getElementById('sidebar');
    if (sb) sb.classList.toggle('is-open');
  });

  /* ---- Tabs -------------------------------------------------------- */
  function initTabs(scope) {
    var sets = (scope || d).querySelectorAll('[data-tabs]');
    for (var s = 0; s < sets.length; s++) {
      var set = sets[s];
      if (set.getAttribute('data-tabs-ready') === 'true') continue;
      set.setAttribute('data-tabs-ready', 'true');
      (function (set) {
        var btns = set.querySelectorAll('.tab-btn');
        var panels = set.querySelectorAll('.tab-panel');
        function activate(idx) {
          for (var i = 0; i < btns.length; i++) {
            var on = i === idx;
            btns[i].classList.toggle('is-active', on);
            btns[i].setAttribute('aria-selected', on ? 'true' : 'false');
            btns[i].setAttribute('tabindex', on ? '0' : '-1');
          }
          for (var j = 0; j < panels.length; j++) panels[j].classList.toggle('is-active', j === idx);
        }
        for (var i = 0; i < btns.length; i++) {
          (function (i) {
            btns[i].addEventListener('click', function () { activate(i); });
            btns[i].addEventListener('keydown', function (ev) {
              var next = null;
              if (ev.key === 'ArrowRight') next = (i + 1) % btns.length;
              else if (ev.key === 'ArrowLeft') next = (i - 1 + btns.length) % btns.length;
              else if (ev.key === 'Home') next = 0;
              else if (ev.key === 'End') next = btns.length - 1;
              if (next === null) return;
              ev.preventDefault();
              activate(next);
              btns[next].focus();
            });
          })(i);
        }
        // 深链：#tab 面板里的锚点被打开时切到对应标签
        var hash = location.hash.replace('#', '');
        if (hash) {
          for (var k = 0; k < panels.length; k++) {
            if (panels[k].querySelector('[id="' + hash.replace(/"/g, '') + '"]')) { activate(k); break; }
          }
        }
      })(set);
    }
  }
  initTabs(d);

  /* ---- 剪贴板 ------------------------------------------------------ */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = d.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        d.body.appendChild(ta);
        ta.select();
        var ok = d.execCommand('copy');
        d.body.removeChild(ta);
        ok ? resolve() : reject(new Error('execCommand 失败'));
      } catch (e) { reject(e); }
    });
  }

  /* ---- 代码复制 ---------------------------------------------------- */
  d.addEventListener('click', function (ev) {
    var btn = ev.target.closest ? ev.target.closest('[data-copy]') : null;
    if (!btn) return;
    var host = btn.closest('.code-block') || btn.closest('.sdk-signature');
    if (!host) return;
    var codeEl = host.querySelector('.mermaid') || host.querySelector('pre code') || host.querySelector('pre');
    if (!codeEl) return;
    var text = codeEl.getAttribute && codeEl.getAttribute('data-src') ? codeEl.getAttribute('data-src') : codeEl.textContent;
    copyText(text).then(function () {
      btn.setAttribute('data-copied', 'true');
      var t = btn.querySelector('.code-copy-text');
      if (t) { t.setAttribute('data-old', t.textContent); t.textContent = '已复制'; }
      setTimeout(function () {
        btn.removeAttribute('data-copied');
        if (t && t.getAttribute('data-old') !== null) t.textContent = t.getAttribute('data-old');
      }, 1800);
    }).catch(function () {
      try {
        var range = d.createRange();
        range.selectNodeContents(codeEl);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (e) { /* 忽略 */ }
      var t2 = btn.querySelector('.code-copy-text');
      if (t2) t2.textContent = '请按 Ctrl+C';
      setTimeout(function () { if (t2) t2.textContent = ''; }, 2600);
    });
  });

  /* ---- Copy page 按钮 ---------------------------------------------- */
  function pagePlainText() {
    var art = d.querySelector('.prose');
    if (!art) return '';
    return art.innerText.replace(/\n{3,}/g, '\n\n').trim();
  }
  function flash(el, msg) {
    var span = el.querySelector('.copy-page-label') || el;
    var old = span.getAttribute('data-label') || span.textContent;
    span.setAttribute('data-label', old);
    span.textContent = msg;
    setTimeout(function () { span.textContent = old; }, 1800);
  }
  /* 原站「Copy page」= 复制本页 Markdown（LLMs 版），「View as Markdown」= 打开 .md。
     我们的 .md 由 tools/gen_llms.mjs 生成到同路径（<path>.md），取不到时退回正文纯文本。 */
  function pageMdUrl() {
    return d.body.getAttribute('data-md-src') || '';
  }
  function pageMarkdownText() {
    var url = pageMdUrl();
    if (!url || !window.fetch) return Promise.resolve(pagePlainText());
    return fetch(url, { credentials: 'same-origin' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    }).catch(function () { return pagePlainText(); });
  }
  var copyMenu = null;
  function setCopyExpanded(open) {
    var b = d.getElementById('page-context-menu-more');
    if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function closeCopyMenu() {
    if (!copyMenu || copyMenu.hidden) return;
    if (copyMenu.contains(d.activeElement)) {
      var more = d.getElementById('page-context-menu-more');
      if (more) more.focus();
    }
    copyMenu.hidden = true;
    setCopyExpanded(false);
  }
  d.addEventListener('click', function (ev) {
    var main = ev.target.closest ? ev.target.closest('[data-copy-page]') : null;
    if (main) {
      pageMarkdownText().then(function (t) { return copyText(t); })
        .then(function () { flash(main, '已复制'); })
        .catch(function () { flash(main, '复制失败'); });
      closeCopyMenu();
      return;
    }
    var more = ev.target.closest ? ev.target.closest('[data-copy-menu]') : null;
    if (more) {
      copyMenu = d.getElementById('copy-menu');
      if (copyMenu) {
        var open = copyMenu.hidden;
        closeCopyMenu();
        if (open) {
          var r = more.getBoundingClientRect();
          copyMenu.style.top = (r.bottom + 6) + 'px';
          copyMenu.style.right = Math.max(8, (d.documentElement.clientWidth - r.right)) + 'px';
          copyMenu.style.left = 'auto';
          copyMenu.hidden = false;
          setCopyExpanded(true);
          var firstItem = copyMenu.querySelector('[role="menuitem"]');
          if (firstItem) firstItem.focus();
        }
      }
      return;
    }
    var item = ev.target.closest ? ev.target.closest('[data-copy-action]') : null;
    if (item) {
      var act = item.getAttribute('data-copy-action');
      if (act === 'markdown') pageMarkdownText().then(function (t) { return copyText(t); });
      else if (act === 'view') window.open(pageMdUrl(), '_blank', 'noopener');
      closeCopyMenu();
      return;
    }
    if (copyMenu && !copyMenu.hidden && !ev.target.closest('#copy-menu')) closeCopyMenu();
  });
  d.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') closeCopyMenu(); });

  /* ---- Mermaid 懒加载 ---------------------------------------------- */
  var mermaidNodes = d.querySelectorAll('.mermaid');
  if (mermaidNodes.length) {
    var src = d.body.getAttribute('data-mermaid-src');
    var loading = false;
    function renderMermaid() {
      if (!window.mermaid) return;
      try {
        window.mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          // 原站在暗色主题下同样使用 mermaid 默认（浅色）主题，这里保持一致
          theme: 'default',
          fontFamily: 'inherit'
        });
        window.mermaid.run({ nodes: Array.prototype.slice.call(mermaidNodes) }).catch(function () {});
        for (var i = 0; i < mermaidNodes.length; i++) mermaidNodes[i].setAttribute('data-processed', 'true');
      } catch (e) {
        for (var j = 0; j < mermaidNodes.length; j++) {
          mermaidNodes[j].removeAttribute('data-processed');
        }
      }
    }
    function ensureMermaid() {
      if (window.mermaid) { renderMermaid(); return; }
      if (loading) return;
      loading = true;
      var s = d.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function () { loading = false; renderMermaid(); };
      s.onerror = function () { loading = false; };
      d.head.appendChild(s);
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) { io.disconnect(); ensureMermaid(); return; }
        }
      }, { rootMargin: '300px' });
      io.observe(mermaidNodes[0]);
    } else {
      ensureMermaid();
    }
    d.addEventListener('tsd:themechange', function () {
      if (window.mermaid) setTimeout(renderMermaid, 60);
    });
  }

  /* ---- 右侧目录 scroll spy ---------------------------------------- */
  var tocLinks = d.querySelectorAll('.toc-item a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    for (var i = 0; i < tocLinks.length; i++) {
      var id = decodeURIComponent(tocLinks[i].getAttribute('href').slice(1));
      var el = d.getElementById(id);
      if (el) map[id] = tocLinks[i].parentNode;
    }
    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      for (var k = 0; k < entries.length; k++) {
        visible[entries[k].target.id] = entries[k].isIntersecting;
      }
      var first = null;
      for (var j = 0; j < tocLinks.length; j++) {
        var hid = decodeURIComponent(tocLinks[j].getAttribute('href').slice(1));
        if (visible[hid]) { first = hid; break; }
      }
      for (var key in map) map[key].classList.remove('is-active');
      if (first && map[first]) map[first].classList.add('is-active');
    }, { rootMargin: '-120px 0px -70% 0px', threshold: 0 });
    for (var key2 in map) {
      var target = d.getElementById(key2);
      if (target) spy.observe(target);
    }
    setTimeout(function () {
      if (!d.querySelector('.toc-item.is-active') && tocLinks.length) {
        tocLinks[0].parentNode.classList.add('is-active');
      }
    }, 150);
  }

  /* ---- 客户端搜索 -------------------------------------------------- */
  var indexUrl = d.body.getAttribute('data-search-index');
  var overlay = d.getElementById('search-overlay');
  if (indexUrl && overlay) {
    var input = d.getElementById('search-input');
    var list = d.getElementById('search-results');
    var items = null;
    var loading = false;
    var activeIdx = -1;
    var pendingQuery = null;

    function loadIndex() {
      if (items) return Promise.resolve(items);
      if (loading) return pendingQuery;
      loading = true;
      pendingQuery = fetch(indexUrl).then(function (r) { return r.json(); }).then(function (data) {
        items = data;
        loading = false;
        return items;
      }).catch(function () { items = []; loading = false; return items; });
      return pendingQuery;
    }

    function esc(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
    function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, ''); }
    function subseq(hay, needle) {
      var h = 0;
      for (var i = 0; i < needle.length; i++) {
        h = hay.indexOf(needle[i], h);
        if (h === -1) return false;
        h++;
      }
      return true;
    }
    function score(entry, terms) {
      var head = norm(entry.heading);
      var title = norm(entry.title);
      var text = norm(entry.text);
      var total = 0;
      for (var i = 0; i < terms.length; i++) {
        var t = terms[i];
        if (!t) continue;
        if (head.indexOf(t) === 0) total += 60;
        else if (head.indexOf(t) > -1) total += 40;
        else if (title.indexOf(t) > -1) total += 24;
        else if (text.indexOf(t) > -1) total += 12;
        else if (subseq(head, t)) total += 8;
        else if (subseq(text, t)) total += 3;
        else return -1;
      }
      return total;
    }
    function highlight(text, terms) {
      var out = esc(text);
      for (var i = 0; i < terms.length; i++) {
        var t = terms[i];
        if (!t || t.length < 1) continue;
        var idx = out.toLowerCase().indexOf(esc(t).toLowerCase());
        if (idx > -1) {
          out = out.slice(0, idx) + '<mark>' + out.slice(idx, idx + t.length) + '</mark>' + out.slice(idx + t.length);
        }
      }
      return out;
    }

    var base = d.body.getAttribute('data-base') || '/';
    function render(q) {
      var terms = norm(q).length ? q.trim().split(/\s+/).map(norm) : [];
      list.innerHTML = '';
      activeIdx = -1;
      if (!terms.length) {
        list.innerHTML = '<li class="search-empty">输入关键词开始搜索（支持中文与模糊匹配）</li>';
        return;
      }
      var scored = [];
      for (var i = 0; i < items.length; i++) {
        var sc = score(items[i], terms);
        if (sc >= 0) scored.push({ e: items[i], s: sc });
      }
      scored.sort(function (a, b) { return b.s - a.s; });
      scored = scored.slice(0, 24);
      if (!scored.length) {
        list.innerHTML = '<li class="search-empty">没有找到匹配结果</li>';
        return;
      }
      var html = '';
      for (var j = 0; j < scored.length; j++) {
        var e = scored[j].e;
        var href = base + e.path + '/' + (e.anchor ? '#' + e.anchor : '');
        html += '<li class="search-result"><a href="' + esc(href) + '">' +
          '<span class="sr-head">' + highlight(e.title, terms) + (e.anchor ? ' · ' + highlight(e.heading, terms) : '') + '</span>' +
          '<span class="sr-text">' + highlight(e.text, terms) + '</span>' +
          '</a></li>';
      }
      list.innerHTML = html;
    }

    function openSearch() {
      overlay.hidden = false;
      loadIndex().then(function () { render(input.value); });
      input.value = '';
      render('');
      setTimeout(function () { input.focus(); }, 10);
    }
    function closeSearch() { overlay.hidden = true; }

    d.addEventListener('click', function (ev) {
      var t = ev.target.closest ? ev.target.closest('[data-search-open]') : null;
      if (t) { ev.preventDefault(); openSearch(); return; }
      if (ev.target === overlay) closeSearch();
    });
    var closeBtn = d.getElementById('search-close');
    if (closeBtn) closeBtn.addEventListener('click', closeSearch);

    d.addEventListener('keydown', function (ev) {
      var isK = (ev.key === 'k' || ev.key === 'K') && (ev.metaKey || ev.ctrlKey);
      if (isK) { ev.preventDefault(); overlay.hidden ? openSearch() : closeSearch(); return; }
      if (overlay.hidden) return;
      if (ev.key === 'Escape') { closeSearch(); return; }
      var links = list.querySelectorAll('.search-result a');
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        if (!links.length) return;
        activeIdx = ev.key === 'ArrowDown'
          ? (activeIdx + 1) % links.length
          : (activeIdx - 1 + links.length) % links.length;
        for (var i = 0; i < links.length; i++) {
          links[i].parentNode.classList.toggle('is-active', i === activeIdx);
        }
        links[activeIdx].scrollIntoView({ block: 'nearest' });
      } else if (ev.key === 'Enter') {
        if (activeIdx > -1 && links[activeIdx]) { location.href = links[activeIdx].getAttribute('href'); }
        else if (links.length) { location.href = links[0].getAttribute('href'); }
      }
    });
    input.addEventListener('input', function () { render(input.value); });
  }

  /* ---- 交互式演示：ScoreExplorer / ConfidenceExplorer -----------------
     数据不写在 JS 里：
       · ScoreExplorer 每个示例的静态标记由构建期渲染进 <template>，
         这里只做 DOM 交换 + 两处读数（confidence / score）的更新；
       · ConfidenceExplorer 的选项、当前值、预设值全从 DOM 读
         （data-ex-option / input.value / data-ex-preset），
         算法与 confidence.md 里的组件逐行一致。 */
  function initScoreExplorers() {
    var sections = d.querySelectorAll('[data-ex-score-explorer]');
    for (var s = 0; s < sections.length; s++) {
      (function (section) {
        var buttons = section.querySelectorAll('.ex-tab[data-ex-index]');
        var topHost = section.querySelector('[data-ex-top-host]');
        var restHost = section.querySelector('[data-ex-rest-host]');
        var confOut = section.querySelector('.ex-confidence');
        var scoreOut = section.querySelector('[data-ex-score-value]');
        if (!buttons.length || !topHost || !restHost || !confOut || !scoreOut) return;
        var firstTop = topHost.innerHTML;
        var firstRest = restHost.innerHTML;
        function select(index, btn) {
          for (var i = 0; i < buttons.length; i++) {
            buttons[i].setAttribute('aria-pressed', buttons[i] === btn ? 'true' : 'false');
          }
          if (index === 0) {
            topHost.innerHTML = firstTop;
            restHost.innerHTML = firstRest;
          } else {
            var t = section.querySelector('template[data-ex-top="' + index + '"]');
            var r = section.querySelector('template[data-ex-rest="' + index + '"]');
            if (t) topHost.innerHTML = t.innerHTML;
            if (r) restHost.innerHTML = r.innerHTML;
          }
          // 这两个节点是固定的（role=status 的 live region 必须留在原地，
          // 换掉节点本身屏幕阅读器就不播报了），所以只改文本
          confOut.textContent = btn.getAttribute('data-ex-confidence');
          scoreOut.textContent = btn.getAttribute('data-ex-score');
        }
        section.addEventListener('click', function (ev) {
          var btn = ev.target && ev.target.closest ? ev.target.closest('.ex-tab[data-ex-index]') : null;
          if (!btn || !section.contains(btn)) return;
          select(Number(btn.getAttribute('data-ex-index')), btn);
        });
      })(sections[s]);
    }
  }
  initScoreExplorers();

  function initConfidenceExplorers() {
    var sections = d.querySelectorAll('[data-ex-confidence-explorer]');
    for (var s = 0; s < sections.length; s++) {
      (function (section) {
        var inputs = section.querySelectorAll('input[type="range"][data-ex-option]');
        var chart = section.querySelector('.ex-cf-chart');
        var confOut = section.querySelector('.ex-confidence');
        var selectedEl = section.querySelector('.ex-cf-selected');
        var cols = section.querySelectorAll('.ex-col');
        var outs = section.querySelectorAll('.ex-out');
        if (!inputs.length || !chart || !confOut || !selectedEl || cols.length !== inputs.length) return;

        var options = [];
        var values = [];
        for (var i = 0; i < inputs.length; i++) {
          options.push(inputs[i].getAttribute('data-ex-option'));
          values.push(Number(inputs[i].value));
        }

        function formatProbability(value) {
          if (Math.abs(value - 100 / 3) < 0.000001) return '33\u2153%';
          return Number(value.toFixed(1)) + '%';
        }
        function choiceConfidence(vals) {
          var count = vals.length;
          var peak = Math.max.apply(null, vals) / 100;
          return Math.max(0, Math.min(1, (count * peak - 1) / (count - 1)));
        }
        function render(next) {
          values = next;
          var maximum = Math.max.apply(null, values);
          var winners = [];
          for (var a = 0; a < options.length; a++) {
            if (Math.abs(values[a] - maximum) < 0.000001) winners.push(options[a]);
          }
          var unique = winners.length === 1;
          confOut.textContent = choiceConfidence(values).toFixed(2);
          var parts = [];
          for (var b = 0; b < options.length; b++) {
            var label = formatProbability(values[b]);
            parts.push(options[b] + ' ' + label);
            inputs[b].value = values[b];
            inputs[b].setAttribute('aria-valuetext', label);
            if (outs[b]) outs[b].textContent = label;
            cols[b].style.height = values[b] + '%';
            cols[b].className = 'ex-col' + (unique && winners[0] === options[b] ? ' is-winner' : '');
            var val = cols[b].querySelector('.ex-col-val');
            if (val) val.textContent = label;
          }
          var selection = unique ? 'Option ' + winners[0] : 'Tie: ' + winners.join(', ');
          chart.setAttribute('aria-label',
            'Probability distribution: ' + parts.join(', ') + '. ' + selection + '.');
          // 可见那行带 Selected: 前缀，并列时只写 Tie:（与原组件一致）
          selectedEl.textContent = unique ? 'Selected: ' + selection : selection;
        }
        // 与 confidence.md 的 changeProbability 一致：被拖动的那一项取新值，
        // 其余按原比例分摊剩下的比例，最后一项吃掉舍入误差（总和恒为 100）
        function changeProbability(index, value) {
          var remaining = 100 - value;
          var others = [];
          var previousRemaining = 0;
          for (var k = 0; k < values.length; k++) {
            if (k === index) continue;
            others.push(k);
            previousRemaining += values[k];
          }
          var next = values.slice();
          next[index] = value;
          var assigned = 0;
          for (var m = 0; m < others.length; m++) {
            if (m === others.length - 1) {
              next[others[m]] = remaining - assigned;
            } else {
              var share = previousRemaining > 0
                ? remaining * values[others[m]] / previousRemaining
                : remaining / others.length;
              next[others[m]] = share;
              assigned += share;
            }
          }
          return next;
        }
        for (var j = 0; j < inputs.length; j++) {
          (function (idx) {
            inputs[idx].addEventListener('input', function () {
              render(changeProbability(idx, Number(inputs[idx].value)));
            });
          })(j);
        }
        section.addEventListener('click', function (ev) {
          var btn = ev.target && ev.target.closest ? ev.target.closest('[data-ex-preset]') : null;
          if (!btn || !section.contains(btn)) return;
          var raw = btn.getAttribute('data-ex-preset').split(',');
          var preset = [];
          for (var n = 0; n < raw.length; n++) preset.push(Number(raw[n]));
          if (preset.length !== options.length) return;
          render(preset);
        });
        render(values.slice());
      })(sections[s]);
    }
  }
  initConfidenceExplorers();
})();
`;


/* ==================================================================== *
 *  第五部分：导航、页面模板与构建主流程
 * ==================================================================== */

/* ------------------------------------------------------------- 导航模型 */

function collectPages(pages, out) {
  for (const p of pages || []) {
    if (typeof p === 'string') out.push(p);
    else if (p && Array.isArray(p.pages)) collectPages(p.pages, out);
  }
}

function buildNav(docs) {
  const tabs = [];
  for (const t of (docs.navigation && docs.navigation.tabs) || []) {
    const flat = [];
    collectPages(t.groups, flat);
    tabs.push({ label: t.tab || '', icon: t.icon || '', groups: t.groups || [], pages: flat });
  }
  const order = [];
  for (const t of tabs) for (const p of t.pages) order.push(p);
  // 面包屑（原站 eyebrow）：页面所属的顶层分组名
  const groupOf = new Map();
  for (const t of tabs) {
    for (const g of t.groups || []) {
      const flat = [];
      collectPages(g.pages, flat);
      for (const p of flat) groupOf.set(p, g.group || '');
    }
  }
  return { tabs, order, groupOf };
}

function nodeContainsPath(node, target) {
  if (typeof node === 'string') return node === target;
  if (node && Array.isArray(node.pages)) return node.pages.some((c) => nodeContainsPath(c, target));
  return false;
}

function groupContainsPath(group, target) {
  return (group.pages || []).some((c) => nodeContainsPath(c, target));
}

function sidebarNodesHtml(pages, ctx) {
  let html = '';
  for (const node of pages || []) {
    if (typeof node === 'string') {
      const active = node === ctx.currentPath;
      html += '<a class="sb-link' + (active ? ' is-active' : '') + '" href="' + esc(ctx.base + node + '/') + '"' +
        (active ? ' aria-current="page"' : '') + '>' + esc(ctx.titles.get(node) || node) + '</a>';
    } else if (node && Array.isArray(node.pages)) {
      const open = groupContainsPath(node, ctx.currentPath);
      html += '<details class="sb-sub"' + (open ? ' open' : '') + '>' +
        '<summary><span>' + esc(node.group || '') + '</span>' +
        '<span class="accordion-chev" aria-hidden="true">' + icon('chevron-right', 'ic ic-sm') + '</span></summary>' +
        '<div class="sb-sub-body">' + sidebarNodesHtml(node.pages, ctx) + '</div>' +
        '</details>';
    }
  }
  return html;
}

function sidebarHtml(tab, ctx) {
  let html = '';
  for (const g of tab.groups || []) {
    html += '<div class="sb-group">' +
      (g.group ? '<p class="sb-group-title">' + esc(g.group) + '</p>' : '') +
      sidebarNodesHtml(g.pages, ctx) + '</div>';
  }
  return html;
}

/* -------------------------------------------------------------- 页面模板 */

function headScript(themeInitOnly) {
  // 首帧前应用主题偏好（三态）：URL 参数 > localStorage > 跟随系统 prefers-color-scheme
  // 与 docs.typesafe.ai 一致：偏好写在 <html data-theme-preference>，实际主题写在 <html data-theme>。
  return '<script>(function(){var r=document.documentElement;try{' +
    'var m=location.search.match(/[?&]theme=(dark|light)/);' +
    'var v=m?m[1]:localStorage.getItem("tsd-theme-preference");' +
    'if(v!=="dark"&&v!=="light"&&v!=="system"){v="system";}' +
    'var t=(v==="system")?((window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches)?"dark":"light"):v;' +
    'r.setAttribute("data-theme-preference",v);' +
    'r.setAttribute("data-theme",t);r.style.colorScheme=t;' +
    '}catch(e){r.setAttribute("data-theme-preference","system");r.setAttribute("data-theme","light");}' +
    'r.setAttribute("data-js","on");})();<\/script>';
}

/* 主题偏好三态。触发按钮的图标**随偏好切换**，和原站一致：
   system→monitor / light→sun / dark→moon。
   原站的做法是三个图标都在 DOM 里、用
   html[data-theme-preference=…] [data-theme-preference-icon=…] { display: contents } 控制显隐，
   这里照抄同一套机制（CSS 见 .theme-trigger-icon 那段）。 */
const THEME_MENU_OPTIONS = [
  { value: 'system', label: '跟随系统', icon: 'monitor', aria: 'Switch to system theme' },
  { value: 'light', label: '浅色', icon: 'sun', aria: 'Switch to light theme' },
  { value: 'dark', label: '深色', icon: 'moon', aria: 'Switch to dark theme' },
];

function themeMenuHtml() {
  let items = '';
  for (const o of THEME_MENU_OPTIONS) {
    items += '<button type="button" role="menuitemradio" tabindex="-1" aria-checked="false" ' +
      'id="theme-preference-menu-item-' + o.value + '" data-theme-preference="' + o.value + '" ' +
      'aria-label="' + esc(o.aria) + '">' +
      '<span class="theme-menu-main">' + icon(o.icon, 'ic ic-sm', 2) + '<span>' + esc(o.label) + '</span></span>' +
      '<span class="theme-menu-check" aria-hidden="true">' + icon('check', 'ic', 2) + '</span></button>';
  }
  return '<div class="theme-menu-wrap">' +
    '<button class="icon-btn" id="theme-preference-menu-trigger" type="button" ' +
    'aria-label="Change theme preference" aria-haspopup="menu" aria-expanded="false" ' +
    'data-theme-menu-trigger>' +
    THEME_MENU_OPTIONS.map(function (o) {
      return '<span class="theme-trigger-icon" data-theme-preference-icon="' + o.value + '">' +
        icon(o.icon, 'ic ic-sm', 2) + '</span>';
    }).join('') +
    '</button>' +
    '<div class="theme-menu" id="theme-preference-menu" role="menu" hidden ' +
    'aria-labelledby="theme-preference-menu-trigger">' + items + '</div></div>';
}

function topbarHtml(site, ctx, tab) {
  const logoSrc = ctx.rel + 'assets/logo_light.png';
  const logoSrcDark = ctx.rel + 'assets/logo_dark.png';
  let tabs = '';
  for (const t of site.nav.tabs) {
    const first = t.pages[0];
    if (!first) continue;
    const active = t === tab;
    tabs += '<a class="top-tab' + (active ? ' is-active' : '') + '" href="' + esc(ctx.base + first + '/') + '"' +
      (active ? ' aria-current="true"' : '') + '>' +
      (t.icon && ICONS[t.icon] ? icon(t.icon, 'ic ic-sm', 2) : '') + esc(t.label) + '</a>';
  }
  const searchBtn = '<button class="search-btn" type="button" data-search-open aria-label="搜索文档">' +
    icon('search', 'ic ic-sm') + '<span class="search-label">Search...</span><kbd>Ctrl K</kbd></button>';
  return '<header class="topbar">' +
    '<div class="topbar-row1">' +
    '<div class="tb-left">' +
    '<button class="icon-btn menu-btn" type="button" data-menu-toggle aria-label="展开导航">' +
    icon('panel-left', 'ic ic-sm') + '</button>' +
    '<a class="brand" href="' + esc(ctx.base) + '">' +
    '<img class="brand-logo on-light" src="' + esc(logoSrc) + '" alt="' + esc(site.name) + '" width="99" height="22">' +
    '<img class="brand-logo on-dark" src="' + esc(logoSrcDark) + '" alt="' + esc(site.name) + '" width="99" height="22">' +
    '</a></div>' +
    '<div class="tb-center">' + searchBtn + '</div>' +
    '<div class="tb-right">' +
    (site.docs.console || site.docs.footer && site.docs.footer.console
      ? '<a class="btn-primary" href="' + esc(site.docs.console || site.docs.footer.console) + '" target="_blank" rel="noreferrer noopener">TypeSafe console</a>'
      : '<a class="btn-primary" href="https://console.typesafe.ai" target="_blank" rel="noreferrer noopener">TypeSafe console</a>') +
    themeMenuHtml() +
    '</div></div>' +
    '<nav class="topbar-row2" aria-label="主导航"><div class="top-tabs">' + tabs + '</div></nav>' +
    '</header>';
}

function tocHtml(toc) {
  if (!toc.length) return '<aside class="toc" aria-label="\u9875\u5185\u76ee\u5f55"></aside>';
  let items = '';
  for (const t of toc) {
    items += '<li class="toc-item depth-' + t.depth + '"><a href="#' + esc(t.id) + '">' + esc(t.text) + '</a></li>';
  }
  return '<aside class="toc" aria-label="页内目录"><p class="toc-title">On this page</p>' +
    '<ul class="toc-list">' + items + '</ul></aside>';
}

function pagerHtml(page, site, ctx) {
  const idx = site.nav.order.indexOf(page.path);
  const prev = idx > 0 ? site.nav.order[idx - 1] : null;
  const next = idx >= 0 && idx < site.nav.order.length - 1 ? site.nav.order[idx + 1] : null;
  if (!prev && !next) return '';
  let html = '<nav class="pager" aria-label="翻页">';
  html += prev
    ? '<a class="pager-link prev" href="' + esc(ctx.base + prev + '/') + '">' +
      '<span class="pager-col">' +
      '<span class="pager-title">' + esc(ctx.titles.get(prev) || prev) + '</span>' +
      '<span class="pager-dir">' + icon('chevron-left', 'ic') + '上一页</span>' +
      '</span></a>'
    : '<span class="pager-spacer"></span>';
  html += next
    ? '<a class="pager-link next" href="' + esc(ctx.base + next + '/') + '">' +
      '<span class="pager-col">' +
      '<span class="pager-title">' + esc(ctx.titles.get(next) || next) + '</span>' +
      '<span class="pager-dir">下一页' + icon('chevron-right', 'ic') + '</span>' +
      '</span></a>'
    : '<span class="pager-spacer"></span>';
  html += '</nav>';
  return html;
}

function footerHtml(site, ctx) {
  const social = (site.docs.footer && site.docs.footer.social) || {};
  let links = '';
  if (social.website) links += '<a href="' + esc(social.website) + '" target="_blank" rel="noreferrer noopener" aria-label="typesafe.ai">' + icon('globe', 'ic') + '</a>';
  if (social.github) links += '<a href="' + esc(social.github) + '" target="_blank" rel="noreferrer noopener" aria-label="GitHub">' + icon('github', 'ic') + '</a>';
  return '<footer class="site-footer">' +
    '<div class="site-footer-links">' + links + '</div>' +
    '<p class="site-footer-note">' + esc(site.name) + ' \u00b7 \u672c\u6587\u6863\u4e3a ' +
    '<strong>docs.typesafe.ai</strong> \u7b80\u4f53\u4e2d\u6587\u590d\u523b\u7684\u81ea\u6258\u7ba1\u9759\u6001\u6784\u5efa</p>' +
    '</footer>';
}

function searchOverlayHtml() {
  return '<div class="search-overlay" id="search-overlay" hidden>' +
    '<div class="search-panel" role="dialog" aria-modal="true" aria-label="搜索文档">' +
    '<div class="search-field">' + icon('search', 'ic ic-sm') +
    '<input id="search-input" type="search" placeholder="搜索标题与正文…" autocomplete="off" spellcheck="false" aria-label="搜索关键词">' +
    '<span class="search-hint">Esc 关闭</span>' +
    '<button class="icon-btn" id="search-close" type="button" aria-label="关闭搜索">' + icon('x', 'ic ic-sm') + '</button>' +
    '</div><ul class="search-results" id="search-results"></ul></div></div>';
}

/** 把正文开头的 h1（以及紧随其后的导语段落）提到页头，与原站 page-header 槽位一致 */
function splitPageBody(bodyHtml) {
  let rest = String(bodyHtml);
  let h1 = '';
  let lead = '';
  const m = rest.match(/^\s*(<h1\b[^>]*>[\s\S]*?<\/h1>)\s*/);
  if (m) { h1 = m[1]; rest = rest.slice(m[0].length); }
  if (h1) {
    const p = rest.match(/^(<p\b[^>]*>[\s\S]*?<\/p>)\s*/);
    if (p) { lead = p[1]; rest = rest.slice(p[0].length); }
    else {
      // Mintlify 约定：正文开头的引用块就是页面导语（原站渲染成普通段落，不带左边框）
      const bq = rest.match(/^\s*<blockquote>\s*(<p\b[^>]*>[\s\S]*?<\/p>)\s*<\/blockquote>\s*/);
      if (bq) { lead = bq[1]; rest = rest.slice(bq[0].length); }
    }
  }
  return { h1, lead, rest };
}

/* Copy page 按钮组：文案与顺序照原站实测（展开菜单只有两项：
   「Copy page / Copy page as Markdown for LLMs」和「View as Markdown / View this page as plain text」，
   站点自定义 CSS 把图标框与描述行都 display:none 了，所以可见的只有两行纯文字）。 */
function copyPageHtml() {
  return '<div class="copy-group">' +
    '<button class="copy-page" type="button" id="page-context-menu-button" data-copy-page aria-label="Copy page">' +
    icon('copy', 'ic', 1.5) + '<span class="copy-page-label">Copy page</span></button>' +
    '<button class="copy-page-more" type="button" id="page-context-menu-more" data-copy-menu ' +
    'aria-label="More actions" aria-haspopup="menu" aria-expanded="false">' +
    icon('chevron-down', 'ic', 2) + '</button>' +
    '<div class="copy-menu" id="copy-menu" role="menu" hidden>' +
    '<button type="button" role="menuitem" data-copy-action="markdown">Copy page</button>' +
    '<button type="button" role="menuitem" data-copy-action="view">View as Markdown</button>' +
    '</div></div>';
}

function pageHtml(page, bodyHtml, toc, opts, site) {
  const depth = page.path.split('/').length;
  const rel = '../'.repeat(depth);
  const ctx = { base: opts.base, rel, titles: site.titles, currentPath: page.path };
  const tab = site.tabOf.get(page.path) || site.nav.tabs[0];
  const desc = page.description || site.docs.description || '';
  const split = splitPageBody(bodyHtml);
  const eyebrow = (site.nav.groupOf && site.nav.groupOf.get(page.path)) || '';
  const mermaidAttr = page.hasMermaid
    ? ' data-mermaid-src="' + esc(rel + 'assets/mermaid.min.js') + '"'
    : '';
  const mermaidPreload = page.hasMermaid
    ? '<link rel="preload" as="script" href="' + esc(rel + 'assets/mermaid.min.js') + '">\n'
    : '';
  const head =
    '<header class="page-head">' +
    (eyebrow ? '<p class="page-breadcrumb">' + esc(eyebrow) + '</p>' : '') +
    '<div class="page-title-row">' +
    (split.h1 || ('<h1>' + esc(page.title) + '</h1>')) +
    '<div class="page-actions" id="page-context-menu">' + copyPageHtml() + '</div>' +
    '</div>' +
    (split.lead ? '<p class="page-lead">' + unwrapParagraph(split.lead) + '</p>' : '') +
    '</header>';
  return '<!doctype html>\n<html lang="zh-CN" data-theme="light">\n<head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + esc(page.title + ' · ' + site.name) + '</title>\n' +
    '<meta name="description" content="' + esc(desc.slice(0, 160)) + '">\n' +
    '<link rel="icon" href="' + esc(rel) + 'assets/favicon.svg" type="image/svg+xml">\n' +
    '<link rel="canonical" href="' + esc(opts.base + page.path + '/') + '">\n' +
    headScript() + '\n' +
    '<link rel="stylesheet" href="' + esc(rel) + 'assets/style.css">\n' +
    mermaidPreload +
    '</head>\n<body data-base="' + esc(opts.base) + '" data-search-index="' + esc(rel + 'search-index.json') + '"' +
    ' data-md-src="' + esc(rel + page.path + '.md') + '"' + mermaidAttr + '>\n' +
    '<a class="skip-link" href="#main">跳到主要内容</a>\n' +
    topbarHtml(site, ctx, tab) + '\n' +
    '<div class="layout">\n' +
    '<aside class="sidebar" id="sidebar" aria-label="文档导航">' + sidebarHtml(tab, ctx) + '</aside>\n' +
    '<main class="main" id="main"><div class="main-inner">\n' +
    head + '\n' +
    '<article class="prose">' + split.rest + '</article>\n' +
    pagerHtml(page, site, ctx) + '\n' +
    footerHtml(site, ctx) + '\n' +
    '</div></main>\n' +
    tocHtml(toc) + '\n' +
    '</div>\n' +
    searchOverlayHtml() + '\n' +
    '<script src="' + esc(rel) + 'assets/app.js" defer><\/script>\n' +
    '</body>\n</html>\n';
}

function redirectHtml(target, label) {
  return '<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="robots" content="noindex">\n' +
    '<meta http-equiv="refresh" content="0; url=' + esc(target) + '">\n' +
    '<link rel="canonical" href="' + esc(target) + '">\n' +
    '<title>跳转到 ' + esc(label) + '</title>\n</head>\n' +
    // 保留 ?query 与 #hash，重定向后主题等参数不丢
    '<body><script>location.replace(' + JSON.stringify(target) + '+location.search+location.hash);<\/script>' +
    '<p>正在跳转到 <a href="' + esc(target) + '">' + esc(label) + '</a>…</p></body>\n</html>\n';
}

function notFoundHtml(opts, site) {
  const ctx = { base: opts.base, rel: '', titles: site.titles, currentPath: '' };
  const tab = site.nav.tabs[0];
  return '<!doctype html>\n<html lang="zh-CN" data-theme="light">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>页面不存在 · ' + esc(site.name) + '</title>\n' +
    '<meta name="robots" content="noindex">\n' +
    '<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">\n' +
    headScript() + '\n<link rel="stylesheet" href="assets/style.css">\n</head>\n' +
    '<body data-base="' + esc(opts.base) + '" data-search-index="search-index.json">\n' +
    '<a class="skip-link" href="#main">跳到主要内容</a>\n' +
    topbarHtml(site, ctx, tab) + '\n' +
    '<div class="layout"><aside class="sidebar" id="sidebar" aria-label="文档导航">' + sidebarHtml(tab, ctx) + '</aside>' +
    '<main class="main" id="main"><div class="main-inner">' +
    '<header class="page-head"><p class="page-breadcrumb">404</p>' +
    '<div class="page-title-row"><h1 class="h1-plain">页面不存在</h1></div></header>' +
    '<article class="prose">' +
    '<p>你访问的地址没有对应的页面。可能是链接已经变动，或者路径拼写有误。</p>' +
    '<p>可以回到 <a href="' + esc(opts.base) + '">文档首页</a>，或者用顶部的搜索（Ctrl / Cmd + K）查找。</p>' +
    '</article>' +
    footerHtml(site, ctx) +
    '</div></main>' +
    '<aside class="toc" aria-label="页内目录"></aside></div>\n' +
    searchOverlayHtml() + '\n' +
    '<script src="assets/app.js" defer><\/script>\n</body>\n</html>\n';
}

/* ------------------------------------------------------- 页面内容处理 */

function extractTitle(md, fallback) {
  const m = String(md).match(/^#[ \t]+(.+?)[ \t]*$/m);
  return m ? collapseWs(stripInlineMarkdown(m[1])) : fallback;
}

function extractDescription(md) {
  const lines = String(md).replace(/\r\n?/g, '\n').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l || l.startsWith('#') || l.startsWith('>') || l.startsWith('<') || l.startsWith('export')) {
      if (l.startsWith('> ')) return collapseWs(stripInlineMarkdown(l.slice(2)));
      continue;
    }
    return collapseWs(stripInlineMarkdown(l)).slice(0, 200);
  }
  return '';
}

function wrapTables(html) {
  return String(html).replace(/<table>[\s\S]*?<\/table>/g, (m) => '<div class="table-scroll">' + m + '</div>');
}

/**
 * 外链图片本地化：正文里的 ![x](https://mintcdn.com/...) 在构建时改写成
 * assets/images/<本地文件>，产物不再引用 Mintlify CDN（见 SPEC 第 6 节）。
 * 映射表由 tools/vendor/images/manifest.json 提供（原始 URL -> 本地文件名）。
 */
const REMOTE_IMAGE_MAP = (() => {
  try {
    const p = path.join(__dirname, 'vendor', 'images', 'manifest.json');
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.warn('  警告：读取 tools/vendor/images/manifest.json 失败：' + e.message);
  }
  return {};
})();

function rewriteRemoteImages(html, ctx) {
  const s = String(html == null ? '' : html);
  if (s.indexOf('http') === -1) return s;
  return s.replace(/(<img\b[^>]*?\bsrc=")(https?:\/\/[^"]+)(")/g, (m, pre, url, post) => {
    // HTML 属性里的 & 会被序列化成 &amp;，两种写法都要能命中映射表
    const plain = url.replace(/&amp;/g, '&');
    const local = REMOTE_IMAGE_MAP[plain] || REMOTE_IMAGE_MAP[plain.split('?')[0]] ||
      REMOTE_IMAGE_MAP[url] || REMOTE_IMAGE_MAP[url.split('?')[0]];
    if (!local) return m;
    return pre + esc((ctx && ctx.rel ? ctx.rel : '') + 'assets/images/' + local) + post;
  });
}

/** 收尾清理：外链图片本地化、独占一段的纯锚点不该被 p 包着；顺带压缩多余空行 */
function tidyHtml(html, ctx) {
  return rewriteRemoteImages(html, ctx)
    .replace(/<p>\s*(<a\s[^>]*id="[^"]*"[^>]*>\s*<\/a>)\s*<\/p>/g, '$1')
    .replace(/\n{3,}/g, '\n\n');
}

function renderPage(md, pagePath, opts, titles) {
  const ctx = newPageContext(opts, pagePath, opts.base);
  attachExplorerData(md, ctx); // 交互组件的数据取自 .md 源码本身（见文件上方说明）
  let body = renderMarkdown(md, ctx);
  const heading = processHeadings(body);
  body = tidyHtml(wrapTables(heading.html), ctx);
  const problems = auditRenderedHtml(body);
  return {
    body,
    toc: heading.toc,
    hasMermaid: ctx.hasMermaid,
    warnings: ctx.warnings,
    problems,
  };
}

/* ------------------------------------------------------------------ 主流程 */

/** 本地字体：从 tools/vendor/fonts/ 拷到 assets/fonts/，构建产物不引用任何外部字体 */
const VENDOR_FONTS = [
  'inter-latin-wght-normal.woff2',
  'jetbrains-mono-latin-wght-normal.woff2',
];

// 品牌色以 docs.json 的 colors.primary 为准（线上原站实测 = #E551BA），
// STYLE_CSS 里的字面量只是 fallback —— 这样 docs.json 和构建产物不会再各说各话。
function copyAssets(outDir, brand) {
  const assetsDir = path.join(outDir, 'assets');
  mkdirp(assetsDir);
  const css = STYLE_CSS.trimStart()
    .split('--primary: #E551BA;').join('--primary: ' + brand + ';')
    .split('--primary-light: #E551BA;').join('--primary-light: ' + brand + ';');
  writeFileEnsured(path.join(assetsDir, 'style.css'), css);
  writeFileEnsured(path.join(assetsDir, 'app.js'), APP_JS.trimStart());
  const mermaidSrc = path.join(__dirname, 'vendor', 'mermaid.min.js');
  if (fs.existsSync(mermaidSrc)) {
    fs.copyFileSync(mermaidSrc, path.join(assetsDir, 'mermaid.min.js'));
  }
  const fontDir = path.join(assetsDir, 'fonts');
  mkdirp(fontDir);
  for (const f of VENDOR_FONTS) {
    const src = path.join(__dirname, 'vendor', 'fonts', f);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(fontDir, f));
    else console.warn('  警告：缺少字体文件 tools/vendor/fonts/' + f);
  }
  // 正文里原本指向 mintcdn.com 的图片，已在构建时改写成本地路径
  const imgSrcDir = path.join(__dirname, 'vendor', 'images');
  if (fs.existsSync(imgSrcDir)) {
    const imgOutDir = path.join(assetsDir, 'images');
    mkdirp(imgOutDir);
    for (const f of fs.readdirSync(imgSrcDir)) {
      if (f === 'manifest.json') continue;
      fs.copyFileSync(path.join(imgSrcDir, f), path.join(imgOutDir, f));
    }
  }
  const branding = ['logo_light.png', 'logo_dark.png', 'favicon.svg'];
  for (const f of branding) {
    const src = path.join(REPO_ROOT, f);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(assetsDir, f));
    else console.warn('  警告：缺少品牌资源 ' + f);
  }
}
/////END

function main() {
  const t0 = Date.now();
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log('用法：node tools/build_site.mjs [--base /] [--out dist] [--site-name 名称]');
    return;
  }

  const docsPath = path.join(REPO_ROOT, 'docs.json');
  if (!fs.existsSync(docsPath)) throw new Error('找不到 docs.json：' + docsPath);
  const docs = JSON.parse(fs.readFileSync(docsPath, 'utf8'));
  const siteName = opts.siteName || docs.name || '文档';
  const nav = buildNav(docs);
  if (!nav.order.length) throw new Error('docs.json 的 navigation.tabs 里没有页面');

  const tabOf = new Map();
  for (const t of nav.tabs) for (const p of t.pages) tabOf.set(p, t);

  const outDir = opts.out;
  fs.rmSync(outDir, { recursive: true, force: true });
  mkdirp(outDir);

  const titles = new Map();
  const pages = [];
  const warnings = [];
  const problems = [];

  for (const p of nav.order) {
    const mdPath = path.join(REPO_ROOT, p + '.md');
    if (!fs.existsSync(mdPath)) {
      warnings.push('docs.json 引用的页面缺少文件：' + p + '.md');
      continue;
    }
    const md = fs.readFileSync(mdPath, 'utf8');
    titles.set(p, extractTitle(md, p.split('/').pop()));
  }

  const site = { name: siteName, docs, nav, tabOf, titles };

  for (const p of nav.order) {
    const mdPath = path.join(REPO_ROOT, p + '.md');
    if (!fs.existsSync(mdPath)) continue;
    const md = fs.readFileSync(mdPath, 'utf8');
    const r = renderPage(md, p, opts, titles);
    if (r.warnings.length) warnings.push(...r.warnings.map((w) => p + '：' + w));
    if (r.problems.length) problems.push(...r.problems.map((w) => p + '：' + w));
    const page = {
      path: p,
      title: titles.get(p),
      description: extractDescription(md),
      hasMermaid: r.hasMermaid,
      tab: (tabOf.get(p) || {}).label || '',
      toc: r.toc,
    };
    const html = pageHtml(page, r.body, r.toc, opts, site);
    writeFileEnsured(path.join(outDir, p, 'index.html'), html);
    writeFileEnsured(path.join(outDir, p + '.html'), redirectHtml(p.split('/').pop() + '/', page.title));
    pages.push({ page, body: r.body });
  }

  copyAssets(outDir, (docs.colors && (docs.colors.primary || docs.colors.dark)) || '#E551BA');

  // 搜索索引
  const entries = [];
  for (const { page, body } of pages) entries.push(...buildSearchEntries(body, page, page.title));
  writeFileEnsured(path.join(outDir, 'search-index.json'), JSON.stringify(entries));

  // 首页与 404
  const first = nav.order[0];
  const homeHtml = redirectHtml(first + '/', titles.get(first) || first)
    .replace('</head>', '<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">\n</head>');
  writeFileEnsured(path.join(outDir, 'index.html'), homeHtml);
  writeFileEnsured(path.join(outDir, '404.html'), notFoundHtml(opts, site));

  const mermaidPages = pages.filter((x) => x.page.hasMermaid).length;
  const navCount = nav.order.length;
  const builtCount = pages.length;

  console.log('');
  console.log('  构建完成');
  console.log('  ------------------------------------------------------------');
  console.log('  站点名称      ' + siteName);
  console.log('  部署基路径    ' + opts.base);
  console.log('  输出目录      ' + outDir);
  console.log('  docs.json 页面数  ' + navCount);
  console.log('  生成内容页数      ' + builtCount + (navCount === builtCount ? '   ✔ 一致' : '   ✘ 不一致'));
  console.log('  生成 HTML 总数    ' + (builtCount * 2 + 2) + '（内容页 ' + builtCount + ' + 直链跳转页 ' + builtCount + ' + 首页 + 404）');
  console.log('  侧边栏标签页数    ' + nav.tabs.length);
  console.log('  含 mermaid 页面   ' + mermaidPages);
  console.log('  搜索索引条目      ' + entries.length);
  console.log('  用时              ' + ((Date.now() - t0) / 1000).toFixed(2) + 's');
  if (problems.length) {
    console.log('  ------------------------------------------------------------');
    console.log('  ✘ 结构自检发现 ' + problems.length + ' 个问题：');
    for (const w of problems.slice(0, 40)) console.log('     - ' + w);
  } else {
    console.log('  结构自检：无残留 MDX 标签 / 无残留占位符   ✔');
  }
  if (warnings.length) {
    console.log('  ------------------------------------------------------------');
    console.log('  ⚠ 提示 ' + warnings.length + ' 条：');
    for (const w of warnings.slice(0, 40)) console.log('     - ' + w);
    if (warnings.length > 40) console.log('     …还有 ' + (warnings.length - 40) + ' 条');
  }
  console.log('');
  if (navCount !== builtCount) process.exitCode = 1;
  if (problems.length) process.exitCode = 1;
}

main();

