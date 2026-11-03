@echo off
rem サーバーと小窓だけを立ち上げる（ブラウザは開かない）
rem パソコンの起動時に裏で動かす用。すでに動いていれば何もしません。
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
if not defined PYW exit /b 1

start "" "%PYW%" "%~dp0server.py"
start "" "%PYW%" "%~dp0today_widget.pyw"
exit /b 0
