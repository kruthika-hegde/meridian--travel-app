import "./StatusStates.css";

export function LoadingState({ label = "Loading…" }) {
  return (
    <div className="status-state status-state--loading" role="status">
      <span className="status-state__spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="status-state status-state--empty">
      <p className="status-state__title">{title}</p>
      {message && <p className="status-state__message">{message}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", message, onRetry }) {
  return (
    <div className="status-state status-state--error" role="alert">
      <p className="status-state__title">{title}</p>
      {message && <p className="status-state__message">{message}</p>}
      {onRetry && (
        <button type="button" className="status-state__retry" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Skeleton({ height = "1em", width = "100%", radius = "var(--radius-sm)" }) {
  return (
    <span
      className="skeleton"
      style={{ height, width, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}
