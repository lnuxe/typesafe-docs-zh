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
 *   tools/vendor/mermaid.min.js  mermaid v10.9.1 UMD 构建（仅在含 mermaid 的页面按需加载）
 *                                https://unpkg.com/mermaid@10.9.1/dist/mermaid.min.js
 *                                来源 https://github.com/mermaid-js/mermaid  许可证 MIT
 *
 * 图标来自 lucide（ISC 许可证，https://github.com/lucide-icons/lucide），
 * 以 SVG path 字符串内联在本文件里，构建时不发任何外部请求。
 *
 * 设计排版基线参考 clreq + WCAG 2.2 AA：正文 16px / 行高 1.75 / 每行 ≤40 汉字 /
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
  "book-open": "<path d=\"M12 7v14\" /><path d=\"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z\" />",
  "braces": "<path d=\"M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1\" /><path d=\"M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1\" />",
  "brain-circuit": "<path d=\"M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z\" /><path d=\"M9 13a4.5 4.5 0 0 0 3-4\" /><path d=\"M6.003 5.125A3 3 0 0 0 6.401 6.5\" /><path d=\"M3.477 10.896a4 4 0 0 1 .585-.396\" /><path d=\"M6 18a4 4 0 0 1-1.967-.516\" /><path d=\"M12 13h4\" /><path d=\"M12 18h6a2 2 0 0 1 2 2v1\" /><path d=\"M12 8h8\" /><path d=\"M16 8V5a2 2 0 0 1 2-2\" /><circle cx=\"16\" cy=\"13\" r=\".5\" /><circle cx=\"18\" cy=\"3\" r=\".5\" /><circle cx=\"20\" cy=\"21\" r=\".5\" /><circle cx=\"20\" cy=\"8\" r=\".5\" />",
  "chart-no-axes-combined": "<path d=\"M12 16v5\" /><path d=\"M16 14v7\" /><path d=\"M20 10v11\" /><path d=\"m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15\" /><path d=\"M4 18v3\" /><path d=\"M8 14v7\" />",
  "chart-spline": "<path d=\"M3 3v16a2 2 0 0 0 2 2h16\" /><path d=\"M7 16c.5-2 1.5-7 4-7 2 0 2 3 4 3 2.5 0 4.5-5 5-7\" />",
  "check": "<path d=\"M20 6 9 17l-5-5\" />",
  "chevron-right": "<path d=\"m9 18 6-6-6-6\" />",
  "circle-check": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><path d=\"m9 12 2 2 4-4\" />",
  "clipboard-check": "<rect width=\"8\" height=\"4\" x=\"8\" y=\"2\" rx=\"1\" ry=\"1\" /><path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\" /><path d=\"m9 14 2 2 4-4\" />",
  "code": "<polyline points=\"16 18 22 12 16 6\" /><polyline points=\"8 6 2 12 8 18\" />",
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
  "moon": "<path d=\"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z\" />",
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

