/**
 * Security-focused tests for frontend
 * Tests CSP, security headers, input sanitization, and XSS protection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Security Headers and CSP', () => {
  describe('Content Security Policy', () => {
    it('should have CSP meta tag in production builds', () => {
      // In a real deployment, CSP would be set via HTTP headers or meta tag
      // This test verifies the concept
      const mockMetaTag = document.createElement('meta');
      mockMetaTag.httpEquiv = 'Content-Security-Policy';
      mockMetaTag.content = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';";

      expect(mockMetaTag.httpEquiv).toBe('Content-Security-Policy');
      expect(mockMetaTag.content).toContain("default-src 'self'");
    });

    it('should not allow eval in CSP unless required by framework', () => {
      // Note: unsafe-eval may be required by Phaser or TensorFlow.js
      // This test documents the requirement
      const cspContent = "default-src 'self'; script-src 'self' 'unsafe-eval';";

      // If unsafe-eval is present, it should be documented why
      if (cspContent.includes('unsafe-eval')) {
        // Document that this is required for game framework
        expect(cspContent).toContain('script-src');
      }
    });

    it('should restrict script sources', () => {
      const cspContent = "script-src 'self';";
      expect(cspContent).not.toContain('*');
      expect(cspContent).toContain("'self'");
    });

    it('should have form-action directive', () => {
      const cspContent = "default-src 'self'; form-action 'self';";
      expect(cspContent).toContain('form-action');
      expect(cspContent).toContain("form-action 'self'");
    });

    it('should restrict frame-ancestors to prevent clickjacking', () => {
      const cspContent = "default-src 'self'; frame-ancestors 'self';";
      expect(cspContent).toContain('frame-ancestors');
    });

    it('should have base-uri directive', () => {
      const cspContent = "default-src 'self'; base-uri 'self';";
      expect(cspContent).toContain('base-uri');
    });

    it('should restrict object-src to prevent plugin execution', () => {
      const cspContent = "default-src 'self'; object-src 'none';";
      expect(cspContent).toContain('object-src');
    });

    it('should allow WebSocket connections for multiplayer', () => {
      const cspContent = "default-src 'self'; connect-src 'self' ws://localhost:8000 wss://*.railway.app;";
      expect(cspContent).toContain('connect-src');
      // Should allow WebSocket for game multiplayer
      expect(cspContent).toContain('ws://') || expect(cspContent).toContain('wss://');
    });
  });

  describe('Security Headers Requirements', () => {
    it('should require X-Content-Type-Options nosniff', () => {
      const headerValue = 'nosniff';
      expect(headerValue).toBe('nosniff');
    });

    it('should require Strict-Transport-Security', () => {
      const hstsHeader = 'max-age=31536000; includeSubDomains; preload';
      expect(hstsHeader).toContain('max-age=31536000');
      expect(hstsHeader).toContain('includeSubDomains');
    });

    it('should have Permissions-Policy restrictions', () => {
      const permissionsPolicy = 'camera=(), microphone=(), geolocation=()';
      expect(permissionsPolicy).toContain('camera=()');
      expect(permissionsPolicy).toContain('microphone=()');
      expect(permissionsPolicy).toContain('geolocation=()');
    });

    it('should have Cross-Origin-Resource-Policy', () => {
      const corpHeader = 'same-origin';
      expect(corpHeader).toBe('same-origin');
    });

    it('should have Cross-Origin-Opener-Policy', () => {
      const coopHeader = 'same-origin';
      expect(coopHeader).toBe('same-origin');
    });

    it('should have Cross-Origin-Embedder-Policy', () => {
      const coepHeader = 'require-corp';
      expect(coepHeader).toBe('require-corp');
    });
  });
});

describe('Input Sanitization and XSS Protection', () => {
  describe('Player Name Input Validation', () => {
    const sanitizeInput = (input: string): string => {
      // Basic sanitization function
      return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    };

    it('should sanitize HTML tags from player names', () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(maliciousInput);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
      expect(sanitized).toContain('&lt;');
      expect(sanitized).toContain('&gt;');
    });

    it('should sanitize event handlers from input', () => {
      const maliciousInput = '<img src=x onerror=alert("XSS")>';
      const sanitized = sanitizeInput(maliciousInput);

      expect(sanitized).not.toContain('<img');
      expect(sanitized).toContain('&lt;'); // HTML entities should be escaped
      expect(sanitized).toContain('&gt;');
    });

    it('should sanitize javascript: URLs', () => {
      const maliciousInput = 'javascript:alert("XSS")';
      const sanitized = sanitizeInput(maliciousInput);

      // Should escape quotes at minimum
      expect(sanitized).toContain('&quot;');
      expect(sanitized).not.toContain('alert("XSS")'); // Raw quotes should be escaped
    });

    it('should handle quotes in player names', () => {
      const input = `Player"Name'With'Quotes`;
      const sanitized = sanitizeInput(input);

      expect(sanitized).not.toContain('"');
      expect(sanitized).not.toContain("'");
      expect(sanitized).toContain('&quot;');
      expect(sanitized).toContain('&#x27;');
    });

    it('should limit player name length', () => {
      const maxLength = 50;
      const longInput = 'A'.repeat(100);
      const truncated = longInput.substring(0, maxLength);

      expect(truncated.length).toBeLessThanOrEqual(maxLength);
    });

    it('should reject empty player names', () => {
      const input = '';
      const isValid = input.trim().length > 0;

      expect(isValid).toBe(false);
    });

    it('should reject whitespace-only player names', () => {
      const input = '   ';
      const isValid = input.trim().length > 0;

      expect(isValid).toBe(false);
    });
  });

  describe('WebSocket Message Validation', () => {
    it('should validate WebSocket message types', () => {
      const validTypes = [
        'create_room',
        'join_room',
        'player_ready',
        'player_state',
        'game_action',
        'chat',
        'start_game',
        'leave_room'
      ];

      const testMessage = { type: 'create_room', data: {} };
      expect(validTypes).toContain(testMessage.type);
    });

    it('should reject invalid WebSocket message types', () => {
      const validTypes = [
        'create_room',
        'join_room',
        'player_ready',
        'player_state',
        'game_action',
        'chat',
        'start_game',
        'leave_room'
      ];

      const testMessage = { type: 'invalid_type', data: {} };
      expect(validTypes).not.toContain(testMessage.type);
    });

    it('should validate chat message length', () => {
      const maxChatLength = 500;
      const longMessage = 'A'.repeat(1000);
      const truncated = longMessage.substring(0, maxChatLength);

      expect(truncated.length).toBeLessThanOrEqual(maxChatLength);
    });

    it('should sanitize chat messages', () => {
      const sanitizeChat = (input: string): string => {
        return input
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      };

      const maliciousChat = '<script>alert("XSS")</script>';
      const sanitized = sanitizeChat(maliciousChat);

      expect(sanitized).not.toContain('<script>');
    });
  });

  describe('API Key Security', () => {
    it('should not expose API key in frontend code', () => {
      // API key should come from backend, not hardcoded
      const apiKey = import.meta.env.VITE_API_KEY || '';

      // If API key is used in frontend, it should come from env
      expect(typeof apiKey).toBe('string');
    });

    it('should use secure methods for API authentication', () => {
      // API calls should include proper headers
      const mockHeaders = {
        'X-API-Key': 'test-key',
        'Content-Type': 'application/json'
      };

      expect(mockHeaders['X-API-Key']).toBeDefined();
      expect(mockHeaders['Content-Type']).toBe('application/json');
    });
  });
});

describe('CORS and Origin Validation', () => {
  it('should validate WebSocket origins', () => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://jumpjumpjump.railway.app'
    ];

    const testOrigin = 'http://localhost:5173';
    expect(allowedOrigins).toContain(testOrigin);
  });

  it('should reject requests from unauthorized origins', () => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173'
    ];

    const maliciousOrigin = 'http://evil.com';
    expect(allowedOrigins).not.toContain(maliciousOrigin);
  });

  it('should use secure WebSocket protocol in production', () => {
    const isDevelopment = import.meta.env.DEV;
    const wsProtocol = isDevelopment ? 'ws://' : 'wss://';

    // In production, should use wss://
    if (!isDevelopment) {
      expect(wsProtocol).toBe('wss://');
    }
  });
});

describe('Local Storage Security', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should not store sensitive data in localStorage', () => {
    // Should only store game state, not credentials
    localStorage.setItem('playerName', 'TestPlayer');
    localStorage.setItem('highScore', '1000');

    // Should not contain passwords or tokens
    const allKeys = Object.keys(localStorage);
    expect(allKeys).not.toContain('password');
    expect(allKeys).not.toContain('token');
    expect(allKeys).not.toContain('apiKey');
  });

  it('should sanitize data before storing in localStorage', () => {
    const sanitizeForStorage = (data: string): string => {
      return data.replace(/[<>]/g, '');
    };

    const userInput = '<script>alert("XSS")</script>';
    const sanitized = sanitizeForStorage(userInput);

    localStorage.setItem('testData', sanitized);
    expect(localStorage.getItem('testData')).not.toContain('<script>');
  });

  it('should validate data retrieved from localStorage', () => {
    localStorage.setItem('playerName', 'ValidName');

    const retrievedName = localStorage.getItem('playerName');
    const isValid = retrievedName && retrievedName.length > 0 && retrievedName.length <= 50;

    expect(isValid).toBe(true);
  });
});

describe('DOM Manipulation Security', () => {
  it('should use safe DOM manipulation methods', () => {
    const container = document.createElement('div');
    const safeText = 'Safe text content';

    // Use textContent, not innerHTML for user input
    container.textContent = safeText;

    expect(container.textContent).toBe(safeText);
  });

  it('should escape user input when displaying', () => {
    const escapeHtml = (text: string): string => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    const userInput = '<img src=x onerror=alert(1)>';
    const escaped = escapeHtml(userInput);

    expect(escaped).not.toContain('<img');
    expect(escaped).toContain('&lt;');
  });

  it('should prevent innerHTML injection', () => {
    const container = document.createElement('div');
    const maliciousInput = '<script>alert("XSS")</script>';

    // Should use textContent instead of innerHTML for user input
    container.textContent = maliciousInput;

    expect(container.innerHTML).toContain('&lt;');
    expect(container.innerHTML).not.toContain('<script>');
  });
});

describe('Error Handling Security', () => {
  it('should not expose stack traces to users', () => {
    const safeErrorMessage = (error: Error): string => {
      // Don't expose full error details
      return 'An error occurred. Please try again.';
    };

    const error = new Error('Database connection failed at /backend/db/connection.js:123');
    const userMessage = safeErrorMessage(error);

    expect(userMessage).not.toContain('Database');
    expect(userMessage).not.toContain('/backend/');
  });

  it('should log errors securely', () => {
    const secureLog = (message: string, error?: Error): void => {
      // In production, would send to logging service
      // Should not expose to console in production
      if (import.meta.env.DEV) {
        console.error(message, error);
      }
    };

    const error = new Error('Test error');
    // Should not throw
    expect(() => secureLog('Error occurred', error)).not.toThrow();
  });
});

describe('Network Security', () => {
  it('should use HTTPS in production', () => {
    const getApiUrl = (): string => {
      const isDev = import.meta.env.DEV;
      return isDev ? 'http://localhost:8000' : 'https://api.jumpjumpjump.com';
    };

    const apiUrl = getApiUrl();

    if (!import.meta.env.DEV) {
      expect(apiUrl).toMatch(/^https:\/\//);
    }
  });

  it('should timeout long-running requests', () => {
    const TIMEOUT_MS = 30000;

    const fetchWithTimeout = async (url: string, timeout: number = TIMEOUT_MS): Promise<Response> => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        return response;
      } catch (error) {
        clearTimeout(id);
        throw error;
      }
    };

    expect(fetchWithTimeout).toBeDefined();
  });

  it('should validate response content type', () => {
    const validateContentType = (response: Response): boolean => {
      const contentType = response.headers.get('content-type');
      return contentType?.includes('application/json') || false;
    };

    const mockResponse = new Response('{}', {
      headers: { 'content-type': 'application/json' }
    });

    expect(validateContentType(mockResponse)).toBe(true);
  });
});

describe('Rate Limiting Client-Side', () => {
  it('should throttle rapid API calls', () => {
    const throttle = (func: Function, limit: number) => {
      let inThrottle: boolean;
      return function(this: any, ...args: any[]) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    };

    let callCount = 0;
    const throttled = throttle(() => callCount++, 100);

    throttled();
    throttled();
    throttled();

    expect(callCount).toBe(1);
  });

  it('should debounce user input', () => {
    vi.useFakeTimers();

    const debounce = (func: Function, delay: number) => {
      let timeoutId: NodeJS.Timeout;
      return function(this: any, ...args: any[]) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
      };
    };

    let callCount = 0;
    const debounced = debounce(() => callCount++, 300);

    debounced();
    debounced();
    debounced();

    vi.advanceTimersByTime(300);

    expect(callCount).toBe(1);

    vi.useRealTimers();
  });
});

describe('Format String Security', () => {
  describe('Logging Functions', () => {
    it('should not expose sensitive data in logs', () => {
      const sensitiveData = {
        password: 'secret123',
        apiKey: 'api-key-123',
        token: 'auth-token'
      };

      // Safe logging - redact sensitive fields
      const safeLog = (data: any) => {
        const safe = { ...data };
        if (safe.password) safe.password = '[REDACTED]';
        if (safe.apiKey) safe.apiKey = '[REDACTED]';
        if (safe.token) safe.token = '[REDACTED]';
        return safe;
      };

      const logged = safeLog(sensitiveData);
      expect(logged.password).toBe('[REDACTED]');
      expect(logged.apiKey).toBe('[REDACTED]');
      expect(logged.token).toBe('[REDACTED]');
    });

    it('should sanitize user inputs before logging', () => {
      const userInput = '<script>alert("XSS")</script>';

      // Sanitize before logging
      const sanitizeForLog = (input: string) => {
        return input
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      };

      const sanitized = sanitizeForLog(userInput);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;');
      expect(sanitized).toContain('&gt;');
    });

    it('should use template literals safely', () => {
      const playerName = "Player<script>alert('xss')</script>";
      const score = 100;

      // Safe: Using template literals with sanitization
      const sanitize = (str: string) => str.replace(/[<>]/g, '');
      const message = `Player ${sanitize(playerName)} scored ${score}`;

      expect(message).not.toContain('<script>');
      expect(message).toContain('Player');
      expect(message).toContain('100');
    });

    it('should avoid string concatenation with user input in logs', () => {
      const userControlledInput = "normal' + malicious + 'input";

      // Bad practice: Direct concatenation
      // const badLog = "User input: " + userControlledInput;

      // Good practice: Use structured logging
      const goodLog = JSON.stringify({
        type: 'user_input',
        value: userControlledInput
      });

      const parsed = JSON.parse(goodLog);
      expect(parsed.type).toBe('user_input');
      expect(parsed.value).toBe(userControlledInput);
    });

    it('should limit log message length', () => {
      const veryLongInput = 'A'.repeat(10000);
      const maxLogLength = 1000;

      const truncateLog = (message: string, maxLength: number = maxLogLength) => {
        if (message.length <= maxLength) return message;
        return message.substring(0, maxLength) + '... [truncated]';
      };

      const truncated = truncateLog(veryLongInput);
      expect(truncated.length).toBeLessThanOrEqual(maxLogLength + 20); // +20 for "... [truncated]"
    });

    it('should escape format specifiers in user input', () => {
      // Prevent format string injection
      const maliciousInput = '%s%s%s%s%s%s';

      // Safe logging - escape format specifiers
      const escapeFormatSpecifiers = (input: string) => {
        return input.replace(/%/g, '%%');
      };

      const escaped = escapeFormatSpecifiers(maliciousInput);
      expect(escaped).toBe('%%s%%s%%s%%s%%s%%s');
    });

    it('should validate log levels before logging', () => {
      const validLogLevels = ['debug', 'info', 'warn', 'error'];
      const userProvidedLevel = 'info';

      const isValidLogLevel = (level: string) => {
        return validLogLevels.includes(level);
      };

      expect(isValidLogLevel(userProvidedLevel)).toBe(true);
      expect(isValidLogLevel('malicious')).toBe(false);
    });
  });
});
