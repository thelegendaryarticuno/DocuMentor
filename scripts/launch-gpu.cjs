/**
 * Auto-launch script with NVIDIA GPU acceleration
 * Detects the default browser and launches it with GPU flags
 */

const { spawn, exec } = require('child_process');
const os = require('os');
const path = require('path');

// Browser configurations with NVIDIA GPU flags
const BROWSERS = {
  chrome: {
    name: 'Google Chrome',
    paths: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    ],
    processName: 'chrome.exe',
  },
  edge: {
    name: 'Microsoft Edge',
    paths: [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    ],
    processName: 'msedge.exe',
  },
  brave: {
    name: 'Brave Browser',
    paths: [
      'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      path.join(process.env.LOCALAPPDATA || '', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe'),
    ],
    processName: 'brave.exe',
  },
};

// NVIDIA GPU acceleration flags
const GPU_FLAGS = [
  '--force_high_performance_gpu',
  '--use-angle=d3d11',
  '--use-cmd-decoder=passthrough',
  '--enable-features=Vulkan,UseSkiaRenderer,VaapiVideoDecoder',
  '--enable-unsafe-webgpu',
  '--enable-features=WebGPU',
  '--disable-gpu-driver-bug-workarounds',
  '--disable-software-rasterizer',
  '--disable-gpu-sandbox',
  '--enable-zero-copy',
];

const fs = require('fs');

/**
 * Check if a file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (e) {
    return false;
  }
}

/**
 * Find the browser executable
 */
function findBrowser(browserConfig) {
  for (const browserPath of browserConfig.paths) {
    if (fileExists(browserPath)) {
      return browserPath;
    }
  }
  return null;
}

/**
 * Kill existing browser instances
 */
function killBrowser(processName) {
  return new Promise((resolve) => {
    exec(`taskkill /F /IM ${processName} 2>nul`, (error) => {
      // Ignore errors (process might not be running)
      setTimeout(resolve, 2000); // Wait 2 seconds for process to close
    });
  });
}

/**
 * Get default browser from Windows registry
 */
function getDefaultBrowser() {
  return new Promise((resolve) => {
    exec(
      'reg query HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice /v ProgId',
      (error, stdout) => {
        if (error) {
          resolve(null);
          return;
        }

        const match = stdout.match(/ProgId\s+REG_SZ\s+(\S+)/);
        if (!match) {
          resolve(null);
          return;
        }

        const progId = match[1].toLowerCase();

        if (progId.includes('chrome')) {
          resolve('chrome');
        } else if (progId.includes('edge')) {
          resolve('edge');
        } else if (progId.includes('brave')) {
          resolve('brave');
        } else {
          resolve(null);
        }
      }
    );
  });
}

/**
 * Launch browser with NVIDIA GPU flags
 */
async function launchBrowser(browserKey, url) {
  const browserConfig = BROWSERS[browserKey];
  const browserPath = findBrowser(browserConfig);

  if (!browserPath) {
    console.error(`❌ ${browserConfig.name} not found!`);
    console.error(`   Searched paths:`);
    browserConfig.paths.forEach(p => console.error(`   - ${p}`));
    return false;
  }

  console.log(`\n🎮 Launching ${browserConfig.name} with NVIDIA GPU...`);
  console.log(`   Path: ${browserPath}`);

  // Kill existing instances
  console.log(`   Closing existing instances...`);
  await killBrowser(browserConfig.processName);

  // Launch with GPU flags
  console.log(`   Starting with NVIDIA GPU flags...`);
  const args = [...GPU_FLAGS, url];
  
  const child = spawn(browserPath, args, {
    detached: true,
    stdio: 'ignore',
    shell: false,
  });

  child.unref();

  console.log(`\n✅ ${browserConfig.name} launched!`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Wait for browser to open`);
  console.log(`   2. Press F12 to open Developer Console`);
  console.log(`   3. Look for GPU detection messages`);
  console.log(`   4. You should see "NVIDIA" in the GPU description\n`);
  console.log(`💡 If you still see integrated graphics:`);
  console.log(`   - Make sure your laptop is PLUGGED IN 🔌`);
  console.log(`   - Check Windows Graphics Settings`);
  console.log(`   - Check NVIDIA Control Panel settings`);
  console.log(`   - See README_NVIDIA_GPU.md for troubleshooting\n`);

  return true;
}

/**
 * Main execution
 */
async function main() {
  console.log('========================================');
  console.log('  NVIDIA GPU Auto-Launch');
  console.log('========================================\n');

  const platform = os.platform();
  if (platform !== 'win32') {
    console.error('❌ This script currently only supports Windows');
    console.error('   For other platforms, use the browser directly with:');
    console.error('   --force_high_performance_gpu --enable-unsafe-webgpu');
    process.exit(1);
  }

  // Get URL from command line or use default
  const url = process.argv[2] || 'http://localhost:5173';

  // Check if specific browser was requested
  const requestedBrowser = process.argv[3]?.toLowerCase();
  
  let browserToUse = requestedBrowser;

  if (!browserToUse) {
    console.log('🔍 Detecting default browser...');
    browserToUse = await getDefaultBrowser();
  }

  if (browserToUse && BROWSERS[browserToUse]) {
    console.log(`   Default browser: ${BROWSERS[browserToUse].name}`);
    const success = await launchBrowser(browserToUse, url);
    if (success) {
      process.exit(0);
    }
  }

  // Fallback: try all browsers in order
  console.log('\n🔍 Searching for available browsers...');
  for (const [key, config] of Object.entries(BROWSERS)) {
    const browserPath = findBrowser(config);
    if (browserPath) {
      console.log(`   Found: ${config.name}`);
      const success = await launchBrowser(key, url);
      if (success) {
        process.exit(0);
      }
    }
  }

  console.error('\n❌ No supported browser found!');
  console.error('   Please install Chrome, Edge, or Brave browser.');
  console.error('   Or manually launch your browser with these flags:');
  console.error('   ' + GPU_FLAGS.join(' '));
  process.exit(1);
}

// Run
main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
