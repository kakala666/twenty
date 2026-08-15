import axios from 'axios';

import {
  WAHA_REQUEST_TIMEOUT_IN_MS,
  WahaApiClientService,
} from 'src/modules/whatsapp/message-import-manager/drivers/waha/waha-api-client.service';
import {
  WhatsappDriverException,
  WhatsappDriverExceptionCode,
} from 'src/modules/whatsapp/message-import-manager/drivers/waha/whatsapp-driver.exception';

jest.mock('axios');

const WAHA_BASE_URL = 'https://waha.example.com';
const WAHA_API_KEY = 'test-api-key';

describe('WahaApiClientService', () => {
  let service: WahaApiClientService;
  let request: jest.Mock;

  beforeEach(() => {
    request = jest.fn();
    (axios.create as jest.Mock).mockReturnValue({ request });

    service = new WahaApiClientService({
      baseUrl: WAHA_BASE_URL,
      apiKey: WAHA_API_KEY,
    });
  });

  describe('configuration', () => {
    it('should build the http client on the configured base url with a request timeout when constructed', () => {
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: WAHA_BASE_URL,
          timeout: WAHA_REQUEST_TIMEOUT_IN_MS,
        }),
      );
    });
  });

  describe('listSessions', () => {
    it('should GET /api/sessions with the X-Api-Key header when listing sessions', async () => {
      const sessions = [{ name: 'default', status: 'WORKING' }];

      request.mockResolvedValue({ status: 200, data: sessions });

      const result = await service.listSessions();

      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/api/sessions',
          headers: { 'X-Api-Key': WAHA_API_KEY },
        }),
      );
      expect(result).toEqual(sessions);
    });
  });

  describe('getChats', () => {
    it('should interpolate the session name into the path when fetching chats', async () => {
      request.mockResolvedValue({ status: 200, data: [] });

      await service.getChats({
        sessionName: 'default',
        limit: 50,
        offset: 100,
      });

      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/api/default/chats',
          params: { limit: 50, offset: 100 },
        }),
      );
    });

    // WAHA list endpoints answer with a bare JSON array: no envelope, no total
    // and no cursor, so there is nothing for the client to unwrap.
    it('should return the bare array as-is when the endpoint responds without an envelope', async () => {
      const chats = [
        {
          id: '8619880607709@c.us',
          name: 'Ada',
          conversationTimestamp: 1786829197,
        },
      ];

      request.mockResolvedValue({ status: 200, data: chats });

      const result = await service.getChats({ sessionName: 'default' });

      expect(result).toEqual(chats);
    });
  });

  describe('getChatsOverview', () => {
    it('should GET the chats overview path when fetching the overview', async () => {
      request.mockResolvedValue({ status: 200, data: [] });

      await service.getChatsOverview({
        sessionName: 'default',
        limit: 20,
        offset: 0,
      });

      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/api/default/chats/overview',
          params: { limit: 20, offset: 0 },
        }),
      );
    });
  });

  describe('getChatMessages', () => {
    it('should percent-encode the chat id in the path when fetching chat messages', async () => {
      request.mockResolvedValue({ status: 200, data: [] });

      await service.getChatMessages({
        sessionName: 'default',
        chatId: '8619880607709@c.us',
      });

      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/api/default/chats/8619880607709%40c.us/messages',
        }),
      );
    });

    // Backfill slices by time window, so the two filter keys and their unit are
    // part of the contract this client has to honour exactly.
    it('should send the timestamp bounds as filter.timestamp params in unix seconds when a window is given', async () => {
      request.mockResolvedValue({ status: 200, data: [] });

      await service.getChatMessages({
        sessionName: 'default',
        chatId: '8619880607709@c.us',
        limit: 100,
        offset: 0,
        gteInSeconds: 1786742797,
        lteInSeconds: 1786829197,
        downloadMedia: true,
      });

      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: {
            limit: 100,
            offset: 0,
            downloadMedia: true,
            'filter.timestamp.gte': 1786742797,
            'filter.timestamp.lte': 1786829197,
          },
        }),
      );
    });
  });

  describe('sendText', () => {
    it('should POST /api/sendText without a reply_to key when no reply target is given', async () => {
      const sentMessage = { id: 'true_8619880607709@c.us_3EB0FBAD' };

      request.mockResolvedValue({ status: 201, data: sentMessage });

      const result = await service.sendText({
        sessionName: 'default',
        chatId: '8619880607709@c.us',
        text: 'hello',
      });

      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/api/sendText',
          headers: { 'X-Api-Key': WAHA_API_KEY },
          data: {
            session: 'default',
            chatId: '8619880607709@c.us',
            text: 'hello',
          },
        }),
      );
      expect(request.mock.calls[0][0].data).not.toHaveProperty('reply_to');
      expect(result).toEqual(sentMessage);
    });

    it('should include reply_to in the body when a reply target is given', async () => {
      request.mockResolvedValue({ status: 201, data: {} });

      await service.sendText({
        sessionName: 'default',
        chatId: '8619880607709@c.us',
        text: 'sure',
        replyToMessageId: 'false_8619880607709@c.us_3EB0FBAD',
      });

      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            session: 'default',
            chatId: '8619880607709@c.us',
            text: 'sure',
            reply_to: 'false_8619880607709@c.us_3EB0FBAD',
          },
        }),
      );
    });
  });

  describe('listLidMappings', () => {
    it('should return the bare lid-to-phone mapping array when listing lid mappings', async () => {
      const mappings = [
        { lid: '15045975105550@lid', pn: '8619880607709@c.us' },
      ];

      request.mockResolvedValue({ status: 200, data: mappings });

      const result = await service.listLidMappings({ sessionName: 'default' });

      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/api/default/lids',
        }),
      );
      expect(result).toEqual(mappings);
    });
  });

  describe('findPhoneJidByLid', () => {
    it('should percent-encode the lid in the path when resolving a single lid', async () => {
      const mapping = { lid: '15045975105550@lid', pn: '8619880607709@c.us' };

      request.mockResolvedValue({ status: 200, data: mapping });

      const result = await service.findPhoneJidByLid({
        sessionName: 'default',
        lid: '15045975105550@lid',
      });

      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/api/default/lids/15045975105550%40lid',
        }),
      );
      expect(result).toEqual(mapping);
    });
  });

  describe('error handling', () => {
    it('should raise a WhatsappDriverException carrying the status code when the response is not 2xx', async () => {
      request.mockResolvedValue({
        status: 500,
        data: { message: 'boom' },
      });

      const error = await service.listSessions().catch((thrown) => thrown);

      expect(error).toBeInstanceOf(WhatsappDriverException);
      expect(error.code).toBe(WhatsappDriverExceptionCode.PROVIDER_ERROR);
      expect(error.statusCode).toBe(500);
    });

    it('should raise an UNAUTHORIZED exception when the api key is rejected', async () => {
      request.mockResolvedValue({ status: 401, data: {} });

      const error = await service.listSessions().catch((thrown) => thrown);

      expect(error).toBeInstanceOf(WhatsappDriverException);
      expect(error.code).toBe(WhatsappDriverExceptionCode.UNAUTHORIZED);
      expect(error.statusCode).toBe(401);
    });

    it('should raise a NOT_FOUND exception when the session does not exist', async () => {
      request.mockResolvedValue({ status: 404, data: {} });

      const error = await service
        .getChats({ sessionName: 'missing' })
        .catch((thrown) => thrown);

      expect(error).toBeInstanceOf(WhatsappDriverException);
      expect(error.code).toBe(WhatsappDriverExceptionCode.NOT_FOUND);
      expect(error.statusCode).toBe(404);
    });

    it('should raise a NETWORK_ERROR exception with no status code when the connection is refused', async () => {
      const connectionRefused = Object.assign(
        new Error('connect ECONNREFUSED 127.0.0.1:3000'),
        { isAxiosError: true, code: 'ECONNREFUSED' },
      );

      request.mockRejectedValue(connectionRefused);

      const error = await service.listSessions().catch((thrown) => thrown);

      expect(error).toBeInstanceOf(WhatsappDriverException);
      expect(error.code).toBe(WhatsappDriverExceptionCode.NETWORK_ERROR);
      expect(error.statusCode).toBeUndefined();
      expect(error.cause).toBe(connectionRefused);
    });

    // Driven by axios' own timeout setting, so no timers are involved here and
    // jest's global fake timers stay out of the way.
    it('should raise a NETWORK_ERROR exception when the request times out', async () => {
      request.mockRejectedValue(
        Object.assign(new Error('timeout of 30000ms exceeded'), {
          isAxiosError: true,
          code: 'ECONNABORTED',
        }),
      );

      const error = await service
        .getChats({ sessionName: 'default' })
        .catch((thrown) => thrown);

      expect(error).toBeInstanceOf(WhatsappDriverException);
      expect(error.code).toBe(WhatsappDriverExceptionCode.NETWORK_ERROR);
    });
  });
});
