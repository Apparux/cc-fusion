#!/bin/bash
# CC-Fusion Uninstaller
# Usage: curl -fsSL https://raw.githubusercontent.com/CanCanNeedNei/cc-fusion/main/uninstall.sh | bash

set -e

INSTALL_DIR="$HOME/.claude/cc-fusion"
SETTINGS_FILE="$HOME/.claude/settings.json"

echo "🗑️  Uninstalling CC-Fusion..."

# 1. Remove installation directory
if [ -d "$INSTALL_DIR" ]; then
  rm -rf "$INSTALL_DIR"
  echo "✅ Removed $INSTALL_DIR"
else
  echo "⏭️  $INSTALL_DIR not found, skipping"
fi

# 2. Remove statusLine from settings.json (if jq available)
if [ -f "$SETTINGS_FILE" ]; then
  if command -v jq &> /dev/null; then
    # Check if statusLine.command contains cc-fusion
    if jq -e '.statusLine.command // "" | contains("cc-fusion")' "$SETTINGS_FILE" &> /dev/null; then
      jq 'del(.statusLine)' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
      echo "✅ Removed statusLine from $SETTINGS_FILE"
    else
      echo "⏭️  statusLine not pointing to cc-fusion, skipping settings cleanup"
    fi
  else
    echo "⚠️  jq not found — please manually remove the statusLine block from $SETTINGS_FILE"
  fi
else
  echo "⏭️  $SETTINGS_FILE not found, skipping"
fi

echo ""
echo "✅ CC-Fusion uninstalled successfully!"
echo "🔄 Restart Claude Code for changes to take effect."
