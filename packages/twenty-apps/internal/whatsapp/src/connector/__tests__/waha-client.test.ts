import { afterEach, describe, expect, it, vi } from 'vitest';

import { encodeWahaPathSegment, WahaClient } from 'src/connector/waha-client';

const API_KEY = 'super-secret-key';

const stubFetch = (payload: unknown) => {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  }));

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

const buildClient = () =>
  new WahaClient({ baseUrl: 'https://waha.example.com/', apiKey: API_KEY });

const getRequest = (fetchMock: ReturnType<typeof stubFetch>) => {
  const [url, init] = fetchMock.mock.calls[0] as unknown as [
    string,
    { headers: Record<string, string>; body?: string; method: string },
  ];

  return { url, init };
};

describe('encodeWahaPathSegment', () => {
  it('should percent-encode the @ in a jid so it never reaches the path raw', () => {
    expect(encodeWahaPathSegment('15045975105550@lid')).toBe(
      '15045975105550%40lid',
    );
  });
});

describe('WahaClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should send the api key in the X-Api-Key header on every request', async () => {
    const fetchMock = stubFetch([]);

    await buildClient().listSessions();

    const { url, init } = getRequest(fetchMock);

    expect(url).toBe('https://waha.example.com/api/sessions');
    expect(init.headers['X-Api-Key']).toBe(API_KEY);
  });

  it('should strip a trailing slash from the base url', async () => {
    const fetchMock = stubFetch([]);

    await buildClient().listSessions();

    expect(getRequest(fetchMock).url).not.toContain('//api');
  });

  it('should percent-encode a jid used as a path segment', async () => {
    const fetchMock = stubFetch({ lid: 'x', pn: 'y' });

    await buildClient().findPhoneJidByLid({
      sessionName: 'default',
      lid: '15045975105550@lid',
    });

    expect(getRequest(fetchMock).url).toBe(
      'https://waha.example.com/api/default/lids/15045975105550%40lid',
    );
  });

  it('should pass the limit as a query parameter and omit undefined ones', async () => {
    const fetchMock = stubFetch([]);

    await buildClient().getChatsOverview({
      sessionName: 'default',
      limit: 100,
    });

    const { url } = getRequest(fetchMock);

    expect(url).toContain('/api/default/chats/overview?limit=100');
    expect(url).not.toContain('offset');
  });

  it('should omit reply_to entirely when the message is not a reply', async () => {
    const fetchMock = stubFetch({ id: 'true_x@c.us_ABC' });

    await buildClient().sendText({
      sessionName: 'default',
      chatId: '8619880607709@c.us',
      text: 'hi',
    });

    const { url, init } = getRequest(fetchMock);
    const body = JSON.parse(init.body ?? '{}') as Record<string, unknown>;

    expect(url).toBe('https://waha.example.com/api/sendText');
    expect(init.method).toBe('POST');
    expect(body).toEqual({
      session: 'default',
      chatId: '8619880607709@c.us',
      text: 'hi',
    });
    expect('reply_to' in body).toBe(false);
  });

  it('should include reply_to when a reply target is given', async () => {
    const fetchMock = stubFetch({ id: 'true_x@c.us_ABC' });

    await buildClient().sendText({
      sessionName: 'default',
      chatId: '8619880607709@c.us',
      text: 'hi',
      replyToMessageId: 'false_8619880607709@c.us_ABC',
    });

    const body = JSON.parse(
      getRequest(fetchMock).init.body ?? '{}',
    ) as Record<string, unknown>;

    expect(body.reply_to).toBe('false_8619880607709@c.us_ABC');
  });

  it('should throw without echoing the api key when WAHA answers with an error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({}),
        text: async () => 'unauthorized',
      })),
    );

    const error = await buildClient()
      .listSessions()
      .catch((caught: Error) => caught);

    expect((error as Error).message).toContain('401 Unauthorized');
    expect((error as Error).message).not.toContain(API_KEY);
  });
});
