# @quick-gen/cli

[![npm version](https://img.shields.io/npm/v/@quick-gen/cli.svg)](https://www.npmjs.com/package/@quick-gen/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A quick and flexible code generation toolkit.

## 🚀 Features

- 📝 **Code Generation**: Generate various types of code and documentation
- 🔧 **Plugin System**: Extensible architecture for different generation needs
- 🎯 **Easy to Use**: Simple and intuitive CLI interface
- 🔄 More features coming soon...

## 📦 Installation

### Global Installation (Recommended)
```bash
# Using npm
npm install -g @quick-gen/cli

# Using yarn
yarn global add @quick-gen/cli

# Using pnpm
pnpm add -g @quick-gen/cli
```

### Local Installation
```bash
# Using npm
npm install @quick-gen/cli --save-dev

# Using yarn
yarn add -D @quick-gen/cli

# Using pnpm
pnpm add -D @quick-gen/cli
```

## 🎯 Usage

### Generate React Documentation

```bash
# Using global installation
quick-gen react -d src/components

# Using local installation
npx quick-gen react -d src/components
```

### Common Commands
```bash
# Generate docs for components
quick-gen react -d src/components

# Show help
quick-gen --help
```

### CLI Options

| Command | Description |
|---------|-------------|
| `react -d [dir]` | Generate JSDoc for React components |

#### React Command Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--dir` | `-d` | Directory to scan for React components | `src` |
| `--help` | `-h` | Show help | |

## 🛠️ Requirements

- Node.js >= 14
- React project with `.js` or `.jsx` files

## 📦 Related Packages

- [@quick-gen/cli](https://www.npmjs.com/package/@quick-gen/cli) - Core CLI tool
- [@quick-gen/react](https://www.npmjs.com/package/@quick-gen/react) - React documentation generator

## 🔗 Links

- [GitHub Repository](https://github.com/fufuShih/quick-gen)
- [Bug Reports](https://github.com/fufuShih/quick-gen/issues)
- [npm Organization](https://www.npmjs.com/org/quick-gen)
