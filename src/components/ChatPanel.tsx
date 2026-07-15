import { useEffect, useRef, useState } from 'react';
import { ArrowRight, GearSix } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useAI } from '../hooks/useAI';
import { usePreference } from '../hooks/usePreference';
import { search } from '../utils/search';
import { isVerifiedProject } from '../utils/projectQuality';

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

  useEffect(() => { checkAvailability(); }, [checkAvailability]);
  useEffect(() => {
    if (messages.length) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const localAnswer = (message: string): ChatMessage => {
    const state = search(message);
    const excluded = new Set(preference.dislikedProjectIds);
    const eligible = state.results.filter(result => isVerifiedProject(result.project) && !excluded.has(result.project.id));
    const topScore = eligible[0]?.score || 0;
    const matches = eligible
      .filter(result => result.score >= Math.max(10, topScore * .35))
      .slice(0, 4);
    return {
      role: 'assistant',
      content: matches.length
        ? `${state.explanation} 先比较下面 ${matches.length} 个真实桌面快照；点进去可拿到截图驱动的复刻包。`
        : '验收库里还没有足够接近的方向。我没有用低质量截图凑数；可以换成行业、材质、明暗或“不要什么”再描述一次。',
      recommendations: matches.map(result => ({
        id: result.project.id,
        name: result.project.name,
        reason: result.reasons.slice(0, 2).join('；') || result.project.description,
        styleFamily: result.project.styleFamilyNameZh,
      })),
    };
  };

  const handleSend = async () => {
    const userMessage = input.trim();
    if (!userMessage || loading) return;
    setInput('');
    setMessages(previous => [...previous, { role: 'user', content: userMessage }]);

    if (available !== true) {
      setMessages(previous => [...previous, localAnswer(userMessage)]);
      return;
    }

    const local = search(userMessage).results.filter(result => isVerifiedProject(result.project)).slice(0, 8);
    const context = [
      preference.likedProjectIds.length ? `已喜欢: ${preference.likedProjectIds.join(', ')}` : '',
      preference.dislikedProjectIds.length ? `已排除: ${preference.dislikedProjectIds.join(', ')}` : '',
      `最近对话: ${messages.slice(-4).map(item => `${item.role}: ${item.content}`).join(' | ')}`,
    ].filter(Boolean).join('\n');
    const response = await chat(userMessage, context, local.map(({ project }) => ({
      id: project.id, name: project.name, styleFamilyNameZh: project.styleFamilyNameZh,
      mood: project.mood, description: project.description,
    })));
    setMessages(previous => [...previous, response ? {
      role: 'assistant', content: response.reply, recommendations: response.recommendations,
    } : localAnswer(userMessage)]);
  };

  const saveEndpoint = () => {
    updateEndpoint(endpointInput);
    setShowSettings(false);
    window.setTimeout(checkAvailability, 100);
  };

  return (
    <div className="chat-panel">
      <div className="chat-panel__header">
        <span className="chat-panel__title">设计方向助手</span>
        <span className={`chat-panel__status ${available ? 'chat-panel__status--ok' : ''}`}>
          {available ? '云端增强已连接' : '本地匹配可用'}
        </span>
        <button className="chat-panel__settings-btn" type="button" onClick={() => setShowSettings(value => !value)} aria-label="AI 设置"><GearSix size={18} /></button>
      </div>

      {showSettings && <div className="chat-panel__settings">
        <label className="chat-panel__label" htmlFor="ai-endpoint">可选：云端 AI Worker 地址</label>
        <input id="ai-endpoint" className="chat-panel__input" placeholder="https://your-worker.workers.dev" value={endpointInput} onChange={event => setEndpointInput(event.target.value)} />
        <p className="chat-panel__help">留空也能本地选图。这里只为接入你自己的云端对话服务。</p>
        <div className="chat-panel__actions"><button className="btn btn-primary" type="button" onClick={saveEndpoint}>保存</button><button className="btn btn-secondary" type="button" onClick={() => setShowSettings(false)}>取消</button></div>
      </div>}

      <div className="chat-panel__body">
        {!messages.length && <div className="chat-panel__welcome">
          <p>描述行业、材质、气质，或者明确说“不要什么”：</p>
          <div className="chat-panel__examples">
            {['金属质感的汽车产品页，但不要太赛博', '文化机构，像展览目录，有大量留白', '专业的 AI 产品，但不要紫色渐变'].map(example => <button type="button" key={example} onClick={() => setInput(example)}>{example}</button>)}
          </div>
        </div>}
        {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`chat-message chat-message--${message.role}`}>
          <div className="chat-message__content">{message.content}</div>
          {!!message.recommendations?.length && <div className="chat-recommendations">{message.recommendations.map(item => <Link key={item.id} to={`/detail/${item.id}`} className="chat-recommendation"><span><strong>{item.name}</strong><small>{item.styleFamily}</small></span><span>{item.reason}</span><ArrowRight size={16} /></Link>)}</div>}
        </div>)}
        {loading && <div className="chat-message chat-message--assistant"><div className="chat-message__content">正在结合偏好收敛方向…</div></div>}
        {error && endpoint && <div className="chat-inline-note">云端连接失败，已自动回到本地匹配。</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-panel__input-area">
        <textarea className="chat-panel__textarea" placeholder="例如：黑白摄影的建筑事务所，不要大字滚动…" value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSend(); } }} rows={2} disabled={loading} />
        <button className="btn btn-primary chat-panel__send" type="button" onClick={handleSend} disabled={loading || !input.trim()}>匹配 UI <ArrowRight size={16} /></button>
      </div>
    </div>
  );
}
