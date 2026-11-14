// A confirmation dialog built on the browser's native <dialog> element.
// showModal() gives us for free: a dimmed backdrop, focus kept inside the dialog,
// and the Esc key to cancel. Used to confirm deleting a parcel.
import { useEffect, useRef } from 'react';

export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  busyLabel = 'Working…',
  busy = false,
  error = null,
  onConfirm,
  onCancel,
}) {
  const ref = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus(); // the safe choice is focused, so Enter doesn't delete by accident
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault(); // Esc: let React state decide whether to close
        if (!busy) onCancel();
      }}
      onClick={(e) => {
        if (e.target === ref.current && !busy) onCancel(); // click on the backdrop
      }}
    >
      <div className="dialog__body">
        <h2 id="dialog-title" className="dialog__title">
          {title}
        </h2>
        <div className="dialog__message">{children}</div>
        {error && (
          <p className="form-alert" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button ref={cancelRef} type="button" className="btn" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn--danger" onClick={onConfirm} disabled={busy}>
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
