import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import {
  createBlindIndex,
  decryptPayload,
  deriveMasterKey,
  encryptPayload,
} from "../crypto/zkVault.js";

const VaultContext = createContext(null);
const IDLE_LOCK_MS = 15 * 60 * 1000;

export function VaultProvider({ children }) {
  const { user, tenant } = useAuth();
  const [keys, setKeys] = useState(null);

  const lockVault = useCallback(() => {
    setKeys(null);
  }, []);

  const unlockVault = useCallback(async (passphrase) => {
    lockVault();
    if (!tenant?.vaultSalt) {
      throw new Error("This workspace has no key-derivation salt. Refresh your session and try again.");
    }
    const derivedKeys = await deriveMasterKey(passphrase, tenant.vaultSalt);
    setKeys(derivedKeys);
  }, [lockVault, tenant?.vaultSalt]);

  useEffect(() => {
    lockVault();
  }, [lockVault, tenant?.id, user?.id]);

  useEffect(() => {
    if (!keys) return undefined;

    let timeoutId;
    let lastTimerReset = Date.now();
    const scheduleLock = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(lockVault, IDLE_LOCK_MS);
      lastTimerReset = Date.now();
    };
    const handleActivity = () => {
      if (Date.now() - lastTimerReset >= 30_000) scheduleLock();
    };
    const events = ["pointerdown", "pointermove", "keydown", "touchstart", "wheel"];

    scheduleLock();
    events.forEach((eventName) => window.addEventListener(eventName, handleActivity, { passive: true }));
    return () => {
      window.clearTimeout(timeoutId);
      events.forEach((eventName) => window.removeEventListener(eventName, handleActivity));
    };
  }, [keys, lockVault]);

  const encrypt = useCallback((payload) => {
    if (!keys) throw new Error("Unlock the workspace vault before encrypting.");
    return encryptPayload(payload, keys.aesKey);
  }, [keys]);

  const decrypt = useCallback((ciphertextBase64, ivBase64) => {
    if (!keys) throw new Error("Unlock the workspace vault before decrypting.");
    return decryptPayload(ciphertextBase64, ivBase64, keys.aesKey);
  }, [keys]);

  const blindIndex = useCallback((value) => {
    if (!keys) throw new Error("Unlock the workspace vault before creating a blind index.");
    return createBlindIndex(value, keys.hmacKey);
  }, [keys]);

  const value = useMemo(() => ({
    isUnlocked: Boolean(keys),
    unlockVault,
    lockVault,
    encrypt,
    decrypt,
    blindIndex,
  }), [keys, unlockVault, lockVault, encrypt, decrypt, blindIndex]);

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) throw new Error("useVault must be used inside VaultProvider.");
  return context;
}
