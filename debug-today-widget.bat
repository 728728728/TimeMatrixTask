@echo off
rem うまく起動しないときに、エラー内容を画面に出して確かめる用
setlocal
chcp 932 >nul
@echo off
rem --- Python(pythonw) を探す。Microsoft Store のダミーは使わない ---
set "PYW="

if exist "%LOCALAPPDATA%\Python\bin\python.exe" set "PYW=%LOCALAPPDATA%\Python\bin\python.exe"

if not defined PYW for /d %%D in ("%LOCALAPPDATA%\Programs\Python\Python3*") do if exist "%%D\python.exe" set "PYW=%%D\python.exe"
if not defined PYW for /d %%D in ("%ProgramFiles%\Python3*") do if exist "%%D\python.exe" set "PYW=%%D\python.exe"
if not defined PYW for /d %%D in ("C:\Python3*") do if exist "%%D\python.exe" set "PYW=%%D\python.exe"

if not defined PYW (
  for /f "delims=" %%P in ('where python.exe 2^>nul') do (
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

echo 使う Python: "%PYW%"
echo.
"%PYW%" "%~dp0today_widget.pyw"
echo.
echo --- 終了コード: %errorlevel% ---
pause
