import { defineView, ViewType } from 'twenty-sdk/define';

import {
  WHATSAPP_ACCOUNT_DISPLAY_NAME_FIELD_ID,
  WHATSAPP_ACCOUNT_LAST_SYNCED_AT_FIELD_ID,
  WHATSAPP_ACCOUNT_LID_FIELD_ID,
  WHATSAPP_ACCOUNT_OBJECT_ID,
  WHATSAPP_ACCOUNT_PHONE_NUMBER_FIELD_ID,
  WHATSAPP_ACCOUNT_SESSION_NAME_FIELD_ID,
  WHATSAPP_ACCOUNT_STATUS_FIELD_ID,
  WHATSAPP_ACCOUNTS_VIEW_FIELD_DISPLAY_NAME_ID,
  WHATSAPP_ACCOUNTS_VIEW_FIELD_LAST_SYNCED_AT_ID,
  WHATSAPP_ACCOUNTS_VIEW_FIELD_LID_ID,
  WHATSAPP_ACCOUNTS_VIEW_FIELD_PHONE_NUMBER_ID,
  WHATSAPP_ACCOUNTS_VIEW_FIELD_SESSION_NAME_ID,
  WHATSAPP_ACCOUNTS_VIEW_FIELD_STATUS_ID,
  WHATSAPP_ACCOUNTS_VIEW_ID,
} from '../constants/universal-identifiers';

export default defineView({
  universalIdentifier: WHATSAPP_ACCOUNTS_VIEW_ID,
  // Platform convention for app views: the placeholder is substituted with
  // the already-translated object label, so the name localises with the object.
  name: 'All {objectLabelPlural}',
  objectUniversalIdentifier: WHATSAPP_ACCOUNT_OBJECT_ID,
  type: ViewType.TABLE,
  icon: 'IconBrandWhatsapp',
  position: 0,
  fields: [
    {
      universalIdentifier: WHATSAPP_ACCOUNTS_VIEW_FIELD_DISPLAY_NAME_ID,
      fieldMetadataUniversalIdentifier: WHATSAPP_ACCOUNT_DISPLAY_NAME_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: WHATSAPP_ACCOUNTS_VIEW_FIELD_PHONE_NUMBER_ID,
      fieldMetadataUniversalIdentifier: WHATSAPP_ACCOUNT_PHONE_NUMBER_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: WHATSAPP_ACCOUNTS_VIEW_FIELD_SESSION_NAME_ID,
      fieldMetadataUniversalIdentifier: WHATSAPP_ACCOUNT_SESSION_NAME_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: WHATSAPP_ACCOUNTS_VIEW_FIELD_STATUS_ID,
      fieldMetadataUniversalIdentifier: WHATSAPP_ACCOUNT_STATUS_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: WHATSAPP_ACCOUNTS_VIEW_FIELD_LAST_SYNCED_AT_ID,
      fieldMetadataUniversalIdentifier:
        WHATSAPP_ACCOUNT_LAST_SYNCED_AT_FIELD_ID,
      position: 4,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: WHATSAPP_ACCOUNTS_VIEW_FIELD_LID_ID,
      fieldMetadataUniversalIdentifier: WHATSAPP_ACCOUNT_LID_FIELD_ID,
      position: 5,
      isVisible: false,
      size: 180,
    },
  ],
});
