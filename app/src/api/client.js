/**
 * Shared API root. Teammate screens should import { apiUrl, getJson } from here.
 *
 * Local web: http://localhost:8080
 * iPhone (Expo Go): http://YOUR_LAN_IP:8080  (localhost on the phone is the phone)
 * Deployed: https://your-render-service.onrender.com
 */
export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080'
).replace(/\/$/, '');

export function apiUrl(path) {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${suffix}`;
}

export async function getJson(path) {
  const response = await fetch(apiUrl(path));
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json();
}

export async function pingHealth() {
  return getJson('/api/health');
}
