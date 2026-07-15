import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MagnifyingGlass } from '@phosphor-icons/react';
import { getSuggestions } from '../utils/search';

interface SearchBarProps {
  initialValue?: string;
}

export default function SearchBar({ initialValue = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => setQuery(initialValue), [initialValue]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const submit = (value: string) => {
    const next = value.trim();
    if (!next) return;
    navigate(`/?q=${encodeURIComponent(next)}`);
    setOpen(false);
  };

  const suggestions = getSuggestions(query);

  return (
    <div className="search-box" ref={containerRef}>
      <form className="search-box__form" onSubmit={event => { event.preventDefault(); submit(query); }}>
        <MagnifyingGlass size={20} weight="regular" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={event => { setQuery(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="比如：金属质感的汽车产品页，但不要太赛博"
          aria-label="描述你想找的 UI"
          aria-controls={listId}
          aria-expanded={open && suggestions.length > 0}
        />
        <button type="submit" className="icon-button icon-button--dark" aria-label="开始查找">
          <ArrowRight size={19} weight="bold" aria-hidden="true" />
        </button>
      </form>
      {open && suggestions.length > 0 && (
        <div className="search-box__suggestions" id={listId} role="listbox" aria-label="搜索建议">
          {suggestions.slice(0, 6).map(suggestion => (
            <button
              type="button"
              role="option"
              aria-selected="false"
              key={suggestion}
              onClick={() => { setQuery(suggestion); submit(suggestion); }}
            >
              {suggestion}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
