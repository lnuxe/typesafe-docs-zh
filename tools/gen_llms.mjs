#!/usr/bin/env node
/**
 * gen_llms.mjs —— 复刻原站（Mintlify）的「给 LLM 看的」产物。
 *
 * 原站 docs.typesafe.ai 另外输出三样东西，我们的静态构建也要有：
 *   1. /llms.txt        —— 全站索引：站名 + 一句话描述 + 每页的「标题 / 描述 / .md 链接」
 *   2. /llms-full.txt   —— 全站正文拼接成单个纯文本文件
 *   3. /<path>.md       —— 每个页面额外的原始 Markdown 副本（llms.txt 链的就是它）
 *
 * 用 Node 写（不是 Python）是因为目标服务器上只装了 Node，没有 Python。
 *
 * 用法:
 *   node tools/gen_llms.mjs --dist dist --base /typesafe/ --url http://example.com/typesafe
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.dirname(HERE);

function parseArgs(argv) {
  const o = { dist: path.join(REPO, 'dist'), base: '/', url: '', full: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const eq = a.indexOf('=');
    const key = eq >= 0 ? a.slice(0, eq) : a;
    const val = eq >= 0 ? a.slice(eq + 1) : argv[++i];
    if (key === '--dist') o.dist = val;
    else if (key === '--base') o.base = val;
    else if (key === '--url') o.url = val;
    else if (key === '--no-full') o.full = false;
  }
  return o;
}

function navPages(docs) {
  const out = [], seen = new Set();
  (function walk(node) {
    if (typeof node === 'string') {
      const p = node.replace(/^\/+|\/+$/g, '');
      if (p && !seen.has(p)) { seen.add(p); out.push(p); }
    } else if (Array.isArray(node)) {
      node.forEach(walk);
    } else if (node && typeof node === 'object') {
      if (node.pages) walk(node.pages);
      else if (node.groups) walk(node.groups);
      else Object.values(node).forEach((v) => { if (v && typeof v === 'object') walk(v); });
    }
  })(docs.navigation || {});
  return out;
}

/** 标题取第一个 H1；描述取 H1 之后第一段非空、非引用/代码/表格的正文，并截断。 */
function splitTitleDesc(md) {
  const lines = md.split('\n');
  let title = null, i = 0;
  for (; i < lines.length; i++) {
    const m = lines[i].match(/^#\s+(.+?)\s*$/);
    if (m) { title = m[1].trim(); i++; break; }
  }
  const buf = [];
  for (; i < lines.length; i++) {
    const ln = lines[i].replace(/\s+$/, '');
    if (!ln.trim()) { if (buf.length) break; continue; }
    const s = ln.replace(/^\s+/, '');
    if (s.startsWith('>') || s.startsWith('#') || s.startsWith('|') || s.startsWith('~~~') || s.startsWith('<')){
      if (buf.length) break; else continue;
    }
    if (s.startsWith(String.fromCharCode(96).repeat(3))) { if (buf.length) break; else continue; }
    buf.push(s.trim());
  }
  let desc = buf.join(' ');
  desc = desc.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  desc = desc.replace(/[*_]/g, '').replace(new RegExp(String.fromCharCode(96), 'g'), '');
  desc = desc.replace(/\s+/g, ' ').trim();
  if (desc.length > 200) {
    let cut = desc.slice(0, 200);
    for (const sep of ['。', '；', '. ', '，', ', ']) {
      const k = cut.lastIndexOf(sep);
      if (k > 80) { cut = cut.slice(0, k + sep.length); break; }
    }
    desc = cut.replace(/\s+$/, '');
    if (!/[。.；]$/.test(desc)) desc += '…';
  }
  return { title, desc };
}

const opts = parseArgs(process.argv.slice(2));
const dist = path.resolve(opts.dist);
if (!fs.existsSync(dist)) { console.error('找不到 dist：' + dist); process.exit(2); }

const docs = JSON.parse(fs.readFileSync(path.join(REPO, 'docs.json'), 'utf8'));
const siteName = docs.name || 'Docs';
const siteDesc = docs.description || '';

let base = opts.base;
if (base !== '/' && !base.endsWith('/')) base += '/';
const urlRoot = opts.url ? opts.url.replace(/\/+$/, '') + '/' : base;

const pages = navPages(docs);
const indexLines = ['# ' + siteName, ''];
if (siteDesc) indexLines.push('> ' + siteDesc, '');
const fullParts = [];
let got = 0;
const missing = [];

for (const p of pages) {
  let src = path.join(REPO, p.split('/').join(path.sep) + '.md');
  if (!fs.existsSync(src)) src = path.join(REPO, p.split('/').join(path.sep), 'index.md');
  if (!fs.existsSync(src)) { missing.push(p); continue; }
  const md = fs.readFileSync(src, 'utf8');
  const { title, desc } = splitTitleDesc(md);
  const t = title || p;
  got++;
  indexLines.push('- [' + t + '](' + urlRoot + p + '.md)' + (desc ? ': ' + desc : ''));
  fullParts.push('# ' + t + '\nSource: ' + (urlRoot + p).replace(/\/+$/, '') + '\n\n' + md.trim() + '\n');
  const dst = path.join(dist, p.split('/').join(path.sep) + '.md');
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, md);
}

fs.writeFileSync(path.join(dist, 'llms.txt'), indexLines.join('\n').replace(/\s+$/, '') + '\n');
if (opts.full) {
  fs.writeFileSync(path.join(dist, 'llms-full.txt'), fullParts.join('\n\n---\n\n').replace(/\s+$/, '') + '\n');
}

console.log('llms.txt        : ' + got + ' 个页面');
console.log('llms-full.txt   : ' + fullParts.length + ' 段正文');
console.log('每页 .md 副本    : ' + got + ' 个');
if (missing.length) {
  console.error('!! docs.json 里有但磁盘上没有的页面 ' + missing.length + ' 个：');
  missing.slice(0, 20).forEach((m) => console.error('   ' + m));
  process.exit(1);
}
