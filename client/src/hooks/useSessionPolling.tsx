import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

export function useSessionPolling(sessionId: string | undefined) {
  const queryClient = useQueryClient();
  const pollInterval = useRef<number | null>(null);

  // Query to fetch session data
  const query = useQuery({
    queryKey: [`/api/sessions/${sessionId}`],
    enabled: !!sessionId,
    refetchOnWindowFocus: true,
    staleTime: 2000, // Data becomes stale after 2 seconds
    refetchInterval: 3000, // Refetch every 3 seconds
    refetchIntervalInBackground: true,
    retry: 3, // Retry 3 times on failure
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Additional manual polling as a fallback
  useEffect(() => {
    if (!sessionId) return;

    // Clear existing interval if any
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
    }

    // Manual polling as backup
    const fetchData = () => {
      if (document.visibilityState !== 'hidden') {
        queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}`] });
      }
    };

    // Set new interval
    pollInterval.current = window.setInterval(fetchData, 5000);

    // Initial fetch
    fetchData();

    // Clean up on unmount
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [sessionId, queryClient]);

  return query;
}
