#!/bin/bash
# CC-Fusion Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/CanCanNeedNei/cc-fusion/main/install.sh | bash

set -e

INSTALL_DIR="$HOME/.claude/cc-fusion"
REPO_URL="https://github.com/CanCanNeedNei/cc-fusion.git"

echo "🚀 Installing CC-Fusion..."

# Clone or update
if [ -d "$INSTALL_DIR" ]; then
  echo "📁 Found existing installation, updating..."
  cd "$INSTALL_DIR"
  git pull --quiet
else
  echo "📥 Cloning to $INSTALL_DIR..."
  git clone --quiet "$REPO_URL" "$INSTALL_DIR"
fi

# Check if dist/ exists (pre-built)
if [ ! -f "$INSTALL_DIR/dist/index.js" ]; then
  echo "⚙️  Building from source..."
  cd "$INSTALL_DIR"
  npm install --quiet 2>/dev/null
  npm run build --silent 2>/dev/null
fi

echo ""
echo "✅ CC-Fusion installed successfully!"
echo ""
echo "📋 Next step — add this to ~/.claude/settings.json:"
echo ""
echo '  {'
echo '    "statusLine": {'
echo '      "type": "command",'
echo "      \"command\": \"node $INSTALL_DIR/dist/index.js\","
echo '      "padding": 0'
echo '    }'
echo '  }'
echo ""
echo "Then restart Claude Code. Enjoy! 🎉"
echo ""
echo "To uninstall later, run:"
echo "  curl -fsSL https://raw.githubusercontent.com/CanCanNeedNei/cc-fusion/main/uninstall.sh | bash"
