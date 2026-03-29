/**
 * netlifyClient.js
 * Helpers voor het aanroepen van Netlify functions en Supabase Storage uploads.
 */
import { supabase } from './supabaseClient';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

/**
 * Roep een Netlify function aan via /api/<name>
 * @param {string} name — functienaam (zonder pad)
 * @param {object} data — request body
 * @returns {Promise<any>} — geparsed JSON response
 */
export async function callFunction(name, data = {}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Function ${name} returned ${res.status}`);
  }
  return res.json();
}

/**
 * Upload een bestand naar Supabase Storage (bucket: uploads)
 * @param {File} file — te uploaden bestand
 * @param {string} [folder='uploads'] — submap in bucket
 * @returns {Promise<string>} — publieke URL van het bestand
 */
export async function uploadFile(file, folder = 'uploads') {
  const { data: { user } } = await supabase.auth.getUser();
  const ext = file.name.split('.').pop();
  const path = `${folder}/${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(path, file, { contentType: file.type });

  if (uploadError) throw new Error(uploadError.message);

  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(path);
  return publicUrl;
}
