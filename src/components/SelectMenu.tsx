import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

const R = '#7A1F1F';

export interface SelectOption {
  value: string;
  label: string;
  /** Secondary line, shown under the label in the menu. */
  hint?: string;
  /** Emoji or node rendered before the label (flags, icons). */
  prefix?: React.ReactNode;
}

interface SelectMenuProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Heading shown on the mobile bottom sheet. */
  sheetTitle?: string;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Styled replacement for a native <select>. Renders as an anchored popover on
 * desktop and a thumb-reachable bottom sheet on phones, where an OS dropdown
 * would otherwise ignore the field styling entirely.
 */
export default function SelectMenu({
  value,
  onChange,
  options,
  sheetTitle,
  placeholder = 'Select…',
  ariaLabel,
  disabled,
  className = '',
}: SelectMenuProps) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const commit = (index: number) => {
    const opt = options[index];
    if (!opt) return;
    onChange(opt.value);
    close();
  };

  /* Desktop popover: flip up when there's no room beneath, and anchor to the
     trigger's right edge when widening rightward would run off screen. */
  const MENU_MAX_W = 240;
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const needed = Math.min(options.length * 44 + 16, 280);
    setDropUp(rect.bottom + needed > window.innerHeight && rect.top > needed);
    setAlignRight(rect.left + Math.max(MENU_MAX_W, rect.width) > window.innerWidth - 8);
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);

    // Keep the page still behind the sheet on phones.
    const isSheet = window.matchMedia('(max-width: 639px)').matches;
    const prevOverflow = document.body.style.overflow;
    if (isSheet) document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      if (isSheet) document.body.style.overflow = prevOverflow;
    };
  }, [open, selectedIndex]);

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    listRef.current?.querySelectorAll('[role="option"]')[activeIndex]
      ?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % options.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + options.length) % options.length);
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        commit(activeIndex);
        break;
      case 'Tab':
        close(false);
        break;
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`} onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className={`w-full h-12 sm:h-11 pl-3.5 pr-9 flex items-center gap-2 bg-slate-50 border rounded-xl text-left text-base sm:text-sm font-semibold text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          open
            ? 'bg-white border-[#7A1F1F]/60 ring-4 ring-[#7A1F1F]/10'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {selected?.prefix && <span className="flex-shrink-0 leading-none">{selected.prefix}</span>}
        <span className={`truncate ${selected ? '' : 'text-slate-400 font-normal'}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={15}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <>
          {/* Sheet backdrop — phones only */}
          <div className="ej-fade fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] sm:hidden" aria-hidden="true" />

          <div
            ref={listRef}
            role="listbox"
            aria-label={ariaLabel ?? sheetTitle}
            tabIndex={-1}
            className={`ej-sheet sm:ej-pop fixed inset-x-0 bottom-0 z-[60] max-h-[70vh] overflow-y-auto overscroll-contain rounded-t-3xl border-t border-slate-200 bg-white shadow-2xl pb-[max(0.75rem,env(safe-area-inset-bottom))]
              sm:absolute sm:bottom-auto sm:z-50 sm:max-h-[17.5rem] sm:w-max sm:min-w-full sm:max-w-60 sm:rounded-2xl sm:border sm:shadow-xl sm:pb-1.5 ${
                dropUp ? 'sm:top-auto sm:bottom-full sm:mb-2' : 'sm:top-full sm:mt-2'
              } ${alignRight ? 'sm:left-auto sm:right-0' : 'sm:left-0 sm:right-auto'}`}
          >
            {/* Grab handle + title (sheet only) */}
            <div className="sm:hidden sticky top-0 bg-white pt-2.5 pb-2 px-4 border-b border-slate-100">
              <span className="mx-auto block w-9 h-1 rounded-full bg-slate-300" />
              {sheetTitle && (
                <span className="mt-2.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {sheetTitle}
                </span>
              )}
            </div>

            <div className="p-1.5 sm:p-1.5">
              {options.map((opt, i) => {
                const isSelected = opt.value === value;
                const isActive = i === activeIndex;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    /* mousemove, not mouseenter: a stationary pointer left over the
                       list must not hijack the keyboard highlight on reopen. */
                    onMouseMove={() => setActiveIndex(i)}
                    onClick={() => commit(i)}
                    className={`w-full min-h-12 sm:min-h-9 px-3 py-2 flex items-center gap-2.5 rounded-xl sm:rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-[#FAF0E8]'
                        : isActive
                        ? 'bg-slate-100'
                        : 'bg-transparent'
                    }`}
                  >
                    {opt.prefix && <span className="flex-shrink-0 leading-none">{opt.prefix}</span>}
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-[15px] sm:text-sm font-semibold ${
                          isSelected ? 'text-[#7A1F1F]' : 'text-slate-800'
                        }`}
                      >
                        {opt.label}
                      </span>
                      {opt.hint && (
                        <span className="block truncate text-[11.5px] sm:text-[11px] text-slate-400 mt-0.5">
                          {opt.hint}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 shadow-2xs"
                        style={{ backgroundColor: R }}
                      >
                        <Check size={11} strokeWidth={3} className="text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
