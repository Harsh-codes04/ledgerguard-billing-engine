const PBKDF2_ITERATIONS = 310_000;
const AES_KEY_BYTES = 32;
const GCM_IV_BYTES = 12;

function subtleCrypto() {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new Error("Web Crypto is unavailable. Open LedgerGuard on localhost or over HTTPS.");
  }
  return window.crypto.subtle;
}

function hexToBytes(hex, label, minimumBytes = 1) {
  if (typeof hex !== "string" || hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) {
    throw new Error(`${label} must be a hexadecimal string.`);
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  if (bytes.length < minimumBytes) {
    throw new Error(`${label} must contain at least ${minimumBytes} bytes.`);
  }
  return bytes;
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return window.btoa(binary);
}

function base64ToBytes(value) {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function deriveMasterKey(passphrase, saltHex) {
  if (typeof passphrase !== "string" || passphrase.length === 0) {
    throw new Error("Enter your workspace encryption passphrase.");
  }

  const subtle = subtleCrypto();
  const salt = hexToBytes(saltHex, "Workspace salt", 16);
  const passphraseBytes = new TextEncoder().encode(passphrase);
  let derivedBytes;
  let aesBytes;
  let hmacBytes;

  try {
    const passphraseKey = await subtle.importKey(
      "raw",
      passphraseBytes,
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    derivedBytes = new Uint8Array(await subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      passphraseKey,
      AES_KEY_BYTES * 16
    ));

    // Split one PBKDF2 output into independent AES and HMAC key material.
    aesBytes = derivedBytes.slice(0, AES_KEY_BYTES);
    hmacBytes = derivedBytes.slice(AES_KEY_BYTES, AES_KEY_BYTES * 2);

    const [aesKey, hmacKey] = await Promise.all([
      subtle.importKey("raw", aesBytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]),
      subtle.importKey("raw", hmacBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]),
    ]);

    return { aesKey, hmacKey };
  } finally {
    passphraseBytes.fill(0);
    derivedBytes?.fill(0);
    aesBytes?.fill(0);
    hmacBytes?.fill(0);
  }
}

export async function encryptPayload(plainObject, aesKey) {
  if (plainObject === null || typeof plainObject !== "object") {
    throw new Error("Encrypted payload must be a JSON object or array.");
  }

  const serialized = JSON.stringify(plainObject);
  if (typeof serialized !== "string") {
    throw new Error("Encrypted payload must be JSON serializable.");
  }

  const encoded = new TextEncoder().encode(serialized);
  try {
    const iv = window.crypto.getRandomValues(new Uint8Array(GCM_IV_BYTES));
    const ciphertext = await subtleCrypto().encrypt(
      { name: "AES-GCM", iv, tagLength: 128 },
      aesKey,
      encoded
    );
    return {
      ciphertextBase64: bytesToBase64(new Uint8Array(ciphertext)),
      ivBase64: bytesToBase64(iv),
    };
  } finally {
    encoded.fill(0);
  }
}

export async function decryptPayload(ciphertextBase64, ivBase64, aesKey) {
  const subtle = subtleCrypto();
  let plaintextBytes;
  try {
    plaintextBytes = new Uint8Array(await subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(ivBase64), tagLength: 128 },
      aesKey,
      base64ToBytes(ciphertextBase64)
    ));
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(plaintextBytes));
  } catch {
    throw new Error("Invalid passphrase or corrupted ciphertext");
  } finally {
    plaintextBytes?.fill(0);
  }
}

export async function createBlindIndex(value, hmacKey) {
  if (typeof value !== "string") {
    throw new Error("Blind-index input must be a string.");
  }

  const normalized = new TextEncoder().encode(value.trim().toLowerCase());
  try {
    const signature = await subtleCrypto().sign("HMAC", hmacKey, normalized);
    return bytesToHex(new Uint8Array(signature));
  } finally {
    normalized.fill(0);
  }
}

export async function computeCommitment(amountInPaiseOrCents, nonceHex) {
  if (!Number.isSafeInteger(amountInPaiseOrCents)) {
    throw new Error("Commitment amount must be a safe whole number of minor currency units.");
  }

  const nonce = hexToBytes(nonceHex, "Commitment nonce", 16);
  const message = new TextEncoder().encode(`${amountInPaiseOrCents}:${bytesToHex(nonce)}`);
  try {
    const digest = await subtleCrypto().digest("SHA-256", message);
    return bytesToHex(new Uint8Array(digest));
  } finally {
    message.fill(0);
    nonce.fill(0);
  }
}
