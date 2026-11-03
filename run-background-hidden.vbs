' ログオン時の常駐用
' 黒い画面を出さずに start-background.bat を実行する
Dim sh, here
Set sh = CreateObject("WScript.Shell")
here = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))
sh.Run """" & here & "start-background.bat""", 0, False
