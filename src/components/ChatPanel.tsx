import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAI } from '../hooks/useAI';
import { usePreference } from '../hooks/usePreference';
import projectsData from '../data/ui-projects.json';
import type { UIProject } from '../types';

const projects = projectsData as UIProject[];

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  recommendations?: Array<{ id: string; name: string; reason: string; styleFamily: string }>;
}

export default function ChatPanel() {
  const { chat, available, loading, error, endpoint, updateEndpoint, checkAvailability } = useAI();
  const { preference } = usePreference();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [endpointInput, setEndpointInput] = useState(endpoint);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check availability on mount
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    // Build context from preferences
    const context = [
      preference.likedProjectIds.length > 0 ? `已喜欢: ${preference.likedProjectIds.join(', ')}` : '',
      preference.dislikedProjectIds.length > 0 ? `已排除: ${preference.dislikedProjectIds.join(', ')}` : '',
      preference.positiveKeywords.length > 0 ? `正向偏好: ${preference.positiveKeywords.join(', ')}` : '',
      preference.negativeKeywords.length > 0 ? `负向偏好: ${preference.negativeKeywords.join(', ')}` : '',
      preference.lockedDecisions.length > 0 ? `已锁定: ${preference.lockedDecisions.join(', ')}` : '',
    ].filter(Boolean).join('\n');

    // Send project summaries for AI to reference
    const projectSummaries = projects.map(p => ({
      id: p.id,
      name: p.name,
      styleFamilyNameZh: p.styleFamilyNameZh,
      mood: p.mood,
      description: p.description,
    }));

    const response = await chat(userMessage, context, projectSummaries);

    if (response) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.reply,
        recommendations: response.recommendations,
      }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSaveEndpoint = () => {
    updateEndpoint(endpointInput);
    setShowSettings(false);
    setTimeout(() => checkAvailability(), 100);
  };

  // Not configured state
  if (available === false && !endpoint) {
    return (
      <div className="chat-panel chat-panel--empty">
        <div className="chat-panel__header">
          <span className="chat-panel__title">AI 设计对话</span>
        </div>
        <div className="chat-panel__body">
          <p className="chat-panel__hint">
            AI 服务未配置。配置后可以：
          </p>
          <ul className="chat-panel__features">
            <li>用自然语言描述你想要的 UI 方向</li>
            <li>AI 从画廊中推荐最接近的项目</li>
            <li>从选定参考提取主题 DNA</li>
            <li>生成可运行的 HTML 页面</li>
          </ul>
          <p className="chat-panel__hint">
            未配置时，本地搜索和浏览功能仍然可用。
          </p>
          <button className="btn btn-secondary" onClick={() => setShowSettings(true)}>
            配置 AI 服务
          </button>
        </div>
        {showSettings && (
          <div className="chat-panel__settings">
            <label className="chat-panel__label">Worker 地址</label>
            <input
              type="text"
              className="chat-panel__input"
              placeholder="https://your-worker.workers.dev"
              value={endpointInput}
              onChange={e => setEndpointInput(e.target.value)}
            />
            <p className="chat-panel__help">
              部署 Cloudflare Worker 后，将地址填入此处。详见 worker/README.md
            </p>
            <div className="chat-panel__actions">
              <button className="btn btn-primary" onClick={handleSaveEndpoint}>保存</button>
              <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>取消</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="chat-panel">
      <div className="chat-panel__header">
        <span className="chat-panel__title">AI 设计对话</span>
        <span className={`chat-panel__status ${available ? 'chat-panel__status--ok' : 'chat-panel__status--off'}`}>
          {available ? '● 在线' : '○ 离线'}
        </span>
        <button
          className="chat-panel__settings-btn"
          onClick={() => setShowSettings(!showSettings)}
          aria-label="设置"
        >
          ⚙
        </button>
      </div>

      {showSettings && (
        <div className="chat-panel__settings">
          <label className="chat-panel__label">Worker 地址</label>
          <input
            type="text"
            className="chat-panel__input"
            placeholder="https://your-worker.workers.dev"
            value={endpointInput}
            onChange={e => setEndpointInput(e.target.value)}
          />
          <div className="chat-panel__actions">
            <button className="btn btn-primary" onClick={handleSaveEndpoint}>保存</button>
            <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>取消</button>
          </div>
        </div>
      )}

      <div className="chat-panel__body">
        {messages.length === 0 && (
          <div className="chat-panel__welcome">
            <p>描述你想要的 UI 方向，例如：</p>
            <div className="chat-panel__examples">
              <button onClick={() => setInput('金属质感的汽车产品页，但不要太赛博')}>金属质感的汽车产品页</button>
              <button onClick={() => setInput('高端茶品牌，东方但不要古风')}>高端茶品牌，东方但不要古风</button>
              <button onClick={() => setInput('创意机构作品集，暗色，有3D元素')}>创意机构作品集</button>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`chat-message chat-message--${msg.role}`}>
            <div className="chat-message__content">{msg.content}</div>
            {msg.recommendations && msg.recommendations.length > 0 && (
              <div className="chat-recommendations">
                {msg.recommendations.map(rec => (
                  <Link
                    key={rec.id}
                    to={`/detail/${rec.id}`}
                    className="chat-recommendation"
                  >
                    <span className="chat-recommendation__name">{rec.name}</span>
                    <span className="chat-recommendation__style">{rec.styleFamily}</span>
                    <span className="chat-recommendation__reason">{rec.reason}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="chat-message chat-message--assistant">
            <div className="chat-message__content chat-message__loading">
              <span className="chat-dot" /> <span className="chat-dot" /> <span className="chat-dot" />
            </div>
          </div>
        )}

        {error && (
          <div className="chat-message chat-message--error">
            <div className="chat-message__content">{error}</div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-panel__input-area">
        <textarea
          className="chat-panel__textarea"
          placeholder="描述你想要的 UI 方向…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={loading}
        />
        <button
          className="btn btn-primary chat-panel__send"
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >
          发送
        </button>
      </div>
    </div>
  );
}
