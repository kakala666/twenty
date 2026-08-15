import { defineApplication, FieldType } from 'twenty-sdk/define';

import { APPLICATION_UNIVERSAL_IDENTIFIER } from './constants/universal-identifiers';

export { APPLICATION_UNIVERSAL_IDENTIFIER };

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: 'WhatsApp',
  description:
    'Syncs WhatsApp conversations into the CRM through a self-hosted WAHA instance',
  category: 'Communication',
  serverVariables: {
    WAHA_BASE_URL: {
      description:
        'Base URL of the self-hosted WAHA instance, e.g. https://waha.example.com',
      type: FieldType.TEXT,
      isRequired: true,
      isSecret: false,
    },
    WAHA_API_KEY: {
      description: 'API key WAHA expects in the X-Api-Key header',
      type: FieldType.TEXT,
      isRequired: true,
      isSecret: true,
    },
    WAHA_WEBHOOK_SECRET: {
      description:
        'Shared secret used to authenticate inbound WAHA webhook calls',
      type: FieldType.TEXT,
      isRequired: false,
      isSecret: true,
    },
    WAHA_SESSION_NAME: {
      description:
        'WAHA session to send through when a chat has no account linked yet; defaults to "default"',
      type: FieldType.TEXT,
      isRequired: false,
      isSecret: false,
    },
  },
});
