@echo off
echo ================================
echo  Lumina Gallery — Build Windows
echo ================================
echo.

call npm run package:win

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo [BLAD] Budowanie nie powiodlo sie!
  pause
  exit /b 1
)

echo.
echo [OK] Gotowe! Plik instalacyjny: release\windows\
echo.
pause
