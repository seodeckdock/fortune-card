#!/usr/bin/env python3
"""
PreToolUse 훅: Write/Edit/MultiEdit/NotebookEdit 로 저장하려는 내용에
API 키 등 시크릿 패턴이 있으면 저장을 차단한다.
단, .env 계열 파일(.env, .env.local, ...)은 예외로 허용한다.

차단 시: 사유를 stderr(터미널)에 출력하고 exit code 2 로 도구 호출을 막는다.
파싱 오류 등 예기치 못한 상황에서는 안전하게 허용(exit 0)하여
훅 버그가 모든 파일 저장을 막지 않도록 한다(fail-open).
"""
import json
import os
import re
import sys

# 시크릿으로 간주할 패턴 (이름 -> 정규식)
SECRET_PATTERNS = {
    "OpenAI/Anthropic/OpenRouter 키 (sk-)": r"sk-[A-Za-z0-9_\-]{16,}",
    "AWS 액세스 키 (AKIA/ASIA)": r"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b",
    "GitHub 토큰 (ghp_/gho_/... , github_pat_)": r"\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b",
    "Slack 토큰 (xox...)": r"\bxox[baprs]-[A-Za-z0-9-]{10,}",
    "Google API 키 (AIza)": r"\bAIza[0-9A-Za-z_\-]{35}\b",
    "개인 키 블록 (PRIVATE KEY)": r"-----BEGIN [A-Z ]*PRIVATE KEY-----",
}


def is_env_file(path: str) -> bool:
    base = os.path.basename(path or "")
    return base == ".env" or base.startswith(".env.")


def extract_content(tool_name: str, tool_input: dict) -> str:
    """도구별로 '저장하려는 내용'을 모아 하나의 문자열로 반환."""
    parts = []
    if "content" in tool_input:  # Write
        parts.append(tool_input.get("content") or "")
    if "new_string" in tool_input:  # Edit
        parts.append(tool_input.get("new_string") or "")
    if "new_source" in tool_input:  # NotebookEdit
        parts.append(tool_input.get("new_source") or "")
    for edit in tool_input.get("edits", []) or []:  # MultiEdit
        if isinstance(edit, dict):
            parts.append(edit.get("new_string") or "")
    return "\n".join(p for p in parts if isinstance(p, str))


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0  # fail-open: 입력 파싱 실패 시 허용

    tool_input = data.get("tool_input") or {}
    tool_name = data.get("tool_name") or ""
    file_path = tool_input.get("file_path") or tool_input.get("notebook_path") or ""

    # .env 계열 파일은 예외 허용
    if is_env_file(file_path):
        return 0

    content = extract_content(tool_name, tool_input)
    if not content:
        return 0

    hits = [name for name, pat in SECRET_PATTERNS.items() if re.search(pat, content)]
    if not hits:
        return 0

    where = file_path or "(파일 경로 미상)"
    print("🚫 시크릿 저장 차단됨", file=sys.stderr)
    print(f"   파일: {where}", file=sys.stderr)
    print(f"   감지된 시크릿 유형: {', '.join(hits)}", file=sys.stderr)
    print(
        "   이 내용에는 시크릿으로 보이는 값이 있어 저장을 막았습니다.\n"
        "   → 키는 코드에 넣지 말고 .env(.local) 파일이나 환경변수로 옮기세요.\n"
        "   (.env 계열 파일은 이 검사에서 예외로 허용됩니다.)",
        file=sys.stderr,
    )
    return 2  # PreToolUse: 도구 호출 차단


if __name__ == "__main__":
    sys.exit(main())
