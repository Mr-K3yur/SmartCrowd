import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  state: State;
  props: Props;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = this.state.error?.message;
      let errorDetails: any = null;

      try {
        if (errorMessage && errorMessage.startsWith('{')) {
          const parsed = JSON.parse(errorMessage);
          errorMessage = parsed.error;
          errorDetails = parsed;
        }
      } catch (e) {
        // Not a JSON error message
      }

      return (
        <div className="p-8 m-4 max-w-3xl mx-auto bg-red-50 border border-red-200 rounded-lg text-red-900 font-sans shadow-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
             <span className="bg-red-200 text-red-700 p-1 rounded">🛡️</span> Firebase Permissions Error
          </h2>
          <p className="mb-4 font-medium">{errorMessage}</p>
          <div className="mb-4 text-sm bg-white p-4 rounded-lg border border-red-100 shadow-sm text-slate-700">
             <p className="font-bold mb-2 text-slate-900">How to Fix This:</p>
             <p className="mb-2">It looks like the Firestore Security Rules on your connected Firebase project are blocking access to <code>{errorDetails?.path || 'the database'}</code>.</p>
             <p>Since you are using a manual external database configuration, the preview cannot auto-deploy rules. Please update the rules in your <strong>Firebase Console &rarr; Firestore &rarr; Rules</strong> using the content generated in <code>firestore.rules</code>.</p>
          </div>
          {errorDetails && (
            <details className="mt-4">
              <summary className="text-sm font-semibold cursor-pointer text-red-800 hover:text-red-900">Show Error Data Log</summary>
              <pre className="mt-2 text-xs bg-red-100 p-4 rounded overflow-auto max-w-full text-red-800 border border-red-200">
                {JSON.stringify(errorDetails, null, 2)}
              </pre>
            </details>
          )}
          {this.props.fallback}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;


