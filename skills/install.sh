#!/usr/bin/env sh
# kr-privacy-review Skill 설치
#   프로젝트:  sh skills/install.sh /path/to/your-repo
#   사용자 전역: sh skills/install.sh --user
# 원격에서 바로 설치:
#   curl -fsSL https://raw.githubusercontent.com/geniuskey/privacy-guide/main/skills/install.sh | sh -s -- --user
set -eu
REPO_TARBALL="https://codeload.github.com/geniuskey/privacy-guide/tar.gz/refs/heads/main"
SRC_DIR="$(cd "$(dirname "$0")" 2>/dev/null && pwd)/kr-privacy-review"

if [ "${1:-}" = "--user" ]; then
  DEST="${HOME}/.claude/skills"
elif [ -n "${1:-}" ]; then
  DEST="$1/.claude/skills"
else
  echo "사용법: install.sh <프로젝트 경로> | --user" >&2
  exit 1
fi

mkdir -p "$DEST"
if [ -f "$SRC_DIR/SKILL.md" ]; then
  rm -rf "$DEST/kr-privacy-review"
  cp -R "$SRC_DIR" "$DEST/"
else
  TMP="$(mktemp -d)"
  trap 'rm -rf "$TMP"' EXIT
  curl -fsSL "$REPO_TARBALL" | tar -xz -C "$TMP"
  rm -rf "$DEST/kr-privacy-review"
  cp -R "$TMP"/privacy-guide-main/skills/kr-privacy-review "$DEST/"
fi
echo "설치 완료: $DEST/kr-privacy-review"
echo "Codex 등 다른 에이전트는 AGENTS.md에 'skills/kr-privacy-review/SKILL.md 절차를 따른다'고 적어 사용하세요."
