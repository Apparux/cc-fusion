#!/bin/bash
# CCometixLine Uninstaller
# Usage: curl -fsSL https://raw.githubusercontent.com/CanCanNeedNei/cc-fusion/main/scripts/uninstall-ccline.sh | bash

set -e

CCLINE_DIR="$HOME/.claude/ccline"
SETTINGS_FILE="$HOME/.claude/settings.json"

echo "🗑️  Uninstalling CCometixLine..."

# 1. Remove npm global package
if command -v npm &> /dev/null; then
  if npm list -g @cometix/ccline &> /dev/null; then
    npm uninstall -g @cometix/ccline 2>/dev/null && echo "✅ Uninstalled npm package @cometix/ccline" || echo "⚠️  Failed to uninstall npm package (try: sudo npm uninstall -g @cometix/ccline)"
  else
    echo "⏭️  npm package @cometix/ccline not found, skipping"
  fi
else
  echo "⏭️  npm not found, skipping npm cleanup"
fi

# 2. Remove binary directory (~/.claude/ccline)
if [ -d "$CCLINE_DIR" ]; then
  rm -rf "$CCLINE_DIR"
  echo "✅ Removed $CCLINE_DIR"
else
  echo "⏭️  $CCLINE_DIR not found, skipping"
fi

# 3. Remove statusLine from settings.json (if it points to ccline)
if [ -f "$SETTINGS_FILE" ]; then
  if command -v jq &> /dev/null; then
    if jq -e '.statusLine.command // "" | contains("ccline")' "$SETTINGS_FILE" &> /dev/null; then
      jq 'del(.statusLine)' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
      echo "✅ Removed statusLine from $SETTINGS_FILE"
    else
      echo "⏭️  statusLine not pointing to ccline, skipping settings cleanup"
    fi
  else
    echo "⚠️  jq not found — please manually remove the statusLine block from $SETTINGS_FILE"
  fi
else
  echo "⏭️  $SETTINGS_FILE not found, skipping"
fi

echo ""
echo "📋 Note: If you ran 'ccline --patch' on Claude Code, the patch will be auto-reverted on next Claude Code update."
echo ""
echo "✅ CCometixLine uninstalled successfully!"
echo "🔄 Restart Claude Code for changes to take effect."
