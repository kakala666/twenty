import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  MESSAGES_ON_WHATSAPP_CHAT_FIELD_ID,
  WHATSAPP_CHAT_OBJECT_ID,
  WHATSAPP_CHAT_ON_WHATSAPP_MESSAGE_FIELD_ID,
  WHATSAPP_MESSAGE_OBJECT_ID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: MESSAGES_ON_WHATSAPP_CHAT_FIELD_ID,
  objectUniversalIdentifier: WHATSAPP_CHAT_OBJECT_ID,
  type: FieldType.RELATION,
  name: 'messages',
  label: 'Messages',
  icon: 'IconMessage',
  relationTargetObjectMetadataUniversalIdentifier: WHATSAPP_MESSAGE_OBJECT_ID,
  relationTargetFieldMetadataUniversalIdentifier:
    WHATSAPP_CHAT_ON_WHATSAPP_MESSAGE_FIELD_ID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
