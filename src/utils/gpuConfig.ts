/**
 * GPU configuration utilities for WebGPU adapter selection.
 * 
 * This module configures WebGPU to prefer discrete/high-performance GPUs
 * (like NVIDIA, AMD dedicated cards) over integrated graphics.
 */

export interface GPUAdapterInfo {
  vendor: string;
  architecture: string;
  device: string;
  description: string;
  isDiscrete: boolean;
  isFallback: boolean;
}

/**
 * Check if GPU adapter is a discrete GPU (NVIDIA, AMD, etc.)
 */
function isDiscreteGPU(adapter: GPUAdapter): boolean {
  const info = adapter.info;
  if (!info || !info.description) return false;
  
  const desc = info.description.toLowerCase();
  const vendor = info.vendor?.toLowerCase() || '';
  
  // Check for discrete GPU indicators
  const discreteKeywords = ['nvidia', 'geforce', 'rtx', 'gtx', 'radeon', 'amd'];
  const integratedKeywords = ['integrated', 'intel', 'uhd', 'iris'];
  
  // If it explicitly mentions discrete GPU brands, it's discrete
  if (discreteKeywords.some(keyword => desc.includes(keyword) || vendor.includes(keyword))) {
    return true;
  }
  
  // If it mentions integrated, it's not discrete
  if (integratedKeywords.some(keyword => desc.includes(keyword))) {
    return false;
  }
  
  return false;
}

/**
 * Get GPU score - higher score means better GPU for our use case.
 * Prioritizes: 1) Discrete GPUs, 2) NVIDIA/AMD, 3) Non-integrated
 */
function getGPUScore(adapter: GPUAdapter): number {
  const info = adapter.info;
  if (!info) return 0;
  
  const desc = (info.description || '').toLowerCase();
  const vendor = (info.vendor || '').toLowerCase();
  
  let score = 0;
  
  // Highest priority: NVIDIA discrete GPUs
  if (vendor.includes('nvidia') || desc.includes('nvidia') || desc.includes('geforce')) {
    score += 1000;
  }
  
  // High priority: AMD discrete GPUs
  if (vendor.includes('amd') || desc.includes('radeon')) {
    score += 900;
  }
  
  // Bonus for RTX/GTX (high-end NVIDIA)
  if (desc.includes('rtx') || desc.includes('gtx')) {
    score += 500;
  }
  
  // Penalize integrated graphics heavily
  if (desc.includes('integrated') || desc.includes('intel') || desc.includes('uhd') || desc.includes('iris')) {
    score -= 10000;
  }
  
  return score;
}

/**
 * Request WebGPU adapter with aggressive preference for discrete NVIDIA GPU.
 * This function tries multiple strategies to find and select the best GPU.
 * 
 * @returns Adapter info if WebGPU is available, null otherwise
 */
export async function requestHighPerformanceGPU(): Promise<GPUAdapterInfo | null> {
  if (!navigator.gpu) {
    console.warn('WebGPU is not supported in this browser');
    return null;
  }

  try {
    console.log('🔍 Searching for best GPU adapter...');
    
    // Strategy 1: Try to get all adapters and pick the best one
    const allAdapters: Array<{ adapter: GPUAdapter; score: number; info: GPUAdapterInfo }> = [];
    
    // Try different power preferences
    const preferences: Array<GPUPowerPreference | undefined> = [
      'high-performance',
      'low-power',
      undefined, // default
    ];
    
    for (const powerPreference of preferences) {
      try {
        const adapter = await navigator.gpu.requestAdapter(
          powerPreference ? { powerPreference } : undefined
        );
        
        if (adapter) {
          const info = adapter.info || ({} as GPUAdapterInfo);
          const adapterInfo: GPUAdapterInfo = {
            vendor: info.vendor || 'Unknown',
            architecture: info.architecture || 'Unknown',
            device: info.device || 'Unknown',
            description: info.description || 'Unknown',
            isDiscrete: isDiscreteGPU(adapter),
            isFallback: false,
          };
          
          const score = getGPUScore(adapter);
          
          // Check if we already have this adapter (same description)
          const isDuplicate = allAdapters.some(
            a => a.info.description === adapterInfo.description
          );
          
          if (!isDuplicate) {
            allAdapters.push({ adapter, score, info: adapterInfo });
            console.log(`   Found GPU (${powerPreference || 'default'}): ${adapterInfo.description} (score: ${score})`);
          }
        }
      } catch (error) {
        console.warn(`   Failed to get adapter for ${powerPreference}:`, error);
      }
    }
    
    if (allAdapters.length === 0) {
      console.error('❌ No WebGPU adapters found');
      return null;
    }
    
    // Sort by score (highest first)
    allAdapters.sort((a, b) => b.score - a.score);
    
    // Select the best adapter (highest score)
    const best = allAdapters[0];
    
    console.log('✅ Selected GPU:', {
      description: best.info.description,
      vendor: best.info.vendor,
      isDiscrete: best.info.isDiscrete,
      score: best.score,
      type: best.info.isDiscrete ? '🎮 Discrete GPU' : '💻 Integrated GPU',
    });
    
    // Warn if we selected integrated graphics
    if (!best.info.isDiscrete) {
      console.warn('⚠️  WARNING: Selected GPU is integrated graphics, not discrete GPU!');
      console.warn('   This may indicate that your NVIDIA GPU is not available to WebGPU.');
      console.warn('   Check: 1) GPU drivers updated, 2) Hardware acceleration enabled in browser');
    }
    
    // Store adapter for SDK to use
    // @ts-expect-error - Storing adapter for SDK access
    window.__preferredGPUAdapter = best.adapter;

    return best.info;
  } catch (error) {
    console.error('Failed to request high-performance GPU:', error);
    return null;
  }
}

