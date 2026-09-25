/**
 * Iran Proxy Management Service
 * Manages Iranian residential and datacenter proxies to bypass geo-restrictions
 * and anti-bot blocks for Alibaba, FlyToday, and SafarMarket.
 */

import { ProxyAgent } from 'undici';

export interface IranProxyItem {
  url: string;
  ip: string;
  port: number;
  protocol: 'http' | 'https' | 'socks5';
  provider?: string;
  country: 'IR';
  status: 'active' | 'untested' | 'failed';
  latencyMs?: number;
  lastChecked?: string;
  isCustom?: boolean;
}

// Built-in seed of known Iranian HTTP/SOCKS proxies (Irancell, MCI, Shatel, Asiatech pools)
// These serve as immediate fallbacks if external proxy lists are temporarily unreachable.
const DEFAULT_IRAN_PROXIES: IranProxyItem[] = [
  {
    url: 'http://5.160.201.213:8080',
    ip: '5.160.201.213',
    port: 8080,
    protocol: 'http',
    provider: 'Shatel / Datacenter Tehran',
    country: 'IR',
    status: 'untested',
  },
  {
    url: 'http://185.128.81.99:80',
    ip: '185.128.81.99',
    port: 80,
    protocol: 'http',
    provider: 'Asiatech Tehran',
    country: 'IR',
    status: 'untested',
  },
  {
    url: 'http://91.99.100.12:8080',
    ip: '91.99.100.12',
    port: 8080,
    protocol: 'http',
    provider: 'MCI Mobile Iran',
    country: 'IR',
    status: 'untested',
  },
  {
    url: 'http://178.131.25.101:80',
    ip: '178.131.25.101',
    port: 80,
    protocol: 'http',
    provider: 'Irancell MTN',
    country: 'IR',
    status: 'untested',
  },
];

export class IranProxyService {
  private static proxyPool: IranProxyItem[] = [...DEFAULT_IRAN_PROXIES];
  private static activeProxy: IranProxyItem | null = null;
  private static isInitialized = false;

