import React, { Suspense, Component, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { CameraConfig } from '../types/lesson.types';
import { LoadingScreen, ErrorFallback } from './LoadingScreen';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** GLTF URLs to evict from the drei cache on retry (TECH_DEBT L2). */
  gltfUrls?: string[];
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
    // A failed useGLTF promise stays cached as rejected, so a plain re-render
    // would instantly re-throw the same error (TECH_DEBT L2). Evict the lesson
    // GLTFs from the drei cache so the retry actually re-fetches the assets.
    (this.props.gltfUrls ?? []).forEach((url) => useGLTF.clear(url));
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
  /** GLTF URLs to evict from the drei cache when the error boundary retries. */
  gltfUrls?: string[];
}

export const SceneCanvas: React.FC<SceneCanvasProps> = ({
  cameraConfig,
  children,
  className = 'w-full h-full relative',
  gltfUrls
}) => {
  return (
    <div className={className}>
      <CanvasErrorBoundary gltfUrls={gltfUrls}>
        <Suspense fallback={<LoadingScreen />}>
          <Canvas
            shadows
            dpr={[1, 2]}
            // frameloop="demand" (TECH_DEBT C2): the scene is fully static —
            // nothing uses useFrame. Rendering every frame at display refresh
            // is pure GPU/battery waste. In demand mode R3F auto-invalidates on
            // any re-render, so the Atmosphere Timeline drags and the eased
            // step sweeps (which drive sliderPosition state each rAF tick)
            // still animate one frame per update.
            frameloop="demand"
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
