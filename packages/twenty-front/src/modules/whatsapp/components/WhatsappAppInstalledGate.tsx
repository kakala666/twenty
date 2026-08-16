import { type ReactNode } from 'react';

import { WhatsappAppNotInstalledEmptyState } from '@/whatsapp/components/WhatsappAppNotInstalledEmptyState';
import { useIsWhatsappAppInstalled } from '@/whatsapp/hooks/useIsWhatsappAppInstalled';

type WhatsappAppInstalledGateProps = {
  children: ReactNode;
};

// Hooks cannot be conditional, so the check that keeps `useObjectMetadataItem`
// from throwing has to live in a parent that early-returns.
export const WhatsappAppInstalledGate = ({
  children,
}: WhatsappAppInstalledGateProps) => {
  const isWhatsappAppInstalled = useIsWhatsappAppInstalled();

  if (!isWhatsappAppInstalled) {
    return <WhatsappAppNotInstalledEmptyState />;
  }

  return <>{children}</>;
};
