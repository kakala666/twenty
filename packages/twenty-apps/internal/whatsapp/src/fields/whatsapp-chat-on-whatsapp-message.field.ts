import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  MESSAGES_ON_WHATSAPP_CHAT_FIELD_ID,
  WHATSAPP_CHAT_OBJECT_ID,
  WHATSAPP_CHAT_ON_WHATSAPP_MESSAGE_FIELD_ID,
  WHATSAPP_MESSAGE_OBJECT_ID,
} from '../constants/universal-identifiers';

// The join column is `whatsappChatId`, not `chatId`: `chatId` is already the
// name of the TEXT field holding the raw WAHA chat id on whatsappChat.
export default defineField({
  universalIdentifier: WHATSAPP_CHAT_ON_WHATSAPP_MESSAGE_FIELD_ID,
  objectUniversalIdentifier: WHATSAPP_MESSAGE_OBJECT_ID,
  type: FieldType.RELATION,
  name: 'whatsappChat',
  label: 'Chat',
  icon: 'IconMessages',
  relationTargetObjectMetadataUniversalIdentifier: WHATSAPP_CHAT_OBJECT_ID,
  relationTargetFieldMetadataUniversalIdentifier:
    MESSAGES_ON_WHATSAPP_CHAT_FIELD_ID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'whatsappChatId',
  },
});
