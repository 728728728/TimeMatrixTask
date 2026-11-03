' 9:30 / 16:30 の自動起動用
' 黒い画面を出さずに start-matrix-hub.bat を実行する
Dim sh, here
Set sh = CreateObject("WScript.Shell")
here = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))
sh.Run """" & here & "start-matrix-hub.bat""", 0, False
