/**
 * HealthOS API client.
 *
 * Override with EXPO_PUBLIC_API_URL.
 * Default is the deployed Render API so Expo Go / Netlify work without extra setup.
 */
import { Platform } from 'react-native';

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'https://medwise-api-dghq.onrender.com'
).replace(/\/$/, '');

export function apiUrl(path) {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${suffix}`;
}

async function handle(response) {
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!response.ok) {
    const message = body?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return body;
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
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    if (key === 'image') {
      await appendImage(form, value);
      continue;
    }
    form.append(key, value);
  }
  const response = await fetch(apiUrl(path), { method: 'POST', body: form });
  return handle(response);
}

async function appendImage(form, image) {
  if (!image) {
    return;
  }
  const uri = image.uri || image;
  const name = image.name || (typeof uri === 'string' ? uri.split('/').pop() : 'scan.jpg') || 'scan.jpg';
  const type = image.mimeType || image.type || 'image/jpeg';
  if (Platform.OS === 'web') {
    const blob = await fetch(uri).then((res) => res.blob());
    form.append('image', blob, name);
    return;
  }
  form.append('image', { uri, name, type });
}

/** Turn "Glucose 7.2, Vitamin D 18" or {"glucose":7.2} into a JSON string for POST /api/blood/scan. */
export function parseLabValues(text) {
  if (!text || !String(text).trim()) {
    return undefined;
  }
  const trimmed = String(text).trim();
  if (trimmed.startsWith('{')) {
    JSON.parse(trimmed);
    return trimmed;
  }
  const out = {};
  const re = /([A-Za-z][A-Za-z0-9 %\-]*)\s*[:=]?\s*(\d+(?:\.\d+)?)/g;
  let match = re.exec(trimmed);
  while (match) {
    const key = match[1].trim().toLowerCase().replace(/\s+/g, '_');
    out[key] = Number(match[2]);
    match = re.exec(trimmed);
  }
  if (Object.keys(out).length === 0) {
    throw new Error('Enter values like Glucose 7.2 or JSON {"glucose": 7.2}');
  }
  return JSON.stringify(out);
}

export async function pingHealth() {
  return getJson('/api/health');
}

export async function getDashboard() {
  return getJson('/api/dashboard');
}

export async function scanMedicine({ name, image }) {
  return postForm('/api/medicine/scan', { name, image });
}

export async function markMedicineTaken(id) {
  const response = await fetch(apiUrl(`/api/medicine/${id}/taken`), { method: 'POST' });
  return handle(response);
}

export async function listMedicines() {
  return getJson('/api/medicine');
}

export async function scanBlood({ values, image }) {
  const encoded = values ? parseLabValues(values) : undefined;
  return postForm('/api/blood/scan', { values: encoded, image });
}

export async function listBloodScans() {
  return getJson('/api/blood');
}

export async function checkWater({ ph, tds, chlorine, image }) {
  if (image) {
    return postForm('/api/water/check', {
      ph: ph == null || ph === '' ? undefined : String(ph),
      tds: tds == null || tds === '' ? undefined : String(tds),
      chlorine: chlorine == null || chlorine === '' ? undefined : String(chlorine),
      image,
    });
  }
  return postJson('/api/water/check', { ph, tds, chlorine });
}

export async function listWaterChecks() {
  return getJson('/api/water');
}

export async function sendChatMessage(message) {
  return postJson('/api/chat', { message });
}

export async function getChatHistory() {
  const data = await getJson('/api/chat');
  return Array.isArray(data) ? data : [];
}
