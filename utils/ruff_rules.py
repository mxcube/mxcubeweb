import re

ALLOWED_FAMILIES = {"E", "F", "B", "I", "S"}


def get_family(code: str) -> str:
    # Extract leading letters only (e.g. SIM102 -> SIM, S101 -> S)
    match = re.match(r"[A-Z]+", code)
    return match.group(0) if match else ""


def clean_ignore_block(block: str) -> str:
    codes = re.findall(r'"([A-Z0-9]+)"', block)

    filtered = [c for c in codes if get_family(c) in ALLOWED_FAMILIES]

    if not filtered:
        return "[]"

    return "[\n" + "".join(f'    "{c}",\n' for c in filtered) + "]"


with open("ruff.toml") as f:
    content = f.read()

cleaned = re.sub(
    r"\[(?:\s*\"[A-Z0-9]+\",\s*)+\]",
    lambda m: clean_ignore_block(m.group(0)),
    content,
)

# Remove lines like: "path/to/file.py" = []
cleaned = re.sub(
    r'^\s*".+?"\s*=\s*\[\]\s*,?\n',
    "",
    cleaned,
    flags=re.MULTILINE,
)

# Remove empty sections leftover
cleaned = re.sub(
    r"\[tool\.ruff\.lint\.per-file-ignores\]\s*\n(\s*\n)*",
    "[tool.ruff.lint.per-file-ignores]\n",
    cleaned,
)

with open("ruff.cleaned.toml", "w") as f:
    f.write(cleaned)
