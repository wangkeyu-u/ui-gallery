import { useState, useCallback, useRef } from 'react';

// ============================================================
// AI Hook — detects Worker availability and proxies LLM calls
// Falls back gracefully when AI is not configured
// ============================================================

const AI_ENDPOINT_KEY = 'ui-gallery-ai-endpoint';

function getDefaultEndpoint(): string {
  // Try localStorage first, then default to same-origin
  const saved = localStorage.getItem(AI_ENDPOINT_KEY);
  if (saved) return saved;
  // Default: assume Worker is deployed at same origin /api/*
  // User can change this in settings
  return '';
}

export interface ChatRecommendation {
  id: string;
  name: string;
  reason: string;
  styleFamily: string;
}

export interface ChatResponse {
  reply: string;
  recommendations?: ChatRecommendation[];
  actions?: string[];
}

export function useAI() {
  const [endpoint, setEndpoint] = useState(getDefaultEndpoint());
  const [available, setAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Check if AI service is available
  const checkAvailability = useCallback(async () => {
    if (!endpoint) {
      setAvailable(false);
      return false;
    }
    try {
      const res = await fetch(`${endpoint}/api/health`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        setAvailable(data.aiEnabled === true);
        return data.aiEnabled === true;
      }
      setAvailable(false);
      return false;
    } catch {
      setAvailable(false);
      return false;
    }
  }, [endpoint]);

  // Update endpoint
  const updateEndpoint = useCallback((url: string) => {
    setEndpoint(url);
    localStorage.setItem(AI_ENDPOINT_KEY, url);
    setAvailable(null);
  }, []);

  // Chat with AI
  const chat = useCallback(async (
    message: string,
    context?: string,
    projects?: Array<{ id: string; name: string; styleFamilyNameZh: string; mood: string[]; description: string }>
  ): Promise<ChatResponse | null> => {
    if (!endpoint) {
      setError('AI 服务未配置。请在设置中填写 Worker 地址。');
      return null;
    }

    setLoading(true);
    setError(null);

    // Cancel previous request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${endpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context, projects }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'AI request failed');
      }

      setAvailable(true);
      return data.data as ChatResponse;
    } catch (err: any) {
      if (err.name === 'AbortError') return null;
      setError(err.message);
      setAvailable(false);
      return null;
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  // Generate theme DNA from a reference
  const generateTheme = useCallback(async (
    referenceId: string,
    referencePrompt: string,
    themeName?: string
  ): Promise<any | null> => {
    if (!endpoint) {
      setError('AI 服务未配置。');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${endpoint}/api/theme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `从以下参考 UI 提取主题 DNA${themeName ? `，主题名称：${themeName}` : ''}。\n\n参考 ID: ${referenceId}\n参考提示词:\n${referencePrompt}`,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  // Generate runnable HTML from theme
  const generateCode = useCallback(async (
    themeDNA: any,
    contentType: string,
    content: string
  ): Promise<{ html: string; notes: string } | null> => {
    if (!endpoint) {
      setError('AI 服务未配置。');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `根据以下主题 DNA 生成 ${contentType} 页面。\n\n内容:\n${content}\n\n主题 DNA:\n${JSON.stringify(themeDNA, null, 2)}`,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  return {
    endpoint,
    available,
    loading,
    error,
    checkAvailability,
    updateEndpoint,
    chat,
    generateTheme,
    generateCode,
  };
}
