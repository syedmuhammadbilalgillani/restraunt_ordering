// utils/secureStorage.ts
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const getKey = async (secret: string) => {
  return crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    'AES-GCM',
    false,
    ['encrypt', 'decrypt']
  );
};

export const encrypt = async (data: string, secret: string) => {
  const key = await getKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit nonce

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    textEncoder.encode(data)
  );

  // Combine IV + Encrypted
  const buffer = new Uint8Array(iv.byteLength + encrypted.byteLength);
  buffer.set(iv, 0);
  buffer.set(new Uint8Array(encrypted), iv.byteLength);

  return btoa(String.fromCharCode(...buffer)); // base64
};

export const decrypt = async (encryptedBase64: string, secret: string) => {
  const encryptedBytes = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));
  const iv = encryptedBytes.slice(0, 12);
  const data = encryptedBytes.slice(12);

  const key = await getKey(secret);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  return textDecoder.decode(decrypted);
};
