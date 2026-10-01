@echo off
setlocal
if "%~1"=="" goto usage
if "%~2"=="" goto usage
node "%~dp0scripts\android-inspect.cjs" "%~1" "%~2"
exit /b %errorlevel%
:usage
echo Usage: Inspect-Android.cmd DEVICE_SERIAL NEW_PRIVATE_DIRECTORY
echo Set DOL_ANDROID_CLI and DOL_ANDROID_SDK if they are not already available.
pause
exit /b 1
