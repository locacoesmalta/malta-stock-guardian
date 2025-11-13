import { describe, it, expect } from 'vitest';
import { 
  sanitizeHTML, 
  sanitizeText, 
  stripScriptTags,
  sanitizeFileName,
  sanitizeURL,
  validateAndSanitizeEmail,
  containsXSSPatterns,
  containsSQLInjectionPatterns
} from '@/lib/inputSanitization';

describe('XSS Protection Tests', () => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '<svg onload=alert("XSS")>',
    '"><script>alert(String.fromCharCode(88,83,83))</script>',
    '<iframe src="javascript:alert(1)">',
    '<body onload=alert("XSS")>',
    '<input onfocus=alert("XSS") autofocus>',
    '<select onfocus=alert("XSS") autofocus>',
    '<textarea onfocus=alert("XSS") autofocus>',
    '<object data="data:text/html,<script>alert(1)</script>">',
  ];

  describe('sanitizeHTML', () => {
    xssPayloads.forEach(payload => {
      it(`should sanitize: ${payload}`, () => {
        const clean = sanitizeHTML(payload);
        expect(clean).not.toContain('<script');
        expect(clean).not.toContain('onerror');
        expect(clean).not.toContain('javascript:');
        expect(clean).not.toContain('onload');
        expect(clean).not.toContain('onfocus');
      });
    });

    it('should preserve normal text', () => {
      expect(sanitizeHTML('Hello World')).toBe('Hello World');
      expect(sanitizeHTML('João da Silva')).toBe('João da Silva');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeHTML(null)).toBe('');
      expect(sanitizeHTML(undefined)).toBe('');
    });
  });

  describe('sanitizeText', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeText('<div>Hello</div>')).not.toContain('<div>');
    });

    it('should remove javascript: protocol', () => {
      const result = sanitizeText('javascript:alert(1)');
      expect(result).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const result = sanitizeText('onclick=alert(1)');
      expect(result.toLowerCase()).not.toContain('onclick=');
    });

    it('should preserve normal text with special characters', () => {
      expect(sanitizeText('R$ 100,00')).toContain('R$ 100,00');
      expect(sanitizeText('Email: test@example.com')).toContain('test@example.com');
    });
  });

  describe('stripScriptTags', () => {
    it('should remove script tags and content', () => {
      const input = 'Hello <script>alert(1)</script> World';
      const result = stripScriptTags(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });
  });

  describe('sanitizeFileName', () => {
    it('should remove dangerous characters', () => {
      expect(sanitizeFileName('<script>.jpg')).toBe('script.jpg');
      expect(sanitizeFileName('test|file.pdf')).toBe('testfile.pdf');
    });

    it('should prevent path traversal', () => {
      const result = sanitizeFileName('../../etc/passwd');
      expect(result).not.toContain('..');
      expect(result).not.toContain('/');
    });

    it('should replace spaces with underscores', () => {
      expect(sanitizeFileName('my file.txt')).toBe('my_file.txt');
    });

    it('should limit length', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const result = sanitizeFileName(longName);
      expect(result.length).toBeLessThanOrEqual(255);
    });
  });

  describe('sanitizeURL', () => {
    it('should block dangerous protocols', () => {
      expect(sanitizeURL('javascript:alert(1)')).toBeNull();
      expect(sanitizeURL('data:text/html,<script>alert(1)</script>')).toBeNull();
      expect(sanitizeURL('vbscript:msgbox(1)')).toBeNull();
    });

    it('should allow safe URLs', () => {
      expect(sanitizeURL('https://example.com')).toBe('https://example.com');
      expect(sanitizeURL('http://test.com/path')).toBe('http://test.com/path');
      expect(sanitizeURL('mailto:test@example.com')).toBe('mailto:test@example.com');
    });

    it('should reject invalid URLs', () => {
      expect(sanitizeURL('not a url')).toBeNull();
      expect(sanitizeURL('ftp://example.com')).toBeNull();
    });
  });

  describe('validateAndSanitizeEmail', () => {
    it('should validate correct emails', () => {
      expect(validateAndSanitizeEmail('user@example.com')).toBe('user@example.com');
      expect(validateAndSanitizeEmail('test.user+tag@example.co.uk')).toBe('test.user+tag@example.co.uk');
    });

    it('should reject emails with dangerous characters', () => {
      expect(validateAndSanitizeEmail('test<script>@example.com')).toBeNull();
      expect(validateAndSanitizeEmail('test"@example.com')).toBeNull();
    });

    it('should reject malformed emails', () => {
      expect(validateAndSanitizeEmail('notanemail')).toBeNull();
      expect(validateAndSanitizeEmail('@example.com')).toBeNull();
      expect(validateAndSanitizeEmail('user@')).toBeNull();
    });

    it('should normalize email to lowercase', () => {
      expect(validateAndSanitizeEmail('USER@EXAMPLE.COM')).toBe('user@example.com');
    });
  });

  describe('containsXSSPatterns', () => {
    it('should detect XSS patterns', () => {
      expect(containsXSSPatterns('<script>alert(1)</script>')).toBe(true);
      expect(containsXSSPatterns('javascript:alert(1)')).toBe(true);
      expect(containsXSSPatterns('<img onerror=alert(1)>')).toBe(true);
      expect(containsXSSPatterns('<svg onload=alert(1)>')).toBe(true);
    });

    it('should not flag normal text', () => {
      expect(containsXSSPatterns('Hello World')).toBe(false);
      expect(containsXSSPatterns('Normal description text')).toBe(false);
    });
  });

  describe('containsSQLInjectionPatterns', () => {
    it('should detect SQL injection patterns', () => {
      expect(containsSQLInjectionPatterns("' OR '1'='1")).toBe(true);
      expect(containsSQLInjectionPatterns('DROP TABLE users')).toBe(true);
      expect(containsSQLInjectionPatterns('UNION SELECT * FROM passwords')).toBe(true);
      expect(containsSQLInjectionPatterns("'; DROP TABLE users; --")).toBe(true);
    });

    it('should not flag normal text', () => {
      expect(containsSQLInjectionPatterns('Product name')).toBe(false);
      expect(containsSQLInjectionPatterns('Description text')).toBe(false);
    });
  });
});

describe('SQL Injection Protection Tests', () => {
  const sqlPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "1' UNION SELECT * FROM passwords--",
    "admin'--",
    "' OR 1=1--",
    "1; DELETE FROM products WHERE '1'='1",
  ];

  sqlPayloads.forEach(payload => {
    it(`should detect SQL injection: ${payload}`, () => {
      expect(containsSQLInjectionPatterns(payload)).toBe(true);
    });
  });
});
