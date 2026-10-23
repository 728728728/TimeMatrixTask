@echo off
rem 今日やること・デスクトップウィジェットを起動する（画面に小窓が出ます）
setlocal
@echo off
rem --- Python(pythonw) を探す。Microsoft Store のダミーは使わない ---
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

start "" "%PYW%" "%~dp0today_widget.pyw"
exit /b 0
