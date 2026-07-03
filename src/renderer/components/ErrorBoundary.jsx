import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * Catches render errors in its subtree and shows a recoverable fallback, so a
 * single broken view can't white-screen the whole app. Keyed by route in App so
 * it clears automatically when the user navigates away.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('View crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-fallback">
          <AlertTriangle size={40} />
          <div className="error-title">Something went wrong</div>
          <div className="error-sub">
            This view hit an unexpected error. Your data is safe.
          </div>
          <div className="error-actions">
            <button className="btn btn-ghost" onClick={() => this.setState({ error: null })}>
              <RotateCcw size={15} /> Try again
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                window.location.hash = '#/today';
                this.setState({ error: null });
              }}
            >
              Go to Today
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
