import { defineLogicFunction } from 'twenty-sdk/define';

import { WHATSAPP_SYNC_CHATS_FUNCTION_ID } from 'src/constants/universal-identifiers';
import { syncWhatsappChats } from 'src/logic-functions/handlers/sync-whatsapp-chats';

export default defineLogicFunction({
  universalIdentifier: WHATSAPP_SYNC_CHATS_FUNCTION_ID,
  name: 'whatsapp-sync-chats',
  description:
    'Refreshes WhatsApp accounts and chats from WAHA. Does not import message history.',
  // A full run is one sessions call plus two calls per session; 120s leaves room
  // for an account with many chats.
  timeoutSeconds: 120,
  handler: syncWhatsappChats,
  cronTriggerSettings: {
    pattern: '*/15 * * * *',
  },
});
