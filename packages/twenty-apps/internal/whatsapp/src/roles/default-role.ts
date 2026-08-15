import { defineApplicationRole } from 'twenty-sdk/define';

import { DEFAULT_ROLE_UNIVERSAL_IDENTIFIER } from '../constants/universal-identifiers';

export default defineApplicationRole({
  universalIdentifier: DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'WhatsApp default function role',
  description: 'Role the WhatsApp app operations run as',
  canReadAllObjectRecords: true,
  canUpdateAllObjectRecords: true,
  canSoftDeleteAllObjectRecords: true,
  canDestroyAllObjectRecords: false,
});
