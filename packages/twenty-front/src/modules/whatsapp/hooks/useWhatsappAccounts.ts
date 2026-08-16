import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { WHATSAPP_ACCOUNT_OBJECT_NAME_SINGULAR } from '@/whatsapp/constants/WhatsappAccountObjectNameSingular';
import { type WhatsappAccountRecord } from '@/whatsapp/types/WhatsappAccountRecord';

export const useWhatsappAccounts = () => {
  const { records, loading } = useFindManyRecords<WhatsappAccountRecord>({
    objectNameSingular: WHATSAPP_ACCOUNT_OBJECT_NAME_SINGULAR,
    orderBy: [{ lastSyncedAt: 'DescNullsLast' }],
    limit: 10,
    recordGqlFields: {
      id: true,
      sessionName: true,
      displayName: true,
      phoneNumber: true,
      status: true,
      lastSyncedAt: true,
    },
  });

  return {
    whatsappAccounts: records,
    loading,
  };
};
