

ECHO Get version of package.json
@ECHO OFF
FOR /f "usebackqdelims=" %%A IN (
  `Powershell.exe -Nop -C "(Get-Content ..\package.json|ConvertFrom-Json).version"`
) DO SET version=%%A
ECHO AppVersion=%version%
@ECHO ON

ECHO Create new Inno Setup File
SET issoutfile="French Aggregator %version%.iss"
DEL %issoutfile%
SET pscommand="(gc 'French Aggregator.tmpl') -replace 'OldAppVersion', '%version%' | Out-File -encoding ASCII '%issoutfile%'"
powershell -Command %pscommand%
pause

ECHO Go and store App dir
CD "..\"
SET appdir=%CD%

ECHO Go to Work dir
CD "..\"

ECHO Remove Dirs
RD /S /Q "French Aggregator-win32-x64"
RD /S /Q "French Aggregator Setup

pause

ECHO Run electron-packager
REM --asar
start electron-packager "%appdir%" "French Aggregator" --platform=win32 --arch=x64 --electron-version=5.0.6 --overwrite --no-prune --ignore="setup" --ignore=".vscode" --asar

pause

