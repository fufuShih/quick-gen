# Quick Gen Docs Monorepo

This monorepo contains packages related to Quick Gen Docs - a powerful CLI tool that automatically generates comprehensive JSDoc documentation for React components.

## 📦 Packages

- [quick-gen-docs](packages/README.md) - Core CLI tool for generating JSDoc documentation

## 🛠️ Development

### Prerequisites

- Node.js >= 14
- pnpm >= 8.9.0

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests across all packages
pnpm test

# Run development mode
pnpm dev
```

### Workspace Structure

```
.
├── packages/
│   └── quick-gen-docs/     # Core CLI package
├── package.json            # Root package.json
└── pnpm-workspace.yaml     # Workspace configuration
```

### Package Management

```bash
# Add a dependency to a specific package
pnpm add <dependency> --filter <package-name>

# Add a development dependency to root
pnpm add -Dw <dependency>

# Run a command in a specific package
pnpm --filter <package-name> <command>
```

## 🌟 Featured Package: quick-gen-docs

A powerful CLI tool that automatically generates comprehensive JSDoc documentation for React components. Save time and maintain consistent documentation across your React projects with automated JSDoc generation.

### Key Features

- 🔍 **Intelligent Component Detection**
- 📝 **Automated JSDoc Generation**
- 💪 **Broad Component Support**
- 🎯 **Smart Props Analysis**
- 🚀 **Non-Intrusive**

For detailed information about quick-gen-docs, please see the [package documentation](packages/README.md).

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/quick-gen-docs)
- [GitHub Repository](https://github.com/fufuShih/quick-gen-docs)
- [Bug Reports](https://github.com/fufuShih/quick-gen-docs/issues)

## 📄 License

ISC © [fufuShih](https://github.com/fufuShih) 