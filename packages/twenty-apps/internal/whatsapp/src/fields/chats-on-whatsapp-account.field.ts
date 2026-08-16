import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  ACCOUNT_ON_WHATSAPP_CHAT_FIELD_ID,
  CHATS_ON_WHATSAPP_ACCOUNT_FIELD_ID,
  WHATSAPP_ACCOUNT_OBJECT_ID,
  WHATSAPP_CHAT_OBJECT_ID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: CHATS_ON_WHATSAPP_ACCOUNT_FIELD_ID,
  objectUniversalIdentifier: WHATSAPP_ACCOUNT_OBJECT_ID,
  type: FieldType.RELATION,
  name: 'chats',
  label: 'Chats',
  icon: 'IconMessages',
  // Inverse of the sync-owned `account` relation: attaching a chat from this
  // side would write the same `accountId` the sync owns.
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: WHATSAPP_CHAT_OBJECT_ID,
  relationTargetFieldMetadataUniversalIdentifier:
    ACCOUNT_ON_WHATSAPP_CHAT_FIELD_ID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
