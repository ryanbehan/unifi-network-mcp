import type { TargetConfig, ResultEnvelope, Device } from '../types.js';
import { HttpClient } from '../http.js';
import { ensureSession } from '../session.js';
import { sitePath } from '../router.js';

export interface GetDevicesOpts { site?: string; raw?: boolean; macs?: string[] }

export async function getDevices(target: TargetConfig, http: HttpClient, opts: GetDevicesOpts = {}): Promise<ResultEnvelope<Device[]>> {
  await ensureSession(target, http);
  const s = opts.site || target.default_site;

  let res;
  if (opts.macs && opts.macs.length > 0) {
    if (target.controller_type === 'classic') {
      res = await http.request<{ data?: any[]; meta?: any }>({
        method: 'POST',
        url: sitePath(target, s, 'stat/device'),
        data: { macs: opts.macs }
      });
    } else if (opts.macs.length === 1) {
      res = await http.request<{ data?: any[]; meta?: any }>({
        method: 'GET',
        url: sitePath(target, s, `stat/device/${encodeURIComponent(opts.macs[0])}`)
      });
    } else {
      res = await http.request<{ data?: any[]; meta?: any }>({
        method: 'GET',
        url: sitePath(target, s, 'stat/device')
      });
    }
  } else {
    res = await http.request<{ data?: any[]; meta?: any }>({ method: 'GET', url: sitePath(target, s, 'stat/device') });
  }

  if (res.status >= 200 && res.status < 300) {
    const list = ((res.data as any)?.data || []) as any[];
    const devices: Device[] = list.map((d: any) => ({
      mac: d.mac,
      type: d.type,
      model: d.model,
      name: d.name || d.adopted_name || d.hostname,
      ip: d.ip,
      version: d.version,
      adopted: d.adopted,
      state: d.state,
      uptime: d.uptime,
      site_id: d.site_id
    }));
    const truncated = !!((res.data as any)?.meta?.count);
    return { data: devices, ...(truncated ? { truncated: true } : {}), ...(opts.raw ? { raw: res.data } : {}) };
  }
  throw new Error(`HTTP ${res.status}`);
}
