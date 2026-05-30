import argon2 from 'argon2'

// Argon2id — OWASP recommended settings for 2025+
// memoryCost: 64MB RAM required per hash — makes GPU/ASIC attacks expensive
// timeCost: 3 iterations
// parallelism: 4 threads
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 64 * 1024, // 64 MB
  timeCost: 3,
  parallelism: 4,
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS)
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password)
  } catch {
    return false
  }
}
