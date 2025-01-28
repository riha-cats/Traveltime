@echo off
title Maintenance Mode Control Panel
color 0A

set SERVER_DIR=C:\Users\Administrator\Desktop\Dongmom
set ALLOWED_IPS=127.0.0.1,192.168.45.1  :: 허용 IP 콤마 구분

:menu
cls
echo ====================================
echo  Server Maintenance Control Panel  
echo ====================================
echo 1. 점검 모드 시작 (서버 재시작)
echo 2. 정상 모드 복귀 (서버 재시작)
echo 3. 현재 설정 확인
echo 4. 종료
echo ====================================
set /p choice="메뉴 선택 (1-4): "

if "%choice%"=="1" goto maintenance_on
if "%choice%"=="2" goto maintenance_off
if "%choice%"=="3" goto show_status
if "%choice%"=="4" exit
goto menu

:maintenance_on
set MAINTENANCE_MODE=true
echo 점검 모드 활성화 중...
goto restart_server

:maintenance_off
set MAINTENANCE_MODE=false
echo 정상 모드 복귀 중...
goto restart_server

:restart_server
taskkill /f /im node.exe >nul 2>&1
cd /d %SERVER_DIR%
start "" node app.js
timeout /t 3 /nobreak >nul
goto show_status

:show_status
cls
echo ====================================
echo  현재 서버 상태
echo ====================================
echo Maintenance Mode: %MAINTENANCE_MODE%
echo Allowed IPs: %ALLOWED_IPS%
echo ====================================
pause
goto menu