  /**
   * Initialize pool and load environment proxy if set
   */
  static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Check custom environment variable for dedicated Iran proxy
    const envProxy = process.env.IRAN_PROXY_URL || process.env.IRAN_RESIDENTIAL_PROXY;
    if (envProxy) {
      try {
        const parsed = new URL(envProxy);
        this.addCustomProxy({
          url: envProxy,
          ip: parsed.hostname,
          port: Number(parsed.port) || 8080,
          protocol: parsed.protocol.replace(':', '') as any,
          provider: 'Custom Configured Env Proxy',
          status: 'active',
          isCustom: true,
        });
      } catch {
        // Invalid URL ignore
      }
    }
  }

  /**
   * Get all proxies in the pool
   */
  static getAllProxies(): IranProxyItem[] {
    this.init();
    return [...this.proxyPool];
  }

  /**
   * Get currently active proxy or pick next best one
   */
  static getActiveProxy(): IranProxyItem | null {
    this.init();
    if (this.activeProxy && this.activeProxy.status === 'active') {
      return this.activeProxy;
    }
    const working = this.proxyPool.find((p) => p.status === 'active');
    if (working) {
      this.activeProxy = working;
      return working;
    }
    return this.proxyPool[0] || null;
  }

  /**
   * Add a custom proxy (e.g. from user/admin input)
   */
  static addCustomProxy(item: Partial<IranProxyItem> & { url: string }): IranProxyItem {
    this.init();
    let url = item.url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('socks5://')) {
      url = `http://${url}`;
    }

    let ip = item.ip || 'unknown';
    let port = item.port || 8080;
    try {
      const parsed = new URL(url);
      ip = parsed.hostname;
      port = Number(parsed.port) || (parsed.protocol === 'https:' ? 443 : 80);
    } catch {}

    const proxy: IranProxyItem = {
      url,
      ip,
      port,
      protocol: (url.startsWith('socks5') ? 'socks5' : url.startsWith('https') ? 'https' : 'http') as any,
      provider: item.provider || 'Custom Iran Proxy',
      country: 'IR',
      status: item.status || 'untested',
      isCustom: true,
    };

    // Remove existing if duplicate
    this.proxyPool = this.proxyPool.filter((p) => p.url !== proxy.url);
    this.proxyPool.unshift(proxy);
    if (proxy.status === 'active') {
      this.activeProxy = proxy;
    }
    return proxy;
  }

  /**
   * Create an undici ProxyAgent for fetch requests
   */
  static createDispatcher(proxyUrl?: string): ProxyAgent | undefined {
    this.init();
    const targetUrl = proxyUrl || this.getActiveProxy()?.url;
    if (!targetUrl) return undefined;

    try {
      return new ProxyAgent(targetUrl);
    } catch (err) {
      console.warn(`[IranProxyService] Failed to create ProxyAgent for ${targetUrl}:`, err);
      return undefined;
    }
  }

  /**
   * Test a single proxy by pinging an Iranian target or header test
   */
  static async testProxy(proxyUrl: string): Promise<{ success: boolean; latencyMs: number; message: string }> {
    this.init();
    const start = Date.now();
    try {
      const dispatcher = new ProxyAgent(proxyUrl);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);

      // Ping a reliable endpoint
      const response = await fetch('https://api.alibaba.ir/health/check', {
        method: 'GET',
        // @ts-ignore undici dispatcher
        dispatcher,
        signal: controller.signal,
      }).catch(async () => {
        // Fallback test
        return await fetch('https://httpbin.org/ip', {
          method: 'GET',
          // @ts-ignore undici dispatcher
          dispatcher,
          signal: controller.signal,
        });
      });

      clearTimeout(timeout);
      const latency = Date.now() - start;

      const proxyItem = this.proxyPool.find((p) => p.url === proxyUrl);
      if (proxyItem) {
        proxyItem.status = 'active';
        proxyItem.latencyMs = latency;
        proxyItem.lastChecked = new Date().toISOString();
        this.activeProxy = proxyItem;
      }

      return {
        success: true,
        latencyMs: latency,
        message: `پروکسی فعال است (تاخیر: ${latency} میلی‌ثانیه)`,
      };
    } catch (err: any) {
      const proxyItem = this.proxyPool.find((p) => p.url === proxyUrl);
      if (proxyItem) {
        proxyItem.status = 'failed';
        proxyItem.lastChecked = new Date().toISOString();
      }
      return {
        success: false,
        latencyMs: Date.now() - start,
        message: `اتصال برقرار نشد: ${err.message}`,
      };
    }
  }

  /**
   * Search and fetch live Iranian proxies from public repositories & APIs
   */
  static async searchAndFetchIranProxies(): Promise<{ fetched: number; total: number }> {
    this.init();
    let newFound = 0;

    const sources = [
      'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=10000&country=IR&ssl=all&anonymity=all',
      'https://raw.githubusercontent.com/daniyal-abbassi/iran-proxy/main/proxies.json',
      'https://raw.githubusercontent.com/proxifly/free-proxy-list/main/proxies/countries/IR/data.json',
    ];

    for (const source of sources) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(source, { signal: controller.signal });
        clearTimeout(timeout);

        if (!res.ok) continue;

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('json') || source.endsWith('.json')) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : json.proxies || [];
          for (const item of list) {
            const ip = item.ip || item.host;
            const port = item.port;
            if (ip && port) {
              const url = `http://${ip}:${port}`;
              if (!this.proxyPool.some((p) => p.url === url)) {
                this.proxyPool.push({
                  url,
                  ip,
                  port: Number(port),
                  protocol: (item.protocol || 'http').toLowerCase(),
                  provider: item.org || item.isp || 'Iran Public Proxy',
                  country: 'IR',
                  status: 'untested',
                });
                newFound++;
              }
            }
          }
        } else {
          // Plain text IP:PORT
          const text = await res.text();
          const lines = text.split(/\r?\n/);
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && trimmed.includes(':') && !trimmed.startsWith('#')) {
              const [ip, port] = trimmed.split(':');
              if (ip && port) {
                const url = `http://${ip}:${port}`;
                if (!this.proxyPool.some((p) => p.url === url)) {
                  this.proxyPool.push({
                    url,
                    ip,
                    port: Number(port),
                    protocol: 'http',
                    provider: 'ProxyScrape Iran Pool',
                    country: 'IR',
                    status: 'untested',
                  });
                  newFound++;
                }
              }
            }
          }
        }
      } catch (err) {
        // Silently skip failed source
      }
    }

    return { fetched: newFound, total: this.proxyPool.length };
  }
}
