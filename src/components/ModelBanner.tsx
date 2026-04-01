interface Props {
  progress: number;
  modelName?: string;
  totalMB?: number;
}

export function ModelBanner({ progress, modelName = 'Model', totalMB }: Props) {
  // Render null when progress >= 100
  if (progress >= 100) return null;

  const loadedMB = totalMB ? Math.round((progress / 100) * totalMB) : 0;
  const progressPercent = Math.round(progress);

  return (
    <div className="model-banner">
      <span className="model-banner-text">
        {modelName} loading · {progressPercent}%
      </span>
      
      <div className="model-banner-progress-track">
        <div
          className="model-banner-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {totalMB && (
        <span className="model-banner-mb">
          {loadedMB} MB / {totalMB} MB
        </span>
      )}
    </div>
  );
}