function icon(name, cls = 'ic') {
  const body = ICONS[name] || ICONS[FALLBACK_ICON] || '';
  return '<svg class="' + cls + '" viewBox="0 0 24 24" width="18" height="18" fill="none" ' +
    'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ' +
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

function copyButtonHtml(label) {
  return '<button class="code-copy" type="button" data-copy aria-label="' + esc(label || '复制代码') + '" ' +
    'title="' + esc(label || '复制代码') + '">' +
    icon('copy', 'ic ic-copy') + icon('check', 'ic ic-copied') +
    '<span class="code-copy-text">' + esc((label || '复制代码').replace('代码', '')) + '</span></button>';
}

function codeBlockHtml(code, info, ctx) {
  const parsed = parseFenceInfo(info);
  const lang = parsed.lang, title = parsed.title;
  if (lang === 'mermaid') {
    ctx.hasMermaid = true;
    const src = String(code).replace(/\s+$/, '');
    return '<div class="code-block mermaid-block" data-mermaid-block>' +
      '<div class="code-bar"><span class="code-lang">' + icon('network', 'ic ic-sm') + 'Mermaid 图表</span>' +
      copyButtonHtml('复制图表源码') + '</div>' +
      '<div class="mermaid" data-src="' + esc(src) + '">' + escText(src) + '</div>' +
      '</div>';
  }
  const label = title || prettyLang(lang) || '';
  return '<div class="code-block"' + (lang ? ' data-lang="' + esc(lang) + '"' : '') + '>' +
    '<div class="code-bar">' +
    '<span class="code-lang">' + (label ? esc(label) : '代码') + '</span>' +
    copyButtonHtml('复制代码') +
    '</div>' +
    '<pre tabindex="0"><code' + (lang ? ' class="language-' + esc(lang) + '"' : '') + '>' +
    escText(code) + '</code></pre>' +
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

/* ------------------------------------------------------------- 组件渲染 */

function calloutHtml(cls, iconName, bodyHtml, title) {
  return '<div class="callout callout-' + cls + '">' +
    '<span class="callout-ic" aria-hidden="true">' + icon(iconName, 'ic') + '</span>' +
    '<div class="callout-body">' +
    (title ? '<p class="callout-title">' + esc(title) + '</p>' : '') +
    bodyHtml +
    '</div></div>';
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
          .replace('<div class="code-block"', '<div class="code-block code-block-flat"');
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

    default:
      if (JS_RUNTIME_COMPONENTS[name]) {
        ctx.warnings.push('交互式组件 <' + name + ' /> 已降级为说明块（' + ctx.page + '）');
        return '<div class="runtime-notice">' +
          '<span class="runtime-ic" aria-hidden="true">' + icon('braces', 'ic') + '</span>' +
          '<div><p class="runtime-title">交互式演示：' + esc(JS_RUNTIME_COMPONENTS[name]) + '</p>' +
          '<p class="runtime-text">这个区块在原始 Mintlify 站点里是一个 React 交互组件，需要客户端运行时。' +
          '自托管静态构建不包含该运行时，因此这里显示占位说明。其余正文与代码示例不受影响。</p></div>' +
          '</div>';
      }
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
    '<p class="example-hint">想直接运行这段请求？把它粘贴到 ' +
    '<a href="https://console.typesafe.ai/playground" target="_blank" rel="noreferrer noopener">TypeSafe Playground</a>。</p>' +
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
    const anchor = (d >= 2 && d <= 4)
      ? '<a class="heading-anchor" href="#' + esc(id) + '" aria-label="本节链接" tabindex="-1">#</a>'
      : '';
    let body = inner;
    let tail = '';
    const trimmed = body.replace(/\s+$/, '');
    tail = body.slice(trimmed.length);
    body = trimmed + anchor + tail;
    if ((d === 2 || d === 3) && text) toc.push({ id, text, depth: d });
    return '<h' + d + attrs + '>' + body + '</h' + d + '>';
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
/* --- 设计令牌 ------------------------------------------------------- */
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", "Source Han Sans SC", "Noto Sans CJK SC",
    "WenQuanYi Micro Hei", Roboto, Helvetica, Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
    "Liberation Mono", "Courier New", monospace;
  --brand: #7C3AED;
  --brand-light: #A78BFA;
  --brand-dark: #6D28D9;
  --s1: 4px; --s2: 8px; --s3: 12px; --s4: 16px; --s5: 24px; --s6: 32px; --s7: 48px; --s8: 64px;
  --radius: 10px;
  --radius-sm: 6px;
  --maxw-text: 640px;
  --topbar-h: 60px;
}
html[data-theme="light"] {
  --bg: #ffffff;
  --bg-soft: #fafafa;
  --bg-elev: #ffffff;
  --bg-inset: #f4f4f5;
  --border: #e4e4e7;
  --border-strong: #d4d4d8;
  --text: #18181b;
  --text-muted: #52525b;
  --text-faint: #71717a;
  --accent: #6D28D9;
  --accent-hover: #5B21B6;
  --accent-soft: #f5f3ff;
  --accent-border: #ddd6fe;
  --code-bg: #f8f8f9;
  --shadow: 0 1px 2px rgba(24, 24, 27, .06), 0 8px 24px rgba(24, 24, 27, .05);
  --note-fg: #6D28D9; --note-bg: #f6f3ff; --note-bd: #ddd6fe;
  --tip-fg: #047857; --tip-bg: #f1fbf6; --tip-bd: #bbf7d0;
  --warn-fg: #B45309; --warn-bg: #fffbf0; --warn-bd: #fde68a;
  --sel: #ede9fe;
}
html[data-theme="dark"] {
  --bg: #0d0d11;
  --bg-soft: #121218;
  --bg-elev: #17171d;
  --bg-inset: #1b1b22;
  --border: #2a2a33;
  --border-strong: #3b3b47;
  --text: #e8e8ec;
  --text-muted: #a8a8b4;
  --text-faint: #8f8f9c;
  --accent: #A78BFA;
  --accent-hover: #C4B5FD;
  --accent-soft: #1c1830;
  --accent-border: #3b2f63;
  --code-bg: #141419;
  --shadow: 0 1px 2px rgba(0, 0, 0, .5), 0 8px 24px rgba(0, 0, 0, .35);
  --note-fg: #C4B5FD; --note-bg: #17142a; --note-bd: #3b2f63;
  --tip-fg: #6EE7B7; --tip-bg: #0f1a16; --tip-bd: #1f4d3c;
  --warn-fg: #FCD34D; --warn-bg: #1c1710; --warn-bd: #57430f;
  --sel: #2b2350;
}

/* --- 基础 ----------------------------------------------------------- */
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; scroll-padding-top: calc(var(--topbar-h) + 16px); }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: .001ms !important; transition-duration: .001ms !important; }
}
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.75;
  text-align: start;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--accent); text-decoration: none; }
