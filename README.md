# Quick-gen

[![npm version](https://badge.fury.io/js/@quick-gen/cli.svg)](https://www.npmjs.com/package/@quick-gen/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A collection of quick and flexible code generation tools for modern web development.

## 🚀 Features

- 📝 **React Documentation Generation**: Automatically generate JSDoc for React components
- 🔍 **Intelligent Detection**: Smart component and props analysis
- 🛠️ **Flexible Toolkit**: Extensible architecture for various generation needs
- 💪 **Developer Friendly**: Easy to use CLI with comprehensive options

## 📦 Installation

### Install CLI Tool (Recommended)
```bash
# Using npm
npm install -g @quick-gen/cli

# Using yarn
yarn global add @quick-gen/cli

# Using pnpm
pnpm add -g @quick-gen/cli
```

### Install React Plugin
```bash
# Using npm
npm install @quick-gen/react --save-dev

# Using yarn
yarn add -D @quick-gen/react

# Using pnpm
pnpm add -D @quick-gen/react
```

## 🎯 Usage

### Using the CLI tool

```bash
# Generate React documentation
quickgen react src/components

# Specify output directory
quickgen react src/components --output docs/api

# Show help
quickgen --help
```

### Using the React package directly

```javascript
const { generateDocs } = require('@quick-gen/react');

generateDocs('src/components');
```

## 🛠️ Development

This project uses pnpm as its package manager. To get started:

```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Install dependencies
pnpm install

# Run tests
pnpm test
```

## 📦 Available Packages

| Package | Description | Version |
|---------|------------|----------|
| [@quick-gen/cli](packages/genkit/README.md) | Core CLI tool for code generation | [![npm version](https://badge.fury.io/js/@quick-gen/cli.svg)](https://www.npmjs.com/package/@quick-gen/cli) |
| [@quick-gen/react](packages/react/README.md) | React code generator and documentation tool | [![npm version](https://badge.fury.io/js/@quick-gen/react.svg)](https://www.npmjs.com/package/@quick-gen/react) |

## 🔗 Links

- [GitHub Repository](https://github.com/fufuShih/quick-gen)
- [Bug Reports](https://github.com/fufuShih/quick-gen/issues)
- [npm Organization](https://www.npmjs.com/org/quick-gen)

## 📄 License

MIT © Felix Shih 