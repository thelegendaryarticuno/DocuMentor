/**
 * RunAnywhere SDK initialization and model catalog.
 *
 * This module:
 * 1. Initializes the core SDK (TypeScript-only, no WASM)
 * 2. Registers the LlamaCPP backend (loads LLM/VLM WASM)
 * 3. Registers the ONNX backend (sherpa-onnx — STT/TTS/VAD)
 * 4. Registers the model catalog and wires up VLM worker
 *
 * Import this module once at app startup.
 */

import {
  RunAnywhere,
  SDKEnvironment,
  ModelManager,
  ModelCategory,
  LLMFramework,
  type CompactModelDef,
} from '@runanywhere/web';

import { LlamaCPP, VLMWorkerBridge } from '@runanywhere/web-llamacpp';
import { ONNX } from '@runanywhere/web-onnx';
import { 
  requestHighPerformanceGPU, 
  logGPUInfo, 
  getGPUTroubleshootingSteps 
} from './utils/gpuConfig';

// Vite bundles the worker as a standalone JS chunk and returns its URL.
// @ts-ignore — Vite-specific ?worker&url query
import vlmWorkerUrl from './workers/vlm-worker?worker&url';

// ---------------------------------------------------------------------------
// Model catalog
// ---------------------------------------------------------------------------

const MODELS: CompactModelDef[] = [
  // LLM — Liquid AI LFM2 350M (small + fast for chat)
  {
    id: 'lfm2-350m-q4_k_m',
    name: 'LFM2 350M Q4_K_M',
    repo: 'LiquidAI/LFM2-350M-GGUF',
    files: ['LFM2-350M-Q4_K_M.gguf'],
    framework: LLMFramework.LlamaCpp,
    modality: ModelCategory.Language,
    memoryRequirement: 250_000_000,
  },
  // LLM — Liquid AI LFM2 1.2B Tool (optimized for tool calling & function calling)
  {
    id: 'lfm2-1.2b-tool-q4_k_m',
    name: 'LFM2 1.2B Tool Q4_K_M',
    repo: 'LiquidAI/LFM2-1.2B-Tool-GGUF',
    files: ['LFM2-1.2B-Tool-Q4_K_M.gguf'],
    framework: LLMFramework.LlamaCpp,
    modality: ModelCategory.Language,
    memoryRequirement: 800_000_000,
  },
  // VLM — Liquid AI LFM2-VL 450M (vision + language)
  {
    id: 'lfm2-vl-450m-q4_0',
    name: 'LFM2-VL 450M Q4_0',
    repo: 'runanywhere/LFM2-VL-450M-GGUF',
    files: ['LFM2-VL-450M-Q4_0.gguf', 'mmproj-LFM2-VL-450M-Q8_0.gguf'],
    framework: LLMFramework.LlamaCpp,
    modality: ModelCategory.Multimodal,
    memoryRequirement: 500_000_000,
  },
  // STT (sherpa-onnx archive)
  {
    id: 'sherpa-onnx-whisper-tiny.en',
    name: 'Whisper Tiny English (ONNX)',
    url: 'https://huggingface.co/runanywhere/sherpa-onnx-whisper-tiny.en/resolve/main/sherpa-onnx-whisper-tiny.en.tar.gz',
    framework: LLMFramework.ONNX,
    modality: ModelCategory.SpeechRecognition,
    memoryRequirement: 105_000_000,
    artifactType: 'archive' as const,
  },
  // TTS (sherpa-onnx archive)
  {
    id: 'vits-piper-en_US-lessac-medium',
    name: 'Piper TTS US English (Lessac)',
    url: 'https://huggingface.co/runanywhere/vits-piper-en_US-lessac-medium/resolve/main/vits-piper-en_US-lessac-medium.tar.gz',
    framework: LLMFramework.ONNX,
    modality: ModelCategory.SpeechSynthesis,
    memoryRequirement: 65_000_000,
    artifactType: 'archive' as const,
  },
  // VAD (single ONNX file)
  {
    id: 'silero-vad-v5',
    name: 'Silero VAD v5',
    url: 'https://huggingface.co/runanywhere/silero-vad-v5/resolve/main/silero_vad.onnx',
    files: ['silero_vad.onnx'],
    framework: LLMFramework.ONNX,
    modality: ModelCategory.Audio,
    memoryRequirement: 5_000_000,
  },
];

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

let _initPromise: Promise<void> | null = null;
let _selectedGPUInfo: Awaited<ReturnType<typeof requestHighPerformanceGPU>> | null = null;

