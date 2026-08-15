import { createHash, createHmac, timingSafeEqual } from 'crypto';

import { isDefined, isNonEmptyString } from 'src/utils/type-guards.util';

// WAHA signs the webhook body with HMAC-SHA512 and sends the hex digest here.
export const WAHA_HMAC_HEADER = 'x-webhook-hmac';
// Alternative auth path: a `customHeaders` entry on the session's webhook config
// carrying the shared secret verbatim. It works even when the raw body is not
// available to the function, which the HMAC path requires.
export const WAHA_SHARED_SECRET_HEADER = 'x-waha-webhook-secret';

export type WahaWebhookVerificationOutcome =
  | 'ACCEPTED_HMAC'
  | 'ACCEPTED_SHARED_SECRET'
  // Deliberate open-door fallback, see verifyWahaWebhookRequest.
  | 'ACCEPTED_NO_SECRET_CONFIGURED'
  | 'REJECTED_INVALID_HMAC'
  | 'REJECTED_MISSING_CREDENTIALS'
  | 'REJECTED_RAW_BODY_UNAVAILABLE';

export type WahaWebhookVerificationResult = {
  isAccepted: boolean;
  outcome: WahaWebhookVerificationOutcome;
  reason: string;
};

// Constant-time equality for arbitrary-length strings: both sides are hashed to
// a fixed width first, so neither the length nor the content of the expected
// value leaks through the comparison.
const isEqualInConstantTime = (left: string, right: string): boolean =>
  timingSafeEqual(
    createHash('sha512').update(left, 'utf8').digest(),
    createHash('sha512').update(right, 'utf8').digest(),
  );

export const computeWahaWebhookHmac = (
  rawBody: string,
  secret: string,
): string => createHmac('sha512', secret).update(rawBody, 'utf8').digest('hex');

const findHeader = (
  headers: Record<string, string | undefined>,
  name: string,
): string | undefined => {
  const match = Object.entries(headers).find(
    ([headerName]) => headerName.toLowerCase() === name,
  );

  return isNonEmptyString(match?.[1]) ? match[1] : undefined;
};

type VerifyWahaWebhookRequestArgs = {
  headers: Record<string, string | undefined>;
  // Optional on the route payload; only the byte-exact original body can be
  // hashed, so a re-serialized `body` is never an acceptable substitute.
  rawBody: string | undefined;
  secret: string | undefined;
};

export const verifyWahaWebhookRequest = ({
  headers,
  rawBody,
  secret,
}: VerifyWahaWebhookRequestArgs): WahaWebhookVerificationResult => {
  // ⚠ OPEN DOOR ⚠ With no secret configured this endpoint is unauthenticated and
  // accepts anything. It is deliberate so the integration can be wired up before
  // the secret exists — set WAHA_WEBHOOK_SECRET as soon as the URL is public.
  if (!isNonEmptyString(secret)) {
    return {
      isAccepted: true,
      outcome: 'ACCEPTED_NO_SECRET_CONFIGURED',
      reason:
        'WAHA_WEBHOOK_SECRET is not set: accepting the request UNVERIFIED. ' +
        'Set the secret to enable signature checking.',
    };
  }

  const sharedSecretHeader = findHeader(headers, WAHA_SHARED_SECRET_HEADER);

  if (isDefined(sharedSecretHeader)) {
    if (isEqualInConstantTime(sharedSecretHeader, secret)) {
      return {
        isAccepted: true,
        outcome: 'ACCEPTED_SHARED_SECRET',
        reason: `Matched the ${WAHA_SHARED_SECRET_HEADER} shared secret.`,
      };
    }

    return {
      isAccepted: false,
      outcome: 'REJECTED_INVALID_HMAC',
      reason: `The ${WAHA_SHARED_SECRET_HEADER} header did not match the configured secret.`,
    };
  }

  const signature = findHeader(headers, WAHA_HMAC_HEADER);

  if (!isDefined(signature)) {
    return {
      isAccepted: false,
      outcome: 'REJECTED_MISSING_CREDENTIALS',
      reason: `Neither ${WAHA_HMAC_HEADER} nor ${WAHA_SHARED_SECRET_HEADER} was present.`,
    };
  }

  if (!isNonEmptyString(rawBody)) {
    // Distinct from a bad signature: the request may well be genuine, we simply
    // cannot check it. Never fall back to hashing a re-serialized body — key
    // order and whitespace differ, so it could only ever produce a false reject.
    return {
      isAccepted: false,
      outcome: 'REJECTED_RAW_BODY_UNAVAILABLE',
      reason:
        'A signature was supplied but the raw request body was not available ' +
        'to the function, so the HMAC cannot be verified.',
    };
  }

  if (
    isEqualInConstantTime(
      signature.trim().toLowerCase(),
      computeWahaWebhookHmac(rawBody, secret),
    )
  ) {
    return {
      isAccepted: true,
      outcome: 'ACCEPTED_HMAC',
      reason: `Matched the ${WAHA_HMAC_HEADER} signature.`,
    };
  }

  return {
    isAccepted: false,
    outcome: 'REJECTED_INVALID_HMAC',
    reason: `The ${WAHA_HMAC_HEADER} signature did not match the raw body.`,
  };
};
