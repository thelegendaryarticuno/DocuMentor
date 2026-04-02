import { LoaderState } from '../hooks/useModelLoader';

interface AppBootScreenProps {
  state: LoaderState;
  progress: number;
  error: string | null;
  onRetry: () => void;
}

function getBootCopy(state: LoaderState, progress: number) {
  switch (state) {
    case 'downloading':
      return {
        eyebrow: 'Downloading model',
        title: 'Preparing your local AI workspace',
        description: `DocuMentor is downloading the language model before opening the app. ${Math.round(progress)}% complete.`,
      };
    case 'loading':
      return {
        eyebrow: 'Loading model',
        title: 'Warming up the on-device engine',
        description: 'The model files are ready. We are loading them into the runtime so the app opens fully prepared.',
      };
    case 'error':
      return {
        eyebrow: 'Startup issue',
        title: 'The AI engine could not finish loading',
        description: 'Check your connection or local browser storage, then retry startup.',
      };
    case 'ready':
      return {
        eyebrow: 'Ready',
        title: 'Opening DocuMentor',
        description: 'Your local AI model is ready.',
      };
    case 'idle':
    default:
      return {
        eyebrow: 'Starting up',
        title: 'Initializing DocuMentor',
        description: 'Setting up the local AI runtime and checking cached model files.',
      };
  }
}

export function AppBootScreen({ state, progress, error, onRetry }: AppBootScreenProps) {
  const copy = getBootCopy(state, progress);
  const progressWidth = state === 'loading' ? 100 : Math.max(progress, 6);

  return (
    <div className="app-boot">
      <div className="app-boot-panel">
        <div className="app-boot-brand">
          <div className="app-boot-logo">
            <span className="app-boot-logo-dot" />
          </div>
          <div>
            <p className="app-boot-eyebrow">{copy.eyebrow}</p>
            <h1 className="app-boot-title">{copy.title}</h1>
          </div>
        </div>

        <p className="app-boot-description">{copy.description}</p>

        <div className="app-boot-animation" aria-hidden="true">
          <span className="app-boot-ring app-boot-ring-a" />
          <span className="app-boot-ring app-boot-ring-b" />
          <span className="app-boot-core" />
          <span className="app-boot-particle app-boot-particle-a" />
          <span className="app-boot-particle app-boot-particle-b" />
          <span className="app-boot-particle app-boot-particle-c" />
        </div>

        <div className="app-boot-progress-card">
          <div className="app-boot-progress-labels">
            <span>{state === 'loading' ? 'Loading into engine' : 'Model progress'}</span>
            <span>{Math.round(progressWidth)}%</span>
          </div>
          <div className="app-boot-progress-track">
            <div className="app-boot-progress-fill" style={{ width: `${progressWidth}%` }} />
          </div>
        </div>

        <div className="app-boot-status-row">
          <span className="app-boot-status-pill">Private and on-device</span>
          <span className="app-boot-status-pill">Startup runs once per session</span>
        </div>

        {state === 'error' && (
          <div className="app-boot-error-block">
            {error && <p className="app-boot-error-text">{error}</p>}
            <button className="app-boot-retry" onClick={onRetry}>
              Retry loading model
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
