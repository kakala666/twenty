import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  PERSON_ON_WHATSAPP_CHAT_FIELD_ID,
  WHATSAPP_CHAT_OBJECT_ID,
  WHATSAPP_CHATS_ON_PERSON_FIELD_ID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: WHATSAPP_CHATS_ON_PERSON_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.RELATION,
  name: 'whatsappChats',
  label: 'WhatsApp Chats',
  icon: 'IconBrandWhatsapp',
  relationTargetObjectMetadataUniversalIdentifier: WHATSAPP_CHAT_OBJECT_ID,
  relationTargetFieldMetadataUniversalIdentifier:
    PERSON_ON_WHATSAPP_CHAT_FIELD_ID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
