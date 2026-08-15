import { defineIndex } from 'twenty-sdk/define';

import {
  WHATSAPP_CHAT_CHAT_ID_FIELD_ID,
  WHATSAPP_CHAT_CHAT_ID_INDEX_FIELD_ID,
  WHATSAPP_CHAT_CHAT_ID_INDEX_ID,
  WHATSAPP_CHAT_OBJECT_ID,
} from '../constants/universal-identifiers';

// Inbound webhooks arrive keyed by the WAHA chat id, so the chat lookup on the
// ingestion hot path goes through this column.
export default defineIndex({
  universalIdentifier: WHATSAPP_CHAT_CHAT_ID_INDEX_ID,
  objectUniversalIdentifier: WHATSAPP_CHAT_OBJECT_ID,
  fields: [
    {
      universalIdentifier: WHATSAPP_CHAT_CHAT_ID_INDEX_FIELD_ID,
      fieldUniversalIdentifier: WHATSAPP_CHAT_CHAT_ID_FIELD_ID,
    },
  ],
});
