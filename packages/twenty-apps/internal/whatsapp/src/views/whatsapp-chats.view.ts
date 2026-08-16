import { defineView, ViewType } from 'twenty-sdk/define';

import {
  ACCOUNT_ON_WHATSAPP_CHAT_FIELD_ID,
  COMPANY_ON_WHATSAPP_CHAT_FIELD_ID,
  PERSON_ON_WHATSAPP_CHAT_FIELD_ID,
  WHATSAPP_CHAT_CHAT_ID_FIELD_ID,
  WHATSAPP_CHAT_IS_GROUP_FIELD_ID,
  WHATSAPP_CHAT_LAST_MESSAGE_AT_FIELD_ID,
  WHATSAPP_CHAT_NAME_FIELD_ID,
  WHATSAPP_CHAT_OBJECT_ID,
  WHATSAPP_CHAT_SYNCED_FROM_AT_FIELD_ID,
  WHATSAPP_CHATS_VIEW_FIELD_ACCOUNT_ID,
  WHATSAPP_CHATS_VIEW_FIELD_CHAT_ID_ID,
  WHATSAPP_CHATS_VIEW_FIELD_COMPANY_ID,
  WHATSAPP_CHATS_VIEW_FIELD_IS_GROUP_ID,
  WHATSAPP_CHATS_VIEW_FIELD_LAST_MESSAGE_AT_ID,
  WHATSAPP_CHATS_VIEW_FIELD_NAME_ID,
  WHATSAPP_CHATS_VIEW_FIELD_PERSON_ID,
  WHATSAPP_CHATS_VIEW_FIELD_SYNCED_FROM_AT_ID,
  WHATSAPP_CHATS_VIEW_ID,
} from '../constants/universal-identifiers';

export default defineView({
  universalIdentifier: WHATSAPP_CHATS_VIEW_ID,
  // Platform convention for app views: the placeholder is substituted with
  // the already-translated object label, so the name localises with the object.
  name: 'All {objectLabelPlural}',
  objectUniversalIdentifier: WHATSAPP_CHAT_OBJECT_ID,
  type: ViewType.TABLE,
  icon: 'IconMessages',
  position: 0,
  fields: [
    {
      universalIdentifier: WHATSAPP_CHATS_VIEW_FIELD_NAME_ID,
      fieldMetadataUniversalIdentifier: WHATSAPP_CHAT_NAME_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: WHATSAPP_CHATS_VIEW_FIELD_LAST_MESSAGE_AT_ID,
      fieldMetadataUniversalIdentifier: WHATSAPP_CHAT_LAST_MESSAGE_AT_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: WHATSAPP_CHATS_VIEW_FIELD_PERSON_ID,
      fieldMetadataUniversalIdentifier: PERSON_ON_WHATSAPP_CHAT_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: WHATSAPP_CHATS_VIEW_FIELD_COMPANY_ID,
      fieldMetadataUniversalIdentifier: COMPANY_ON_WHATSAPP_CHAT_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: WHATSAPP_CHATS_VIEW_FIELD_ACCOUNT_ID,
      fieldMetadataUniversalIdentifier: ACCOUNT_ON_WHATSAPP_CHAT_FIELD_ID,
      position: 4,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: WHATSAPP_CHATS_VIEW_FIELD_IS_GROUP_ID,
      fieldMetadataUniversalIdentifier: WHATSAPP_CHAT_IS_GROUP_FIELD_ID,
      position: 5,
      isVisible: true,
      size: 100,
    },
    {
      universalIdentifier: WHATSAPP_CHATS_VIEW_FIELD_CHAT_ID_ID,
      fieldMetadataUniversalIdentifier: WHATSAPP_CHAT_CHAT_ID_FIELD_ID,
      position: 6,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: WHATSAPP_CHATS_VIEW_FIELD_SYNCED_FROM_AT_ID,
      fieldMetadataUniversalIdentifier: WHATSAPP_CHAT_SYNCED_FROM_AT_FIELD_ID,
      position: 7,
      isVisible: false,
      size: 180,
    },
  ],
});
