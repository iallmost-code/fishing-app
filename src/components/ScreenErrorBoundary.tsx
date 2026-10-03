import { Component, type ReactNode } from "react";
export default class ScreenErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <section className="card empty-page">
        <h2>This screen couldn't load</h2>
        <p>
          Check your connection and reopen this tab. Your other screens remain
          available.
        </p>
      </section>
    ) : (
      this.props.children
    );
  }
}
