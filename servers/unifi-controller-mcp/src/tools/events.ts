import type { TargetConfig, ResultEnvelope, Event } from '../types.js';
import { HttpClient } from '../http.js';
import { ensureSession } from '../session.js';
import { sitePath } from '../router.js';

export interface GetEventsOpts { site?: string; raw?: boolean; start?: number; end?: number; limit?: number }

export async function getEvents(target: TargetConfig, http: HttpClient, opts: GetEventsOpts = {}): Promise<ResultEnvelope<Event[]>> {
  await ensureSession(target, http);
  const s = opts.site || target.default_site;
  const params = new URLSearchParams();
  if (opts.start) params.set('start', String(opts.start));
  if (opts.end) params.set('end', String(opts.end));
  if (opts.limit) params.set('limit', String(opts.limit));

  const url = sitePath(target, s, `stat/event${params.toString() ? `?${params.toString()}` : ''}`);
  const res = await http.request<{ data?: any[]; meta?: any }>({ method: 'GET', url });
  if (res.status >= 200 && res.status < 300) {
    const list = ((res.data as any)?.data || []) as any[];
    const events: Event[] = list.map((e: any) => ({
      time: e.time ?? 0,
      key: e.key,
      msg: e.msg,
      user: e.user,
      ap_mac: e.ap_mac,
      site_id: e.site_id
    }));
    const truncated = !!((res.data as any)?.meta?.count);
    return { data: events, ...(truncated ? { truncated: true } : {}), ...(opts.raw ? { raw: res.data } : {}) };
  }
  throw new Error(`HTTP ${res.status}`);
}
