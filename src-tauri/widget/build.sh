#!/bin/sh
# Tauri beforeBundleCommand: 위젯 확장(.appex)을 universal로 빌드하고 Developer ID로 서명한다
set -eu
cd "$(dirname "$0")"
IDENTITY="${APPLE_SIGNING_IDENTITY:--}"

xcodegen generate --quiet
xcodebuild -project DomadoWidget.xcodeproj -target DomadoWidget -configuration Release \
  ARCHS="arm64 x86_64" ONLY_ACTIVE_ARCH=NO SYMROOT="$PWD/build" CODE_SIGN_IDENTITY="$IDENTITY" -quiet build
