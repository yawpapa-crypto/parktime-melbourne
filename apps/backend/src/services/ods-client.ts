/**
 * City of Melbourne OpenDataSoft Explore API v2.1 client.
 * @see https://data.melbourne.vic.gov.au/api/explore/v2.1
 */

const DEFAULT_BASE = "https://data.melbourne.vic.gov.au/api/explore/v2.1";
const DEFAULT_TIMEZONE = "Australia/Melbourne";
const DEFAULT_LANG = "en";
const MAX_RECORD_LIMIT = 100;
const MAX_OFFSET_PLUS_LIMIT = 10000;

export class OdsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "OdsApiError";
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isRateLimited() {
    return this.status === 429;
  }
}

export interface OdsRecordsResponse<T = Record<string, unknown>> {
  total_count: number;
  results: T[];
}

export interface OdsClientOptions {
  baseUrl?: string;
  apiKey?: string;
  timezone?: string;
  lang?: string;
  maxRetries?: number;
}

export interface FetchRecordsOptions {
  offset?: number;
  limit?: number;
  where?: string;
  select?: string;
}

export interface FetchAllRecordsOptions {
  maxRecords?: number;
  pageSize?: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MelbourneOdsClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly timezone: string;
  private readonly lang: string;
  private readonly maxRetries: number;

  constructor(options: OdsClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? process.env.MELBOURNE_COUNCIL_API_BASE ?? DEFAULT_BASE).replace(
      /\/catalog\/datasets\/?$/,
      "",
    );
    this.apiKey = options.apiKey ?? process.env.MELBOURNE_OPENDATA_API_KEY;
    this.timezone = options.timezone ?? DEFAULT_TIMEZONE;
    this.lang = options.lang ?? DEFAULT_LANG;
    this.maxRetries = options.maxRetries ?? 3;
  }

  private buildUrl(path: string, params: Record<string, string | number | undefined>): string {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
    if (this.apiKey) url.searchParams.set("apikey", this.apiKey);
    url.searchParams.set("timezone", this.timezone);
    url.searchParams.set("lang", this.lang);
    return url.toString();
  }

  private async request(url: string, accept: string, allowKeylessRetry = true): Promise<Response> {
    let attempt = 0;
    let triedWithoutKey = false;

    while (attempt <= this.maxRetries) {
      const res = await fetch(url, { headers: { Accept: accept } });

      if (res.ok) return res;

      if (res.status === 401) {
        const body = await res.text().catch(() => "");
        const invalidKey = body.toLowerCase().includes("api key is not valid");
        if (invalidKey && allowKeylessRetry && this.apiKey && !triedWithoutKey) {
          triedWithoutKey = true;
          url = url.replace(/([?&])apikey=[^&]*&?/, "$1").replace(/\?$/, "");
          continue;
        }
        throw new OdsApiError(
          invalidKey
            ? "ODS unauthorized — MELBOURNE_OPENDATA_API_KEY is not valid"
            : "ODS unauthorized — check MELBOURNE_OPENDATA_API_KEY",
          401,
        );
      }

      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("retry-after") ?? "5");
        if (attempt < this.maxRetries) {
          await sleep(retryAfter * 1000);
          attempt++;
          continue;
        }
        throw new OdsApiError(`ODS rate limited: ${url}`, 429, retryAfter);
      }

      const body = await res.text().catch(() => "");
      throw new OdsApiError(`ODS request failed (${res.status}): ${body.slice(0, 200)}`, res.status);
    }

    throw new OdsApiError("ODS request exhausted retries", 500);
  }

  async fetchRecords<T = Record<string, unknown>>(
    datasetId: string,
    options: FetchRecordsOptions = {},
  ): Promise<OdsRecordsResponse<T>> {
    const limit = Math.min(options.limit ?? MAX_RECORD_LIMIT, MAX_RECORD_LIMIT);
    const offset = options.offset ?? 0;

    if (offset + limit >= MAX_OFFSET_PLUS_LIMIT) {
      throw new OdsApiError(
        `ODS records pagination cap reached (offset+limit must be < ${MAX_OFFSET_PLUS_LIMIT}). Use export instead.`,
        400,
      );
    }

    const url = this.buildUrl(`/catalog/datasets/${datasetId}/records`, {
      limit,
      offset,
      where: options.where,
      select: options.select,
    });

    const res = await this.request(url, "application/json");
    return (await res.json()) as OdsRecordsResponse<T>;
  }

  async fetchAllRecords<T = Record<string, unknown>>(
    datasetId: string,
    options: FetchAllRecordsOptions = {},
  ): Promise<T[]> {
    const pageSize = Math.min(options.pageSize ?? MAX_RECORD_LIMIT, MAX_RECORD_LIMIT);
    const maxRecords = options.maxRecords ?? MAX_OFFSET_PLUS_LIMIT - pageSize;
    const records: T[] = [];
    let offset = 0;

    while (offset + pageSize < MAX_OFFSET_PLUS_LIMIT && records.length < maxRecords) {
      const page = await this.fetchRecords<T>(datasetId, { offset, limit: pageSize });
      if (!page.results.length) break;
      records.push(...page.results);
      offset += page.results.length;
      if (page.results.length < pageSize) break;
      if (page.total_count != null && offset >= page.total_count) break;
    }

    return records;
  }

  async fetchExportGeoJson(datasetId: string): Promise<{ type: string; features?: unknown[] }> {
    const url = this.buildUrl(`/catalog/datasets/${datasetId}/exports/geojson`, { limit: -1 });
    const res = await this.request(url, "application/geo+json, application/json");
    return (await res.json()) as { type: string; features?: unknown[] };
  }

  async fetchExportJson<T = Record<string, unknown>>(datasetId: string): Promise<T[]> {
    const url = this.buildUrl(`/catalog/datasets/${datasetId}/exports/json`, { limit: -1 });
    const res = await this.request(url, "application/json");
    const json = (await res.json()) as T[] | { results?: T[] };
    if (Array.isArray(json)) return json;
    return json.results ?? [];
  }

  async fetchDatasetFeatures(datasetId: string): Promise<unknown[]> {
    try {
      const geo = await this.fetchExportGeoJson(datasetId);
      return geo.features ?? [];
    } catch (err) {
      if (err instanceof OdsApiError && (err.isUnauthorized || err.status === 404)) throw err;
      try {
        return await this.fetchExportJson(datasetId);
      } catch (exportErr) {
        if (exportErr instanceof OdsApiError && exportErr.isUnauthorized) throw exportErr;
        return this.fetchAllRecords(datasetId);
      }
    }
  }
}

export const melbourneOds = new MelbourneOdsClient();
