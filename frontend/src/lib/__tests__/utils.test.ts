import {
  cn,
  formatDate,
  formatFileSize,
  debounce,
  truncate,
  isValidEmail,
  isValidPhone,
  getInitials,
} from '../utils';

describe('Utility Functions', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });
  });

  describe('formatDate', () => {
    it('formats date in short format', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date, 'short');
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
    });

    it('formats date in long format', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date, 'long');
      expect(formatted).toContain('January');
    });

    it('formats relative dates', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const formatted = formatDate(oneHourAgo, 'relative');
      expect(formatted).toContain('1h ago');
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();
    
    it('delays function execution', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 1000);

      debouncedFunc();
      expect(func).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      expect(func).toHaveBeenCalledTimes(1);
    });
  });

  describe('truncate', () => {
    it('truncates long strings', () => {
      const longString = 'a'.repeat(100);
      expect(truncate(longString, 50).length).toBeLessThanOrEqual(53); // 50 + '...'
    });

    it('returns short strings unchanged', () => {
      expect(truncate('short', 10)).toBe('short');
    });
  });

  describe('isValidEmail', () => {
    it('validates correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('validates correct phone numbers', () => {
      expect(isValidPhone('+1234567890')).toBe(true);
      expect(isValidPhone('(123) 456-7890')).toBe(true);
      expect(isValidPhone('123-456-7890')).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('abc')).toBe(false);
    });
  });

  describe('getInitials', () => {
    it('extracts initials from name', () => {
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Mary Jane Watson')).toBe('MJ');
      expect(getInitials('A')).toBe('A');
    });
  });
});

