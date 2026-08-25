import React from 'react';
import { useProgress } from '@react-three/drei';
import { Compass, AlertTriangle, RefreshCw } from 'lucide-react';

interface LoadingScreenProps {
  label?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  label = 'Loading Archaeological Scene...'
}) => {
  const { progress, item, active } = useProgress();

  if (!active && progress === 100) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-maya-bg text-maya-text px-6">
      <div className="relative flex items-center justify-center mb-8">
        <div className="w-20 h-20 rounded-full border-2 border-maya-gold/20 animate-ping absolute" />
        <div className="w-16 h-16 rounded-full border-2 border-maya-gold border-t-transparent animate-spin flex items-center justify-center">
          <Compass className="w-6 h-6 text-maya-gold animate-pulse" />
        </div>
      </div>

      <div className="text-center max-w-md w-full">
        <h3 className="font-serif text-xl tracking-wider text-maya-cream mb-2 uppercase font-semibold">
          {label}
        </h3>

        <p className="text-xs text-maya-textDim font-mono mb-4 truncate h-4">
          {item ? `Loading: ${item.split('/').pop()}` : 'Initializing 3D geometry & textures...'}
        </p>

        <div className="w-full bg-maya-surfaceHover h-1.5 rounded-full overflow-hidden border border-maya-gold/20 p-[1px]">
          <div
            className="bg-gradient-to-r from-maya-goldDark via-maya-gold to-maya-goldLight h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(5, Math.round(progress))}%` }}
          />
        </div>

        <div className="flex justify-between items-center mt-2 text-[11px] text-maya-textDim font-mono">
          <span>Maya Archaeoastronomy Engine</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary?: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0d0707] text-[#f8d7da] p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-red-950/50 border border-red-500/40 flex items-center justify-center mb-6 text-red-400">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <h2 className="font-serif text-2xl font-bold text-red-200 mb-3 tracking-wide">
        Scene Loading Error
      </h2>

      <p className="max-w-lg text-sm text-red-300/80 mb-6 bg-red-950/30 p-4 rounded-lg border border-red-900/50 font-mono text-left break-all">
        {error.message || 'An unexpected error occurred while initializing the 3D scene.'}
      </p>

      {resetErrorBoundary && (
        <button
          onClick={resetErrorBoundary}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#8b2323] hover:bg-[#a82e2e] text-white text-sm font-medium rounded-lg transition-colors border border-red-400/30 shadow-lg cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Initialization
        </button>
      )}
    </div>
  );
};
