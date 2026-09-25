#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_llms.py —— 复刻原站（Mintlify）的「给 LLM 看的」产物。

原站 docs.typesafe.ai 另外输出三样东西，我们的静态构建也要有：

  1. /llms.txt        —— 全站索引：站名 + 一句话描述 + 每页的标题/描述/.md 链接
  2. /llms-full.txt   —— 全站正文拼接成一个纯文本文件（Mintlify 的 "full" 变体）
  3. /<path>.md       —— 每个页面额外的原始 Markdown 副本（llms.txt 里链的就是它）

用法:
    python tools/gen_llms.py --dist dist --base /typesafe/ --url http://example.com/typesafe
"""
import argparse, json, os, re, sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

BT = chr(96)          # 反引号，避免在本文件里写裸反引号
FENCE = BT * 3
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def nav_pages(docs):
    """按导航顺序取出所有页面路径（去重）。"""
    out, seen = [], set()

    def walk(node):
        if isinstance(node, str):
            p = node.strip("/")
            if p and p not in seen:
                seen.add(p)
                out.append(p)
        elif isinstance(node, list):
            for x in node:
                walk(x)
        elif isinstance(node, dict):
            if "pages" in node:
                walk(node["pages"])
            elif "groups" in node:
                walk(node["groups"])
            else:
                for v in node.values():
                    if isinstance(v, (list, dict)):
                        walk(v)

    walk(docs.get("navigation", {}))
    return out


def split_title_desc(md):
    """标题取第一个 H1；描述取 H1 之后第一段非空、非引用块/代码块的正文。"""
    title, desc = None, ""
    lines = md.split("\n")
    i = 0
    while i < len(lines):
        m = re.match(r"^#\s+(.+?)\s*$", lines[i])
        if m:
            title = m.group(1).strip()
            i += 1
            break
        i += 1
    buf = []
    while i < len(lines):
        ln = lines[i].rstrip()
        if not ln.strip():
            if buf:
                break
        elif ln.lstrip().startswith((">", "#", "|", FENCE, "<")):
            if buf:
                break
        else:
            buf.append(ln.strip())
        i += 1
    if buf:
        desc = " ".join(buf)
    desc = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", desc)      # 去链接
    desc = re.sub(r"[*_" + BT + r"]", "", desc)                # 去强调与行内代码标记
    desc = re.sub(r"\s+", " ", desc).strip()
    # 原站的描述来自 front-matter，很短；我们没有 front-matter，所以取首段并截断，
    # 免得索引里混进整段正文（原站 llms.txt 只有 16KB）。
    if len(desc) > 200:
        cut = desc[:200]
        for sep in ("。", "；", ". ", "，", ", "):
            i = cut.rfind(sep)
            if i > 80:
                cut = cut[:i + len(sep)]
                break
        desc = cut.rstrip() + ("…" if not cut.endswith(("。", ".", "；")) else "")
    return title, desc


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dist", default=os.path.join(REPO, "dist"))
    ap.add_argument("--base", default="/")
    ap.add_argument("--url", default="")
    ap.add_argument("--no-full", action="store_true")
    a = ap.parse_args()

    dist = os.path.abspath(a.dist)
    if not os.path.isdir(dist):
        raise SystemExit("找不到 dist：%s" % dist)

    docs = json.loads(read(os.path.join(REPO, "docs.json")))
    site_name = docs.get("name") or "Docs"
    site_desc = docs.get("description") or ""

    base = a.base
    if base != "/" and not base.endswith("/"):
        base += "/"
    url_root = (a.url.rstrip("/") + "/") if a.url else base

    pages = nav_pages(docs)
    index_lines = ["# %s" % site_name, ""]
    if site_desc:
        index_lines += ["> %s" % site_desc, ""]
    full_parts, got, missing = [], 0, []

    for p in pages:
        src = os.path.join(REPO, p.replace("/", os.sep) + ".md")
        if not os.path.isfile(src):
            src = os.path.join(REPO, p.replace("/", os.sep), "index.md")
        if not os.path.isfile(src):
            missing.append(p)
            continue
        md = read(src)
        title, desc = split_title_desc(md)
        title = title or p
        got += 1
        index_lines.append("- [%s](%s)%s" % (title, url_root + p + ".md", (": " + desc) if desc else ""))
        full_parts.append("# %s\nSource: %s\n\n%s\n" % (title, (url_root + p).rstrip("/"), md.strip()))
        dst = os.path.join(dist, p.replace("/", os.sep) + ".md")
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        with open(dst, "w", encoding="utf-8", newline="\n") as f:
            f.write(md)

    with open(os.path.join(dist, "llms.txt"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(index_lines).rstrip() + "\n")

    if not a.no_full:
        with open(os.path.join(dist, "llms-full.txt"), "w", encoding="utf-8", newline="\n") as f:
            f.write("\n\n---\n\n".join(full_parts).rstrip() + "\n")

    print("llms.txt        : %d 个页面" % got)
    print("llms-full.txt   : %d 段正文" % len(full_parts))
    print("每页 .md 副本    : %d 个" % got)
    if missing:
        print("!! docs.json 里有但磁盘上没有的页面 %d 个：" % len(missing))
        for m in missing[:20]:
            print("   ", m)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
