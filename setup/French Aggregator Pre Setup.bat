SET version=1.0.1

CD "..\"
SET appdir=%CD%

CD "..\"
CD

ECHO Remove Dirs

RD /S /Q "French Aggregator %version%-win32-x64"
RD /S /Q "French Aggregator Setup %version%

pause

ECHO Electron-packager
REM --asar
start electron-packager "%appdir%" "French Aggregator %version%" --platform=win32 --arch=x64 --electron-version=5.0.6 --overwrite --no-prune --ignore="setup" --ignore=".vscode" --asar

pause

