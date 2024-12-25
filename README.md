# Quickgen Monorepo

A collection of quick and flexible code generation tools for modern web development.

## Packages

- [@quickgen/cli](packages/genkit/README.md) - Main CLI tool for code generation
- [@quickgen/react](packages/react/README.md) - React code generator and documentation tool

## Installation

You can install the packages separately:

```bash
# Install the CLI tool globally
npm install -g @quickgen/cli

# Install the React package
npm install @quickgen/react --save-dev
```

## Usage

### Using the CLI tool

```bash
# Generate React documentation
quickgen react src/components

# Show help
quickgen --help
```

### Using the React package directly

```javascript
const { generateDocs } = require('@quickgen/react');

generateDocs('src/components');
```

## Development

This project uses pnpm as its package manager. To get started:

```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Install dependencies
pnpm install

# Run tests
pnpm test
```

## Publishing

```bash
# Publish all packages
pnpm publish-packages
```

## 📦 Packages

| Package | Description | Version |
|---------|------------|----------|
| [@quickgen/cli](packages/genkit/README.md) | Core CLI tool for code generation | [![npm version](https://badge.fury.io/js/@quickgen/cli.svg)](https://www.npmjs.com/package/@quickgen/cli) |
| [@quickgen/react](packages/react/README.md) | React code generator and documentation tool | [![npm version](https://badge.fury.io/js/@quickgen/react.svg)](https://www.npmjs.com/package/@quickgen/react) |

## 🔗 Links

- [GitHub Repository](https://github.com/fufuShih/genkit)
- [Bug Reports](https://github.com/fufuShih/genkit/issues)
- [npm Organization](https://www.npmjs.com/org/quickgen)

## License

MIT © Felix Shih 