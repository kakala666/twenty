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

@Injectable()
export class WahaApiClientService {
  private readonly httpClient: AxiosInstance;
  private readonly apiKey: string;

  constructor(
    @Inject(WAHA_API_CLIENT_OPTIONS) options: WahaApiClientOptions,
  ) {
    this.apiKey = options.apiKey;
    this.httpClient = axios.create({ baseURL: options.baseUrl });
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
    const response = await this.httpClient.request({
      method,
      url,
      headers: { 'X-Api-Key': this.apiKey },
      params,
      data,
    });

    return response.data as TResponse;
  }
}
