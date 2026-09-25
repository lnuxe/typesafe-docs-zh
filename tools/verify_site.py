#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
verify_site.py —— 构建产物自检：锚点、站内链接、MDX 残留。

扫描 dist/ 下所有 HTML，检查三件事：
  1. 每个 href="#..." 在同一页里都有对应的 id（否则"路由跳转"点不动）
  2. 每个站内链接 / 资源在磁盘上真实存在
  3. 没有残留的 {#literal}（自定义标题锚点必须被解析掉，不能当字面量渲染）

会从每个页面的 <body data-base="..."> 读出部署基路径并据此解析（所以 --base /typesafe/ 的构建也能验）。

用法:
    python tools/verify_site.py [dist 目录]
退出码: 0 = 全部通过; 1 = 有问题
"""
import os, re, sys, html as H

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

DIST = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dist")
DIST = os.path.abspath(DIST)
if not os.path.isdir(DIST):
    raise SystemExit("找不到 dist 目录：%s（先跑 node tools/build_site.mjs）" % DIST)

# href/src 前面不能是字母或 -，否则 data-src / data-mermaid-src 会被误当成资源引用
ATTR_RE = re.compile(r'(?<![\w-])(?:href|src)="([^"]*)"')
ID_RE = re.compile(r'\bid="([^"]+)"')
BASE_RE = re.compile(r'<body[^>]*\bdata-base="([^"]*)"')

pages = anchors = links = 0
bad_anchor, bad_link, literal = [], [], []

for dp, _dn, fn in os.walk(DIST):
    for f in fn:
        if not f.endswith(".html"):
            continue
        p = os.path.join(dp, f)
        rel = os.path.relpath(p, DIST).replace("\\", "/")
        t = open(p, encoding="utf-8").read()
        pages += 1

        for m in re.finditer(r".{0,50}\{#[^}]{1,40}\}", t):
            literal.append((rel, m.group(0).replace("\n", " ")[:100]))

        ids = {H.unescape(x) for x in ID_RE.findall(t)}
        bm = BASE_RE.search(t)
        base = bm.group(1) if bm else "/"

        for raw in ATTR_RE.findall(t):
            u = H.unescape(raw)
            if u.startswith(("http://", "https://", "mailto:", "data:", "javascript:")):
                continue
            if u.startswith("#"):
                anchors += 1
                if u[1:] not in ids:
                    bad_anchor.append((rel, u))
                continue
            path = u.split("#")[0].split("?")[0]
            if not path:
                continue
            links += 1
            if path.startswith("/"):
                # 去掉部署基路径后再落到磁盘上找
                if base != "/" and path.startswith(base):
                    path = "/" + path[len(base):]
                cand = os.path.join(DIST, path.lstrip("/"))
            else:
                cand = os.path.normpath(os.path.join(os.path.dirname(p), path))
            if os.path.isdir(cand):
                cand = os.path.join(cand, "index.html")
            if not os.path.exists(cand):
                bad_link.append((rel, u))

print("扫描 %d 个 HTML：页内锚点 %d 个、站内链接/资源 %d 个" % (pages, anchors, links))
print("  失效锚点（点了跳不动）      : %d" % len(bad_anchor))
print("  解析不到的站内链接/资源      : %d" % len(bad_link))
print("  残留 {#...} 字面量          : %d" % len(literal))
for rel, u in bad_anchor[:20]:
    print("    [anchor] %-42s %s" % (rel, u))
for rel, u in bad_link[:20]:
    print("    [link]   %-42s %s" % (rel, u))
for rel, s in literal[:10]:
    print("    [literal] %-42s %s" % (rel, s))

ok = not (bad_anchor or bad_link or literal)
print("\n结果：" + ("全部通过" if ok else "有问题"))
sys.exit(0 if ok else 1)
