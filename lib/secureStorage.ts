const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const ENC_PREFIX = "enc:v1:";

/**
 * WebCrypto (crypto.subtle) is only available in secure contexts in the browser.
 * In local dev when you access via http://<LAN-IP>:3000, subtle may be undefined.
 * This helper returns WebCrypto only when available; otherwise null.
 */
function getWebCrypto(): Crypto | null {
  const c = globalThis.crypto as Crypto | undefined;
  if (!c) return null;
  if (!("subtle" in c)) return null;
  // Some environments expose crypto but not subtle
  if (!c.subtle) return null;
  return c;
}

/**
 * AES-GCM requires key size 128/192/256 bits. We accept any secret and normalize it
 * to 32 bytes by UTF-8 bytes + zero padding/truncation.
 */
function normalizeSecretTo32Bytes(secret: string): Uint8Array {
  const bytes = textEncoder.encode(secret);
  const out = new Uint8Array(32);
  out.set(bytes.slice(0, 32));
  return out;
}

async function importAesKey(
  webCrypto: Crypto,
  secret: string,
): Promise<CryptoKey> {
  const raw = normalizeSecretTo32Bytes(secret);
  return await webCrypto.subtle.importKey(
    "raw",
    raw as unknown as ArrayBuffer,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Encrypt string data. If encryption isn't available (or secret missing),
 * returns the original string so the app never breaks in local dev.
 */
export async function encrypt(data: string, secret: string): Promise<string> {
  const webCrypto = getWebCrypto();
  if (!webCrypto || !secret) {
    return data;
  }

  const key = await importAesKey(webCrypto, secret);
  const iv = webCrypto.getRandomValues(new Uint8Array(12)); // 96-bit nonce

  const encrypted = await webCrypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    textEncoder.encode(data),
  );

  // Store iv + ciphertext
  const cipherBytes = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.byteLength + cipherBytes.byteLength);
  combined.set(iv, 0);
  combined.set(cipherBytes, iv.byteLength);

  return `${ENC_PREFIX}${bytesToBase64(combined)}`;
}

/**
 * Decrypt a value produced by encrypt(). If value is not encrypted (no prefix),
 * or crypto/secret isn't available, returns the original value.
 */
export async function decrypt(
  encryptedValue: string,
  secret: string,
): Promise<string> {
  const webCrypto = getWebCrypto();
  if (!encryptedValue.startsWith(ENC_PREFIX)) {
    return encryptedValue;
  }
  if (!webCrypto || !secret) {
    // Can't decrypt in this environment → treat as plain (or you can throw).
    // We return empty string to avoid breaking hydration.
    return "";
  }

  const b64 = encryptedValue.slice(ENC_PREFIX.length);
  const bytes = base64ToBytes(b64);

  const iv = bytes.slice(0, 12);
  const data = bytes.slice(12);

  const key = await importAesKey(webCrypto, secret);

  const decrypted = await webCrypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  );
  return textDecoder.decode(decrypted);
}
