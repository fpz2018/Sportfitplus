import React from 'react';
import { Button } from '@/components/ui/button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 p-8 text-center">
          <p className="text-2xl font-semibold text-slate-800">Er ging iets mis</p>
          <p className="text-slate-500 max-w-md">
            Er is een onverwachte fout opgetreden op deze pagina.
          </p>
          <Button
            variant="outline"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Opnieuw proberen
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
