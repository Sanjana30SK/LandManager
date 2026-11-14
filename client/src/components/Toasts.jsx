// Renders the notifications from useToasts. aria-live makes screen readers announce them.
export default function Toasts({ toasts, onDismiss }) {
  return (
    <div className="toasts" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.tone}`} role={t.tone === 'error' ? 'alert' : 'status'}>
          <span>{t.message}</span>
          <button type="button" className="toast__close" aria-label="Dismiss notification" onClick={() => onDismiss(t.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
