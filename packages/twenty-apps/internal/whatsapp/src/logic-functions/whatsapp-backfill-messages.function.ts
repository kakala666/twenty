import { defineLogicFunction } from 'twenty-sdk/define';

import { WHATSAPP_BACKFILL_MESSAGES_FUNCTION_ID } from 'src/constants/universal-identifiers';
import { backfillWhatsappMessages } from 'src/logic-functions/handlers/backfill-whatsapp-messages';

// The cron passes an empty payload, `dev:function:exec -p '{...}'` passes the
// operator's overrides; both land on the same optional argument.
const handler = async (payload?: unknown) =>
  await backfillWhatsappMessages(payload);

export default defineLogicFunction({
  universalIdentifier: WHATSAPP_BACKFILL_MESSAGES_FUNCTION_ID,
  name: 'whatsapp-backfill-messages',
  description:
    'Imports WhatsApp history that predates the install, one time window at a time.',
  // Bulk import, so it gets far more room than the other functions — but well
  // under the executor's 900s ceiling, and the run budget is sized to finish in
  // roughly half of it so a slow WAHA still lands inside the timeout.
  timeoutSeconds: 600,
  handler,
  cronTriggerSettings: {
    // Hourly at :17. Deliberately off the quarter hours the chat sync occupies,
    // so the two never compete for the same WAHA session, and hourly rather
    // than more often because each run is bounded: catching up is a matter of a
    // handful of runs, and once every chat has reached the horizon the job
    // collapses to a single filtered query that returns nothing.
    pattern: '17 * * * *',
  },
});
