// GPU time of a render through EXT_disjoint_timer_query_webgl2 (WebGL 2). Many browsers do not expose it (Safari, most
// phones, Firefox without a flag); then `available` is false and lastMs stays 0. Results arrive a few frames late.

export interface GpuTimer {
  readonly available: boolean;
  /** Call right before the render. Skipped while a previous query is still open or too many wait. */
  begin(): void;
  /** Call right after the render. */
  end(): void;
  /** The last finished query's GPU time in ms (0 = none yet, or not available). */
  readonly lastMs: number;
}

interface TimerExt {
  TIME_ELAPSED_EXT: number;
  GPU_DISJOINT_EXT: number;
}

export function createGpuTimer(gl: WebGLRenderingContext | WebGL2RenderingContext | null): GpuTimer {
  const gl2 = gl && typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext ? gl : null;
  let ext: TimerExt | null = null;
  try {
    ext = (gl2?.getExtension('EXT_disjoint_timer_query_webgl2') as TimerExt | null) ?? null;
  } catch {
    ext = null;
  }
  const pending: WebGLQuery[] = [];
  let active: WebGLQuery | null = null;
  let lastMs = 0;
  const poll = (): void => {
    if (!gl2 || !ext) return;
    while (pending.length) {
      const q = pending[0];
      if (!gl2.getQueryParameter(q, gl2.QUERY_RESULT_AVAILABLE)) break;
      const disjoint = gl2.getParameter(ext.GPU_DISJOINT_EXT);
      const ns = gl2.getQueryParameter(q, gl2.QUERY_RESULT) as number;
      if (!disjoint) lastMs = ns / 1e6;
      gl2.deleteQuery(q);
      pending.shift();
    }
  };
  return {
    available: !!ext,
    get lastMs() {
      return lastMs;
    },
    begin() {
      if (!gl2 || !ext || active) return;
      poll();
      if (pending.length > 3) return;
      const q = gl2.createQuery();
      if (!q) return;
      gl2.beginQuery(ext.TIME_ELAPSED_EXT, q);
      active = q;
    },
    end() {
      if (!gl2 || !ext || !active) return;
      gl2.endQuery(ext.TIME_ELAPSED_EXT);
      pending.push(active);
      active = null;
    },
  };
}
