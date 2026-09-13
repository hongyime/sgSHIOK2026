export const WALK_PREVIEW_TIMEOUT_MS = 12_000;

export async function requestWalkPreview(url: string, timeoutMs = WALK_PREVIEW_TIMEOUT_MS): Promise<{ ok?: boolean; route_geometry?: string; total_distance_m?: number; total_time_s?: number }> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new DOMException('Walking preview timed out', 'TimeoutError'));
      controller.abort();
    }, timeoutMs);
  });
  try {
    return await Promise.race([deadline, fetch(url, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw Object.assign(new Error('Walking preview unavailable'), { status: response.status });
      return response.json();
    })]);
  } finally { clearTimeout(timer); }
}
