# Contributing to PD AIO SDK

Thank you for considering contributing to PD AIO SDK! This document provides guidelines and instructions for contributing.

## 🎯 Ways to Contribute

- **Report bugs** - Open an issue describing the bug
- **Suggest features** - Open an issue with your feature request
- **Submit pull requests** - Fix bugs or implement new features
- **Improve documentation** - Help us make the docs better
- **Add tests** - Increase test coverage
- **Add exchange adapters** - Support new perpetual DEXs

## 🚀 Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm, yarn, or pnpm
- Git

### Setup Steps

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/PD-AIO-SDK.git
cd PD-AIO-SDK

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env

# 4. Fill in your credentials in .env (for testing)
# NEVER commit .env file!

# 5. Build the project
npm run build

# 6. Run tests
npm test

# 7. Run type checking
npm run typecheck

# 8. Run linter
npm run lint
```

## 📝 Code Style

We use ESLint and Prettier for code formatting. The configuration is already set up.

```bash
# Format code
npm run format

# Fix linting issues
npm run lint:fix
```

### TypeScript Guidelines

- Use TypeScript strict mode (already configured)
- Avoid `any` - use `unknown` if truly dynamic
- Provide JSDoc comments for public APIs
- Include examples in JSDoc where appropriate

### Naming Conventions

- **Interfaces**: `I` prefix (e.g., `IExchangeAdapter`)
- **Types**: PascalCase (e.g., `OrderType`)
- **Classes**: PascalCase (e.g., `HyperliquidAdapter`)
- **Functions**: camelCase (e.g., `fetchMarkets`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `MAX_RETRIES`)

## 🧪 Testing

All contributions must include tests.

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test.test.ts

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Requirements

- **Unit tests**: Test individual functions/methods
- **Integration tests**: Test complete request/response cycles with mocks
- **Minimum coverage**: 80% for new code
- All tests must pass before submitting PR

## 🔄 Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, documented code
   - Add tests for new functionality
   - Update documentation if needed

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   Follow conventional commit format:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `test:` - Test additions/changes
   - `refactor:` - Code refactoring
   - `chore:` - Maintenance tasks

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Ensure all tests pass
   - Wait for review

## 🏗️ Adding New Exchange Adapters

If you want to add support for a new exchange, we follow **Pattern A** (Full-Featured) architecture for consistency across all adapters.

For detailed step-by-step instructions, see **[ADAPTER_GUIDE.md](./ADAPTER_GUIDE.md)**.

### Quick Overview

1. **Check feasibility**
   - Does the exchange have a public API?
   - Is there documentation available?
   - Does it support perpetual contracts?
   - Is testnet available for testing?

2. **Create adapter structure (Pattern A)**
   ```
   src/adapters/yourexchange/
   ├── YourExchangeAdapter.ts     # Main adapter implementation
   ├── YourExchangeNormalizer.ts  # Data transformation class (REQUIRED)
   ├── YourExchangeAuth.ts        # Authentication class (if complex auth)
   ├── utils.ts                   # Helper functions only
   ├── constants.ts               # API URLs, rate limits, etc.
   ├── types.ts                   # TypeScript types & Zod schemas
   └── index.ts                   # Public exports
   ```

   **Pattern A Requirements:**
   - ✅ Dedicated Normalizer class for all data transformations
   - ✅ Utils file contains ONLY helper functions (no normalization)
   - ✅ Adapter uses normalizer instance (`this.normalizer.normalizeX()`)
   - ✅ Separate Auth class for complex authentication flows

3. **Implement required classes**

   **YourExchangeNormalizer.ts** (REQUIRED):
   - `normalizeSymbol()` - Exchange format → unified format
   - `toExchangeSymbol()` - Unified format → exchange format
   - `normalizeMarket()`, `normalizeOrder()`, `normalizePosition()`
   - `normalizeBalance()`, `normalizeOrderBook()`, `normalizeTrade()`
   - `normalizeTicker()`, `normalizeFundingRate()`

   **YourExchangeAdapter.ts**:
   - Implement `IExchangeAdapter` interface
   - Use normalizer instance for all transformations
   - Market data methods (fetchMarkets, fetchOrderBook, etc.)
   - Trading methods (createOrder, cancelOrder, etc.)
   - Account methods (fetchBalance, fetchPositions)
   - WebSocket methods (optional but recommended)

   **utils.ts** (Helper functions only):
   - Order request conversions
   - Error mapping functions
   - Exchange-specific utilities
   - NO normalization functions (use Normalizer class)

4. **Add to factory**
   - Update `src/factory.ts`
   - Add to `SupportedExchange` type
   - Add to `ExchangeConfigMap`

5. **Add comprehensive tests**
   - Unit tests for Normalizer class (10+ tests)
   - Unit tests for utility functions
   - Integration tests for adapter (30+ tests)
   - Auth tests if complex authentication
   - **Minimum 50+ tests total**

6. **Update documentation**
   - Add to README.md (Supported Exchanges table)
   - Add to .env.example (credentials template)
   - Create exchange guide in `docs/guides/yourexchange.md`
   - Update CHANGELOG.md
   - Update API.md with adapter details

### Pattern A Benefits

- **Consistency**: All 7 existing adapters follow Pattern A
- **Testability**: Normalizer can be tested independently
- **Maintainability**: Clear separation of concerns
- **Reusability**: Normalizer can be used directly by users

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for detailed architecture documentation.

## 📚 Documentation

- Keep README.md up to date
- Document all public APIs with JSDoc
- Include code examples where helpful
- Update CHANGELOG.md for notable changes

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. **Description** - Clear description of the bug
2. **Steps to reproduce** - How to trigger the bug
3. **Expected behavior** - What should happen
4. **Actual behavior** - What actually happens
5. **Environment**:
   - Node.js version
   - npm/yarn/pnpm version
   - Operating system
   - SDK version
6. **Code sample** - Minimal reproducible example
7. **Error messages** - Full error stack traces

## 💡 Feature Requests

When requesting features:

1. **Use case** - Describe why you need this feature
2. **Proposed solution** - How you think it should work
3. **Alternatives** - Other approaches you've considered
4. **Impact** - Who would benefit from this feature

## ⚖️ Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Prioritize collaboration over conflict

## 📄 License

By contributing to PD AIO SDK, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- CHANGELOG.md (for notable contributions)
- GitHub contributors page
- Future documentation (for significant features)

## 📧 Questions?

- Open an issue for questions
- Check existing issues/PRs first
- Be patient - maintainers are volunteers

---

Thank you for contributing to PD AIO SDK! 🚀
