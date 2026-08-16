import { useLingui } from '@lingui/react/macro';
import { useMatch, useResolvedPath } from 'react-router-dom';
import { IconBrandWhatsapp } from 'twenty-ui/icon';

import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { NavigationDrawerSection } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSection';
import { WHATSAPP_CHAT_BASE_PATH } from '@/whatsapp/constants/WhatsappChatBasePath';
import { useIsWhatsappAppInstalled } from '@/whatsapp/hooks/useIsWhatsappAppInstalled';

export const NavigationDrawerWhatsappSection = () => {
  const { t } = useLingui();
  const isWhatsappAppInstalled = useIsWhatsappAppInstalled();

  const whatsappResolvedPathname = useResolvedPath(
    WHATSAPP_CHAT_BASE_PATH,
  ).pathname;

  // `end: false` so a selected conversation keeps the entry highlighted.
  const isWhatsappRouteActive = !!useMatch({
    path: whatsappResolvedPathname,
    end: false,
  });

  if (!isWhatsappAppInstalled) {
    return null;
  }

  return (
    <NavigationDrawerSection>
      <NavigationDrawerItem
        label={t`WhatsApp`}
        to={WHATSAPP_CHAT_BASE_PATH}
        Icon={IconBrandWhatsapp}
        active={isWhatsappRouteActive}
      />
    </NavigationDrawerSection>
  );
};
