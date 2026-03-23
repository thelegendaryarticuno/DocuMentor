# NVIDIA GPU Setup Guide for DocuMentor

This guide will help you configure your system to use your **NVIDIA discrete GPU** instead of integrated graphics for WebGPU acceleration.

## 🔍 Check Current GPU Status

When you run the application, open the browser console (F12) and look for these messages:

### ✅ **Good** - NVIDIA GPU is detected:
```
✅ Selected GPU: NVIDIA GeForce RTX 3060
   Type: 🎮 Discrete GPU
   Vendor: nvidia
```

### ⚠️ **Bad** - Integrated graphics detected:
```
⚠️  WARNING: Using Integrated Graphics instead of NVIDIA GPU!
   Selected: Intel(R) UHD Graphics 630
```

---

## 🛠️ How to Force Your Browser to Use NVIDIA GPU

### **Step 1: Windows Graphics Settings** (Most Important!)

This is the **primary** method to force Windows to assign your NVIDIA GPU to your browser:

1. Open **Windows Settings** (Windows Key + I)
2. Go to **System → Display → Graphics Settings** (or search "Graphics Settings")
3. Click **"Browse"** button
4. Navigate to and select your browser executable:
   - **Chrome**: `C:\Program Files\Google\Chrome\Application\chrome.exe`
   - **Edge**: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`
   - **Brave**: `C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe`
5. Click **"Options"** on the added browser
6. Select **"High performance"** (this is your NVIDIA GPU)
7. Click **"Save"**

**Important**: Close your browser completely and restart it after this change!

---

### **Step 2: NVIDIA Control Panel**

Configure NVIDIA Control Panel to prefer high-performance GPU for your browser:

1. **Right-click on desktop** → Select **"NVIDIA Control Panel"**
2. Go to **"Manage 3D Settings"** in the left panel
3. Click the **"Program Settings"** tab
4. Click **"Add"** and select your browser from the list (or browse to it)
5. For **"Select the preferred graphics processor"**, choose:
   - **"High-performance NVIDIA processor"**
6. Click **"Apply"**

---

### **Step 3: Browser Settings**

Make sure hardware acceleration is enabled:

#### **Chrome / Edge / Brave:**
1. Go to `chrome://settings/system` (or `edge://settings/system`)
2. Make sure **"Use hardware acceleration when available"** is **ON**
3. Restart your browser

---

### **Step 4: Enable WebGPU** (If Needed)

Some browsers might need WebGPU explicitly enabled:

#### **Chrome / Edge:**
1. Go to `chrome://flags` (or `edge://flags`)
2. Search for **"webgpu"**
3. Set **"Unsafe WebGPU"** to **Enabled**
4. Click **"Relaunch"** to restart browser

---

### **Step 5: Update GPU Drivers**

Make sure you have the latest NVIDIA drivers:

1. Visit [NVIDIA Driver Downloads](https://www.nvidia.com/Download/index.aspx)
2. Select your GPU model
3. Download and install the latest **Game Ready Driver** or **Studio Driver**
4. Restart your computer after installation

---

## 🧪 Testing the Configuration

After completing the steps above:

1. **Completely close your browser** (check Task Manager to ensure it's not running)
2. **Restart your browser**
3. Open DocuMentor and press **F12** to open the console
4. Look for the GPU detection messages
5. You should see your NVIDIA GPU listed

---

## 🐛 Troubleshooting

### Problem: Still showing integrated graphics

**Solution checklist:**
- [ ] Did you **completely close and restart** the browser after making changes?
- [ ] Did you set **both** Windows Graphics Settings AND NVIDIA Control Panel?
- [ ] Is your laptop **plugged into power**? Some laptops disable discrete GPU on battery
- [ ] Are you using an **external monitor**? Try connecting directly to external display
- [ ] Update your NVIDIA drivers to the latest version
- [ ] Check Windows Device Manager - is the NVIDIA GPU showing any errors?

### Problem: WebGPU not available at all

**Possible causes:**
- Your GPU is too old (WebGPU requires NVIDIA GTX 900 series or newer)
- Drivers are outdated
- Browser version is too old (Chrome/Edge 113+ required)

### Problem: Error messages about WASM or initialization failures

**Try:**
1. Clear browser cache completely
2. Disable browser extensions that might interfere
3. Try in an incognito/private window
4. Check if your antivirus is blocking WebAssembly

---

## 📊 Performance Comparison

Once NVIDIA GPU is working:

| Metric | Integrated Graphics | NVIDIA GPU |
|--------|-------------------|------------|
| Inference Speed | 5-10 tokens/sec | 25-50+ tokens/sec |
| First Token Latency | 2-5 seconds | 0.5-1 second |
| VLM Support | Limited/Error | Full support |
| Model Size Limit | ~500MB | 2GB+ |

---

## 🔗 Additional Resources

- [Chrome WebGPU Status](chrome://gpu)
- [Edge GPU Info](edge://gpu)
- [NVIDIA Control Panel Guide](https://nvidia.custhelp.com/app/answers/detail/a_id/3130)
- [Windows Graphics Settings](https://support.microsoft.com/windows)

---

## 💡 Quick Reference: Console Commands

You can also check GPU info programmatically in the browser console:

```javascript
// Check if WebGPU is available
console.log('WebGPU available:', !!navigator.gpu);

// Request and log GPU info
navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })
  .then(adapter => {
    console.log('GPU Info:', adapter.info);
  });
```

---

**Need more help?** Check the browser console for detailed GPU detection logs and follow the troubleshooting steps printed there.
