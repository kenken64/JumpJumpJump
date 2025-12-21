# GitHub Actions Local Testing with act

## Quick Reference

### List available workflows
```powershell
act -l
```

### Test Coverage Workflow
```powershell
# Dry run (see what would execute)
act push -W .github/workflows/test-coverage.yml -n

# Actually run it
act push -W .github/workflows/test-coverage.yml
```

### Release Workflow (tag-triggered)
```powershell
# Dry run
act push -W .github/workflows/release.yml --eventpath .github/workflows/tag-event.json -n

# Run specific jobs
act push -W .github/workflows/release.yml --eventpath .github/workflows/tag-event.json -j build-frontend
act push -W .github/workflows/release.yml --eventpath .github/workflows/tag-event.json -j build-backend
```

### Playwright E2E Tests
```powershell
act push -W .github/workflows/playwright.yml -n
```

### Common Options
```powershell
# Verbose output
act push -v

# Pass secrets
act push -s GITHUB_TOKEN=your_token

# Use specific platform image
act push -P ubuntu-latest=catthehacker/ubuntu:act-latest

# Skip jobs that need specific permissions
act push --no-skip-checkout
```

### Troubleshooting

1. **Docker not running**: Make sure Docker Desktop is running
2. **Slow first run**: First run downloads Docker images (~2GB)
3. **Permission errors**: Some actions need `GITHUB_TOKEN` - pass with `-s`
4. **Service containers**: Redis/Postgres services may need extra config

### Notes
- Docker Desktop must be running
- First run will be slow (downloads ~2GB image)
- Some GitHub-specific features won't work locally
- Secrets must be passed manually or via `.secrets` file
