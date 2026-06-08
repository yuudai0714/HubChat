#!/usr/bin/env bash
# ============================================================
# HubChat リリース自動化スクリプト
#   使い方:  ./scripts/release.sh            （package.json の version で実行）
#   前提:    notarytool-profile が Keychain に登録済み
#            gh CLI が yuudai0714 アカウントで認証済み
# ============================================================
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
DIST="$ROOT/dist"
PROFILE="notarytool-profile"
REPO="yuudai0714/HubChat"

VER="$(node -p "require('./package.json').version")"
TAG="v${VER}"
echo "================ HubChat リリース ${TAG} ================"

# --- 既存タグの確認 ---
if gh release view "$TAG" --repo "$REPO" >/dev/null 2>&1; then
  echo "⚠️  リリース ${TAG} は既に存在します。中止します（version を上げてください）。"
  exit 1
fi

# --- ビルド ---
echo "▶ クリーンビルド (mac + win)"
rm -rf "$DIST"
npm run build:mac
npm run build:win

# --- 公証（DMG 2つ並列 → ZIP 2つ並列。ZIPは別ステップにして競合回避） ---
echo "▶ 公証: DMG"
( cd "$DIST" && \
  xcrun notarytool submit "HubChat-${VER}-arm64.dmg" --keychain-profile "$PROFILE" --wait & \
  xcrun notarytool submit "HubChat-${VER}.dmg"       --keychain-profile "$PROFILE" --wait & \
  wait )

echo "▶ 公証: ZIP"
( cd "$DIST" && \
  xcrun notarytool submit "HubChat-${VER}-arm64-mac.zip" --keychain-profile "$PROFILE" --wait & \
  wait )
# x64 zip は単体で（並列実行時の "must be a zip" 誤検知を避ける）
( cd "$DIST" && xcrun notarytool submit "HubChat-${VER}-mac.zip" --keychain-profile "$PROFILE" --wait )

# --- staple（DMGのみ。ZIPはstaple不可） ---
echo "▶ staple"
xcrun stapler staple "$DIST/HubChat-${VER}-arm64.dmg"
xcrun stapler staple "$DIST/HubChat-${VER}.dmg"

# --- GitHub リリース作成（yml フィードを必ず含める＝自動更新の生命線） ---
echo "▶ GitHub リリース作成"
TOKEN="$(gh auth token --user yuudai0714)"
git remote set-url origin "https://yuudai0714:${TOKEN}@github.com/${REPO}.git"

NOTES_FILE="$(mktemp)"
cat > "$NOTES_FILE" <<EOF
## ${TAG}

（リリースノートを編集してください）
EOF

gh release create "$TAG" \
  "$DIST/HubChat-${VER}-arm64.dmg#HubChat-${VER}-arm64.dmg (Mac Apple Silicon)" \
  "$DIST/HubChat-${VER}-arm64-mac.zip#HubChat-${VER}-arm64-mac.zip (Mac Apple Silicon ZIP)" \
  "$DIST/HubChat-${VER}.dmg#HubChat-${VER}.dmg (Mac Intel)" \
  "$DIST/HubChat-${VER}-mac.zip#HubChat-${VER}-mac.zip (Mac Intel ZIP)" \
  "$DIST/HubChat-Setup-${VER}.exe#HubChat-Setup-${VER}.exe (Windows)" \
  "$DIST/latest-mac.yml" \
  "$DIST/latest.yml" \
  --repo "$REPO" \
  --title "$TAG" \
  --notes-file "$NOTES_FILE" \
  --draft

rm -f "$NOTES_FILE"

echo ""
echo "✅ ドラフトを作成しました。リリースノートを編集 → 公開してください:"
echo "   https://github.com/${REPO}/releases"
echo ""
echo "※ latest-mac.yml / latest.yml を含めているので、既存ユーザーは"
echo "   アプリ内のワンクリック更新で ${TAG} に上げられます。"
