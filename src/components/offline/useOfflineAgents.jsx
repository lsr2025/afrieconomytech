/**
 * Copyright © 2026 Kwahlelwa Group (Pty) Ltd.
 * All Rights Reserved.
 */
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { offlineStorage } from './OfflineStorage';
import { useOfflineStatus } from './useOfflineStatus';

/**
 * Returns agents from server when online, from IndexedDB cache when offline.
 * Automatically updates the cache on every successful online fetch.
 */
export function useOfflineAgents() {
  const { isOnline } = useOfflineStatus();

  return useQuery({
    queryKey: ['field-agents', isOnline],
    queryFn: async () => {
      if (!isOnline) return offlineStorage.getCachedAgents();
      const agents = await base44.entities.FieldAgent.list();
      if (agents.length > 0) await offlineStorage.cacheAgents(agents);
      return agents;
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });
}