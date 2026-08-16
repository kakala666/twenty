import { type WhatsappMessageRecord } from '@/whatsapp/types/WhatsappMessageRecord';

export type WhatsappMessageDayGroup = {
  // `yyyy-MM-dd` in local time, stable enough to key a React list on.
  dayKey: string;
  dayDate: Date;
  whatsappMessages: WhatsappMessageRecord[];
};