a:hover { color: var(--accent-hover); text-decoration: underline; text-underline-offset: 3px; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 3px; }
img { max-width: 100%; height: auto; }
.ic { flex: none; display: inline-block; vertical-align: -3px; }
.ic-sm { width: 16px; height: 16px; }
.ic-lg { width: 20px; height: 20px; }
.skip-link {
  position: absolute; left: 8px; top: -48px; z-index: 200;
  background: var(--accent); color: #fff; padding: 8px 16px; border-radius: var(--radius-sm);
  min-height: 24px; display: inline-flex; align-items: center;
}
.skip-link:focus { top: 8px; color: #fff; }
.only-light, .only-dark { display: block; }
html[data-theme="dark"] .only-light { display: none !important; }
html[data-theme="light"] .only-dark { display: none !important; }

/* --- 顶栏 ----------------------------------------------------------- */
.topbar {
  position: sticky; top: 0; z-index: 60;
  height: var(--topbar-h);
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: saturate(180%) blur(10px);
  border-bottom: 1px solid var(--border);
}
.topbar-inner {
  max-width: 1440px; margin: 0 auto; height: 100%;
  padding: 0 var(--s5); display: flex; align-items: center; gap: var(--s5);
}
.brand { display: inline-flex; align-items: center; gap: var(--s2); min-height: 24px; flex: none; }
.brand:hover { text-decoration: none; }
.brand-logo { height: 24px; width: auto; display: block; }
.brand-logo.on-dark { display: none; }
html[data-theme="dark"] .brand-logo.on-light { display: none; }
html[data-theme="dark"] .brand-logo.on-dark { display: block; }
.brand-name { font-size: 16px; font-weight: 600; color: var(--text); letter-spacing: -.01em; }
.top-tabs { display: flex; align-items: center; gap: var(--s1); overflow-x: auto; flex: 1 1 auto; scrollbar-width: none; }
.top-tabs::-webkit-scrollbar { display: none; }
.top-tab {
  display: inline-flex; align-items: center; gap: 6px; min-height: 32px;
  padding: 0 var(--s3); border-radius: var(--radius-sm); white-space: nowrap;
  color: var(--text-muted); font-size: 14px; font-weight: 500;
}
.top-tab:hover { background: var(--bg-inset); color: var(--text); text-decoration: none; }
.top-tab.is-active { color: var(--accent); background: var(--accent-soft); }
.top-actions { display: flex; align-items: center; gap: var(--s2); flex: none; }
.icon-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-width: 32px; height: 32px; padding: 0 var(--s2); border-radius: var(--radius-sm);
  border: 1px solid var(--border); background: var(--bg-elev); color: var(--text-muted);
  font: inherit; font-size: 14px; cursor: pointer;
}
.icon-btn:hover { border-color: var(--border-strong); color: var(--text); }
.search-btn { padding: 0 var(--s2) 0 var(--s3); min-width: 180px; justify-content: flex-start; }
.search-btn kbd {
  margin-left: auto; font-family: var(--font-mono); font-size: 12px; color: var(--text-faint);
  border: 1px solid var(--border); border-radius: 4px; padding: 0 4px; background: var(--bg-inset);
}
html:not([data-js="on"]) .search-btn, html:not([data-js="on"]) #theme-toggle { display: none; }
.theme-ic { display: inline-flex; }
html[data-theme="light"] .theme-ic-dark { display: none; }
html[data-theme="dark"] .theme-ic-light { display: none; }
.menu-btn { display: none; }

/* --- 布局 ----------------------------------------------------------- */
.layout {
  max-width: 1440px; margin: 0 auto; padding: var(--s6) var(--s5) var(--s8);
  display: grid; grid-template-columns: 248px minmax(0, 1fr) 216px;
  gap: var(--s6); align-items: start;
}
.sidebar { position: sticky; top: calc(var(--topbar-h) + var(--s5)); max-height: calc(100vh - var(--topbar-h) - 48px); overflow-y: auto; }
.sb-group { margin-bottom: var(--s5); }
.sb-group-title {
  font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: none;
  color: var(--text-faint); margin: 0 0 var(--s2) var(--s3);
}
.sb-link {
  display: flex; align-items: center; min-height: 28px; padding: 2px var(--s3);
  border-radius: var(--radius-sm); color: var(--text-muted); font-size: 14px; line-height: 1.5;
  border-left: 2px solid transparent;
}
.sb-link:hover { background: var(--bg-inset); color: var(--text); text-decoration: none; }
.sb-link.is-active { color: var(--accent); background: var(--accent-soft); font-weight: 600; border-left-color: var(--accent); }
.sb-sub { margin: var(--s1) 0; }
.sb-sub > summary {
  display: flex; align-items: center; gap: 6px; min-height: 28px; padding: 2px var(--s3);
  cursor: pointer; list-style: none; color: var(--text-muted); font-size: 14px; font-weight: 600;
  border-radius: var(--radius-sm);
}
.sb-sub > summary::-webkit-details-marker { display: none; }
.sb-sub > summary:hover { background: var(--bg-inset); color: var(--text); }
.sb-sub > summary .accordion-chev { transition: transform .15s ease; margin-left: auto; opacity: .7; }
.sb-sub[open] > summary .accordion-chev { transform: rotate(90deg); }
.sb-sub-body { padding-left: var(--s3); margin-left: var(--s2); border-left: 1px solid var(--border); }

.main { min-width: 0; }
.main-inner { max-width: 688px; margin: 0 auto; padding: 0 var(--s5); }

/* --- 正文 ----------------------------------------------------------- */
.prose { font-size: 16px; line-height: 1.75; color: var(--text); }
.prose > * { max-width: var(--maxw-text); }
.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
  line-height: 1.3; font-weight: 650; letter-spacing: -.01em; text-wrap: balance;
  scroll-margin-top: calc(var(--topbar-h) + 16px);
}
.prose h1 { font-size: 30px; margin: 0 0 var(--s4); }
.prose h2 { font-size: 24px; margin: var(--s7) 0 var(--s3); padding-top: var(--s2); }
.prose h3 { font-size: 18px; margin: var(--s6) 0 var(--s2); }
.prose h4 { font-size: 16px; margin: var(--s5) 0 var(--s2); }
.prose h5, .prose h6 { font-size: 16px; margin: var(--s4) 0 var(--s2); color: var(--text-muted); }
.prose p { margin: 0 0 var(--s4); }
.prose ul, .prose ol { margin: 0 0 var(--s4); padding-left: var(--s5); }
.prose li { margin: var(--s1) 0; }
.prose li > ul, .prose li > ol { margin: var(--s1) 0; }
.prose hr { border: 0; border-top: 1px solid var(--border); margin: var(--s6) 0; }
.prose blockquote {
  margin: 0 0 var(--s4); padding: var(--s1) 0 var(--s1) var(--s4);
  border-left: 3px solid var(--accent-border); color: var(--text-muted);
}
.prose blockquote p:last-child { margin-bottom: 0; }
.prose strong { font-weight: 650; }
.prose code {
  font-family: var(--font-mono); font-size: 14px;
  background: var(--bg-inset); border: 1px solid var(--border);
  border-radius: 4px; padding: 1px 5px; word-break: break-word;
}
.prose a code { color: inherit; }
.prose table { border-collapse: collapse; width: 100%; font-size: 14px; line-height: 1.6; margin: 0 0 var(--s4); }
.table-scroll { overflow-x: auto; margin: 0 0 var(--s4); }
.table-scroll > table { margin: 0; }
.prose th, .prose td { border: 1px solid var(--border); padding: var(--s2) var(--s3); text-align: start; vertical-align: top; }
.prose thead th { background: var(--bg-inset); font-weight: 650; }
.prose img { border-radius: var(--radius-sm); }
.heading-anchor {
  margin-left: var(--s2); color: var(--text-faint); font-weight: 400;
  opacity: 0; transition: opacity .12s ease; text-decoration: none;
}
h1:hover > .heading-anchor, h2:hover > .heading-anchor, h3:hover > .heading-anchor,
h4:hover > .heading-anchor, .heading-anchor:focus-visible { opacity: .8; }
.heading-anchor:hover { text-decoration: none; color: var(--accent); opacity: 1; }

