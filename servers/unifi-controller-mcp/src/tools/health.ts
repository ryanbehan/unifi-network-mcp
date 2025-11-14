import type { TargetConfig, ResultEnvelope } from '../types.js';
import { HttpClient } from '../http.js';
import { ensureSession } from '../session.js';
import { sitePath } from '../router.js';

export async function getHealth(target: TargetConfig, http: HttpClient, site?: string, raw = false): Promise<ResultEnvelope<any>> {
  await ensureSession(target, http);
  const s = site || target.default_site;
  const res = await http.request<{ data?: any[]; meta?: any }>({ method: 'GET', url: sitePath(target, s, 'stat/health') });
  if (res.status >= 200 && res.status < 300) {
    const truncated = !!(res.data && (res.data as any).meta && (res.data as any).meta.count);
    return { data: (res.data as any).data || [], ...(truncated ? { truncated: true } : {}), ...(raw ? { raw: res.data } : {}) };
  }
  throw new Error(`HTTP ${res.status}`);
}
