#!/bin/bash
# Claude HUD Uninstaller
# Usage: curl -fsSL https://raw.githubusercontent.com/CanCanNeedNei/cc-fusion/main/scripts/uninstall-claude-hud.sh | bash

set -e

PLUGIN_DIR="$HOME/.claude/plugins/claude-hud"
SETTINGS_FILE="$HOME/.claude/settings.json"

echo "🗑️  Uninstalling Claude HUD..."

# 1. Remove plugin directory
if [ -d "$PLUGIN_DIR" ]; then
  rm -rf "$PLUGIN_DIR"
  echo "✅ Removed $PLUGIN_DIR"
else
  echo "⏭️  $PLUGIN_DIR not found, skipping"
fi

# 2. Remove statusLine from settings.json (if it points to claude-hud)
if [ -f "$SETTINGS_FILE" ]; then
  if command -v jq &> /dev/null; then
    if jq -e '.statusLine.command // "" | contains("claude-hud")' "$SETTINGS_FILE" &> /dev/null; then
      jq 'del(.statusLine)' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
      echo "✅ Removed statusLine from $SETTINGS_FILE"
    else
      echo "⏭️  statusLine not pointing to claude-hud, skipping settings cleanup"
    fi
  else
    echo "⚠️  jq not found — please manually remove the statusLine block from $SETTINGS_FILE"
  fi
else
  echo "⏭️  $SETTINGS_FILE not found, skipping"
fi

echo ""
echo "📋 After restarting Claude Code, run: /reload-plugins"
echo ""
echo "✅ Claude HUD uninstalled successfully!"
echo "🔄 Restart Claude Code for changes to take effect."
