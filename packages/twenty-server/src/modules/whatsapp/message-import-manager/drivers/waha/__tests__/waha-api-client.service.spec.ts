import axios from 'axios';

import { WahaApiClientService } from 'src/modules/whatsapp/message-import-manager/drivers/waha/waha-api-client.service';

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

      await service.getChats({ sessionName: 'default', limit: 50, offset: 100 });

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
        { id: '8619880607709@c.us', name: 'Ada', conversationTimestamp: 1786829197 },
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
});
