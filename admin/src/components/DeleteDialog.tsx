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
    <div className="dialog-overlay fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/30 px-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="dialog-content w-full max-w-lg rounded-3xl border border-red-100 bg-white p-6 shadow-2xl shadow-neutral-950/10"
      >
        <div className="mb-6 flex items-start gap-4">
          <div className="mt-1 h-10 w-1 rounded-full bg-red-300" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-red-500">
              Delete {noun}
            </p>
            <h2 id={titleId} className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950">{itemName}</h2>
            {!isFailed && (
              <p id={descriptionId} className="mt-3 text-sm leading-6 text-neutral-600">
                This action cannot be undone. The published content and its admin entry will be permanently removed.
              </p>
            )}
            {isFailed && (
              <div id={descriptionId} className="mt-4 space-y-3 text-sm leading-6 text-neutral-700">
                {error instanceof DeleteContentError && error.kind === 'partial-delete' && (
                  <p>The content file may already be deleted, but the site index still needs to be updated.</p>
                )}
                {detail && <p>{detail}</p>}
              </div>
            )}
          </div>
        </div>

        {!isFailed && (
          <div className="rounded-2xl border border-red-100 bg-red-50/60 p-4 text-sm leading-6 text-neutral-700">
            The admin will retry once if the content index changed underneath you before showing a failure.
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isFailed ? 'Close' : 'Cancel'}
          </button>
          {!isFailed && (
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {isDeleting ? 'Deleting...' : `Delete ${noun}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteDialog;
