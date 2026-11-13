import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

// scrypt with N=2^15, r=8, p=3 (a parameter set recommended by OWASP).
// Stored as: scrypt$N$r$p$salt$hash, so parameters can change later without
// breaking old hashes.
const KEY_LENGTH = 64;
const N = 32768;
const R = 8;
const P = 3;

function derive(
  password: string,
  salt: Buffer,
  n: number,
  r: number,
  p: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      KEY_LENGTH,
      { N: n, r, p, maxmem: 128 * n * r * 2 },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P);
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (![n, r, p].every((value) => Number.isInteger(value) && value > 0)) {
    return false;
  }

  const expected = Buffer.from(parts[5], 'base64');
  const actual = await derive(
    password,
    Buffer.from(parts[4], 'base64'),
    n,
    r,
    p,
  );
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// Used when the email is unknown, so a missing account takes as long to answer
// as a wrong password.
let dummy: Promise<string> | undefined;
export function dummyHash(): Promise<string> {
  dummy ??= hashPassword('this-is-not-a-real-password');
  return dummy;
}
