import { type WhatsappMessageDayGroup } from '@/whatsapp/types/WhatsappMessageDayGroup';
import { type WhatsappMessageRecord } from '@/whatsapp/types/WhatsappMessageRecord';

const getLocalDayKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

// Expects messages already ordered oldest-first; groups are emitted in the same
// order so the caller can render them straight into the thread.
export const groupWhatsappMessagesByDay = (
  whatsappMessages: WhatsappMessageRecord[],
): WhatsappMessageDayGroup[] => {
  const dayGroups: WhatsappMessageDayGroup[] = [];

  for (const whatsappMessage of whatsappMessages) {
    const sentAtDate = new Date(whatsappMessage.sentAt);

    if (Number.isNaN(sentAtDate.getTime())) {
      continue;
    }

    const dayKey = getLocalDayKey(sentAtDate);
    const lastDayGroup = dayGroups.at(-1);

    if (lastDayGroup?.dayKey === dayKey) {
      lastDayGroup.whatsappMessages.push(whatsappMessage);
      continue;
    }

    dayGroups.push({
      dayKey,
      dayDate: sentAtDate,
      whatsappMessages: [whatsappMessage],
    });
  }

  return dayGroups;
};
