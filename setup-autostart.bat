@echo off
rem ============================================================
rem  Matrix Hub の自動起動を設定します
rem    1) 毎朝 9:30   サーバー＋小窓＋ブラウザを開く
rem    2) 毎日 16:30  同上（夜の振り返り用）
rem    3) ログオン時  サーバー＋小窓だけを裏で立ち上げる
rem  やめたいときは remove-autostart.bat を実行してください。
rem ============================================================
setlocal
set "DIR=%~dp0"
if "%DIR:~-1%"=="\" set "DIR=%DIR:~0,-1%"

echo Matrix Hub の自動起動を設定します。
echo.

schtasks /Create /TN "TimeMatrixTask 朝の確認" /TR "\"%DIR%\run-hub-hidden.vbs\"" /SC DAILY /ST 09:30 /F
schtasks /Create /TN "TimeMatrixTask 夜の振り返り" /TR "\"%DIR%\run-hub-hidden.vbs\"" /SC DAILY /ST 16:30 /F
schtasks /Create /TN "TimeMatrixTask 常駐（小窓）" /TR "\"%DIR%\run-background-hidden.vbs\"" /SC ONLOGON /DELAY 0000:30 /F

echo.
echo ---- 登録された内容 ----
schtasks /Query /TN "TimeMatrixTask 朝の確認" /FO LIST | findstr /i "タスク名 次回 状態 TaskName Next Status"
schtasks /Query /TN "TimeMatrixTask 夜の振り返り" /FO LIST | findstr /i "タスク名 次回 状態 TaskName Next Status"
schtasks /Query /TN "TimeMatrixTask 常駐（小窓）" /FO LIST | findstr /i "タスク名 次回 状態 TaskName Next Status"
echo.
echo 設定が終わりました。この画面は閉じて大丈夫です。
pause
