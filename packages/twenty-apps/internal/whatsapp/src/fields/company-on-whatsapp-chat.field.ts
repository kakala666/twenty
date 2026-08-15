import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  COMPANY_ON_WHATSAPP_CHAT_FIELD_ID,
  WHATSAPP_CHAT_OBJECT_ID,
  WHATSAPP_CHATS_ON_COMPANY_FIELD_ID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: COMPANY_ON_WHATSAPP_CHAT_FIELD_ID,
  objectUniversalIdentifier: WHATSAPP_CHAT_OBJECT_ID,
  type: FieldType.RELATION,
  name: 'company',
  label: 'Company',
  description: 'CRM company this conversation was matched to',
  icon: 'IconBuildingSkyscraper',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    WHATSAPP_CHATS_ON_COMPANY_FIELD_ID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'companyId',
  },
});
