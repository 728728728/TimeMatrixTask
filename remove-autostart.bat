@echo off
rem Matrix Hub の自動起動をやめる（アプリ本体やデータはそのままです）
setlocal
echo 自動起動の設定を削除します。
echo.
schtasks /Delete /TN "TimeMatrixTask 朝の確認" /F
schtasks /Delete /TN "TimeMatrixTask 夜の振り返り" /F
schtasks /Delete /TN "TimeMatrixTask 常駐（小窓）" /F
echo.
echo 削除しました。すでに出ている小窓は、閉じるボタンで終了します。
pause
