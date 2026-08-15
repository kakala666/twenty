import { describe, expect, it } from 'vitest';

import {
  computeWahaWebhookHmac,
  verifyWahaWebhookRequest,
  WAHA_HMAC_HEADER,
  WAHA_SHARED_SECRET_HEADER,
} from 'src/utils/verify-waha-webhook-request.util';

const SECRET = 'a-shared-secret';
const RAW_BODY = '{"event":"message.any","session":"default"}';
const SIGNATURE = computeWahaWebhookHmac(RAW_BODY, SECRET);

describe('computeWahaWebhookHmac', () => {
  it('should produce a 128-character hex sha512 digest', () => {
    expect(SIGNATURE).toMatch(/^[0-9a-f]{128}$/);
  });

  it('should change when a single byte of the body changes', () => {
    expect(computeWahaWebhookHmac(`${RAW_BODY} `, SECRET)).not.toBe(SIGNATURE);
  });

  it('should change when the secret changes', () => {
    expect(computeWahaWebhookHmac(RAW_BODY, 'other')).not.toBe(SIGNATURE);
  });
});

describe('verifyWahaWebhookRequest', () => {
  it('should accept when the hmac header matches the raw body', () => {
    const result = verifyWahaWebhookRequest({
      headers: { [WAHA_HMAC_HEADER]: SIGNATURE },
      rawBody: RAW_BODY,
      secret: SECRET,
    });

    expect(result.isAccepted).toBe(true);
    expect(result.outcome).toBe('ACCEPTED_HMAC');
  });

  it('should accept when the hmac header arrives with different casing', () => {
    const result = verifyWahaWebhookRequest({
      headers: { 'X-Webhook-Hmac': SIGNATURE.toUpperCase() },
      rawBody: RAW_BODY,
      secret: SECRET,
    });

    expect(result.isAccepted).toBe(true);
  });

  it('should reject when the hmac does not match the raw body', () => {
    const result = verifyWahaWebhookRequest({
      headers: { [WAHA_HMAC_HEADER]: SIGNATURE },
      rawBody: `${RAW_BODY} tampered`,
      secret: SECRET,
    });

    expect(result.isAccepted).toBe(false);
    expect(result.outcome).toBe('REJECTED_INVALID_HMAC');
  });

  it('should accept when the shared-secret custom header matches', () => {
    const result = verifyWahaWebhookRequest({
      headers: { [WAHA_SHARED_SECRET_HEADER]: SECRET },
      rawBody: undefined,
      secret: SECRET,
    });

    expect(result.isAccepted).toBe(true);
    expect(result.outcome).toBe('ACCEPTED_SHARED_SECRET');
  });

  it('should reject when the shared-secret custom header does not match', () => {
    const result = verifyWahaWebhookRequest({
      headers: { [WAHA_SHARED_SECRET_HEADER]: 'wrong' },
      rawBody: RAW_BODY,
      secret: SECRET,
    });

    expect(result.isAccepted).toBe(false);
    expect(result.outcome).toBe('REJECTED_INVALID_HMAC');
  });

  // Distinct from a bad signature: the request may be genuine, we simply cannot
  // check it, and re-serializing `body` could only ever produce a false reject.
  it('should report a distinct outcome when a signature is present but the raw body is not', () => {
    const result = verifyWahaWebhookRequest({
      headers: { [WAHA_HMAC_HEADER]: SIGNATURE },
      rawBody: undefined,
      secret: SECRET,
    });

    expect(result.isAccepted).toBe(false);
    expect(result.outcome).toBe('REJECTED_RAW_BODY_UNAVAILABLE');
  });

  it('should reject when neither credential header is present', () => {
    const result = verifyWahaWebhookRequest({
      headers: {},
      rawBody: RAW_BODY,
      secret: SECRET,
    });

    expect(result.isAccepted).toBe(false);
    expect(result.outcome).toBe('REJECTED_MISSING_CREDENTIALS');
  });

  // Deliberate open door so the integration can be wired up before the secret
  // exists; the caller logs the warning.
  it.each([
    ['undefined', undefined],
    ['an empty string', ''],
  ])('should accept unverified when the secret is %s', (_, secret) => {
    const result = verifyWahaWebhookRequest({
      headers: {},
      rawBody: RAW_BODY,
      secret,
    });

    expect(result.isAccepted).toBe(true);
    expect(result.outcome).toBe('ACCEPTED_NO_SECRET_CONFIGURED');
    expect(result.reason).toContain('UNVERIFIED');
  });

  it('should not leak the secret through the reason of a rejection', () => {
    const result = verifyWahaWebhookRequest({
      headers: { [WAHA_SHARED_SECRET_HEADER]: 'wrong' },
      rawBody: RAW_BODY,
      secret: SECRET,
    });

    expect(result.reason).not.toContain(SECRET);
  });
});
