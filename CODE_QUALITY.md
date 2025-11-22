# Code Quality Guardrails

This document outlines the code quality measures in place to prevent build errors.

## TypeScript Configuration

The project uses strict TypeScript settings in `tsconfig.json`:

- `"noUnusedLocals": true` - Errors on unused local variables
- `"noUnusedParameters": true` - Errors on unused function parameters
- `"strict": true` - Enables all strict type checking options

## ESLint Configuration

ESLint is configured to catch common issues:

- **Unused variables**: Will error if variables are declared but never used
- **TypeScript rules**: Enforces TypeScript best practices
- **React rules**: Ensures React code follows best practices

### Running Linting

```bash
cd frontend

# Check for issues
pnpm run lint

# Auto-fix issues
pnpm run lint:fix

# Type check only
pnpm run type-check
```

## Pre-commit Hook

A Git pre-commit hook automatically runs TypeScript type checking before each commit. If there are type errors, the commit will be blocked.

## Build Process

The build command runs TypeScript type checking before building:

```bash
pnpm build  # Runs: tsc --noEmit && vite build
```

This ensures no unused variables or type errors make it into production.

## Tips to Avoid Issues

1. **Remove unused variables** - If you declare a variable but don't use it, either use it or remove it
2. **Prefix with underscore** - If you intentionally want an unused variable (e.g., for documentation), prefix it with `_`:
   ```typescript
   const _unusedVar = value  // Won't trigger error
   ```
3. **Run type check regularly** - Run `pnpm run type-check` during development
4. **Install ESLint extension** - Use the ESLint extension in VS Code for real-time feedback

## VS Code Settings

Add these to your `.vscode/settings.json` for automatic linting:

```json
{
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```