/** Initialize the RunAnywhere SDK. Safe to call multiple times. */
export async function initSDK(): Promise<void> {
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    // Step 0: Request high-performance GPU (NVIDIA, AMD discrete) before SDK init
    // This ensures WebGPU uses the dedicated GPU instead of integrated graphics
    console.log('🎮 Requesting high-performance GPU...');
    await logGPUInfo(); // Log all available GPUs for debugging
    _selectedGPUInfo = await requestHighPerformanceGPU();
    
    if (_selectedGPUInfo) {
      if (_selectedGPUInfo.isDiscrete) {
        console.log('✅ Selected GPU:', _selectedGPUInfo.description);
        console.log('   Type: 🎮 Discrete GPU');
        console.log('   Vendor:', _selectedGPUInfo.vendor);
      } else {
        console.error('⚠️  WARNING: Using Integrated Graphics instead of NVIDIA GPU!');
        console.error('   Selected:', _selectedGPUInfo.description);
        console.error('   This will result in slower performance and limited features.');
        console.error('\n📋 To use your NVIDIA GPU, follow these steps:');
        getGPUTroubleshootingSteps().forEach(step => console.error('   ' + step));
        console.error('\n   After making changes, restart your browser and reload the page.\n');
      }
    } else {
      console.warn('⚠️  Could not select high-performance GPU, will use default');
    }

    // Step 1: Initialize core SDK (TypeScript-only, no WASM)
    await RunAnywhere.initialize({
      environment: SDKEnvironment.Development,
      debug: true,
    });

    // Step 2: Register backends with GPU acceleration (loads WASM automatically)
    // LlamaCPP will use the GPU adapter we requested above (high-performance preference)
    await LlamaCPP.register({
      // 'auto' will detect WebGPU support and use GPU when available for faster inference
      // With our high-performance GPU request above, this should prefer NVIDIA over integrated
      acceleration: 'auto',
    });
    await ONNX.register();

    // Step 3: Register model catalog
    RunAnywhere.registerModels(MODELS);

    // Step 4: Wire up VLM worker
    VLMWorkerBridge.shared.workerUrl = vlmWorkerUrl;
    RunAnywhere.setVLMLoader({
      get isInitialized() { return VLMWorkerBridge.shared.isInitialized; },
      init: () => VLMWorkerBridge.shared.init(),
      loadModel: (params) => VLMWorkerBridge.shared.loadModel(params),
      unloadModel: () => VLMWorkerBridge.shared.unloadModel(),
    });
  })();

  return _initPromise;
}

/** Get acceleration mode after init. */
export function getAccelerationMode(): string | null {
  return LlamaCPP.isRegistered ? LlamaCPP.accelerationMode : null;
}

/** Check if GPU acceleration is currently active. */
export function isGPUAccelerationActive(): boolean {
  const mode = getAccelerationMode();
  return mode?.toLowerCase().includes('webgpu') ?? false;
}

/** Get detailed hardware acceleration info including GPU details. */
export function getHardwareAccelerationInfo(): {
  isActive: boolean;
  mode: string | null;
  description: string;
  gpuInfo: {
    vendor: string;
    device: string;
    description: string;
    isDiscrete: boolean;
  } | null;
} {
  const mode = getAccelerationMode();
  const isActive = mode?.toLowerCase().includes('webgpu') ?? false;
  
  let description = isActive
    ? 'GPU acceleration is active. Models will use your device\'s GPU for faster inference.'
    : mode
    ? `Running on ${mode}. GPU acceleration is not active. Models will run on CPU/WebAssembly.`
    : 'Hardware acceleration status unknown. SDK may not be initialized yet.';
  
  // Add GPU details if available
  if (_selectedGPUInfo && isActive) {
    const gpuType = _selectedGPUInfo.isDiscrete ? 'Discrete GPU' : 'Integrated GPU';
    description = `GPU acceleration active using ${_selectedGPUInfo.description} (${gpuType}, ${_selectedGPUInfo.vendor})`;
  }
  
  return {
    isActive,
    mode,
    description,
    gpuInfo: _selectedGPUInfo ? {
      vendor: _selectedGPUInfo.vendor,
      device: _selectedGPUInfo.device,
      description: _selectedGPUInfo.description,
      isDiscrete: _selectedGPUInfo.isDiscrete,
    } : null,
  };
}

// Re-export for convenience
export { RunAnywhere, ModelManager, ModelCategory, VLMWorkerBridge };
