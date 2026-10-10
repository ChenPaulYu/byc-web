/** Shared CV hover/focus/touch preview; one active card, native links and print-safe portals. */
import React, { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const ActivePreview = createContext<{ id: string | null; select: (id: string) => void } | null>(null);

export function CvPreviewProvider({ children }: { children: React.ReactNode }) {
  const [id, select] = useState<string | null>(null);
  return <ActivePreview.Provider value={{ id, select }}>{children}</ActivePreview.Provider>;
}

interface PreviewLinkProps {
  href: string;
  label: string;
  className: string;
  title: string;
  eyebrow: string;
  detail?: string;
  meta?: string;
  external?: boolean;
  resources?: React.ReactNode;
  children: React.ReactNode;
}

export function CvPreviewLink({ href, label, className, title, eyebrow, detail, meta, external = false, resources, children }: PreviewLinkProps) {
  const popupId = useId();
  const activePreview = useContext(ActivePreview);
  const anchor = useRef<HTMLAnchorElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const touch = useRef(false);
  const suppressFocus = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  const cancelClose = () => clearTimeout(closeTimer.current);
  const show = () => { cancelClose(); activePreview?.select(popupId); setMounted(true); setOpen(true); };
  const hide = () => { cancelClose(); setOpen(false); };
  const leave = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      if (!card.current?.contains(document.activeElement) && document.activeElement !== anchor.current) setOpen(false);
    }, 140);
  };
  const dismiss = () => {
    if (card.current?.contains(document.activeElement)) {
      suppressFocus.current = true;
      anchor.current?.focus({ preventScroll: true });
    }
    hide();
  };

  useEffect(() => {
    if (activePreview && activePreview.id !== popupId) {
      clearTimeout(closeTimer.current);
      setOpen(false);
    }
  }, [activePreview?.id, popupId]);
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  useEffect(() => {
    if (!open && mounted) {
      const timer = setTimeout(() => setMounted(false), 160);
      return () => clearTimeout(timer);
    }
  }, [open, mounted]);

  useLayoutEffect(() => {
    if (!mounted || !anchor.current || !card.current) return;
    const rect = anchor.current.getBoundingClientRect();
    const { width, height } = card.current.getBoundingClientRect();
    const below = rect.bottom + 10;
    setPosition({
      left: Math.max(12, Math.min(rect.left - 16, window.innerWidth - width - 12)),
      top: Math.max(72, Math.min(below + height <= window.innerHeight - 12 ? below : rect.top - height - 10, window.innerHeight - height - 12)),
    });
  }, [mounted, title, detail, meta]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!card.current?.contains(event.target as Node) && !anchor.current?.contains(event.target as Node)) hide();
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); dismiss(); } };
    const scroll = (event: Event) => { if (!card.current?.contains(event.target as Node)) hide(); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    window.addEventListener('scroll', scroll, true);
    window.addEventListener('resize', hide);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('scroll', scroll, true);
      window.removeEventListener('resize', hide);
    };
  }, [open]);

  return <>
    <a ref={anchor} className={className} href={href} aria-label={label}
      target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}
      aria-haspopup="dialog" aria-expanded={open} aria-controls={mounted ? popupId : undefined}
      onPointerEnter={event => { if (event.pointerType !== 'touch') show(); }} onPointerLeave={leave}
      onPointerDown={event => { touch.current = event.pointerType === 'touch'; }}
      onFocus={() => { if (suppressFocus.current) suppressFocus.current = false; else if (!touch.current) show(); }}
      onBlur={leave}
      onClick={event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (touch.current && !open) { event.preventDefault(); show(); } else hide();
        touch.current = false;
      }}
      onKeyDown={event => {
        if (event.key === 'Tab' && !event.shiftKey && open) {
          event.preventDefault();
          card.current?.querySelector<HTMLElement>('a, button')?.focus();
        }
      }}>{children}</a>
    {mounted && createPortal(<div ref={card} id={popupId} role="dialog" aria-labelledby={`${popupId}-title`}
      className="cv-reference-popover" data-open={open} style={position} inert={!open}
      onPointerEnter={cancelClose} onPointerLeave={leave} onFocus={cancelClose} onBlur={leave}
      onKeyDown={event => {
        const controls = card.current?.querySelectorAll<HTMLElement>('a, button');
        if (event.key === 'Tab' && event.shiftKey && document.activeElement === controls?.[0]) {
          event.preventDefault(); suppressFocus.current = true; anchor.current?.focus({ preventScroll: true });
        } else if (event.key === 'Tab' && !event.shiftKey && document.activeElement === controls?.[controls.length - 1]) {
          // Continue from the citation in document order instead of jumping to the browser chrome.
          suppressFocus.current = true; anchor.current?.focus({ preventScroll: true }); hide();
        }
      }}>
      <p className="cv-preview-label">{eyebrow}</p>
      <h3 id={`${popupId}-title`}>{title}</h3>
      {detail && <p className="cv-preview-detail">{detail}</p>}
      {meta && <p className="cv-preview-venue">{meta}</p>}
      <div className="cv-preview-footer">
        <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} onClick={hide}>{external ? 'Open in new tab' : 'View in CV'} <span aria-hidden="true">↗</span></a>
        {resources}
      </div>
      <button className="cv-preview-close" aria-label="Close reference preview" onClick={dismiss}>×</button>
    </div>, document.body)}
  </>;
}
