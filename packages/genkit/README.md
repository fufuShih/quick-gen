# @genkit/cli

[![npm version](https://badge.fury.io/js/@genkit/cli.svg)](https://www.npmjs.com/package/@genkit/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A powerful CLI tool for generating code documentation and more.

## Installation

### Global Installation (Recommended)
```bash
# Using npm
npm install -g @genkit/cli

# Using yarn
yarn global add @genkit/cli

# Using pnpm
pnpm add -g @genkit/cli
```

### Local Installation
```bash
# Using npm
npm install @genkit/cli --save-dev

# Using yarn
yarn add -D @genkit/cli

# Using pnpm
pnpm add -D @genkit/cli
```

## Features

- 📝 React Documentation Generation
- 🔄 More features coming soon...

## Usage

### Generate React Documentation

```bash
# Using global installation
genkit react src/components

# Using local installation
npx genkit react src/components
```

### Common Commands
```bash
# Generate docs for components
genkit react src/components

# Specify output directory
genkit react src/components --output docs/api

# Show help
genkit --help
```

### Options

| Command | Description |
|---------|-------------|
| `react [dir]` | Generate React documentation |

#### React Command Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Output directory | `docs` |
| `--help` | `-h` | Show help | |

## 🛠️ Requirements

- Node.js >= 14
- React project with `.js` or `.jsx` files

## 📦 Packages

- [@genkit/cli](https://www.npmjs.com/package/@genkit/cli) - Core CLI tool
- [@genkit/react](https://www.npmjs.com/package/@genkit/react) - React documentation generator

## 🔗 Links

- [GitHub Repository](https://github.com/fufuShih/genkit)
- [Bug Reports](https://github.com/fufuShih/genkit/issues)
- [npm Organization](https://www.npmjs.com/org/genkit)

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b feature/my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/my-new-feature`)
5. Create new Pull Request