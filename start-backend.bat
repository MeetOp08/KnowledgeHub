@echo off
echo Starting KnowledgeHub Backend Server...
cd /d "%~dp0backend"
set PORT=5000
node index.js
pause
