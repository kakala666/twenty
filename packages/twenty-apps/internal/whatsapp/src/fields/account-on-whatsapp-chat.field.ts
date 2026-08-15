import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  ACCOUNT_ON_WHATSAPP_CHAT_FIELD_ID,
  CHATS_ON_WHATSAPP_ACCOUNT_FIELD_ID,
  WHATSAPP_ACCOUNT_OBJECT_ID,
  WHATSAPP_CHAT_OBJECT_ID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: ACCOUNT_ON_WHATSAPP_CHAT_FIELD_ID,
  objectUniversalIdentifier: WHATSAPP_CHAT_OBJECT_ID,
  type: FieldType.RELATION,
  name: 'account',
  label: 'Account',
  description: 'WhatsApp number this conversation belongs to',
  icon: 'IconBrandWhatsapp',
  relationTargetObjectMetadataUniversalIdentifier: WHATSAPP_ACCOUNT_OBJECT_ID,
  relationTargetFieldMetadataUniversalIdentifier:
    CHATS_ON_WHATSAPP_ACCOUNT_FIELD_ID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'accountId',
  },
});