/* --- 提示块 --------------------------------------------------------- */
.callout {
  display: flex; gap: var(--s3); padding: var(--s4);
  border: 1px solid var(--border); border-left-width: 3px; border-radius: var(--radius);
  margin: 0 0 var(--s5); background: var(--bg-soft);
}
.callout-ic { flex: none; margin-top: 2px; line-height: 1; }
.callout-body { min-width: 0; }
.callout-body > *:last-child { margin-bottom: 0; }
.callout-body p { max-width: none; }
.callout-title { font-weight: 650; margin: 0 0 var(--s1); }
.callout-note, .callout-info { background: var(--note-bg); border-color: var(--note-bd); border-left-color: var(--note-fg); }
.callout-note .callout-ic, .callout-info .callout-ic, .callout-note .callout-title, .callout-info .callout-title { color: var(--note-fg); }
.callout-tip { background: var(--tip-bg); border-color: var(--tip-bd); border-left-color: var(--tip-fg); }
.callout-tip .callout-ic, .callout-tip .callout-title { color: var(--tip-fg); }
.callout-warning { background: var(--warn-bg); border-color: var(--warn-bd); border-left-color: var(--warn-fg); }
.callout-warning .callout-ic, .callout-warning .callout-title { color: var(--warn-fg); }

/* --- 卡片 / 分栏 ---------------------------------------------------- */
.grid { display: grid; gap: var(--s4); margin: 0 0 var(--s5); max-width: none; }
.grid-1 { grid-template-columns: minmax(0, 1fr); }
.grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.card {
  display: flex; gap: var(--s3); align-items: flex-start;
  padding: var(--s4); border: 1px solid var(--border); border-radius: var(--radius);
  background: var(--bg-elev); color: var(--text); min-height: 24px;
}
a.card:hover { border-color: var(--accent-border); background: var(--accent-soft); text-decoration: none; }
.card-ic { color: var(--accent); flex: none; margin-top: 2px; }
.card-text { display: flex; flex-direction: column; gap: var(--s1); min-width: 0; flex: 1 1 auto; }
.card-title { font-weight: 650; font-size: 16px; }
.card-body { color: var(--text-muted); font-size: 14px; line-height: 1.7; }
.card-body p { margin: 0; }
.card-arrow { color: var(--text-faint); flex: none; margin-top: 3px; }
a.card:hover .card-arrow { color: var(--accent); }
.card-note { border-left: 3px solid var(--note-fg); }
.card-tip { border-left: 3px solid var(--tip-fg); }
.card-warning { border-left: 3px solid var(--warn-fg); }

/* --- Tabs ----------------------------------------------------------- */
.tabs { margin: 0 0 var(--s5); max-width: none; }
.tab-nav {
  display: flex; gap: var(--s1); border-bottom: 1px solid var(--border);
  overflow-x: auto; overflow-y: hidden; scrollbar-width: none;
}
.tab-nav::-webkit-scrollbar { display: none; }
.tab-btn {
  appearance: none; background: none; border: 0; border-bottom: 2px solid transparent;
  margin-bottom: -1px; padding: var(--s2) var(--s3); min-height: 36px; cursor: pointer;
  font: inherit; font-size: 14px; font-weight: 500; color: var(--text-muted); white-space: nowrap;
}
.tab-btn:hover { color: var(--text); }
.tab-btn.is-active { color: var(--accent); border-bottom-color: var(--accent); }
.tab-panels { padding-top: var(--s4); }
html[data-js="on"] .tab-panel { display: none; }
html[data-js="on"] .tab-panel.is-active { display: block; }
html:not([data-js="on"]) .tab-nav { display: none; }
html:not([data-js="on"]) .tab-panel { display: block; padding-top: var(--s2); }
html:not([data-js="on"]) .tab-panel + .tab-panel { border-top: 1px dashed var(--border); margin-top: var(--s3); }
.tab-panel > *:last-child { margin-bottom: 0; }

