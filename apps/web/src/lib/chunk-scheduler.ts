export class AbortError extends Error {
  constructor(message?: string) {
    super(message ?? "Chunked ingestion aborted");
    this.name = "AbortError";
  }
}

export interface IngestInChunksOptions {
  chunkSize?: number;
  signal?: AbortSignal;
}

export interface BatchProgress {
  completed: number;
  total: number;
}

export async function ingestInChunks<T>(
  items: T[],
  onBatch: (batch: T[], progress: BatchProgress) => void,
  options?: IngestInChunksOptions,
): Promise<void> {
  const chunkSize = options?.chunkSize ?? 500;
  const signal = options?.signal;
  const total = items.length;

  if (total === 0) return;

  if (signal?.aborted) {
    throw new AbortError();
  }

  for (let i = 0; i < total; i += chunkSize) {
    if (signal?.aborted) {
      throw new AbortError();
    }

    const batch = items.slice(i, i + chunkSize);
    const completed = Math.min(i + chunkSize, total);

    onBatch(batch, { completed, total });

    if (completed < total) {
      await new Promise<void>((resolve) => {
        const task = () => resolve();
        if (typeof requestIdleCallback === "function") {
          requestIdleCallback(task);
        } else {
          setTimeout(task, 0);
        }
      });
    }
  }
}
