import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { ReservoirItem } from '../types';

// The reservoir lives only in this browser. No accounts, no server storage:
// it is sent along with each generate request instead.
const STORAGE_KEY = 'epoche_reservoir';
const MAX_TEXT = 2000;

interface ReservoirContextType {
  items: ReservoirItem[];
  addItem: (text: string, sourceUrl?: string, sourceTitle?: string) => void;
  removeItem: (id: string) => void;
  importItems: (incoming: unknown) => number;
}

const ReservoirContext = createContext<ReservoirContextType | undefined>(undefined);

function load(): ReservoirItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(isItem) : [];
  } catch {
    return [];
  }
}

function isItem(value: unknown): value is ReservoirItem {
  const v = value as ReservoirItem;
  return !!v && typeof v.id === 'string' && typeof v.text === 'string' && v.text.trim() !== '';
}

function normalize(value: unknown): ReservoirItem | null {
  const v = value as Partial<ReservoirItem>;
  if (!v || typeof v.text !== 'string' || !v.text.trim()) return null;
  return {
    id: typeof v.id === 'string' && v.id ? v.id : crypto.randomUUID(),
    text: v.text.trim().slice(0, MAX_TEXT),
    // Only http(s): imported files or pages could otherwise smuggle javascript: links
    source_url: typeof v.source_url === 'string' && /^https?:\/\//i.test(v.source_url) ? v.source_url : undefined,
    source_title: typeof v.source_title === 'string' ? v.source_title : undefined,
    created_at: typeof v.created_at === 'string' ? v.created_at : new Date().toISOString(),
  };
}

export function ReservoirProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ReservoirItem[]>(load);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or blocked: keep working in memory
    }
  }, [items]);

  // Merge new items, skipping ids or texts we already hold. Returns how many were added.
  const merge = useCallback((incoming: unknown[]): number => {
    const fresh = incoming.map(normalize).filter((i): i is ReservoirItem => i !== null);
    const isNew = (list: ReservoirItem[]) => {
      const ids = new Set(list.map(i => i.id));
      const texts = new Set(list.map(i => i.text));
      return fresh.filter(i => !ids.has(i.id) && !texts.has(i.text));
    };
    const added = isNew(itemsRef.current).length;
    setItems(prev => {
      const toAdd = isNew(prev);
      return toAdd.length ? [...toAdd, ...prev] : prev;
    });
    return added;
  }, []);

  const addItem = useCallback((text: string, sourceUrl?: string, sourceTitle?: string) => {
    merge([{ text, source_url: sourceUrl, source_title: sourceTitle }]);
  }, [merge]);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const importItems = useCallback((incoming: unknown) => {
    return Array.isArray(incoming) ? merge(incoming) : 0;
  }, [merge]);

  // Bridge from the Chrome extension: its content script posts captured items
  // into this page, we store them and acknowledge so it can clear its queue.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const data = event.data;
      if (data?.type !== 'epoche:reservoir-add' || !Array.isArray(data.items)) return;
      merge(data.items);
      const ids = data.items.map((i: { id?: string }) => i?.id).filter(Boolean);
      window.postMessage({ type: 'epoche:reservoir-ack', ids }, window.location.origin);
    };
    window.addEventListener('message', onMessage);
    // Tell the extension (if installed) that the page is ready to receive
    window.postMessage({ type: 'epoche:ready' }, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, [merge]);

  return (
    <ReservoirContext.Provider value={{ items, addItem, removeItem, importItems }}>
      {children}
    </ReservoirContext.Provider>
  );
}

export function useReservoir() {
  const context = useContext(ReservoirContext);
  if (context === undefined) {
    throw new Error('useReservoir must be used within a ReservoirProvider');
  }
  return context;
}