/* --- 折叠面板 ------------------------------------------------------- */
.accordion-group { margin: 0 0 var(--s5); border-top: 1px solid var(--border); max-width: none; }
.accordion { border-bottom: 1px solid var(--border); max-width: none; }
.accordion-sum, .expandable-sum {
  display: flex; align-items: center; gap: var(--s2); cursor: pointer; list-style: none;
  padding: var(--s3) var(--s1); min-height: 32px; font-weight: 600; font-size: 15px;
}
.accordion-sum::-webkit-details-marker, .expandable-sum::-webkit-details-marker { display: none; }
.accordion-sum:hover, .expandable-sum:hover { color: var(--accent); }
.accordion-title, .expandable-title { flex: 1 1 auto; }
.accordion-ic { color: var(--accent); }
.accordion-chev { color: var(--text-faint); transition: transform .15s ease; flex: none; }
details[open] > summary > .accordion-chev { transform: rotate(90deg); }
.accordion-body { padding: 0 var(--s1) var(--s4); }
.accordion-body > *:last-child { margin-bottom: 0; }
.expandable {
  border: 1px solid var(--border); border-radius: var(--radius); margin: 0 0 var(--s4);
  padding: 0 var(--s4); background: var(--bg-soft); max-width: none;
}
.expandable-sum { margin: 0; }
.expandable-body { padding-bottom: var(--s4); }
.expandable-body > *:last-child { margin-bottom: 0; }

/* --- Steps ---------------------------------------------------------- */
.steps { list-style: none; margin: 0 0 var(--s5); padding: 0; counter-reset: none; max-width: none; }
.step { position: relative; padding: 0 0 var(--s5) var(--s6); border-left: 2px solid var(--border); margin-left: 15px; }
.step:last-child { border-left-color: transparent; padding-bottom: 0; }
.step-head { display: flex; align-items: center; gap: var(--s3); margin: 0 0 var(--s2); }
.step-num {
  position: absolute; left: -16px; top: -2px;
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--accent); color: #fff; font-size: 14px; font-weight: 650;
  display: inline-flex; align-items: center; justify-content: center;
}
.step-title { font-size: 18px; margin: 0; line-height: 1.4; }
.step-body > *:last-child { margin-bottom: 0; }

/* --- Frame ---------------------------------------------------------- */
.frame {
  margin: 0 0 var(--s5); padding: var(--s2); border: 1px solid var(--border);
  border-radius: var(--radius); background: var(--bg-soft); max-width: none;
}
.frame img, .frame iframe, .frame video { display: block; width: 100%; border-radius: var(--radius-sm); }
.frame iframe { aspect-ratio: 16 / 9; border: 0; }
.frame figcaption { font-size: 13px; color: var(--text-muted); padding: var(--s2) var(--s1) 0; }

/* --- 代码块 --------------------------------------------------------- */
.code-block {
  position: relative; margin: 0 0 var(--s5); border: 1px solid var(--border);
  border-radius: var(--radius); background: var(--code-bg); overflow: hidden; max-width: none;
}
.code-bar {
  display: flex; align-items: center; justify-content: space-between; gap: var(--s2);
  padding: var(--s1) var(--s2) var(--s1) var(--s3);
  border-bottom: 1px solid var(--border); background: var(--bg-inset); min-height: 36px;
}
.code-lang {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 600; letter-spacing: .02em; color: var(--text-muted);
}
.code-copy {
  display: inline-flex; align-items: center; gap: var(--s1); min-height: 24px;
  padding: 2px var(--s2); border: 1px solid transparent; border-radius: var(--radius-sm);
  background: none; color: var(--text-muted); font: inherit; font-size: 12px; cursor: pointer;
}
.code-copy:hover { color: var(--text); border-color: var(--border); background: var(--bg-elev); }
.code-copy .ic-copied, .code-copy[data-copied="true"] .ic-copy { display: none; }
.code-copy[data-copied="true"] .ic-copied { display: inline-block; color: var(--tip-fg); }
html:not([data-js="on"]) .code-copy { display: none; }
.code-block pre {
  margin: 0; padding: var(--s4); overflow-x: auto;
  font-family: var(--font-mono); font-size: 13px; line-height: 1.65;
}
.code-block pre code { background: none; border: 0; padding: 0; font-size: inherit; color: var(--text); }
.code-block-flat { border: 0; border-radius: 0; margin: 0; }
.mermaid-block .mermaid {
  padding: var(--s4); overflow-x: auto; font-family: var(--font-mono);
  font-size: 13px; line-height: 1.6; white-space: pre; color: var(--text-muted);
}
.mermaid-block .mermaid[data-processed="true"] {
  white-space: normal; font-family: var(--font-sans); color: var(--text); text-align: center;
}
.mermaid-block .mermaid[data-processed="true"] svg { max-width: 100%; height: auto; }
.mermaid-error { color: var(--warn-fg); font-size: 13px; }

/* --- API 字段 ------------------------------------------------------- */
.field { border: 1px solid var(--border); border-radius: var(--radius); margin: 0 0 var(--s3); background: var(--bg-elev); max-width: none; }
.field-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s2); padding: var(--s3) var(--s4); }
.field-name { font-family: var(--font-mono); font-size: 14px; font-weight: 650; background: none; border: 0; padding: 0; }
.field-type { font-family: var(--font-mono); font-size: 12px; color: var(--accent); background: var(--accent-soft); border-radius: 4px; padding: 1px 6px; }
.field-req, .field-opt, .field-default { font-size: 12px; color: var(--text-faint); }
.field-req { color: var(--warn-fg); font-weight: 600; }
.field-body { padding: 0 var(--s4) var(--s3); border-top: 1px solid var(--border); padding-top: var(--s3); }
.field-body > *:last-child { margin-bottom: 0; }
.field .field { margin: var(--s3) 0 0; }

