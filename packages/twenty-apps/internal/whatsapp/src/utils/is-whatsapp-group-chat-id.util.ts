import { parseWhatsappJid } from 'src/utils/parse-whatsapp-jid.util';

// WAHA exposes no `isGroup` flag on chats or chat overviews, so the only signal
// is the `@g.us` server in the chat id.
export const isWhatsappGroupChatId = (chatId: string): boolean =>
  parseWhatsappJid(chatId).kind === 'GROUP';
