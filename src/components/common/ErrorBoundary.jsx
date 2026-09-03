import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ padding: "var(--space-8) 0", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "var(--size-2xl)", marginBottom: "var(--space-2)" }}>
            Something went off course
          </p>
          <p style={{ color: "color-mix(in srgb, var(--color-charcoal) 65%, transparent)", marginBottom: "var(--space-4)" }}>
            Refresh the page to try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              background: "var(--color-ink)",
              color: "var(--color-parchment)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              padding: "0.75rem 1.5rem",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
