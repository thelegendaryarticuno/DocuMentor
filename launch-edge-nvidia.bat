@echo off
echo ========================================
echo  Launching Edge with NVIDIA GPU
echo ========================================
echo.

REM Close any existing Edge instances first
echo Closing existing Edge instances...
taskkill /F /IM msedge.exe 2>nul
if %errorlevel% equ 0 (
    echo Edge closed successfully
    timeout /t 2 /nobreak >nul
) else (
    echo No Edge instances running
)

echo.
echo Starting Edge with NVIDIA GPU flags...
echo.

REM Launch Edge with GPU flags forcing high-performance GPU
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" ^
  --force_high_performance_gpu ^
  --use-angle=d3d11 ^
  --use-cmd-decoder=passthrough ^
  --enable-features=Vulkan,UseSkiaRenderer,VaapiVideoDecoder ^
  --enable-unsafe-webgpu ^
  --enable-features=WebGPU ^
  --disable-gpu-driver-bug-workarounds ^
  --disable-software-rasterizer ^
  --disable-gpu-sandbox ^
  --enable-zero-copy ^
  http://localhost:5173

echo.
echo ========================================
echo Edge launched with NVIDIA GPU flags!
echo ========================================
echo.
echo Next steps:
echo 1. Wait for Edge to open
echo 2. Press F12 to open Developer Console
echo 3. Look for GPU detection messages
echo 4. You should see "NVIDIA" in the GPU description
echo.
echo If you see integrated graphics instead:
echo - Make sure your laptop is PLUGGED IN
echo - Check Windows Graphics Settings
echo - Check NVIDIA Control Panel settings
echo.
pause
