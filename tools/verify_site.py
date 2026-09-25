
import os, re, sys, html as H
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
DIST=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dist")
# 严格：href/src 前面不能是字母或 -，避免把 data-src / data-mermaid-src 当成资源引用
attr_re=re.compile(r'(?<![\w-])(?:href|src)="([^"]*)"')
bad=[]; total=0; pages=0
for dp,dn,fn in os.walk(DIST):
    for f in fn:
        if not f.endswith(".html"): continue
        p=os.path.join(dp,f); rel=os.path.relpath(p,DIST).replace("\\","/"); pages+=1
        base=os.path.dirname(p)
        for u in attr_re.findall(open(p,encoding="utf-8").read()):
            u=H.unescape(u)
            if u.startswith(("http://","https://","mailto:","data:","#","javascript:")): continue
            total+=1
            path=u.split("#")[0].split("?")[0]
            if not path: continue
            cand=os.path.join(DIST, path.lstrip("/")) if path.startswith("/") else os.path.normpath(os.path.join(base,path))
            if os.path.isdir(cand): cand=os.path.join(cand,"index.html")
            if not os.path.exists(cand): bad.append((rel,u))
print("扫描 %d 个 HTML，站内链接/资源 %d 个，解析失败 %d 个" % (pages,total,len(bad)))
for rel,u in bad[:25]: print("   %-44s -> %s" % (rel,u))