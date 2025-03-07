/**
 * API utilities for handling URLs and domain transformations
 */

/**
 * Gets the backend URL from environment variables with minimal transformations
 * to ensure it works correctly
 */
export function getBackendUrl(): string {
  let apiUrl = process.env.NEXT_PUBLIC_API_URL;
  // console.log("Backend API URL from env:", apiUrl);
  
  if (!apiUrl) {
    console.error("NEXT_PUBLIC_API_URL environment variable is not set!");
    return "";
  }
  
  // Force HTTPS if needed but DO NOT modify the domain structure
  if (typeof window !== 'undefined' && 
      apiUrl.startsWith('http://') && 
      window.location.protocol === 'https:') {
    apiUrl = apiUrl.replace('http://', 'https://');
    // console.log("Forced HTTPS for backend URL:", apiUrl);
  }
  
  // Remove trailing slash if present
  if (apiUrl.endsWith('/')) {
    apiUrl = apiUrl.slice(0, -1);
    // console.log("Removed trailing slash:", apiUrl);
  }
  
  // NO DOMAIN STRUCTURE MODIFICATIONS - use exactly what's in the environment
  // console.log("Final backend URL:", apiUrl);
  return apiUrl;
}

/**
 * Constructs a full API endpoint URL for a specific operator
 */
export function getApiEndpointUrl(operator: string): string {
  const baseUrl = getBackendUrl();
  if (!baseUrl) {
    return "";
  }
  return `${baseUrl}/api/operators/${encodeURIComponent(operator)}`;
} 