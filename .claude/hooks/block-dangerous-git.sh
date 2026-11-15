#!/bin/bash

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).tool_input.command||"")}catch{console.log("")}})')

DANGEROUS_PATTERNS=(
  "git reset --hard"
  "git clean -fd"
  "git clean -f"
  "git branch -D"
  "git checkout \."
  "git restore \."
  "push --force"
  "reset --hard"
)

# Pushes: only a plain push of a feat/* branch to origin is allowed.
# The whole command must match, so chained commands, force flags,
# refspecs (a:b) and pushes to main/master or other branches are blocked.
if echo "$COMMAND" | grep -q "git push"; then
  if ! echo "$COMMAND" | grep -qE '^git push( -u| --set-upstream)? origin feat/[A-Za-z0-9._/-]+$'; then
    echo "BLOCKED: '$COMMAND'. Only 'git push [-u] origin feat/<branch>' is allowed; force pushes and pushes to main or other branches are blocked. The user has prevented you from doing this." >&2
    exit 2
  fi
fi

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern"; then
    echo "BLOCKED: '$COMMAND' matches dangerous pattern '$pattern'. The user has prevented you from doing this." >&2
    exit 2
  fi
done

exit 0
