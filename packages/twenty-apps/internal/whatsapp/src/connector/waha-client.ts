import {
  type WahaChatOverview,
  type WahaClientOptions,
  type WahaLidMapping,
  type WahaMessage,
  type WahaSendTextParams,
  type WahaSession,
} from 'src/connector/types/waha-api.type';
import {
  readApplicationVariable,
  requireApplicationVariable,
} from 'src/utils/read-application-variable.util';
import { isDefined } from 'src/utils/type-guards.util';

export const WAHA_BASE_URL_VARIABLE = 'WAHA_BASE_URL';
export const WAHA_API_KEY_VARIABLE = 'WAHA_API_KEY';
export const WAHA_WEBHOOK_SECRET_VARIABLE = 'WAHA_WEBHOOK_SECRET';
export const WAHA_SESSION_NAME_VARIABLE = 'WAHA_SESSION_NAME';

export const DEFAULT_WAHA_SESSION_NAME = 'default';

// Jids contain `@`, which must never reach a URL path unencoded.
export const encodeWahaPathSegment = (segment: string): string =>
  encodeURIComponent(segment);

type WahaRequestArgs = {
  method: 'GET' | 'POST';
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: Record<string, unknown>;
};

// The single outbound-HTTP surface of this app. Deliberately retry-free: the
// webhook must answer fast and the cron simply runs again in fifteen minutes.
export class WahaClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(options: WahaClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.apiKey = options.apiKey;
  }

  // Reads the app's server variables. See read-application-variable.util for the
  // precedence between the SDK's variable blob and the plain environment.
  static fromApplicationVariables(): WahaClient {
    return new WahaClient({
      baseUrl: requireApplicationVariable(WAHA_BASE_URL_VARIABLE),
      apiKey: requireApplicationVariable(WAHA_API_KEY_VARIABLE),
    });
  }

  static getConfiguredSessionName(): string {
    return (
      readApplicationVariable(WAHA_SESSION_NAME_VARIABLE) ??
      DEFAULT_WAHA_SESSION_NAME
    );
  }

  async listSessions(): Promise<WahaSession[]> {
    return await this.request<WahaSession[]>({
      method: 'GET',
      path: '/api/sessions',
    });
  }

  async getChatsOverview({
    sessionName,
    limit,
    offset,
  }: {
    sessionName: string;
    limit?: number;
    offset?: number;
  }): Promise<WahaChatOverview[]> {
    return await this.request<WahaChatOverview[]>({
      method: 'GET',
      path: `/api/${encodeWahaPathSegment(sessionName)}/chats/overview`,
      query: { limit, offset },
    });
  }

  async listLidMappings({
    sessionName,
    limit,
  }: {
    sessionName: string;
    limit?: number;
  }): Promise<WahaLidMapping[]> {
    return await this.request<WahaLidMapping[]>({
      method: 'GET',
      path: `/api/${encodeWahaPathSegment(sessionName)}/lids`,
      query: { limit },
    });
  }

  async findPhoneJidByLid({
    sessionName,
    lid,
  }: {
    sessionName: string;
    lid: string;
  }): Promise<WahaLidMapping> {
    return await this.request<WahaLidMapping>({
      method: 'GET',
      path: `/api/${encodeWahaPathSegment(sessionName)}/lids/${encodeWahaPathSegment(lid)}`,
    });
  }

  async sendText({
    sessionName,
    chatId,
    text,
    replyToMessageId,
  }: WahaSendTextParams): Promise<WahaMessage> {
    return await this.request<WahaMessage>({
      method: 'POST',
      path: '/api/sendText',
      body: {
        session: sessionName,
        chatId,
        text,
        // WAHA treats a present `reply_to` as a quote, so the key must be absent
        // entirely rather than null when this is not a reply.
        ...(isDefined(replyToMessageId) ? { reply_to: replyToMessageId } : {}),
      },
    });
  }

  private buildUrl({ path, query }: Pick<WahaRequestArgs, 'path' | 'query'>) {
    const url = new URL(`${this.baseUrl}${path}`);

    for (const [key, value] of Object.entries(query ?? {})) {
      if (isDefined(value)) {
        url.searchParams.set(key, String(value));
      }
    }

    return url.toString();
  }

  private async request<TResponse>({
    method,
    path,
    query,
    body,
  }: WahaRequestArgs): Promise<TResponse> {
    const response = await fetch(this.buildUrl({ path, query }), {
      method,
      headers: {
        'X-Api-Key': this.apiKey,
        ...(isDefined(body) ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(isDefined(body) ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      const responseBody = await response.text();

      // The api key lives in a header and is never part of `path` or the body,
      // so echoing them back is safe.
      throw new Error(
        `WAHA ${method} ${path} failed: ${response.status} ${response.statusText} ${responseBody}`,
      );
    }

    return (await response.json()) as TResponse;
  }
}
