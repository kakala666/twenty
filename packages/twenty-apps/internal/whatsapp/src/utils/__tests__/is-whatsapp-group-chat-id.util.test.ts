import { describe, expect, it } from 'vitest';

import { isWhatsappGroupChatId } from 'src/utils/is-whatsapp-group-chat-id.util';

describe('isWhatsappGroupChatId', () => {
  it.each([
    ['120363427733002460@g.us', true],
    ['8619880607709@c.us', false],
    ['15045975105550@lid', false],
    ['8613383234307:3@s.whatsapp.net', false],
    ['status@broadcast', false],
    ['not-a-jid', false],
    ['', false],
  ])('should return %s -> %s', (chatId, expected) => {
    expect(isWhatsappGroupChatId(chatId as string)).toBe(expected);
  });
});
