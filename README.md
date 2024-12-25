# Genkit Monorepo

A collection of code generation tools for modern web development.

## Packages

- [genkit](packages/genkit/README.md) - Main CLI tool for code generation
- [@genkit/react](packages/react/README.md) - React documentation generator

## Installation

You can install the packages separately:

```bash
# Install the CLI tool
npm install -g genkit

# Install the React package
npm install @genkit/react
```

## Usage

### Using the CLI tool

```bash
# Generate React documentation
genkit react src/components

# Show help
genkit --help
```

### Using the React package directly

```javascript
const { generateDocs } = require('@genkit/react');

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

## License

MIT © Felix Shih 