/* --- SDK 签名 ------------------------------------------------------- */
.sdk-signature {
  position: relative; margin: 0 0 var(--s4); border: 1px solid var(--border);
  border-radius: var(--radius); background: var(--code-bg); max-width: none;
}
.sdk-signature .code-copy { position: absolute; top: 6px; right: 6px; }
.sdk-signature pre { margin: 0; padding: var(--s3) var(--s4); overflow-x: auto; font-family: var(--font-mono); font-size: 13px; line-height: 1.6; }
.sdk-signature code { background: none; border: 0; padding: 0; white-space: pre-wrap; word-break: break-word; }
.sdk-signature .n, .sdk-signature .nn { color: var(--accent); }
.sdk-signature .p, .sdk-signature .o { color: var(--text-muted); }
.sdk-signature .kc { color: var(--warn-fg); }
.sdk-signature .s, .sdk-signature .s1, .sdk-signature .s2 { color: var(--tip-fg); }
.sdk-signature .nf, .sdk-signature .fm { color: var(--tip-fg); }
.sdk-signature .mi, .sdk-signature .mf { color: var(--warn-fg); }

/* --- 降级说明 / 示例 ------------------------------------------------ */
.runtime-notice {
  display: flex; gap: var(--s3); padding: var(--s4); margin: 0 0 var(--s5);
  border: 1px dashed var(--border-strong); border-radius: var(--radius);
  background: var(--bg-soft); max-width: none;
}
.runtime-ic { color: var(--text-faint); flex: none; margin-top: 2px; }
.runtime-title { font-weight: 650; margin: 0 0 var(--s1); }
.runtime-text { margin: 0; color: var(--text-muted); font-size: 14px; }
.example-block { margin: 0 0 var(--s5); max-width: none; }
.example-hint { font-size: 13px; color: var(--text-muted); margin: var(--s2) 0 0; }

/* --- 右侧目录 ------------------------------------------------------- */
.toc { position: sticky; top: calc(var(--topbar-h) + var(--s5)); max-height: calc(100vh - var(--topbar-h) - 48px); overflow-y: auto; }
.toc-title { font-size: 12px; font-weight: 700; letter-spacing: .06em; color: var(--text-faint); margin: 0 0 var(--s2); }
.toc-list { list-style: none; margin: 0; padding: 0; border-left: 1px solid var(--border); }
.toc-item a {
  display: block; padding: 3px var(--s3); min-height: 24px; font-size: 13px; line-height: 1.5;
  color: var(--text-muted); border-left: 2px solid transparent; margin-left: -1px;
}
.toc-item a:hover { color: var(--text); text-decoration: none; }
.toc-item.is-active a { color: var(--accent); border-left-color: var(--accent); font-weight: 600; }
.toc-item.depth-3 a { padding-left: var(--s5); }

/* --- 上下页 --------------------------------------------------------- */
.pager { display: flex; gap: var(--s4); margin: var(--s7) auto 0; max-width: var(--maxw-text); }
.pager-link {
  flex: 1 1 0; display: flex; flex-direction: column; gap: 2px;
  padding: var(--s3) var(--s4); border: 1px solid var(--border); border-radius: var(--radius);
  color: var(--text); min-height: 24px; background: var(--bg-elev);
}
.pager-link:hover { border-color: var(--accent-border); background: var(--accent-soft); text-decoration: none; }
.pager-link.next { text-align: end; }
.pager-dir { font-size: 12px; color: var(--text-faint); display: inline-flex; align-items: center; gap: 4px; }
.pager-link.next .pager-dir { justify-content: flex-end; }
.pager-title { font-size: 14px; font-weight: 600; }
.pager-spacer { flex: 1 1 0; }

/* --- 页脚 ----------------------------------------------------------- */
.site-footer {
  border-top: 1px solid var(--border); margin-top: var(--s7);
  padding: var(--s5); font-size: 13px; color: var(--text-muted);
}
.site-footer-inner { max-width: 1440px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: var(--s4); align-items: center; justify-content: space-between; }
.site-footer a { display: inline-flex; align-items: center; gap: 4px; min-height: 24px; }

