import React from "react";

/**
 * Top-level error boundary.
 *
 * Without this, any uncaught render error anywhere in the tree unmounts the
 * whole app and leaves the user staring at a blank white page. This catches
 * those errors and shows a friendly, on-brand fallback with a way to recover.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Keep error reporting in production (warn/error are not stripped).
    console.error("Uncaught UI error:", error, errorInfo);
    // Forward to analytics if available, so we can see real-world crashes.
    try {
      if (typeof window !== "undefined" && typeof window.gtag === "function") {
        window.gtag("event", "exception", {
          description: error?.message || String(error),
          fatal: true,
        });
      }
    } catch (_) {
      /* never let error reporting throw */
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "linear-gradient(to bottom, #0a0e1a, #16213e)",
          color: "#fff",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>(╥﹏╥)</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            Something went wrong
          </h1>
          <p style={{ color: "#9fb3c8", lineHeight: 1.6, marginBottom: 28 }}>
            An unexpected error broke this page. It is not your fault — try
            reloading, and if it keeps happening, head back to the home page.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={this.handleReload}
              style={{
                padding: "10px 22px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                color: "#04212b",
                background: "linear-gradient(135deg, #22d3ee, #06b6d4)",
              }}
            >
              Reload page
            </button>
            <button
              onClick={this.handleGoHome}
              style={{
                padding: "10px 22px",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 600,
                color: "#e2e8f0",
                background: "transparent",
                border: "1px solid rgba(34,211,238,0.4)",
              }}
            >
              Go home
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
