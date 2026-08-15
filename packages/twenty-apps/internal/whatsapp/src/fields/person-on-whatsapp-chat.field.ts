import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  PERSON_ON_WHATSAPP_CHAT_FIELD_ID,
  WHATSAPP_CHAT_OBJECT_ID,
  WHATSAPP_CHATS_ON_PERSON_FIELD_ID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: PERSON_ON_WHATSAPP_CHAT_FIELD_ID,
  objectUniversalIdentifier: WHATSAPP_CHAT_OBJECT_ID,
  type: FieldType.RELATION,
  name: 'person',
  label: 'Person',
  description: 'CRM contact this conversation was matched to',
  icon: 'IconUser',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    WHATSAPP_CHATS_ON_PERSON_FIELD_ID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'personId',
  },
});