/* --- 搜索 ----------------------------------------------------------- */
.search-overlay {
  position: fixed; inset: 0; z-index: 120; background: rgba(9, 9, 11, .45);
  display: flex; align-items: flex-start; justify-content: center; padding: 12vh var(--s4) var(--s4);
}
.search-overlay[hidden] { display: none; }
.search-panel {
  width: 100%; max-width: 600px; background: var(--bg-elev); border: 1px solid var(--border);
  border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; display: flex; flex-direction: column;
  max-height: 70vh;
}
.search-field { display: flex; align-items: center; gap: var(--s2); padding: var(--s3) var(--s4); border-bottom: 1px solid var(--border); }
.search-field input {
  flex: 1 1 auto; border: 0; background: none; color: var(--text);
  font: inherit; font-size: 16px; outline: none; min-height: 28px;
}
.search-field .ic { color: var(--text-faint); }
.search-hint { font-size: 12px; color: var(--text-faint); white-space: nowrap; }
.search-results { list-style: none; margin: 0; padding: var(--s2); overflow-y: auto; }
.search-result a {
  display: block; padding: var(--s2) var(--s3); border-radius: var(--radius-sm);
  color: var(--text); min-height: 24px;
}
.search-result a:hover, .search-result.is-active a { background: var(--accent-soft); text-decoration: none; }
.search-result .sr-title { font-size: 14px; font-weight: 600; }
.search-result .sr-head { font-size: 12px; color: var(--accent); }
.search-result .sr-text { font-size: 13px; color: var(--text-muted); display: block;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.search-result mark { background: var(--sel); color: inherit; border-radius: 2px; padding: 0 1px; }
.search-empty { padding: var(--s5); text-align: center; color: var(--text-muted); font-size: 14px; }

/* --- 响应式 --------------------------------------------------------- */
@media (max-width: 1279px) {
  .layout { grid-template-columns: 248px minmax(0, 1fr); }
  .toc { display: none; }
}
@media (max-width: 1023px) {
  .layout { grid-template-columns: 220px minmax(0, 1fr); gap: var(--s5); }
}
@media (max-width: 899px) {
  .menu-btn { display: inline-flex; }
  .layout { grid-template-columns: minmax(0, 1fr); padding: var(--s5) var(--s4) var(--s7); }
  .main-inner { padding: 0; }
  .sidebar {
    position: fixed; inset: var(--topbar-h) auto 0 0; width: 280px; max-height: none;
    background: var(--bg); border-right: 1px solid var(--border);
    padding: var(--s4); transform: translateX(-100%); transition: transform .18s ease; z-index: 70;
  }
  .sidebar.is-open { transform: none; }
  .topbar-inner { padding: 0 var(--s4); gap: var(--s3); }
  .search-btn { min-width: 32px; padding: 0; justify-content: center; }
  .search-btn span, .search-btn kbd { display: none; }
  .prose h1 { font-size: 24px; }
  .prose h2 { font-size: 20px; }
  .grid-2, .grid-3, .grid-4 { grid-template-columns: minmax(0, 1fr); }
  .pager { flex-direction: column; }
}
@media (max-width: 480px) {
  .brand-logo { height: 20px; width: auto; }
  .pager-link.next { text-align: start; }
}
`;


/* ==================================================================== *
 *  第四部分：客户端脚本（原生 JS，无框架、无构建）
 * ==================================================================== */

const APP_JS = String.raw`
(function () {
  'use strict';
  var d = document;
  var root = d.documentElement;

  /* ---- 主题切换 ---------------------------------------------------- */
  function currentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }
  var forcedTheme = (location.search.match(/[?&]theme=(dark|light)/) || [])[1] || null;
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    var btns = d.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-label', theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题');
      btns[i].setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
    if (forcedTheme) return;                       // URL 显式指定主题时不写入持久化存储
    try { localStorage.setItem('tsd-theme', theme); } catch (e) { /* 隐私模式忽略 */ }
  }
  applyTheme(currentTheme());
  d.addEventListener('click', function (ev) {
    var btn = ev.target.closest ? ev.target.closest('[data-theme-toggle]') : null;
    if (!btn) return;
    applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  });

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

  /* ---- 代码复制 ---------------------------------------------------- */
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
      // 剪贴板不可用：选中代码，提示用户手动复制
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
          theme: currentTheme() === 'dark' ? 'dark' : 'default',
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
    d.addEventListener('click', function (ev) {
      var t = ev.target.closest ? ev.target.closest('[data-theme-toggle]') : null;
      if (t && window.mermaid) setTimeout(renderMermaid, 60);
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
    }, { rootMargin: '-70px 0px -70% 0px', threshold: 0 });
    for (var key2 in map) {
      var target = d.getElementById(key2);
      if (target) spy.observe(target);
    }
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
  return { tabs, order };
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
  // 首帧前应用主题：URL 参数 > localStorage > prefers-color-scheme
  return '<script>(function(){var r=document.documentElement;try{' +
    'var m=location.search.match(/[?&]theme=(dark|light)/);' +
    'var t=m?m[1]:localStorage.getItem("tsd-theme");' +
    'if(t!=="dark"&&t!=="light"){t=(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches)?"dark":"light";}' +
    'r.setAttribute("data-theme",t);r.style.colorScheme=t;' +
    '}catch(e){r.setAttribute("data-theme","light");}r.setAttribute("data-js","on");})();<\/script>';
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
      (t.icon && ICONS[t.icon] ? icon(t.icon, 'ic ic-sm') : '') + esc(t.label) + '</a>';
  }
  return '<header class="topbar"><div class="topbar-inner">' +
    '<button class="icon-btn menu-btn" type="button" data-menu-toggle aria-label="展开导航">' +
    icon('panel-left', 'ic ic-sm') + '</button>' +
    '<a class="brand" href="' + esc(ctx.base) + '">' +
    '<img class="brand-logo on-light" src="' + esc(logoSrc) + '" alt="' + esc(site.name) + '" width="108" height="24">' +
    '<img class="brand-logo on-dark" src="' + esc(logoSrcDark) + '" alt="' + esc(site.name) + '" width="108" height="24">' +
    '</a>' +
    '<nav class="top-tabs" aria-label="主导航">' + tabs + '</nav>' +
    '<div class="top-actions">' +
    '<button class="icon-btn search-btn" type="button" data-search-open aria-label="搜索文档">' +
    icon('search', 'ic ic-sm') + '<span>搜索</span><kbd>Ctrl K</kbd></button>' +
    '<button class="icon-btn" id="theme-toggle" type="button" data-theme-toggle aria-label="切换主题">' +
    '<span class="theme-ic theme-ic-light">' + icon('sun', 'ic ic-sm') + '</span>' +
    '<span class="theme-ic theme-ic-dark">' + icon('moon', 'ic ic-sm') + '</span></button>' +
    '</div></div></header>';
}

