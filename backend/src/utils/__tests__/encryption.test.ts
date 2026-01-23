import { encrypt, decrypt, hash } from '../encryption';

describe('Encryption Utils', () => {
  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt text correctly', () => {
      const originalText = 'sensitive data';
      const encrypted = encrypt(originalText);
      
      expect(encrypted).not.toBe(originalText);
      expect(encrypted).toContain(':');
      
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(originalText);
    });

    it('should handle different input strings', () => {
      const testCases = [
        'short',
        'very long string with special characters !@#$%^&*()',
        '1234567890',
        'unicode: 你好世界',
      ];

      testCases.forEach((text) => {
        const encrypted = encrypt(text);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(text);
      });
    });

    it('should throw error for invalid encrypted data', () => {
      expect(() => {
        decrypt('invalid-format');
      }).toThrow('Invalid encrypted data format');
    });
  });

  describe('hash', () => {
    it('should create consistent hash', () => {
      const text = 'test string';
      const hash1 = hash(text);
      const hash2 = hash(text);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 char hex string
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = hash('string1');
      const hash2 = hash('string2');
      
      expect(hash1).not.toBe(hash2);
    });
  });
});

