import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { assertUnreachable } from 'twenty-shared/utils';

import { CustomException } from 'src/utils/custom-exception';

export enum WhatsappDriverExceptionCode {
  // The WAHA host answered with a non-2xx status we do not treat specially.
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  // No HTTP response at all: connection refused, DNS failure or timeout.
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
}

const getWhatsappDriverExceptionUserFriendlyMessage = (
  code: WhatsappDriverExceptionCode,
): MessageDescriptor => {
  switch (code) {
    case WhatsappDriverExceptionCode.PROVIDER_ERROR:
      return msg`WhatsApp provider request failed.`;
    case WhatsappDriverExceptionCode.NETWORK_ERROR:
      return msg`Could not reach the WhatsApp provider.`;
    case WhatsappDriverExceptionCode.UNAUTHORIZED:
      return msg`The WhatsApp provider rejected the configured API key.`;
    case WhatsappDriverExceptionCode.NOT_FOUND:
      return msg`The requested WhatsApp resource does not exist.`;
    default:
      assertUnreachable(code);
  }
};

export class WhatsappDriverException extends CustomException<WhatsappDriverExceptionCode> {
  // HTTP status of the failing response, or undefined when no response was
  // received at all.
  statusCode?: number;
  // Underlying transport error, kept for diagnostics only — it must never
  // escape the client.
  cause?: Error;

  constructor(
    message: string,
    code: WhatsappDriverExceptionCode,
    {
      statusCode,
      cause,
      userFriendlyMessage,
    }: {
      statusCode?: number;
      cause?: Error;
      userFriendlyMessage?: MessageDescriptor;
    } = {},
  ) {
    super(message, code, {
      userFriendlyMessage:
        userFriendlyMessage ??
        getWhatsappDriverExceptionUserFriendlyMessage(code),
    });
    this.name = 'WhatsappDriverException';
    this.statusCode = statusCode;
    this.cause = cause;
  }
}