function tocHtml(toc) {
  if (!toc.length) return '<aside class="toc" aria-label="页内目录"></aside>';
  let items = '';
  for (const t of toc) {
    items += '<li class="toc-item depth-' + t.depth + '"><a href="#' + esc(t.id) + '">' + esc(t.text) + '</a></li>';
  }
  return '<aside class="toc" aria-label="页内目录"><p class="toc-title">本页目录</p>' +
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
      '<span class="pager-dir">' + icon('arrow-left', 'ic ic-sm') + '上一页</span>' +
      '<span class="pager-title">' + esc(ctx.titles.get(prev) || prev) + '</span></a>'
    : '<span class="pager-spacer"></span>';
  html += next
    ? '<a class="pager-link next" href="' + esc(ctx.base + next + '/') + '">' +
      '<span class="pager-dir">下一页' + icon('arrow-right', 'ic ic-sm') + '</span>' +
      '<span class="pager-title">' + esc(ctx.titles.get(next) || next) + '</span></a>'
    : '<span class="pager-spacer"></span>';
  html += '</nav>';
  return html;
}

function footerHtml(site, ctx) {
  const social = (site.docs.footer && site.docs.footer.social) || {};
  let links = '';
  if (social.website) links += '<a href="' + esc(social.website) + '" target="_blank" rel="noreferrer noopener">' + icon('globe', 'ic ic-sm') + 'typesafe.ai</a>';
  if (social.github) links += '<a href="' + esc(social.github) + '" target="_blank" rel="noreferrer noopener">' + icon('github', 'ic ic-sm') + 'GitHub</a>';
  return '<footer class="site-footer"><div class="site-footer-inner">' +
    '<span>' + esc(site.name) + ' · 本文档为 docs.typesafe.ai 简体中文复刻的自托管静态构建</span>' +
    '<span>' + links + '</span></div></footer>';
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

function pageHtml(page, bodyHtml, toc, opts, site) {
  const depth = page.path.split('/').length;
  const rel = '../'.repeat(depth);
  const ctx = { base: opts.base, rel, titles: site.titles, currentPath: page.path };
  const tab = site.tabOf.get(page.path) || site.nav.tabs[0];
  const desc = page.description || site.docs.description || '';
  const mermaidAttr = page.hasMermaid
    ? ' data-mermaid-src="' + esc(rel + 'assets/mermaid.min.js') + '"'
    : '';
  return '<!doctype html>\n<html lang="zh-CN" data-theme="light">\n<head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + esc(page.title + ' · ' + site.name) + '</title>\n' +
    '<meta name="description" content="' + esc(desc.slice(0, 160)) + '">\n' +
    '<link rel="icon" href="' + esc(rel) + 'assets/favicon.svg" type="image/svg+xml">\n' +
    '<link rel="canonical" href="' + esc(opts.base + page.path + '/') + '">\n' +
    headScript() + '\n' +
    '<link rel="stylesheet" href="' + esc(rel) + 'assets/style.css">\n' +
    '</head>\n<body data-base="' + esc(opts.base) + '" data-search-index="' + esc(rel + 'search-index.json') + '"' + mermaidAttr + '>\n' +
    '<a class="skip-link" href="#main">跳到主要内容</a>\n' +
    topbarHtml(site, ctx, tab) + '\n' +
    '<div class="layout">\n' +
    '<aside class="sidebar" id="sidebar" aria-label="文档导航">' + sidebarHtml(tab, ctx) + '</aside>\n' +
    '<main class="main" id="main"><div class="main-inner">\n' +
    '<article class="prose">' + bodyHtml + '</article>\n' +
    pagerHtml(page, site, ctx) + '\n' +
    '</div></main>\n' +
    tocHtml(toc) + '\n' +
    '</div>\n' +
    footerHtml(site, ctx) + '\n' +
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
    topbarHtml(site, ctx, tab) + '\n' +
    '<div class="layout"><aside class="sidebar" id="sidebar" aria-label="文档导航">' + sidebarHtml(tab, ctx) + '</aside>' +
    '<main class="main" id="main"><div class="main-inner"><article class="prose">' +
    '<h1>404 · 页面不存在</h1>' +
    '<p>你访问的地址没有对应的页面。可能是链接已经变动，或者路径拼写有误。</p>' +
    '<p>可以回到 <a href="' + esc(opts.base) + '">文档首页</a>，或者用右上角的搜索（Ctrl / Cmd + K）查找。</p>' +
    '</article></div></main>' +
    '<aside class="toc" aria-label="页内目录"></aside></div>\n' +
    footerHtml(site, ctx) + '\n' + searchOverlayHtml() + '\n' +
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

/** 收尾清理：独占一段的纯锚点不该被 p 包着；顺带压缩多余空行 */
function tidyHtml(html) {
  return String(html)
    .replace(/<p>\s*(<a\s[^>]*id="[^"]*"[^>]*>\s*<\/a>)\s*<\/p>/g, '$1')
    .replace(/\n{3,}/g, '\n\n');
}

function renderPage(md, pagePath, opts, titles) {
  const ctx = newPageContext(opts, pagePath, opts.base);
  let body = renderMarkdown(md, ctx);
  const heading = processHeadings(body);
  body = tidyHtml(wrapTables(heading.html));
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

function copyAssets(outDir) {
  const assetsDir = path.join(outDir, 'assets');
  mkdirp(assetsDir);
  writeFileEnsured(path.join(assetsDir, 'style.css'), STYLE_CSS.trimStart());
  writeFileEnsured(path.join(assetsDir, 'app.js'), APP_JS.trimStart());
  const mermaidSrc = path.join(__dirname, 'vendor', 'mermaid.min.js');
  if (fs.existsSync(mermaidSrc)) {
    fs.copyFileSync(mermaidSrc, path.join(assetsDir, 'mermaid.min.js'));
  }
  const branding = ['logo_light.png', 'logo_dark.png', 'favicon.svg'];
  for (const f of branding) {
    const src = path.join(REPO_ROOT, f);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(assetsDir, f));
    else console.warn('  警告：缺少品牌资源 ' + f);
  }
}

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

  copyAssets(outDir);

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

