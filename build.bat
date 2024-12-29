@echo off

set SourceDir=%~dp0
set TempDir=%Temp%\Caleph
set Token=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

git clone https://%Token%@github.com/kayyraa/Caleph.git "%TempDir%"
cd /d "%TempDir%"
del /q *.*
for /d %%x in (*) do rd /s /q "%%x"
git add .
git commit -m "Cleared all files"
git push origin main
cd ..
rd /s /q "%TempDir%"

if exist "%TempDir%" rd /s /q "%TempDir%"
git clone https://%Token%@github.com/kayyraa/Caleph.git "%TempDir%"

xcopy /s /e /y "%SourceDir%\*" "%TempDir%"
cd "%TempDir%"
git add .
git commit -m "Auto-update from local project folder"
git push origin main

cd ..
timeout /t 5 /nobreak >nul
rd /s /q "%TempDir%"