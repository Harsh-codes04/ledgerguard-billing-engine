import { createPrivateKey, createPublicKey } from "node:crypto";

export const JWT_ISSUER = "ledgerguard-api";
export const JWT_AUDIENCE = "ledgerguard-client";

function readPem(environmentName) {
  const encoded = process.env[environmentName]?.trim();
  if (!encoded) {
    throw new Error(`Set ${environmentName} in the server environment.`);
  }

  const pem = Buffer.from(encoded, "base64").toString("utf8");
  if (!pem.includes("-----BEGIN ") || !pem.includes(" KEY-----")) {
    throw new Error(`${environmentName} must contain a base64-encoded PEM key.`);
  }
  return pem;
}

export function getJwtPrivateKey() {
  return readPem("JWT_PRIVATE_KEY_BASE64");
}

export function getJwtPublicKey() {
  return readPem("JWT_PUBLIC_KEY_BASE64");
}

export function validateJwtKeyPair() {
  const privateKey = createPrivateKey(getJwtPrivateKey());
  const publicKey = createPublicKey(getJwtPublicKey());
  const derivedPublicKey = createPublicKey(privateKey).export({ type: "spki", format: "der" });
  const configuredPublicKey = publicKey.export({ type: "spki", format: "der" });

  if (!derivedPublicKey.equals(configuredPublicKey)) {
    throw new Error("JWT_PRIVATE_KEY_BASE64 and JWT_PUBLIC_KEY_BASE64 do not belong to the same key pair.");
  }
}
