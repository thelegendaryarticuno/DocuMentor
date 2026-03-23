# 🚀 QUICK START: Force NVIDIA GPU Usage

Your browser is still using integrated graphics. Here's the **fastest way** to fix it:

## ⚡ Super Quick Fix (ONE COMMAND!)

### **NEW: Automatic Launch with GPU**

Just run ONE of these commands - it will start the dev server AND launch your browser with NVIDIA GPU flags automatically:

```bash
# Auto-detect your default browser and launch with GPU
npm run dev:gpu

# Or force a specific browser:
npm run dev:chrome    # Launch Chrome with NVIDIA GPU
npm run dev:edge      # Launch Edge with NVIDIA GPU  
npm run dev:brave     # Launch Brave with NVIDIA GPU
```

**That's it!** The script will:
1. ✅ Start the Vite dev server
2. ✅ Wait for server to be ready
3. ✅ Detect and close existing browser instances
4. ✅ Launch browser with NVIDIA GPU flags
5. ✅ Open your app automatically

### Verify GPU in Console (F12):
```
✅ Selected GPU: NVIDIA GeForce RTX [YOUR MODEL]
   Type: 🎮 Discrete GPU
```

---

## 🔧 Alternative: Manual Launch (Old Method)

If you prefer manual control:

### Step 1: Run Dev Server
```bash
npm run dev
```

### Step 2: Launch Browser with NVIDIA GPU

**Double-click one of these files in your project folder:**
- `launch-chrome-nvidia.bat` (for Chrome)
- `launch-edge-nvidia.bat` (for Edge)

### Step 3: Verify GPU

Press **F12** in the browser and look for:
```
✅ Selected GPU: NVIDIA GeForce RTX [YOUR MODEL]
   Type: 🎮 Discrete GPU
```

---

## 🎯 What Each Command Does

| Command | What It Does |
|---------|-------------|
| `npm run dev:gpu` | 🔍 Auto-detects your default browser, launches with NVIDIA GPU |
| `npm run dev:chrome` | 🎯 Forces Chrome with NVIDIA GPU (fastest if you use Chrome) |
| `npm run dev:edge` | 🎯 Forces Edge with NVIDIA GPU |
| `npm run dev:brave` | 🎯 Forces Brave with NVIDIA GPU |

**Recommended**: Use `npm run dev:chrome` or `npm run dev:edge` for fastest startup (skips browser detection).

---

## ❌ If It Still Shows Integrated Graphics

### Critical Checklist:

1. **🔌 Is your laptop PLUGGED IN?**
   - Most laptops disable NVIDIA GPU when on battery
   - **This is the #1 reason it doesn't work!**

2. **Windows Graphics Settings**
   - Windows Key + I → System → Display → Graphics Settings
   - Add your browser executable
   - Set to "High performance"
   - **Restart browser after this!**

3. **NVIDIA Control Panel**
   - Right-click desktop → NVIDIA Control Panel
   - Manage 3D Settings → Program Settings
   - Add your browser
   - Set to "High-performance NVIDIA processor"

4. **Update Drivers**
   - Visit [NVIDIA Drivers](https://www.nvidia.com/Download/index.aspx)
   - Download latest driver for your GPU
   - Install and restart PC

---

## 🔍 Debug: Check Which GPU is Actually Running

### Method 1: Chrome/Edge GPU Status
1. Open: `chrome://gpu` or `edge://gpu`
2. Look at "Graphics Feature Status"
3. Should show NVIDIA GPU info at the top

### Method 2: NVIDIA GPU Activity Monitor
1. Open NVIDIA Control Panel
2. Desktop menu → "Display GPU Activity Icon in Notification Area"
3. Look for GPU icon in system tray when browser is running
4. If no GPU activity shown → Browser isn't using NVIDIA

### Method 3: Task Manager
1. Open Task Manager (Ctrl+Shift+Esc)
2. Go to "Performance" tab
3. Check both "GPU 0" (probably Intel) and "GPU 1" (probably NVIDIA)
4. Your browser should show activity on NVIDIA GPU

---

## 🎯 What the Batch Files Do

The launch scripts add these critical flags:

```
--force_high_performance_gpu       ← Forces discrete GPU
--use-angle=d3d11                  ← Better NVIDIA support
--enable-unsafe-webgpu             ← Enables WebGPU
--disable-software-rasterizer      ← Prevents CPU fallback
--disable-gpu-driver-bug-workarounds ← Direct GPU access
```

---

## 💡 Alternative: Manual Browser Launch

If batch files don't work, try launching manually:

### Windows Run (Win+R):
```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --force_high_performance_gpu --use-angle=d3d11 --enable-unsafe-webgpu
```

Then navigate to `http://localhost:5173`

---

## 🆘 Still Not Working?

Your laptop might have **NVIDIA Optimus** which makes GPU switching harder. Try:

1. **External Monitor**: Connect to external display via HDMI/DisplayPort
   - Some laptops route NVIDIA GPU through external ports
   
2. **Disable Optimus** (advanced):
   - Some laptops allow disabling Optimus in BIOS
   - Check your laptop manufacturer's documentation

3. **Check Device Manager**:
   - Windows Key + X → Device Manager
   - Expand "Display adapters"
   - Is NVIDIA GPU showing? Any yellow warnings?

---

## 📖 More Details

- **Full setup guide**: See `NVIDIA_GPU_SETUP.md`
- **Technical details**: See `FORCE_NVIDIA_GPU.md`

---

## ✅ Success Indicators

When NVIDIA GPU is working correctly:

1. Console shows: **"NVIDIA"** in GPU description
2. `chrome://gpu` shows: NVIDIA GPU at the top
3. NVIDIA GPU Activity icon shows: Activity in system tray
4. Task Manager shows: GPU 1 (NVIDIA) has activity
5. Performance: 2-5x faster inference, no image errors

---

**Remember**: The most common issue is **laptop not plugged into power**! 🔌
