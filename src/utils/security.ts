// Utility for Parental Gate, PIN Hashing and Security Challenges

const PIN_STORAGE_KEY = 'mwana_parental_pin_hash';
const UNLOCK_STORAGE_KEY = 'mwana_parental_unlocked_until';
const DEFAULT_PIN = '1234';

// Fast SHA-256 hash using Web Crypto API or fallback
export async function hashPin(pin: string): Promise<string> {
  const normalized = pin.trim();
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(`mwana_salt_${normalized}`);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback below
    }
  }
  // Basic fallback hash
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `fallback_${Math.abs(hash)}`;
}

export function hasCustomParentalPin(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(PIN_STORAGE_KEY);
}

export async function verifyParentalPin(inputPin: string): Promise<boolean> {
  const cleanInput = inputPin.trim();
  const storedHash = typeof window !== 'undefined' ? localStorage.getItem(PIN_STORAGE_KEY) : null;

  if (!storedHash) {
    // Check against default PIN 1234
    return cleanInput === DEFAULT_PIN;
  }

  const inputHash = await hashPin(cleanInput);
  return inputHash === storedHash;
}

export async function saveParentalPin(newPin: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const hash = await hashPin(newPin.trim());
  localStorage.setItem(PIN_STORAGE_KEY, hash);
}

export function removeCustomParentalPin(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PIN_STORAGE_KEY);
}

export function isParentSessionValid(): boolean {
  if (typeof window === 'undefined') return false;
  const expiry = localStorage.getItem(UNLOCK_STORAGE_KEY);
  if (!expiry) return false;
  const expNum = parseInt(expiry, 10);
  return !isNaN(expNum) && Date.now() < expNum;
}

export function setParentUnlockedSession(durationMinutes: number = 15): number {
  const expiry = Date.now() + durationMinutes * 60 * 1000;
  if (typeof window !== 'undefined') {
    localStorage.setItem(UNLOCK_STORAGE_KEY, expiry.toString());
  }
  return expiry;
}

export function lockParentSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(UNLOCK_STORAGE_KEY);
  }
}

// Generate an adult math challenge (e.g. 14 x 7 or 85 + 49)
export interface MathChallenge {
  question: string;
  answer: number;
}

export function generateMathChallenge(): MathChallenge {
  const types = ['multiply', 'add_double', 'subtract'];
  const chosenType = types[Math.floor(Math.random() * types.length)];

  if (chosenType === 'multiply') {
    const a = Math.floor(Math.random() * 8) + 12; // 12 to 19
    const b = Math.floor(Math.random() * 6) + 4;  // 4 to 9
    return {
      question: `Combien font ${a} × ${b} ?`,
      answer: a * b,
    };
  } else if (chosenType === 'add_double') {
    const a = Math.floor(Math.random() * 40) + 55; // 55 to 94
    const b = Math.floor(Math.random() * 40) + 45; // 45 to 84
    return {
      question: `Combien font ${a} + ${b} ?`,
      answer: a + b,
    };
  } else {
    const a = Math.floor(Math.random() * 60) + 120; // 120 to 179
    const b = Math.floor(Math.random() * 50) + 35;  // 35 to 84
    return {
      question: `Combien font ${a} − ${b} ?`,
      answer: a - b,
    };
  }
}
