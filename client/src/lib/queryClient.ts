import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Get the correct base URL depending on environment
function getBaseUrl() {
  // Check if we're in a production environment (like Vercel)
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  // Default to localhost for development
  return import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    // Make sure URL is absolute for production or development
    const baseUrl = getBaseUrl();
    const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : url;
    
    console.log(`Making ${method} request to: ${fullUrl}`);
    
    const res = await fetch(fullUrl, {
      method,
      headers: data ? { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache" 
      } : { "Cache-Control": "no-cache" },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      mode: "cors",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API Request failed for ${method} ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Make sure URL is absolute for production or development
      const baseUrl = getBaseUrl();
      const url = queryKey[0] as string;
      const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : url;
      
      console.log(`Making query request to: ${fullUrl}`);
      
      const res = await fetch(fullUrl, {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        },
        mode: "cors",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error(`Query failed for ${queryKey[0]}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchOnWindowFocus: true,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 10000,
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 2,
      retryDelay: 1000,
    },
  },
});
