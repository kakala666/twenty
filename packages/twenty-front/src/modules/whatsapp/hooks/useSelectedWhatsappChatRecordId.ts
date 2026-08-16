import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { isNonEmptyString } from '@sniptt/guards';

import { WHATSAPP_CHAT_BASE_PATH } from '@/whatsapp/constants/WhatsappChatBasePath';
import { WHATSAPP_CHAT_ROUTE_PARAM_NAME } from '@/whatsapp/constants/WhatsappChatRouteParamName';

// The URL is the single source of truth for the selection, so a deep link and a
// click through the list end up in exactly the same state.
export const useSelectedWhatsappChatRecordId = () => {
  const routeParams = useParams();
  const navigate = useNavigate();

  const routeParamValue = routeParams[WHATSAPP_CHAT_ROUTE_PARAM_NAME];

  const selectedWhatsappChatRecordId = isNonEmptyString(routeParamValue)
    ? routeParamValue
    : undefined;

  const selectWhatsappChatRecordId = useCallback(
    (whatsappChatRecordId: string) => {
      void navigate(`${WHATSAPP_CHAT_BASE_PATH}/${whatsappChatRecordId}`);
    },
    [navigate],
  );

  return {
    selectedWhatsappChatRecordId,
    selectWhatsappChatRecordId,
  };
};
