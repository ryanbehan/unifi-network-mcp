import type { TargetConfig, ResultEnvelope } from '../types.js';
import { HttpClient } from '../http.js';
import { ensureSession } from '../session.js';
import { sitePath } from '../router.js';

export interface PostReportOpts {
  site?: string;
  raw?: boolean;
  interval: '5minutes' | 'hourly' | 'daily';
  type: 'site' | 'user' | 'ap';
  attributes: string[];
  macs?: string[];
}

export async function postReport(target: TargetConfig, http: HttpClient, opts: PostReportOpts): Promise<ResultEnvelope<any>> {
  await ensureSession(target, http);
  const s = opts.site || target.default_site;
  const url = sitePath(target, s, `stat/report/${opts.interval}.${opts.type}`);
  const body: any = { attrs: opts.attributes };
  if (opts.macs && opts.macs.length) body.macs = opts.macs;
  const res = await http.request<any>({ method: 'POST', url, data: body });
  if (res.status >= 200 && res.status < 300) {
    return { data: res.data, ...(opts.raw ? { raw: res.data } : {}) };
  }
  throw new Error(`HTTP ${res.status}`);
}
