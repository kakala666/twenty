import { defineView, ViewType } from 'twenty-sdk/define';

import {
  WHATSAPP_CHAT_ON_WHATSAPP_MESSAGE_FIELD_ID,
  WHATSAPP_MESSAGE_ACK_STATUS_FIELD_ID,
  WHATSAPP_MESSAGE_DIRECTION_FIELD_ID,
  WHATSAPP_MESSAGE_EXTERNAL_ID_FIELD_ID,
  WHATSAPP_MESSAGE_HAS_MEDIA_FIELD_ID,
  WHATSAPP_MESSAGE_OBJECT_ID,
  WHATSAPP_MESSAGE_SENDER_NAME_FIELD_ID,
  WHATSAPP_MESSAGE_SENT_AT_FIELD_ID,
  WHATSAPP_MESSAGE_TEXT_FIELD_ID,
  WHATSAPP_MESSAGES_VIEW_FIELD_ACK_STATUS_ID,
  WHATSAPP_MESSAGES_VIEW_FIELD_CHAT_ID,
  WHATSAPP_MESSAGES_VIEW_FIELD_DIRECTION_ID,
  WHATSAPP_MESSAGES_VIEW_FIELD_EXTERNAL_ID_ID,
  WHATSAPP_MESSAGES_VIEW_FIELD_HAS_MEDIA_ID,
  WHATSAPP_MESSAGES_VIEW_FIELD_SENDER_NAME_ID,
  WHATSAPP_MESSAGES_VIEW_FIELD_SENT_AT_ID,
  WHATSAPP_MESSAGES_VIEW_FIELD_TEXT_ID,
  WHATSAPP_MESSAGES_VIEW_ID,
} from '../constants/universal-identifiers';

export default defineView({
  universalIdentifier: WHATSAPP_MESSAGES_VIEW_ID,
  // Platform convention for app views: the placeholder is substituted with
  // the already-translated object label, so the name localises with the object.
  name: 'All {objectLabelPlural}',
  objectUniversalIdentifier: WHATSAPP_MESSAGE_OBJECT_ID,
  type: ViewType.TABLE,
  icon: 'IconMessage',
  position: 0,
  fields: [
    {
      // Must stay first and visible: it is the object's label identifier.
      universalIdentifier: WHATSAPP_MESSAGES_VIEW_FIELD_TEXT_ID,
      fieldMetadataUniversalIdentifier: WHATSAPP_MESSAGE_TEXT_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 320,
    },
    {
      universalIdentifier: WHATSAPP_MESSAGES_VIEW_FIELD_SENT_AT_ID,
      fieldMetadataUniversalIdentifier: WHATSAPP_MESSAGE_SENT_AT_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: WHATSAPP_MESSAGES_VIEW_FIELD_CHAT_ID,
      fieldMetadataUniversalIdentifier:
        WHATSAPP_CHAT_ON_WHATSAPP_MESSAGE_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: WHATSAPP_MESSAGES_VIEW_FIELD_DIRECTION_ID,
      fieldMetadataUniversalIdentifier: WHATSAPP_MESSAGE_DIRECTION_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: WHATSAPP_MESSAGES_VIEW_FIELD_SENDER_NAME_ID,
      fieldMetadataUniversalIdentifier: WHATSAPP_MESSAGE_SENDER_NAME_FIELD_ID,
      position: 4,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: WHATSAPP_MESSAGES_VIEW_FIELD_ACK_STATUS_ID,
      fieldMetadataUniversalIdentifier: WHATSAPP_MESSAGE_ACK_STATUS_FIELD_ID,
      position: 5,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: WHATSAPP_MESSAGES_VIEW_FIELD_HAS_MEDIA_ID,
      fieldMetadataUniversalIdentifier: WHATSAPP_MESSAGE_HAS_MEDIA_FIELD_ID,
      position: 6,
      isVisible: true,
      size: 100,
    },
    {
      universalIdentifier: WHATSAPP_MESSAGES_VIEW_FIELD_EXTERNAL_ID_ID,
      fieldMetadataUniversalIdentifier: WHATSAPP_MESSAGE_EXTERNAL_ID_FIELD_ID,
      position: 7,
      isVisible: false,
      size: 260,
    },
  ],
});
