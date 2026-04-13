import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // Future: send to Sentry or logging service
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#050505',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: 480,
            padding: '2rem',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.03)',
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              fontSize: '1.5rem',
            }}>
              !
            </div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              marginBottom: '0.75rem',
            }}>
              Something went wrong
            </h2>
            <p style={{
              color: '#9ca3af',
              marginBottom: '1.5rem',
              lineHeight: 1.6,
              fontSize: '0.9rem',
            }}>
              An unexpected error occurred. Please try again. If the problem
              persists, restart the application.
            </p>
            {this.state.error && (
              <pre style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: '0.75rem',
                marginBottom: '1.5rem',
                fontSize: '0.75rem',
                color: '#ef4444',
                textAlign: 'left',
                overflow: 'auto',
                maxHeight: 120,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={this.handleRetry}
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                color: '#fff',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: 10,
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
