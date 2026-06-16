interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div
      className="flood-banner absolute top-24 left-1/2 -translate-x-1/2 z-[1000]"
      role="alert"
    >
      <div className="flex items-center gap-3 rounded-xl bg-[rgba(220,38,38,0.92)] px-5 py-3 text-sm text-white shadow-lg backdrop-blur-md">
        <span className="text-base leading-none">{"\u26A0"}</span>
        <span className="flex-1">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-2 shrink-0 rounded-md bg-white/20 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-white/30"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
