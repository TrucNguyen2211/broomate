// ErrorBoundary.jsx
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error){ return { hasError: true, error }; }
  componentDidCatch(error, info){ console.error("Rooms crash:", error, info); }
  render(){
    if (this.state.hasError) {
      return (
        <pre style={{ whiteSpace: "pre-wrap", color: "crimson", background: "#fff0f0", padding: 12, borderRadius: 8 }}>
{String(this.state.error)}
        </pre>
      );
    }
    return this.props.children;
  }
}
