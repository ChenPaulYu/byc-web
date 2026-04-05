import React, { useEffect, useId, useRef } from 'react';

import { DeleteContentError, type ContentType } from '../lib/deleteContentFlow';

interface DeleteDialogProps {
  isOpen: boolean;
  type: ContentType;
  itemName: string;
  isDeleting: boolean;
  error: unknown;
  onConfirm: () => void;
  onClose: () => void;
}

const nounByType: Record<ContentType, string> = {
  blog: 'Post',
  projects: 'Project',
  news: 'News Item',
};

function getErrorDetail(error: unknown): string | undefined {
  if (error instanceof DeleteContentError) {
    return error.detail ?? error.message;
  }

  return error instanceof Error ? error.message : undefined;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  isOpen,
  type,
  itemName,
  isDeleting,
  error,
  onConfirm,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusId = requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      cancelAnimationFrame(focusId);
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isDeleting) {
      dialogRef.current?.focus();
    }
  }, [isDeleting, isOpen]);

  if (!isOpen) {
    return null;
  }

  const noun = nounByType[type];
  const isFailed = !isDeleting && error != null;
  const detail = getErrorDetail(error);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && !isDeleting) {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableControls = [closeButtonRef.current, confirmButtonRef.current].filter(
      (element): element is HTMLButtonElement => element != null && !element.disabled,
    );

    if (focusableControls.length === 0) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }

    const firstControl = focusableControls[0];
    const lastControl = focusableControls[focusableControls.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey) {
      if (activeElement === firstControl || activeElement === dialogRef.current) {
        event.preventDefault();
        lastControl.focus();
      }

      return;
    }

    if (activeElement === lastControl || activeElement === dialogRef.current) {
      event.preventDefault();
      firstControl.focus();
    }
  };

  return (
    <div className="dialog-overlay fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 px-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="dialog-content w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl shadow-neutral-950/15 ring-1 ring-neutral-950/5"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div
            className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-100"
            aria-hidden="true"
          >
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-500">
            Delete {noun}
          </p>
          <h2 id={titleId} className="mt-2 text-xl font-semibold tracking-tight text-neutral-950">{itemName}</h2>

          {!isFailed && (
            <p id={descriptionId} className="mt-3 text-sm leading-relaxed text-neutral-500">
              This action cannot be undone. The published content and its admin entry will be permanently removed.
            </p>
          )}
          {isFailed && (
            <div id={descriptionId} className="mt-4 space-y-2 text-sm leading-relaxed text-neutral-600">
              {error instanceof DeleteContentError && error.kind === 'partial-delete' && (
                <p>The content file may already be deleted, but the site index still needs to be updated.</p>
              )}
              {detail && <p>{detail}</p>}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          {!isFailed && (
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="w-full rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {isDeleting ? 'Deleting\u2026' : `Delete ${noun}`}
            </button>
          )}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-medium text-neutral-600 transition-all hover:bg-neutral-100 hover:text-neutral-950 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isFailed ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteDialog;
