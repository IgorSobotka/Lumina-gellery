#!/bin/bash
echo "================================"
echo " Lumina Gallery — Build macOS"
echo "================================"
echo ""

# Sprawdź czy jesteśmy na macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
  echo "[BŁĄD] Ten skrypt musi być uruchomiony na macOS!"
  echo "       Użyj GitHub Actions żeby budować na Windowsie."
  exit 1
fi

# Sprawdź Node.js
if ! command -v node &> /dev/null; then
  echo "[BŁĄD] Node.js nie jest zainstalowany!"
  exit 1
fi

# Instaluj zależności jeśli trzeba
if [ ! -d "node_modules" ]; then
  echo "[INFO] Instaluję zależności..."
  npm install
fi

echo "[INFO] Buduję dla macOS..."
npm run package:mac

if [ $? -ne 0 ]; then
  echo ""
  echo "[BŁĄD] Budowanie nie powiodło się!"
  exit 1
fi

echo ""
echo "[OK] Gotowe! Plik DMG: release/macos/"
echo ""
