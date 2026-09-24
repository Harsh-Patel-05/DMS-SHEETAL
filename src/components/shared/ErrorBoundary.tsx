import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorFallback } from '@/components/shared/ErrorFallback'

export interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Global React error boundary. Technical details stay in the console only.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // DevTools only — never surface to the UI
    console.error('[DMS] ErrorBoundary:', error)
    console.error('[DMS] Component stack:', info.componentStack)
  }

  handleReload = () => {
    this.setState({ hasError: false })
    window.location.reload()
  }

  handleDashboard = () => {
    this.setState({ hasError: false })
    window.location.assign('/dashboard')
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReload={this.handleReload} onDashboard={this.handleDashboard} />
    }

    return this.props.children
  }
}
