# Force NVIDIA GPU Usage - Launch Scripts

## Problem
WebGPU in browsers may still select integrated graphics even with our code optimizations. The browser needs to be launched with special flags to force NVIDIA GPU usage.

## Solution: Launch Browser with GPU Flags

### Windows Batch Script (Chrome)

Create a file named `launch-chrome-nvidia.bat` in your project folder:

```batch
@echo off
echo Launching Chrome with NVIDIA GPU forced...
echo.

REM Close any existing Chrome instances first
taskkill /F /IM chrome.exe 2>nul

REM Wait a moment for Chrome to fully close
timeout /t 2 /nobreak >nul

REM Launch Chrome with GPU flags forcing high-performance GPU
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --use-angle=d3d11 ^
  --use-cmd-decoder=passthrough ^
  --enable-features=Vulkan,UseSkiaRenderer,VaapiVideoDecoder ^
  --enable-unsafe-webgpu ^
  --enable-features=WebGPU ^
  --force_high_performance_gpu ^
  --disable-gpu-driver-bug-workarounds ^
  --disable-software-rasterizer ^
  http://localhost:5173

echo.
echo Chrome launched with NVIDIA GPU flags
echo Check the browser console to verify GPU selection
pause
```

### Windows Batch Script (Edge)

Create a file named `launch-edge-nvidia.bat`:

```batch
@echo off
echo Launching Edge with NVIDIA GPU forced...
echo.

REM Close any existing Edge instances first
taskkill /F /IM msedge.exe 2>nul

REM Wait a moment for Edge to fully close
timeout /t 2 /nobreak >nul

REM Launch Edge with GPU flags forcing high-performance GPU
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" ^
  --use-angle=d3d11 ^
  --use-cmd-decoder=passthrough ^
  --enable-features=Vulkan,UseSkiaRenderer ^
  --enable-unsafe-webgpu ^
  --enable-features=WebGPU ^
  --force_high_performance_gpu ^
  --disable-gpu-driver-bug-workarounds ^
  --disable-software-rasterizer ^
  http://localhost:5173

echo.
echo Edge launched with NVIDIA GPU flags
echo Check the browser console to verify GPU selection
pause
```

## Usage Instructions

1. **Save the batch file** to your project folder
2. **Start your dev server**: `npm run dev`
3. **Run the batch file** by double-clicking it
4. The browser will launch with NVIDIA GPU forced
5. **Check the console** (F12) to verify NVIDIA GPU is selected

## Key Flags Explained

- `--force_high_performance_gpu` - Forces discrete GPU
- `--use-angle=d3d11` - Use Direct3D 11 (better NVIDIA support)
- `--enable-unsafe-webgpu` - Enable WebGPU
- `--disable-software-rasterizer` - Prevent CPU fallback
- `--disable-gpu-driver-bug-workarounds` - Use GPU directly

## Alternative: Create Desktop Shortcut

### Chrome Shortcut
1. Right-click on Desktop → New → Shortcut
2. Target location:
```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --force_high_performance_gpu --use-angle=d3d11 --enable-unsafe-webgpu --disable-gpu-driver-bug-workarounds
```
3. Name it "Chrome (NVIDIA GPU)"
4. Launch your app, then use this shortcut

### Edge Shortcut
1. Right-click on Desktop → New → Shortcut
2. Target location:
```
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --force_high_performance_gpu --use-angle=d3d11 --enable-unsafe-webgpu --disable-gpu-driver-bug-workarounds
```
3. Name it "Edge (NVIDIA GPU)"
4. Launch your app, then use this shortcut

## Verification

After launching with these flags, you should see in the console:

```
✅ Selected GPU: NVIDIA GeForce RTX [YOUR MODEL]
   Type: 🎮 Discrete GPU
   Vendor: nvidia
```

## Additional Tips

1. **Check chrome://gpu** to see which GPU is active
2. Make sure your **laptop is plugged in** (some laptops disable dGPU on battery)
3. If using **external monitor**, connect it directly to NVIDIA output
4. Update to **Chrome 113+** or **Edge 113+** for best WebGPU support

## Still Not Working?

If NVIDIA GPU still isn't detected:

1. Open **NVIDIA Control Panel**
2. Go to **Desktop** menu → Check **"Display GPU Activity Icon in Notification Area"**
3. Launch your browser with the batch script
4. Check the NVIDIA icon in system tray - it should show GPU activity
5. If no activity shown, the browser still isn't using NVIDIA GPU

**Last resort**: Check if your laptop has **NVIDIA Optimus** technology. Some laptops require updating BIOS or using NVIDIA's "GPU Activity" monitor to force GPU usage.
