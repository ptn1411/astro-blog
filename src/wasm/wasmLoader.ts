/**
 * wasmLoader.ts — Fixed: pass explicit .wasm URL to init()
 *
 * wasm-pack --target web generates glue code that uses import.meta.url
 * to resolve wasm_security_bg.wasm. When loaded via blob URL, import.meta.url
 * is the blob URL (not the actual origin), so the .wasm fetch fails.
 *
 * Fix: call init('/wasm/wasm_security_bg.wasm') explicitly — this is the
 * recommended way when the WASM file is in a static public folder.
 */

export interface WasmSecurityModule {
  generate_app_token(appId: string): string;
  verify_hmac_token(secret: string, appId: string, token: string): string;
  hash_device_signals(signalsJson: string, salt: string): string;
  hash_with_salt(value: string, salt: string): string;
  generate_nonce(): string;
  token_ttl_ms(): number;
}

let _wasm: WasmSecurityModule | null = null;
let _loading: Promise<WasmSecurityModule | null> | null = null;
let _available: boolean | null = null;

export async function loadWasm(): Promise<WasmSecurityModule | null> {
  if (_wasm) return _wasm;
  if (typeof window === 'undefined') return null;
  if (_available === false) return null;
  if (_loading) return _loading;

  _loading = (async (): Promise<WasmSecurityModule | null> => {
    try {
      // Use new Function to bypass TypeScript module resolution for /public/ files
      // Pass the explicit .wasm URL so import.meta.url issue is avoided
      const module = await (new Function('return import("/wasm/wasm_security.js")')()) as Record<string, unknown>;

      const init = module['default'] as ((wasmUrl: string) => Promise<unknown>) | undefined;
      if (typeof init === 'function') {
        // Pass explicit path so the glue code doesn't rely on import.meta.url
        await init('/wasm/wasm_security_bg.wasm');
      }

      _wasm = module as unknown as WasmSecurityModule;
      _available = true;
      console.log('[wasmLoader] ✅ WASM loaded');
      return _wasm;
    } catch (err) {
      console.warn('[wasmLoader] WASM unavailable, JS fallback active:', err);
      _available = false;
      return null;
    }
  })();

  return _loading;
}

export function isWasmReady(): boolean {
  return _wasm !== null;
}
