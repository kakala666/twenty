import { Inject, Injectable } from '@nestjs/common';

import axios, { type AxiosInstance } from 'axios';
import { isDefined } from 'twenty-shared/utils';

import { type WhatsappLidToPhoneJid } from 'src/modules/whatsapp/common/types/whatsapp-identity.type';
import {
  WAHA_API_CLIENT_OPTIONS,
  type WahaApiClientOptions,
  type WahaChat,
  type WahaChatOverview,
  type WahaGetChatMessagesParams,
  type WahaMessage,
  type WahaPaginationParams,
  type WahaSendTextParams,
  type WahaSession,
} from 'src/modules/whatsapp/message-import-manager/drivers/waha/types/waha-api.type';
import {
  WhatsappDriverException,
  WhatsappDriverExceptionCode,
} from 'src/modules/whatsapp/message-import-manager/drivers/waha/whatsapp-driver.exception';

// 401/403 and 404 are the two operationally distinct WAHA failures: a bad key
// and a missing session or chat. Neither is worth retrying.
const toWhatsappDriverExceptionCode = (
  status: number,
): WhatsappDriverExceptionCode => {
  if (status === 401 || status === 403) {
    return WhatsappDriverExceptionCode.UNAUTHORIZED;
  }

  if (status === 404) {
    return WhatsappDriverExceptionCode.NOT_FOUND;
  }

  return WhatsappDriverExceptionCode.PROVIDER_ERROR;
};

// WAHA proxies a live WhatsApp session, so a hung request must not pin a worker
// slot indefinitely. Retrying is deliberately left to the queue layer.
export const WAHA_REQUEST_TIMEOUT_IN_MS = 30_000;

@Injectable()
export class WahaApiClientService {
  private readonly httpClient: AxiosInstance;
  private readonly apiKey: string;

  constructor(@Inject(WAHA_API_CLIENT_OPTIONS) options: WahaApiClientOptions) {
    this.apiKey = options.apiKey;
    // Statuses are classified here rather than by axios, so that callers only
    // ever see WhatsappDriverException and never a raw AxiosError.
    this.httpClient = axios.create({
      baseURL: options.baseUrl,
      timeout: WAHA_REQUEST_TIMEOUT_IN_MS,
      validateStatus: () => true,
    });
  }

  async listSessions(): Promise<WahaSession[]> {
    return await this.request<WahaSession[]>({
      method: 'GET',
      url: '/api/sessions',
    });
  }

  async getChats({
    sessionName,
    limit,
    offset,
  }: { sessionName: string } & WahaPaginationParams): Promise<WahaChat[]> {
    return await this.request<WahaChat[]>({
      method: 'GET',
      url: `/api/${sessionName}/chats`,
      params: { limit, offset },
    });
  }

  async getChatsOverview({
    sessionName,
    limit,
    offset,
  }: { sessionName: string } & WahaPaginationParams): Promise<
    WahaChatOverview[]
  > {
    return await this.request<WahaChatOverview[]>({
      method: 'GET',
      url: `/api/${sessionName}/chats/overview`,
      params: { limit, offset },
    });
  }

  async getChatMessages({
    sessionName,
    chatId,
    limit,
    offset,
    gteInSeconds,
    lteInSeconds,
    downloadMedia,
  }: WahaGetChatMessagesParams): Promise<WahaMessage[]> {
    return await this.request<WahaMessage[]>({
      method: 'GET',
      // Chat ids carry an `@`, which must not leak into the path unencoded.
      url: `/api/${sessionName}/chats/${encodeURIComponent(chatId)}/messages`,
      params: {
        limit,
        offset,
        downloadMedia,
        'filter.timestamp.gte': gteInSeconds,
        'filter.timestamp.lte': lteInSeconds,
      },
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
      url: '/api/sendText',
      data: {
        session: sessionName,
        chatId,
        text,
        // WAHA treats a present `reply_to` as a quote, so the key must be
        // absent entirely rather than null when this is not a reply.
        ...(isDefined(replyToMessageId) ? { reply_to: replyToMessageId } : {}),
      },
    });
  }

  async listLidMappings({
    sessionName,
  }: {
    sessionName: string;
  }): Promise<WhatsappLidToPhoneJid[]> {
    return await this.request<WhatsappLidToPhoneJid[]>({
      method: 'GET',
      url: `/api/${sessionName}/lids`,
    });
  }

  async findPhoneJidByLid({
    sessionName,
    lid,
  }: {
    sessionName: string;
    lid: string;
  }): Promise<WhatsappLidToPhoneJid> {
    return await this.request<WhatsappLidToPhoneJid>({
      method: 'GET',
      url: `/api/${sessionName}/lids/${encodeURIComponent(lid)}`,
    });
  }

  private async request<TResponse>({
    method,
    url,
    params,
    data,
  }: {
    method: 'GET' | 'POST';
    url: string;
    params?: Record<string, string | number | boolean | undefined>;
    data?: Record<string, string | number | boolean>;
  }): Promise<TResponse> {
    const response = await this.httpClient
      .request({
        method,
        url,
        headers: { 'X-Api-Key': this.apiKey },
        params,
        data,
      })
      .catch((error: unknown) => {
        // No response came back at all: refused connection, DNS failure or a
        // client-side timeout.
        throw new WhatsappDriverException(
          `WAHA ${method} ${url} failed: ${error instanceof Error ? error.message : String(error)}`,
          WhatsappDriverExceptionCode.NETWORK_ERROR,
          { cause: error instanceof Error ? error : undefined },
        );
      });

    if (response.status < 200 || response.status >= 300) {
      throw new WhatsappDriverException(
        `WAHA ${method} ${url} failed with HTTP ${response.status}`,
        toWhatsappDriverExceptionCode(response.status),
        { statusCode: response.status },
      );
    }

    return response.data as TResponse;
  }
}
