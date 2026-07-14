import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSuggestions } from '../utils/search';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length > 0) {
      setSuggestions(getSuggestions(query));
      setShowSuggestions(true);
    } else {
      setSuggestions(getSuggestions(''));
      setShowSuggestions(false);
    }
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (s: string) => {
    setQuery(s);
    navigate(`/?q=${encodeURIComponent(s)}`);
    setShowSuggestions(false);
  };

  return (
    <div className="search-bar" ref={containerRef}>
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          className="search-bar__input"
          placeholder="描述你想要的 UI 方向…  例如：金属质感的汽车产品页"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query.length > 0 && setShowSuggestions(true)}
          aria-label="自然语言搜索"
        />
        <div className="search-bar__icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </form>
      {showSuggestions && suggestions.length > 0 && (
        <div className="search-bar__suggestions">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="search-bar__suggestion"
              onClick={() => handleSuggestionClick(s)}
            >
              <span>{s}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
