import { type WhatsappMessageRecord } from '@/whatsapp/types/WhatsappMessageRecord';
import { groupWhatsappMessagesByDay } from '@/whatsapp/utils/groupWhatsappMessagesByDay';

const buildWhatsappMessage = (
  id: string,
  sentAt: string,
): WhatsappMessageRecord =>
  ({
    id,
    externalId: id,
    waMessageId: id,
    text: id,
    sentAt,
    direction: 'INBOUND',
    ackStatus: null,
    senderId: null,
    senderName: null,
    replyToExternalId: null,
    hasMedia: false,
    mediaMimeType: null,
    whatsappChatId: 'chat-record-id',
  }) as WhatsappMessageRecord;

describe('groupWhatsappMessagesByDay', () => {
  it('should return no group for an empty thread', () => {
    expect(groupWhatsappMessagesByDay([])).toEqual([]);
  });

  it('should keep messages sent on the same local day in one group', () => {
    const dayGroups = groupWhatsappMessagesByDay([
      buildWhatsappMessage('first', '2026-03-04T09:00:00.000Z'),
      buildWhatsappMessage('second', '2026-03-04T10:30:00.000Z'),
    ]);

    expect(dayGroups).toHaveLength(1);
    expect(
      dayGroups[0].whatsappMessages.map(
        (whatsappMessage) => whatsappMessage.id,
      ),
    ).toEqual(['first', 'second']);
  });

  it('should split consecutive days into separate groups in order', () => {
    const dayGroups = groupWhatsappMessagesByDay([
      buildWhatsappMessage('first', '2026-03-04T09:00:00.000Z'),
      buildWhatsappMessage('second', '2026-03-05T09:00:00.000Z'),
      buildWhatsappMessage('third', '2026-03-05T18:00:00.000Z'),
    ]);

    expect(dayGroups).toHaveLength(2);
    expect(dayGroups[0].whatsappMessages).toHaveLength(1);
    expect(dayGroups[1].whatsappMessages).toHaveLength(2);
    expect(dayGroups[0].dayKey < dayGroups[1].dayKey).toBe(true);
  });

  it('should skip messages with an unparseable timestamp', () => {
    const dayGroups = groupWhatsappMessagesByDay([
      buildWhatsappMessage('broken', 'not-a-date'),
      buildWhatsappMessage('valid', '2026-03-04T09:00:00.000Z'),
    ]);

    expect(dayGroups).toHaveLength(1);
    expect(dayGroups[0].whatsappMessages[0].id).toBe('valid');
  });
});
