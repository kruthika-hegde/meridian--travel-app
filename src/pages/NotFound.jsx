import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="container" style={{ padding: "var(--space-8) 0", textAlign: "center" }}>
      <p style={{ fontFamily: "var(--font-display)", fontSize: "var(--size-3xl)", marginBottom: "var(--space-2)" }}>
        Not on the map
      </p>
      <p style={{ color: "color-mix(in srgb, var(--color-charcoal) 65%, transparent)", marginBottom: "var(--space-4)" }}>
        That destination doesn't exist yet.
      </p>
      <Link to="/" style={{ color: "var(--color-brass)" }}>
        ← Back to all destinations
      </Link>
    </div>
  );
}
