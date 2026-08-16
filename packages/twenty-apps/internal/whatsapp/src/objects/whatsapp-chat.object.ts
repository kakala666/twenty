import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  WHATSAPP_CHAT_CHAT_ID_FIELD_ID,
  WHATSAPP_CHAT_IS_GROUP_FIELD_ID,
  WHATSAPP_CHAT_LAST_MESSAGE_AT_FIELD_ID,
  WHATSAPP_CHAT_LID_FIELD_ID,
  WHATSAPP_CHAT_NAME_FIELD_ID,
  WHATSAPP_CHAT_OBJECT_ID,
  WHATSAPP_CHAT_PHONE_JID_FIELD_ID,
  WHATSAPP_CHAT_SYNCED_FROM_AT_FIELD_ID,
} from '../constants/universal-identifiers';

// Addressing and timeline fields are derived from WAHA and carry
// `isUIEditable: false`. `name` stays editable on purpose: correcting a
// counterpart's display name is a legitimate human action.
export default defineObject({
  universalIdentifier: WHATSAPP_CHAT_OBJECT_ID,
  nameSingular: 'whatsappChat',
  namePlural: 'whatsappChats',
  labelSingular: 'WhatsApp Chat',
  labelPlural: 'WhatsApp Chats',
  description: 'A WhatsApp conversation, one-to-one or group',
  icon: 'IconMessages',
  labelIdentifierFieldMetadataUniversalIdentifier: WHATSAPP_CHAT_NAME_FIELD_ID,
  fields: [
    {
      universalIdentifier: WHATSAPP_CHAT_CHAT_ID_FIELD_ID,
      type: FieldType.TEXT,
      name: 'chatId',
      label: 'Chat ID',
      description: 'WAHA chat id, e.g. 8619880607709@c.us or 1203...@g.us',
      icon: 'IconHash',
      isUIEditable: false,
    },
    {
      universalIdentifier: WHATSAPP_CHAT_NAME_FIELD_ID,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      description: 'Contact or group name as reported by WhatsApp',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: WHATSAPP_CHAT_PHONE_JID_FIELD_ID,
      type: FieldType.TEXT,
      name: 'phoneJid',
      label: 'Phone JID',
      description: 'Phone-number based jid, e.g. 8619880607709@c.us',
      icon: 'IconPhone',
      isUIEditable: false,
      isNullable: true,
    },
    {
      universalIdentifier: WHATSAPP_CHAT_LID_FIELD_ID,
      type: FieldType.TEXT,
      name: 'lid',
      label: 'LID',
      description: 'WhatsApp privacy id of the counterpart',
      icon: 'IconFingerprint',
      isUIEditable: false,
      isNullable: true,
    },
    {
      universalIdentifier: WHATSAPP_CHAT_IS_GROUP_FIELD_ID,
      type: FieldType.BOOLEAN,
      name: 'isGroup',
      label: 'Is group',
      icon: 'IconUsersGroup',
      isUIEditable: false,
      defaultValue: false,
    },
    {
      universalIdentifier: WHATSAPP_CHAT_LAST_MESSAGE_AT_FIELD_ID,
      type: FieldType.DATE_TIME,
      name: 'lastMessageAt',
      label: 'Last message at',
      icon: 'IconClock',
      isUIEditable: false,
      isNullable: true,
    },
    {
      universalIdentifier: WHATSAPP_CHAT_SYNCED_FROM_AT_FIELD_ID,
      type: FieldType.DATE_TIME,
      name: 'syncedFromAt',
      label: 'Synced from',
      description:
        'Backfill watermark: timestamp of the oldest message already imported',
      icon: 'IconHistory',
      isUIEditable: false,
      isNullable: true,
    },
  ],
});
