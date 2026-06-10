#!/usr/bin/env python3
"""Проверка, что все локальные src/href из HTML и import из JS указывают на существующие файлы."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
errors = []

HTML_ATTR_RE = re.compile(r'(?:src|href)="(\.\./[^"#?]+)')
JS_IMPORT_RE = re.compile(r"from '(\.\./[^'?]+)")


def check_path(from_file: Path, rel: str, label: str) -> None:
    rel = rel.split("?")[0]
    if rel.startswith("http"):
        return
    target = (from_file.parent / rel).resolve()
    try:
        target.relative_to(ROOT.resolve())
    except ValueError:
        errors.append(f"{label}: {from_file.relative_to(ROOT)} -> {rel} (outside root)")
        return
    if not target.exists():
        errors.append(f"{label}: {from_file.relative_to(ROOT)} -> {rel} MISSING")


def check_html(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    for m in HTML_ATTR_RE.finditer(text):
        check_path(path, m.group(1), "HTML")


def check_js(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    for m in JS_IMPORT_RE.finditer(text):
        imp = m.group(1)
        if imp.startswith("../") or imp.startswith("./"):
            # resolve relative to file dir; ./ in core stays in core
            if imp.startswith("./"):
                target = (path.parent / imp).resolve()
            else:
                target = (path.parent / imp).resolve()
            if not target.exists():
                errors.append(f"JS import: {path.relative_to(ROOT)} -> {imp} MISSING")


def main() -> int:
    for html in (ROOT / "pages").glob("*.html"):
        check_html(html)
    if (ROOT / "index.html").exists():
        check_html(ROOT / "index.html")
    for js in (ROOT / "assets" / "js").rglob("*.js"):
        check_js(js)
    if errors:
        print("FAILED — broken paths:")
        for e in errors:
            print(" ", e)
        return 1
    print("OK — all local paths resolve")
    return 0


if __name__ == "__main__":
    sys.exit(main())
