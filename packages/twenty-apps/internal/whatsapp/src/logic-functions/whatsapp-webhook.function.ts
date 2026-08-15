import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { WAHA_WEBHOOK_SECRET_VARIABLE } from 'src/connector/waha-client';
import { WHATSAPP_WEBHOOK_FUNCTION_ID } from 'src/constants/universal-identifiers';
import { handleWahaWebhookEvent } from 'src/logic-functions/handlers/handle-waha-webhook-event';
import { readApplicationVariable } from 'src/utils/read-application-variable.util';
import {
  verifyWahaWebhookRequest,
  WAHA_HMAC_HEADER,
  WAHA_SHARED_SECRET_HEADER,
} from 'src/utils/verify-waha-webhook-request.util';
import { isDefined } from 'src/utils/type-guards.util';

// Public, unauthenticated endpoint (`POST /s/whatsapp/webhook`), so it does its
// own authentication. Everything it chooses to ignore still answers 200: a 4xx
// makes WAHA retry the same delivery forever.
const handler = async (event: RoutePayload): Promise<Response> => {
  const verification = verifyWahaWebhookRequest({
    headers: event.headers,
    rawBody: event.rawBody,
    secret: readApplicationVariable(WAHA_WEBHOOK_SECRET_VARIABLE),
  });

  if (!verification.isAccepted) {
    console.warn(
      `[whatsapp] Rejected webhook delivery (${verification.outcome}): ${verification.reason}`,
    );

    return new Response(
      { accepted: false, reason: verification.outcome },
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (verification.outcome === 'ACCEPTED_NO_SECRET_CONFIGURED') {
    console.warn(`[whatsapp] ${verification.reason}`);
  }

  const body = event.body as Record<string, unknown> | null;

  if (!isDefined(body)) {
    return new Response(
      { accepted: true, handled: false, reason: 'Empty body.' },
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const result = await handleWahaWebhookEvent(body);

    return new Response(
      { accepted: true, ...result },
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    // Answer 500 rather than 200 so WAHA retries a genuine processing failure —
    // ingestion is idempotent on externalId, so a retry is safe.
    console.error('[whatsapp] Failed to process a webhook delivery:', error);

    return new Response(
      { accepted: true, handled: false, reason: 'Processing failed.' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};

export default defineLogicFunction({
  universalIdentifier: WHATSAPP_WEBHOOK_FUNCTION_ID,
  name: 'whatsapp-webhook',
  description: 'Receives WAHA webhook deliveries and ingests WhatsApp messages.',
  timeoutSeconds: 30,
  handler,
  httpRouteTriggerSettings: {
    path: '/whatsapp/webhook',
    httpMethod: 'POST',
    // Public by design; the handler verifies the signature itself.
    isAuthRequired: false,
    // Headers reach the function only when listed here.
    forwardedRequestHeaders: [
      WAHA_HMAC_HEADER,
      WAHA_SHARED_SECRET_HEADER,
      'x-webhook-request-id',
      'x-webhook-timestamp',
    ],
  },
});