/**
 * Get all available GPU adapters for debugging.
 * Useful to see what GPUs are available on the system.
 */
export async function listAllGPUAdapters(): Promise<GPUAdapterInfo[]> {
  if (!navigator.gpu) {
    return [];
  }

  const adapters: GPUAdapterInfo[] = [];
  const seen = new Set<string>();

  // Try different power preferences to find all adapters
  const preferences: Array<GPUPowerPreference | undefined> = [
    'high-performance',
    'low-power', 
    undefined,
  ];

  for (const powerPreference of preferences) {
    try {
      const adapter = await navigator.gpu.requestAdapter(
        powerPreference ? { powerPreference } : undefined
      );
      
      if (adapter) {
        const info = adapter.info || ({} as GPUAdapterInfo);
        const desc = info.description || 'Unknown';
        
        // Avoid duplicates
        if (!seen.has(desc)) {
          seen.add(desc);
          adapters.push({
            vendor: info.vendor || 'Unknown',
            architecture: info.architecture || 'Unknown',
            device: info.device || 'Unknown',
            description: desc,
            isDiscrete: isDiscreteGPU(adapter),
            isFallback: false,
          });
        }
      }
    } catch (error) {
      console.warn(`Failed to get adapter for ${powerPreference}:`, error);
    }
  }

  return adapters;
}

/**
 * Log detailed GPU information to console for debugging.
 */
export async function logGPUInfo(): Promise<void> {
  console.log('🔍 Detecting available GPUs...');
  
  const adapters = await listAllGPUAdapters();
  
  if (adapters.length === 0) {
    console.log('❌ No GPU adapters found');
    return;
  }

  console.log(`✅ Found ${adapters.length} GPU adapter(s):`);
  adapters.forEach((adapter, index) => {
    console.log(`\nGPU ${index + 1}:`, {
      vendor: adapter.vendor,
      device: adapter.device,
      description: adapter.description,
      type: adapter.isDiscrete ? '🎮 Discrete GPU' : '💻 Integrated GPU',
      isFallback: adapter.isFallback,
    });
  });
}

/**
 * Get troubleshooting steps if discrete GPU is not detected.
 */
export function getGPUTroubleshootingSteps(): string[] {
  return [
    '1. Update your GPU drivers to the latest version',
    '2. Enable Hardware Acceleration in your browser:',
    '   - Chrome: chrome://settings/system → Enable "Use hardware acceleration"',
    '   - Edge: edge://settings/system → Enable "Use hardware acceleration"',
    '3. Set your browser to use High Performance GPU (Windows):',
    '   - Windows Settings → System → Display → Graphics Settings',
    '   - Click "Browse" and add your browser executable:',
    '     * Chrome: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    '     * Edge: C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '   - Click "Options" and select "High performance"',
    '4. Enable WebGPU flags (if needed):',
    '   - Chrome: chrome://flags/#enable-unsafe-webgpu',
    '   - Set "Unsafe WebGPU" to Enabled',
    '5. Restart your browser completely after making changes',
    '6. Check NVIDIA Control Panel:',
    '   - Right-click desktop → NVIDIA Control Panel',
    '   - Manage 3D Settings → Program Settings',
    '   - Add your browser and set "Preferred graphics processor" to "High-performance NVIDIA processor"',
  ];
}
