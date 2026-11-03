@echo off
rem Matrix Hub をまとめて起動する
rem   1) データを扱うローカルサーバー  2) デスクトップの小窓  3) ブラウザ
rem すでに動いているものは、そのまま使います（二重起動しません）。
setlocal
set "PYW="
if exist "%LOCALAPPDATA%\Python\bin\pythonw.exe" set "PYW=%LOCALAPPDATA%\Python\bin\pythonw.exe"
if not defined PYW for /d %%D in ("%LOCALAPPDATA%\Programs\Python\Python3*") do if exist "%%D\pythonw.exe" set "PYW=%%D\pythonw.exe"
if not defined PYW for /d %%D in ("%ProgramFiles%\Python3*") do if exist "%%D\pythonw.exe" set "PYW=%%D\pythonw.exe"
if not defined PYW for /d %%D in ("C:\Python3*") do if exist "%%D\pythonw.exe" set "PYW=%%D\pythonw.exe"
if not defined PYW (
  for /f "delims=" %%P in ('where pythonw.exe 2^>nul') do (
    if not defined PYW (
      echo %%P | findstr /i /c:"WindowsApps" >nul
      if errorlevel 1 set "PYW=%%P"
    )
  )
)
if not defined PYW (
  echo.
  echo Python が見つかりませんでした。
  echo python.org 版の Python を入れてから、もう一度お試しください。
  echo.
  pause
  exit /b 1
)

start "" "%PYW%" "%~dp0server.py"
start "" "%PYW%" "%~dp0today_widget.pyw"

rem --- サーバーが応答するまで待ってから開く（最大およそ15秒） ---
set TRIES=0
:wait
set /a TRIES+=1
curl -s -o nul --max-time 1 http://127.0.0.1:8730/api/ping 2>nul
if not errorlevel 1 goto open
if %TRIES% geq 15 goto open
ping -n 2 127.0.0.1 >nul
goto wait

:open
start "" "http://127.0.0.1:8730/index.html"
exit /b 0
