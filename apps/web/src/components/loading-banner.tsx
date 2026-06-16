import { Loader2 } from "lucide-react";

interface LoadingBannerProps {
  message?: string;
}

export function LoadingBanner({
  message = "Loading flood susceptibility data\u2026",
}: LoadingBannerProps) {
  return (
    <div
      className="flood-banner absolute top-24 left-1/2 -translate-x-1/2 z-[1000]"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-xl bg-[rgba(15,23,42,0.92)] px-5 py-3 text-sm text-[#f1f5f9] shadow-lg backdrop-blur-md">
        <Loader2 className="flood-banner__spinner h-4 w-4 shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}
