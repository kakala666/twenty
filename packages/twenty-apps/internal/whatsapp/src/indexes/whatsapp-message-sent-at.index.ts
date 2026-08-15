import { defineIndex } from 'twenty-sdk/define';

import {
  WHATSAPP_MESSAGE_OBJECT_ID,
  WHATSAPP_MESSAGE_SENT_AT_FIELD_ID,
  WHATSAPP_MESSAGE_SENT_AT_INDEX_FIELD_ID,
  WHATSAPP_MESSAGE_SENT_AT_INDEX_ID,
} from '../constants/universal-identifiers';

// Every conversation read and every backfill watermark comparison orders by
// sentAt, so it carries the read path.
export default defineIndex({
  universalIdentifier: WHATSAPP_MESSAGE_SENT_AT_INDEX_ID,
  objectUniversalIdentifier: WHATSAPP_MESSAGE_OBJECT_ID,
  fields: [
    {
      universalIdentifier: WHATSAPP_MESSAGE_SENT_AT_INDEX_FIELD_ID,
      fieldUniversalIdentifier: WHATSAPP_MESSAGE_SENT_AT_FIELD_ID,
    },
  ],
});
