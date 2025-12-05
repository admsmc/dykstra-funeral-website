# E2E Testing Quick Start

Playwright is now set up for automated UI testing. Here's how to use it.

## 🚀 First Run

1. **Create baseline screenshots** (one time only):
   ```bash
   pnpm test:e2e:snapshots
   ```
   This creates baseline images for visual regression testing.

2. **Run all tests**:
   ```bash
   pnpm test:e2e
   ```

## 📋 Common Commands

### Run Tests
```bash
pnpm test:e2e              # All browsers, all tests
pnpm test:e2e:chromium     # Chrome only (fastest)
pnpm test:e2e:mobile       # Mobile browsers only
```

### Debug Tests
```bash
pnpm test:e2e:ui           # Visual test runner (recommended)
pnpm test:e2e:debug        # Step through with debugger
pnpm test:e2e:headed       # Watch browser execute tests
```

### View Results
```bash
pnpm test:e2e:report       # Open HTML report
```

## 📊 What Gets Tested

### Public Tests (No Auth Required)
1. **Smoke Tests** - Quick 3-test validation
2. **Public Routes** - 6 pages × 5+ checks each
3. **Accessibility** - WCAG compliance across all pages
4. **Visual Regression** - Screenshot comparison

### Authenticated Tests (Staff/ERP)
5. **Staff Dashboard** - Navigation, layout, core features
6. **Staff ERP Features** - FinOps, Payroll, Templates, Workflows

### Coverage
**Public Routes**:
- ✅ 6 public routes (/, /about, /services, /contact, /obituaries, /pre-planning)
- ✅ 50+ test cases

**Staff/ERP Routes**:
- ✅ 20+ staff routes (dashboard, cases, contracts, payments, etc.)
- ✅ Financial Operations (FinOps)
- ✅ Payroll Management
- ✅ Template Library & Editor
- ✅ Workflow Approvals & Analytics
- ✅ 60+ test cases

**Total**: 110+ automated tests across 5 browsers

## 🐛 Troubleshooting

### Tests fail on first run?
You may need baseline screenshots:
```bash
pnpm test:e2e:snapshots
```

### Want to see what's happening?
Use headed or UI mode:
```bash
pnpm test:e2e:headed
# or
pnpm test:e2e:ui
```

### Visual regression failures?
Review differences in `test-results/` directory, then:
- If changes are intentional: `pnpm test:e2e:snapshots`
- If not intentional: fix the UI issue and re-run

### Timeout errors?
Increase timeout in `playwright.config.ts` or check for slow API calls.

## 📁 File Structure

```
dykstra-funeral-website/
├── tests/e2e/
│   ├── smoke.spec.ts              # Quick validation
│   ├── public-routes.spec.ts      # Core functionality
│   ├── accessibility.spec.ts      # WCAG compliance
│   ├── visual-regression.spec.ts  # Screenshots
│   ├── utils.ts                   # Helper functions
│   └── README.md                  # Full documentation
├── playwright.config.ts           # Test configuration
├── TESTING.md                     # Complete testing guide
└── .github/workflows/
    └── e2e-tests.yml              # CI/CD automation
```

## 🎯 Best Practices

1. **Run smoke tests first** when debugging:
   ```bash
   npx playwright test smoke.spec.ts
   ```

2. **Use interactive mode** when writing new tests:
   ```bash
   pnpm test:e2e:ui
   ```

3. **Update snapshots carefully** - always review visual diffs first

4. **Run full suite before pushing** to catch issues early

## 🔄 CI/CD

Tests run automatically on:
- Push to `main` or `develop`
- Pull requests

View results in GitHub Actions tab.

## 🔐 Testing Authenticated Routes

### Setup (One Time)
1. Create test user in Clerk Dashboard
2. Set environment variables:
   ```bash
   CLERK_TEST_USER_EMAIL=test-staff@yourdomain.com
   CLERK_TEST_USER_PASSWORD=YourPassword123!
   ```
3. Run staff tests:
   ```bash
   pnpm test:e2e:staff
   ```

**Full Guide**: `tests/e2e/AUTHENTICATED_TESTING.md`

### Test Staff Routes
```bash
pnpm test:e2e:staff    # All staff dashboard tests
pnpm test:e2e:public   # Public routes only
```

## 📚 Learn More

- **Detailed docs**: `tests/e2e/README.md`
- **Complete guide**: `TESTING.md`
- **Authenticated testing**: `tests/e2e/AUTHENTICATED_TESTING.md`
- **Playwright docs**: https://playwright.dev

## ⏱️ Typical Run Times

- Smoke tests: ~10 seconds (3 tests, 1 browser)
- All tests, Chrome only: ~1 minute (50+ tests)
- All tests, all browsers: ~5 minutes (50+ tests × 5 browsers)
- Visual regression only: ~2 minutes (40+ screenshots)

## 💡 Tips

- Use `--headed` to watch tests run visually
- Use `--ui` for the best debugging experience
- Use `--project=chromium` for faster iterations
- Run `test:e2e:mobile` to focus on responsive issues
- Check `playwright-report/` for detailed HTML reports

---

**Ready to start?**
```bash
pnpm test:e2e:ui
```

This opens an interactive test runner where you can:
- See all tests
- Run individual tests
- Watch tests execute
- Debug failures
- Time travel through test steps
