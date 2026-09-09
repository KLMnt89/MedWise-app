/**
 * HealthOS API client.
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

async function handle(response) {
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body?.message || message;
    } catch {
      // ignore body parse errors
    }
    throw new Error(message);
  }
  return response.json();
}

export async function getJson(path) {
  const response = await fetch(apiUrl(path));
  return handle(response);
}

export async function postJson(path, payload) {
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle(response);
}

export async function postForm(path, fields) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    form.append(key, value);
  });
  const response = await fetch(apiUrl(path), { method: 'POST', body: form });
  return handle(response);
}

export function toUploadFile(asset) {
  if (!asset) return undefined;
  const uri = asset.uri;
  const name = uri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(name);
  const type = asset.mimeType || (match ? `image/${match[1]}` : 'image/jpeg');
  return { uri, name, type };
}

export async function pingHealth() {
  return getJson('/api/health');
}

export async function getDashboard() {
  return getJson('/api/dashboard');
}

export async function scanMedicine({ name, image }) {
  return postForm('/api/medicine/scan', { name, image: toUploadFile(image) });
}

export async function markMedicineTaken(id) {
  const response = await fetch(apiUrl(`/api/medicine/${id}/taken`), { method: 'POST' });
  return handle(response);
}

export async function listMedicines() {
  return getJson('/api/medicine');
}

export async function scanBlood({ values, image }) {
  return postForm('/api/blood/scan', { values, image: toUploadFile(image) });
}

export async function listBloodScans() {
  return getJson('/api/blood');
}

export async function checkWater({ ph, tds, chlorine }) {
  return postJson('/api/water/check', { ph, tds, chlorine });
}

export async function listWaterChecks() {
  return getJson('/api/water');
}

export async function sendChatMessage(message) {
  return postJson('/api/chat', { message });
}

export async function getChatHistory() {
  return getJson('/api/chat/history');
}
