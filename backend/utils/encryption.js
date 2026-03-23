import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;

/**
 * Derives an encryption key from a password using PBKDF2
 */
function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512');
}

/**
 * Gets the master encryption key from environment or generates a deterministic one
 */
function getMasterKey() {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('ENCRYPTION_KEY environment variable is required for encryption');
  }
  return secret;
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * Returns: base64 encoded string containing salt + iv + authTag + ciphertext
 */
export function encrypt(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') return plaintext;

  const masterKey = getMasterKey();
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(masterKey, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Pack: salt(64) + iv(16) + authTag(16) + ciphertext
  const packed = Buffer.concat([salt, iv, authTag, encrypted]);
  return `enc:${packed.toString('base64')}`;
}

/**
 * Decrypt an AES-256-GCM encrypted string
 */
export function decrypt(encryptedText) {
  if (!encryptedText || typeof encryptedText !== 'string') return encryptedText;
  if (!encryptedText.startsWith('enc:')) return encryptedText; // Not encrypted

  const masterKey = getMasterKey();
  const packed = Buffer.from(encryptedText.slice(4), 'base64');

  const salt = packed.subarray(0, SALT_LENGTH);
  const iv = packed.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = packed.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = packed.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

  const key = deriveKey(masterKey, salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Hash a value using SHA-256 (one-way, for indexing encrypted fields)
 */
export function hash(value) {
  if (!value) return value;
  return crypto.createHmac('sha256', getMasterKey()).update(value).digest('hex');
}

/**
 * Encrypt specific fields on a lead object before storage
 */
export function encryptLeadFields(lead) {
  if (!lead) return lead;
  const encrypted = { ...lead };

  const sensitiveFields = ['email', 'phone', 'address'];
  for (const field of sensitiveFields) {
    if (encrypted[field]) {
      // Store hash for searchability
      encrypted[`${field}_hash`] = hash(encrypted[field]);
      // Encrypt the actual value
      encrypted[field] = encrypt(encrypted[field]);
    }
  }

  return encrypted;
}

/**
 * Decrypt specific fields on a lead object after retrieval
 */
export function decryptLeadFields(lead) {
  if (!lead) return lead;
  const decrypted = { ...lead };

  const sensitiveFields = ['email', 'phone', 'address'];
  for (const field of sensitiveFields) {
    if (decrypted[field]) {
      decrypted[field] = decrypt(decrypted[field]);
    }
    // Remove hash fields from response
    delete decrypted[`${field}_hash`];
  }

  return decrypted;
}

/**
 * Encrypt an entire object's string values
 */
export function encryptObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const encrypted = {};
  for (const [key, value] of Object.entries(obj)) {
    encrypted[key] = typeof value === 'string' ? encrypt(value) : value;
  }
  return encrypted;
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a key pair for asymmetric encryption (RSA)
 */
export function generateKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
}

export default {
  encrypt,
  decrypt,
  hash,
  encryptLeadFields,
  decryptLeadFields,
  encryptObject,
  generateSecureToken,
  generateKeyPair
};
