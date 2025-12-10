import React, { Component, ReactNode } from 'react';
import Alert from '@cloudscape-design/components/alert';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container>
          <SpaceBetween size="m">
            <Alert type="error" header="Something went wrong">
              {this.state.error?.message || 'An unexpected error occurred'}
            </Alert>
          </SpaceBetween>
        </Container>
      );
    }

    return this.props.children;
  }
}
