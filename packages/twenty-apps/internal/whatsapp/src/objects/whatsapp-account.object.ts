import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  WHATSAPP_ACCOUNT_DISPLAY_NAME_FIELD_ID,
  WHATSAPP_ACCOUNT_LAST_SYNCED_AT_FIELD_ID,
  WHATSAPP_ACCOUNT_LID_FIELD_ID,
  WHATSAPP_ACCOUNT_OBJECT_ID,
  WHATSAPP_ACCOUNT_PHONE_NUMBER_FIELD_ID,
  WHATSAPP_ACCOUNT_SESSION_NAME_FIELD_ID,
  WHATSAPP_ACCOUNT_STATUS_FAILED_OPTION_ID,
  WHATSAPP_ACCOUNT_STATUS_FIELD_ID,
  WHATSAPP_ACCOUNT_STATUS_SCAN_QR_CODE_OPTION_ID,
  WHATSAPP_ACCOUNT_STATUS_STARTING_OPTION_ID,
  WHATSAPP_ACCOUNT_STATUS_STOPPED_OPTION_ID,
  WHATSAPP_ACCOUNT_STATUS_WORKING_OPTION_ID,
} from '../constants/universal-identifiers';

// Mirrors the WAHA session lifecycle states.
export enum WhatsappAccountStatus {
  WORKING = 'WORKING',
  STARTING = 'STARTING',
  SCAN_QR_CODE = 'SCAN_QR_CODE',
  FAILED = 'FAILED',
  STOPPED = 'STOPPED',
}

export default defineObject({
  universalIdentifier: WHATSAPP_ACCOUNT_OBJECT_ID,
  nameSingular: 'whatsappAccount',
  namePlural: 'whatsappAccounts',
  labelSingular: 'WhatsApp Account',
  labelPlural: 'WhatsApp Accounts',
  description: 'A connected WhatsApp number, backed by one WAHA session',
  icon: 'IconBrandWhatsapp',
  labelIdentifierFieldMetadataUniversalIdentifier:
    WHATSAPP_ACCOUNT_DISPLAY_NAME_FIELD_ID,
  fields: [
    {
      universalIdentifier: WHATSAPP_ACCOUNT_SESSION_NAME_FIELD_ID,
      type: FieldType.TEXT,
      name: 'sessionName',
      label: 'Session name',
      description: 'WAHA session name, e.g. default',
      icon: 'IconPlugConnected',
    },
    {
      universalIdentifier: WHATSAPP_ACCOUNT_DISPLAY_NAME_FIELD_ID,
      type: FieldType.TEXT,
      name: 'displayName',
      label: 'Display name',
      description: 'Human readable name of the connected number',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: WHATSAPP_ACCOUNT_PHONE_NUMBER_FIELD_ID,
      type: FieldType.TEXT,
      name: 'phoneNumber',
      label: 'Phone number',
      icon: 'IconPhone',
      isNullable: true,
    },
    {
      universalIdentifier: WHATSAPP_ACCOUNT_LID_FIELD_ID,
      type: FieldType.TEXT,
      name: 'lid',
      label: 'LID',
      description: 'WhatsApp privacy id of the connected number',
      icon: 'IconFingerprint',
      isNullable: true,
    },
    {
      universalIdentifier: WHATSAPP_ACCOUNT_STATUS_FIELD_ID,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      description: 'State reported by the WAHA session',
      icon: 'IconProgress',
      isNullable: true,
      options: [
        {
          id: WHATSAPP_ACCOUNT_STATUS_WORKING_OPTION_ID,
          value: WhatsappAccountStatus.WORKING,
          label: 'Working',
          position: 0,
          color: 'green',
        },
        {
          id: WHATSAPP_ACCOUNT_STATUS_STARTING_OPTION_ID,
          value: WhatsappAccountStatus.STARTING,
          label: 'Starting',
          position: 1,
          color: 'blue',
        },
        {
          id: WHATSAPP_ACCOUNT_STATUS_SCAN_QR_CODE_OPTION_ID,
          value: WhatsappAccountStatus.SCAN_QR_CODE,
          label: 'Scan QR code',
          position: 2,
          color: 'orange',
        },
        {
          id: WHATSAPP_ACCOUNT_STATUS_FAILED_OPTION_ID,
          value: WhatsappAccountStatus.FAILED,
          label: 'Failed',
          position: 3,
          color: 'red',
        },
        {
          id: WHATSAPP_ACCOUNT_STATUS_STOPPED_OPTION_ID,
          value: WhatsappAccountStatus.STOPPED,
          label: 'Stopped',
          position: 4,
          color: 'gray',
        },
      ],
    },
    {
      universalIdentifier: WHATSAPP_ACCOUNT_LAST_SYNCED_AT_FIELD_ID,
      type: FieldType.DATE_TIME,
      name: 'lastSyncedAt',
      label: 'Last synced at',
      icon: 'IconRefresh',
      isNullable: true,
    },
  ],
});
