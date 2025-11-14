import type { TargetConfig, ResultEnvelope, Client } from '../types.js';
import { HttpClient } from '../http.js';
import { ensureSession } from '../session.js';
import { sitePath } from '../router.js';

export interface GetClientsOpts { site?: string; raw?: boolean; active_only?: boolean }

export async function getClients(target: TargetConfig, http: HttpClient, opts: GetClientsOpts = {}): Promise<ResultEnvelope<Client[]>> {
  await ensureSession(target, http);
  const s = opts.site || target.default_site;

  if (opts.active_only) {
    const res = await http.request<{ data?: any[]; meta?: any }>({ method: 'GET', url: sitePath(target, s, 'stat/sta') });
    if (res.status >= 200 && res.status < 300) {
      const list = ((res.data as any)?.data || []) as any[];
      const clients: Client[] = list.map((c: any) => ({
        mac: c.mac,
        hostname: c.hostname || c.name,
        ip: c.ip,
        user_id: c.user_id,
        is_active: true,
        ap_mac: c.ap_mac,
        rx_bytes: c.rx_bytes,
        tx_bytes: c.tx_bytes,
        site_id: c.site_id
      }));
      const truncated = !!((res.data as any)?.meta?.count);
      return { data: clients, ...(truncated ? { truncated: true } : {}), ...(!!opts.raw ? { raw: res.data } : {}) };
    }
    throw new Error(`HTTP ${res.status}`);
  }

  // Combine known clients (rest/user) with active (stat/sta)
  const [knownRes, activeRes] = await Promise.all([
    http.request<{ data?: any[]; meta?: any }>({ method: 'GET', url: sitePath(target, s, 'rest/user') }),
    http.request<{ data?: any[]; meta?: any }>({ method: 'GET', url: sitePath(target, s, 'stat/sta') })
  ]);
  if ((knownRes.status >= 200 && knownRes.status < 300) && (activeRes.status >= 200 && activeRes.status < 300)) {
    const activeMap = new Map<string, any>(((activeRes.data as any)?.data || []).map((c: any) => [c.mac, c]));
    const list = ((knownRes.data as any)?.data || []) as any[];
    const clients: Client[] = list.map((c: any) => {
      const a = activeMap.get(c.mac);
      return {
        mac: c.mac,
        hostname: c.hostname || c.name,
        ip: a?.ip || c.last_ip,
        user_id: c._id,
        is_active: !!a,
        ap_mac: a?.ap_mac,
        rx_bytes: a?.rx_bytes,
        tx_bytes: a?.tx_bytes,
        site_id: c.site_id
      } as Client;
    });
    const truncated = !!((knownRes.data as any)?.meta?.count || (activeRes.data as any)?.meta?.count);
    return { data: clients, ...(truncated ? { truncated: true } : {}), ...(!!opts.raw ? { raw: { known: knownRes.data, active: activeRes.data } } : {}) };
  }
  throw new Error(`HTTP ${knownRes.status}/${activeRes.status}`);
}
