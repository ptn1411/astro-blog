/**
 * AIKeyStatus - Modal hiển thị trạng thái API Keys
 * 
 * Hiển thị:
 * - Số keys active/total cho mỗi provider
 * - Chi tiết trạng thái từng key (masked)
 * - Thời gian cooldown còn lại
 */

import { useState, useEffect, useCallback } from 'react';
import { getGitHubToken, AI_CONFIG } from '../../config';

interface KeyInfo {
  keyMasked: string;
  isActive: boolean;
  failCount: number;
  lastError?: string;
  lastErrorAt?: number;
  disabledUntil?: number;
}

interface ProviderStatus {
  provider: string;
  keys: KeyInfo[];
}

interface ProvidersInfo {
  openrouter: boolean;
  gemini: boolean;
  primary: string;
  keys: {
    openrouter: { total: number; active: number };
    gemini: { total: number; active: number };
  };
}

interface KeysStatusResponse {
  openrouter: ProviderStatus;
  gemini: ProviderStatus;
}

export interface AIKeyStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  refreshInterval?: number;
}

export function AIKeyStatusModal({
  isOpen,
  onClose,
  refreshInterval = 10000,
}: AIKeyStatusModalProps) {
  const [providers, setProviders] = useState<ProvidersInfo | null>(null);
  const [keysStatus, setKeysStatus] = useState<KeysStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = AI_CONFIG.workerUrl;

  const fetchStatus = useCallback(async () => {
    try {
      const providersRes = await fetch(`${baseUrl}/api/copilotkit/providers`);
      if (providersRes.ok) {
        const data = await providersRes.json();
        setProviders(data);
      }

      const token = getGitHubToken();
      if (token) {
        const keysRes = await fetch(`${baseUrl}/api/copilotkit/keys/status`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (keysRes.ok) {
          const data = await keysRes.json();
          setKeysStatus(data);
        }
      }
      setError(null);
    } catch {
      setError('Không thể kết nối server');
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    if (!isOpen) return;
    fetchStatus();
    if (refreshInterval > 0) {
      const interval = setInterval(fetchStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchStatus, refreshInterval, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <KeyIcon size={20} className="text-blue-400" />
            <h2 className="text-lg font-semibold text-white">API Keys Status</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size={24} />
              <span className="ml-3 text-slate-400">Đang tải...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-400">
              <ErrorIcon size={20} />
              <span className="ml-2">{error}</span>
            </div>
          ) : providers ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4 p-4 bg-slate-900/50 rounded-lg">
                <ProviderBadge name="OpenRouter" active={providers.keys.openrouter.active} total={providers.keys.openrouter.total} isPrimary={providers.primary === 'openrouter'} />
                <ProviderBadge name="Gemini" active={providers.keys.gemini.active} total={providers.keys.gemini.total} isPrimary={providers.primary === 'gemini'} />
              </div>
              <ProviderSection name="OpenRouter" active={providers.keys.openrouter.active} total={providers.keys.openrouter.total} isPrimary={providers.primary === 'openrouter'} keys={keysStatus?.openrouter.keys} />
              <ProviderSection name="Gemini" active={providers.keys.gemini.active} total={providers.keys.gemini.total} isPrimary={providers.primary === 'gemini'} keys={keysStatus?.gemini.keys} />
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700 bg-slate-800/50">
          <span className="text-xs text-slate-500">Auto-refresh: {refreshInterval / 1000}s</span>
          <button onClick={fetchStatus} className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
            <RefreshIcon size={14} /> Làm mới
          </button>
        </div>
      </div>
    </div>
  );
}

function ProviderBadge({ name, active, total, isPrimary }: { name: string; active: number; total: number; isPrimary: boolean }) {
  const allActive = active === total && total > 0;
  const someActive = active > 0 && active < total;
  const noneActive = active === 0;
  const bgColor = allActive ? 'bg-green-500/20 text-green-400 border-green-500/30'
    : someActive ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    : noneActive && total > 0 ? 'bg-red-500/20 text-red-400 border-red-500/30'
    : 'bg-gray-500/20 text-gray-400 border-gray-500/30';

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${bgColor}`}>
      {isPrimary && <StarIcon size={14} />}
      <span className="text-sm font-medium">{name}</span>
      <span className="text-sm font-mono">{active}/{total}</span>
    </div>
  );
}

function ProviderSection({ name, active, total, isPrimary, keys }: { name: string; active: number; total: number; isPrimary: boolean; keys?: KeyInfo[] }) {
  return (
    <div className="bg-slate-900/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{name}</span>
          {isPrimary && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">Primary</span>}
        </div>
        <span className={`text-sm font-mono ${active > 0 ? 'text-green-400' : 'text-red-400'}`}>{active}/{total} active</span>
      </div>
      {keys && keys.length > 0 ? (
        <div className="space-y-2">{keys.map((key, idx) => <KeyRow key={idx} keyInfo={key} index={idx + 1} />)}</div>
      ) : total > 0 ? (
        <p className="text-xs text-slate-500 italic">Đăng nhập để xem chi tiết keys</p>
      ) : (
        <p className="text-xs text-slate-500 italic">Chưa cấu hình API key</p>
      )}
    </div>
  );
}

function KeyRow({ keyInfo, index }: { keyInfo: KeyInfo; index: number }) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!keyInfo.disabledUntil) { setTimeLeft(null); return; }
    const updateTimeLeft = () => {
      const remaining = keyInfo.disabledUntil! - Date.now();
      if (remaining <= 0) { setTimeLeft(null); return; }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    };
    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [keyInfo.disabledUntil]);

  return (
    <div className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm ${keyInfo.isActive ? 'bg-slate-800/50' : 'bg-red-900/20'}`}>
      <div className="flex items-center gap-3">
        <span className="text-slate-500 text-xs">#{index}</span>
        <code className="text-slate-300 font-mono text-xs">{keyInfo.keyMasked}</code>
      </div>
      <div className="flex items-center gap-3">
        {keyInfo.failCount > 0 && <span className="text-yellow-400 text-xs" title={keyInfo.lastError}>{keyInfo.failCount} fails</span>}
        {timeLeft && <span className="text-orange-400 text-xs flex items-center gap-1"><ClockIcon size={12} />{timeLeft}</span>}
        <span className={`w-2 h-2 rounded-full ${keyInfo.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
      </div>
    </div>
  );
}

// Header Button
export interface AIKeyStatusButtonProps {
  onClick: () => void;
  className?: string;
}

export function AIKeyStatusButton({ onClick, className = '' }: AIKeyStatusButtonProps) {
  const [status, setStatus] = useState<{ active: number; total: number } | null>(null);
  const baseUrl = AI_CONFIG.workerUrl;

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/copilotkit/providers`);
        if (res.ok) {
          const data = await res.json() as ProvidersInfo;
          setStatus({ active: data.keys.openrouter.active + data.keys.gemini.active, total: data.keys.openrouter.total + data.keys.gemini.total });
        }
      } catch { /* ignore */ }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [baseUrl]);

  const allActive = status && status.active === status.total && status.total > 0;
  const someActive = status && status.active > 0 && status.active < status.total;

  return (
    <button onClick={onClick} className={`p-1.5 rounded transition-colors relative ${className} ${allActive ? 'text-green-400 hover:bg-green-500/20' : someActive ? 'text-yellow-400 hover:bg-yellow-500/20' : 'text-slate-300 hover:bg-slate-600 hover:text-white'}`} title="API Keys Status">
      <KeyIcon size={16} />
      {status && <span className={`absolute -top-1 -right-1 text-[10px] font-mono px-1 rounded ${allActive ? 'bg-green-500 text-white' : someActive ? 'bg-yellow-500 text-black' : 'bg-slate-600 text-white'}`}>{status.active}</span>}
    </button>
  );
}

// Icons
function LoadingSpinner({ size = 16 }: { size?: number }) {
  return <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" /></svg>;
}
function ErrorIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
}
function KeyIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>;
}
function CloseIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
function StarIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
}
function RefreshIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>;
}
function ClockIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}

export const AIKeyStatus = AIKeyStatusModal;
export type AIKeyStatusProps = AIKeyStatusModalProps;
export default AIKeyStatusModal;
