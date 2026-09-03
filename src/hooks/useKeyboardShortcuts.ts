import { useEffect } from 'react';

type TabType = 'dashboard' | 'ledger' | 'analytics' | 'vaults' | 'bills';

const TABS: TabType[] = ['dashboard', 'ledger', 'analytics', 'vaults', 'bills'];

interface KeyboardShortcutHandlers {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenQuickAdd: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onToggleTheme?: () => void;
  onToggleLanguage?: () => void;
  onCloseModal?: () => void;
  isAnyModalOpen?: boolean;
}

export function useKeyboardShortcuts({
  activeTab,
  setActiveTab,
  onOpenQuickAdd,
  onOpenSettings,
  onOpenShortcuts,
  onToggleTheme,
  onToggleLanguage,
  onCloseModal,
  isAnyModalOpen = false,
}: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement)?.isContentEditable;

      const hasMetaOrCtrl = e.metaKey || e.ctrlKey;
      const keyLower = e.key.toLowerCase();

      // 1. ESCAPE: Close modal
      if (e.key === 'Escape') {
        if (isAnyModalOpen && onCloseModal) {
          e.preventDefault();
          onCloseModal();
          return;
        }
      }

      // 2. Global Shortcuts with Modifiers (Cmd/Ctrl or Alt)
      // Cmd/Ctrl + N or Alt + N -> Add Transaction
      if ((hasMetaOrCtrl && keyLower === 'n') || (e.altKey && keyLower === 'n')) {
        e.preventDefault();
        e.stopPropagation();
        onOpenQuickAdd();
        return;
      }

      // 3. Tab switching by numbers (Cmd/Ctrl + 1..5 or Alt + 1..5)
      if (hasMetaOrCtrl || e.altKey) {
        if (['1', '2', '3', '4', '5'].includes(e.key)) {
          const tabIndex = parseInt(e.key, 10) - 1;
          if (tabIndex >= 0 && tabIndex < TABS.length) {
            e.preventDefault();
            e.stopPropagation();
            setActiveTab(TABS[tabIndex]);
            return;
          }
        }
      }

      // 4. Tab switching cycling: Cmd/Ctrl + [ or ] / Alt + Left or Right
      if (
        (hasMetaOrCtrl && e.key === '[') ||
        (e.altKey && e.key === 'ArrowLeft')
      ) {
        e.preventDefault();
        e.stopPropagation();
        const currentIndex = TABS.indexOf(activeTab);
        const prevIndex = (currentIndex - 1 + TABS.length) % TABS.length;
        setActiveTab(TABS[prevIndex]);
        return;
      }

      if (
        (hasMetaOrCtrl && e.key === ']') ||
        (e.altKey && e.key === 'ArrowRight')
      ) {
        e.preventDefault();
        e.stopPropagation();
        const currentIndex = TABS.indexOf(activeTab);
        const nextIndex = (currentIndex + 1) % TABS.length;
        setActiveTab(TABS[nextIndex]);
        return;
      }

      // 5. Open Settings (Cmd/Ctrl + , or Alt + S)
      if ((hasMetaOrCtrl && e.key === ',') || (e.altKey && keyLower === 's')) {
        e.preventDefault();
        e.stopPropagation();
        onOpenSettings();
        return;
      }

      // 6. Toggle Theme: Alt + T
      if (e.altKey && keyLower === 't') {
        if (onToggleTheme) {
          e.preventDefault();
          e.stopPropagation();
          onToggleTheme();
          return;
        }
      }

      // 7. Toggle Language: Alt + L
      if (e.altKey && keyLower === 'l') {
        if (onToggleLanguage) {
          e.preventDefault();
          e.stopPropagation();
          onToggleLanguage();
          return;
        }
      }

      // 8. Shortcuts modal with '?' key (when not inside an input)
      if (!isInput && !hasMetaOrCtrl && !e.altKey) {
        if (e.key === '?' || (e.shiftKey && e.key === '/')) {
          e.preventDefault();
          e.stopPropagation();
          onOpenShortcuts();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [
    activeTab,
    setActiveTab,
    onOpenQuickAdd,
    onOpenSettings,
    onOpenShortcuts,
    onToggleTheme,
    onToggleLanguage,
    onCloseModal,
    isAnyModalOpen,
  ]);
}
