// Auth utility functions using Node.js crypto (no bcrypt dependency needed)
import { createHash, randomBytes, timingSafeEqual } from 'crypto'

const SALT_LENGTH = 16
const ITERATIONS = 10000
const KEY_LENGTH = 64

// Hash a password with salt
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH).toString('hex')
  return new Promise((resolve, reject) => {
    const hash = createHash('sha512')
    hash.update(salt + password)
    // Simple iteration-based hashing (production should use bcrypt/argon2)
    let result = hash.digest('hex')
    for (let i = 1; i < ITERATIONS; i++) {
      const h = createHash('sha512')
      h.update(result + salt)
      result = h.digest('hex')
    }
    resolve(`${salt}:${result}`)
  })
}

// Verify a password against a hash
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const [salt, storedHash] = hashedPassword.split(':')
  if (!salt || !storedHash) return false

  return new Promise((resolve) => {
    const hash = createHash('sha512')
    hash.update(salt + password)
    let result = hash.digest('hex')
    for (let i = 1; i < ITERATIONS; i++) {
      const h = createHash('sha512')
      h.update(result + salt)
      result = h.digest('hex')
    }
    try {
      const resultBuf = Buffer.from(result, 'hex')
      const storedBuf = Buffer.from(storedHash, 'hex')
      resolve(resultBuf.length === storedBuf.length && timingSafeEqual(resultBuf, storedBuf))
    } catch {
      resolve(false)
    }
  })
}

// Generate a random token
export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

// Generate a simple numeric OTP
export function generateOTP(length: number = 6): string {
  const chars = '0123456789'
  let result = ''
  const bytes = randomBytes(length)
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}
