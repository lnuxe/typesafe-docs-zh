#!/usr/bin/env python3
"""结构保真自检：把中文页与英文原文（../_en）逐项对比。

用法：
    python tools/structure_selfcheck.py                      # 全部人工翻译范围内的页面
    python tools/structure_selfcheck.py primitives/score.md  # 只查指定页面

必须完全一致的项（多一项少一项都算 FAIL）：
    * 围栏代码块数量与语言标记
    * 去掉行注释后的代码正文（注释可以翻译，代码本体不能动）
    * mermaid 块数量与骨架（双引号里的节点标签可以翻译，图定义不能动）
    * 链接总数与链接目标集合
    * 标题层级序列（# / ## / ### 的顺序与数量）
    * front-matter 的键集合
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EN = ROOT.parent / "_en"
FENCE_RE = re.compile(r"^\s*(`{3,}|~{3,})\s*(\S*)")
HEADING_RE = re.compile(r"^(#{1,6})\s+")
LINK_RE = re.compile(r"\[[^\]]*\]\(\s*([^)\s]+)")
HREF_RE = re.compile(r"href=[\"']([^\"']+)[\"']")
FRONT_RE = re.compile(r"^---\s*$")


def strip_trailing_comment(line):
    for marker in ("#", "//"):
        cut = None
        for i in range(1, len(line)):
            if line.startswith(marker, i) and line[i - 1].isspace() and line[:i].strip():
                cut = i
                break
        if cut is not None:
            line = line[:cut].rstrip()
    return line


def code_only(body):
    kept = []
    for ln in body:
        s = ln.strip()
        if s.startswith("#") or s.startswith("//") or s.startswith("--") or s.startswith("<!--"):
            continue
        kept.append(strip_trailing_comment(ln))
    return "\n".join(kept)


def mermaid_skeleton(body):
    text = "\n".join(body)
    text = re.sub(r'"[^"]*"', '""', text)
    return re.sub(r"\s+", " ", text).strip()


def parse(path):
    lines = path.read_text(encoding="utf-8").splitlines()
    fences, headings, prose = [], [], []
    front_keys = []
    in_front = False
    cur = None
    for idx, ln in enumerate(lines):
        if idx == 0 and FRONT_RE.match(ln):
            in_front = True
            continue
        if in_front:
            if FRONT_RE.match(ln):
                in_front = False
                continue
            m = re.match(r"^([A-Za-z_][\w-]*):", ln)
            if m:
                front_keys.append(m.group(1))
            continue
        m = FENCE_RE.match(ln)
        if m:
            if cur is None:
                cur = {"lang": m.group(2), "body": []}
            else:
                fences.append(cur)
                cur = None
            continue
        if cur is not None:
            cur["body"].append(ln)
            continue
        h = HEADING_RE.match(ln)
        if h:
            headings.append(len(h.group(1)))
        prose.append(ln)
    text = "\n".join(prose)
    links = LINK_RE.findall(text) + HREF_RE.findall(text)
    return {
        "fence_count": len(fences),
        "fence_langs": [f["lang"] for f in fences],
        "fence_code": [mermaid_skeleton(f["body"]) if f["lang"].startswith("mermaid") else code_only(f["body"]) for f in fences],
        "fence_raw": ["\n".join(f["body"]) for f in fences],
        "mermaid_count": sum(1 for f in fences if f["lang"].startswith("mermaid")),
        "headings": headings,
        "links": links,
        "front_keys": front_keys,
    }


def check(rel):
    zh, en = ROOT / rel, EN / rel
    if not zh.exists() or not en.exists():
        return ["%s 缺失（%s）" % (rel, "中文文件" if not zh.exists() else "英文原文")]
    a, b = parse(en), parse(zh)
    errs, notes = [], []
    if a["fence_count"] != b["fence_count"]:
        errs.append("围栏代码块数量 %d -> %d" % (a["fence_count"], b["fence_count"]))
    if a["fence_langs"] != b["fence_langs"]:
        errs.append("代码块语言标记不一致：%s -> %s" % (a["fence_langs"], b["fence_langs"]))
    for i, (x, y) in enumerate(zip(a["fence_code"], b["fence_code"]), 1):
        if x != y:
            errs.append("第 %d 个代码块的代码本体被改动（不只是注释）" % i)
    for i, (x, y) in enumerate(zip(a["fence_raw"], b["fence_raw"]), 1):
        if x != y:
            notes.append("第 %d 个代码块只改了注释（允许）" % i)
    if a["mermaid_count"] != b["mermaid_count"]:
        errs.append("mermaid 块数量 %d -> %d" % (a["mermaid_count"], b["mermaid_count"]))
    if len(a["headings"]) != len(b["headings"]):
        errs.append("标题数量 %d -> %d" % (len(a["headings"]), len(b["headings"])))
    if a["headings"] != b["headings"]:
        errs.append("标题层级序列不一致：%s -> %s" % (a["headings"], b["headings"]))
    if len(a["links"]) != len(b["links"]):
        errs.append("链接数量 %d -> %d" % (len(a["links"]), len(b["links"])))
    if sorted(set(a["links"])) != sorted(set(b["links"])):
        only_en = sorted(set(a["links"]) - set(b["links"]))
        only_zh = sorted(set(b["links"]) - set(a["links"]))
        errs.append("链接目标不一致（原文多 %s / 译文多 %s）" % (only_en, only_zh))
    if a["front_keys"] != b["front_keys"]:
        errs.append("front-matter 键 %s -> %s" % (a["front_keys"], b["front_keys"]))
    return errs, notes, b


def main():
    targets = sys.argv[1:] or sorted(
        str(p.relative_to(EN)).replace("\\", "/")
        for p in EN.rglob("*.md")
    )
    bad = 0
    for rel in targets:
        rel = rel.replace("\\", "/")
        res = check(rel)
        if len(res) == 1:
            bad += 1
            print("FAIL  %s\n        - %s" % (rel, res[0]))
            continue
        errs, notes, b = res
        if errs:
            bad += 1
            print("FAIL  %s" % rel)
            for e in errs:
                print("        - %s" % e)
        else:
            print("OK    %-58s 代码块 %d / 链接 %d / 标题 %d%s"
                  % (rel, b["fence_count"], len(b["links"]), len(b["headings"]),
                     "  (注释翻译 %d 处)" % len(notes) if notes else ""))
    print("\n失败 %d 个文件" % bad)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
