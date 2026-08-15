import { defineIndex } from 'twenty-sdk/define';

import {
  WHATSAPP_MESSAGE_EXTERNAL_ID_FIELD_ID,
  WHATSAPP_MESSAGE_EXTERNAL_ID_UNIQUE_INDEX_FIELD_ID,
  WHATSAPP_MESSAGE_EXTERNAL_ID_UNIQUE_INDEX_ID,
  WHATSAPP_MESSAGE_OBJECT_ID,
} from '../constants/universal-identifiers';

// Uniqueness on the composite WAHA id is what makes ingestion idempotent:
// replaying a webhook or a backfill page cannot duplicate a message.
export default defineIndex({
  universalIdentifier: WHATSAPP_MESSAGE_EXTERNAL_ID_UNIQUE_INDEX_ID,
  objectUniversalIdentifier: WHATSAPP_MESSAGE_OBJECT_ID,
  isUnique: true,
  fields: [
    {
      universalIdentifier: WHATSAPP_MESSAGE_EXTERNAL_ID_UNIQUE_INDEX_FIELD_ID,
      fieldUniversalIdentifier: WHATSAPP_MESSAGE_EXTERNAL_ID_FIELD_ID,
    },
  ],
});
