import React, { Suspense, Component, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraConfig } from '../types/lesson.types';
import { LoadingScreen, ErrorFallback } from './LoadingScreen';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class CanvasErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('3D Scene Error:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return <ErrorFallback error={this.state.error} resetErrorBoundary={this.reset} />;
    }
    return this.props.children;
  }
}

interface SceneCanvasProps {
  cameraConfig: CameraConfig;
  children: ReactNode;
  className?: string;
}

export const SceneCanvas: React.FC<SceneCanvasProps> = ({
  cameraConfig,
  children,
  className = 'w-full h-full relative'
}) => {
  return (
    <div className={className} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <CanvasErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          <Canvas
            shadows
            dpr={[1, 2]}
            gl={{
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.05,
              powerPreference: 'high-performance'
            }}
            camera={{
              fov: cameraConfig.fov || 48.5,
              near: cameraConfig.near || 0.1,
              far: cameraConfig.far || 1000,
              position: cameraConfig.position || [0, 2, 5]
            }}
            style={{ width: '100%', height: '100%', display: 'block' }}
          >
            {children}
          </Canvas>
        </Suspense>
      </CanvasErrorBoundary>
    </div>
  );
};
