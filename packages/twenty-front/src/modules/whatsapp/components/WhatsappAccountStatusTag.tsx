import { useLingui } from '@lingui/react/macro';
import { isDefined } from 'twenty-shared/utils';
import { type TagColor, Tag } from 'twenty-ui/data-display';

import { useWhatsappAccounts } from '@/whatsapp/hooks/useWhatsappAccounts';
import { type WhatsappAccountStatus } from '@/whatsapp/types/WhatsappAccountRecord';

const TAG_COLOR_BY_WHATSAPP_ACCOUNT_STATUS: Record<
  WhatsappAccountStatus,
  TagColor
> = {
  WORKING: 'green',
  STARTING: 'blue',
  SCAN_QR_CODE: 'orange',
  FAILED: 'red',
  STOPPED: 'gray',
};

export const WhatsappAccountStatusTag = () => {
  const { t } = useLingui();
  const { whatsappAccounts } = useWhatsappAccounts();

  const firstWhatsappAccount = whatsappAccounts.at(0);

  if (!isDefined(firstWhatsappAccount)) {
    return null;
  }

  const status = firstWhatsappAccount.status ?? 'STOPPED';

  const labelByStatus: Record<WhatsappAccountStatus, string> = {
    WORKING: t`Connected`,
    STARTING: t`Starting`,
    SCAN_QR_CODE: t`Scan QR code`,
    FAILED: t`Failed`,
    STOPPED: t`Disconnected`,
  };

  return (
    <Tag
      color={TAG_COLOR_BY_WHATSAPP_ACCOUNT_STATUS[status]}
      text={labelByStatus[status]}
    />
  );
};
