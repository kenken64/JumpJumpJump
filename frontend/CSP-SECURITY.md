# Content Security Policy (CSP) Documentation

## Current CSP Configuration

The application's Content Security Policy is defined in `index.html`:

```
default-src 'self';
script-src 'self' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
connect-src 'self' http://localhost:8000 ws://localhost:8000 https://*.railway.app wss://*.railway.app http://*.railway.app ws://*.railway.app;
media-src 'self' blob:;
form-action 'self';
```

## Rationale for 'unsafe-eval' and 'unsafe-inline'

### Why 'unsafe-eval' is Required

The `'unsafe-eval'` directive in `script-src` is necessary for the following reasons:

1. **Phaser Game Engine Requirement**
   - Phaser 3.x uses dynamic code evaluation for various runtime optimizations
   - The physics engine and rendering pipeline may require `eval()` for performance-critical operations
   - WebGL shader compilation and optimization in Phaser relies on dynamic code generation

2. **TensorFlow.js Dependency**
   - TensorFlow.js (`@tensorflow/tfjs`) is used for ML/AI features in the game
   - TensorFlow.js uses `eval()` and `Function()` constructors for:
     - Dynamic kernel compilation
     - WebGL shader generation
     - Performance optimizations in tensor operations

**Mitigation Strategies:**
- All user input is sanitized before processing
- No user-controlled data is passed to eval() contexts
- Libraries are loaded from trusted sources only (`'self'`)
- Regular dependency updates to patch any security vulnerabilities

### Why 'unsafe-inline' is Required

The `'unsafe-inline'` directive in `style-src` is necessary for:

1. **React Inline Styles**
   - React components use inline styles for dynamic UI elements
   - Game UI overlays require runtime style calculations

2. **Phaser Canvas Styling**
   - Phaser applies inline styles to canvas elements for proper rendering
   - Dynamic viewport adjustments require inline style modifications

**Mitigation Strategies:**
- Minimize use of inline styles where possible
- Consider migrating to CSS-in-JS solutions with nonce support in future iterations
- All style values are validated and sanitized

## Additional Security Headers Implemented

In addition to CSP, the following security headers have been implemented:

### Cross-Origin Headers
- **Cross-Origin-Resource-Policy (CORP)**: `same-origin`
  - Prevents other origins from loading frontend resources
  - Protects against Spectre-like side-channel attacks

- **Cross-Origin-Opener-Policy (COOP)**: `same-origin`
  - Prevents other documents from gaining access to the window object
  - Isolates the browsing context for better security

- **Cross-Origin-Embedder-Policy (COEP)**: **NOT ENABLED**
  - Would require all subresources to explicitly opt-in via CORS or CORP
  - Currently disabled because Phaser and TensorFlow.js load resources dynamically
  - May be enabled in future after thorough testing and resource configuration

### Standard Security Headers (Already Present)
- **X-Frame-Options**: `SAMEORIGIN` - Prevents clickjacking
- **X-Content-Type-Options**: `nosniff` - Prevents MIME sniffing
- **X-XSS-Protection**: `1; mode=block` - Legacy XSS protection

**Configuration Locations:**
- Development server: `frontend/vite.config.ts`
- Production (nginx): `frontend/nginx.conf`

## Future Improvements

### Short-term Goals
1. Audit all inline styles and migrate to external stylesheets where feasible
2. Investigate Phaser and TensorFlow.js alternatives that don't require `unsafe-eval`
3. Implement subresource integrity (SRI) for all external resources
4. Test and enable COEP (Cross-Origin-Embedder-Policy) if resources can be configured properly

### Long-term Goals
1. **Nonce-based CSP**
   - Implement nonce generation for inline scripts and styles
   - This would allow removal of `'unsafe-inline'` while maintaining functionality

2. **Hash-based CSP**
   - Generate SHA-256 hashes for required inline styles
   - More maintainable for static inline content

3. **Evaluate Phaser Alternatives**
   - Research game engines with stricter CSP compatibility
   - Consider custom WebGL renderer if performance requirements allow

4. **TensorFlow.js Configuration**
   - Investigate TensorFlow.js build options that minimize eval usage
   - Consider using pre-compiled models to reduce runtime evaluation

## Security Monitoring

- Regular security audits using OWASP ZAP
- Automated CSP violation reporting (to be implemented)
- Dependency vulnerability scanning with Trivy and npm audit

## References

- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Phaser 3 Documentation](https://photonstorm.github.io/phaser3-docs/)
- [TensorFlow.js Security Considerations](https://www.tensorflow.org/js/guide/security)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)

---

**Last Updated:** 2025-12-25
**Owner:** Frontend Security Team
