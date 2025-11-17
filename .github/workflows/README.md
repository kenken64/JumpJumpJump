# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated testing, building, and deployment of the JumpJumpJump game.

## Workflows

### 1. Test Workflow (`test.yml`)
**Triggers:** Push or PR to `main` or `develop` branches

**Jobs:**
- **Backend Tests**: Runs pytest with coverage reporting
  - Python 3.11
  - Installs dependencies from `requirements.txt` and `requirements-dev.txt`
  - Runs all 33 backend tests
  - Uploads coverage to Codecov
  
- **Frontend Tests**: Runs Vitest with coverage reporting
  - Node.js 20
  - Installs npm dependencies
  - Runs all 54 frontend tests
  - Uploads coverage to Codecov
  
- **Test Summary**: Aggregates results from both test jobs
  - Displays overall test status
  - Fails the workflow if any tests fail

**Usage:**
```bash
# Tests run automatically on push/PR
# View results in the Actions tab of your repository
```

### 2. CI/CD Pipeline (`ci-cd.yml`)
**Triggers:** Push or PR to `main` branch

**Jobs:**
1. **Lint & Format Check**
   - Runs ESLint on frontend code
   - Checks code style and formatting

2. **Test Backend**
   - Runs all backend tests with coverage
   - Uploads coverage reports as artifacts
   - Comments on PRs with coverage information

3. **Test Frontend**
   - Runs all frontend tests with coverage
   - Uploads coverage reports as artifacts

4. **Build Backend**
   - Verifies backend can start successfully
   - Ensures all dependencies are properly installed

5. **Build Frontend**
   - Builds production-ready frontend bundle
   - Uploads build artifacts for deployment

6. **Deploy** (Placeholder)
   - Ready for deployment configuration
   - Only runs on main branch pushes
   - Configure with your deployment target

## Setup Instructions

### 1. Enable GitHub Actions
GitHub Actions is enabled by default for public repositories. For private repositories, go to Settings > Actions > General and enable Actions.

### 2. Add Secrets (Optional)
If you're using Codecov or other services:

1. Go to Settings > Secrets and variables > Actions
2. Add repository secrets:
   - `CODECOV_TOKEN` (optional, for private repos)

### 3. Configure Deployment
To enable deployment, edit the `deploy` job in `ci-cd.yml`:

**Example for Vercel:**
```yaml
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

**Example for AWS:**
```yaml
- name: Deploy to AWS
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: us-east-1
```

## Status Badges

Add these to your main README.md:

```markdown
![Tests](https://github.com/kenken64/JumpJumpJump/workflows/Run%20Tests/badge.svg)
![CI/CD](https://github.com/kenken64/JumpJumpJump/workflows/CI%2FCD%20Pipeline/badge.svg)
[![codecov](https://codecov.io/gh/kenken64/JumpJumpJump/branch/main/graph/badge.svg)](https://codecov.io/gh/kenken64/JumpJumpJump)
```

## Local Testing

Before pushing, you can test locally:

**Backend:**
```bash
cd backend
python -m pytest -v --cov=. --cov-report=term-missing
```

**Frontend:**
```bash
cd frontend
npm run test:coverage -- --run
```

## Workflow Status

View workflow runs:
- Navigate to the **Actions** tab in your GitHub repository
- Click on a workflow to see detailed logs
- Green checkmark ✅ = Success
- Red X ❌ = Failure

## Troubleshooting

### Tests fail in CI but pass locally
- Check Python/Node versions match (Python 3.11, Node 20)
- Ensure all dependencies are in requirements.txt/package.json
- Check for environment-specific issues

### Build artifacts not uploading
- Verify artifact paths are correct
- Check artifact size limits (GitHub has a 500MB limit)

### Coverage reports not showing
- Ensure `--cov-report=xml` is included in pytest command
- Check that coverage files are generated before upload
- Verify Codecov token is configured correctly

## Performance

**Average Workflow Times:**
- Backend Tests: ~30 seconds
- Frontend Tests: ~45 seconds
- Full CI/CD Pipeline: ~3-5 minutes

## Cost
GitHub Actions provides:
- **Public repos**: Unlimited minutes
- **Private repos**: 2,000 minutes/month free

This project uses approximately:
- ~10 minutes per full test run
- ~200 minutes per month (assuming 20 runs)
