# @quick-gen/knowledge

[![npm version](https://img.shields.io/npm/v/@quick-gen/knowledge.svg)](https://www.npmjs.com/package/@quick-gen/knowledge)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A powerful JavaScript/TypeScript code analysis tool that helps you understand your codebase by extracting and organizing information about symbols, dependencies, and relationships in your code.

## 🌟 Features

- 🔍 **Comprehensive Analysis**: 
  - Analyzes JavaScript and TypeScript files
  - Supports JSX and TSX formats
  - Extracts detailed code structure information
- 📊 **Rich Information Extraction**:
  - Classes, methods, and properties
  - Functions and variables
  - Import/Export relationships
  - Symbol references and dependencies
- 📦 **Structured Output**: 
  - Generates organized knowledge files
  - Creates separate JSON files for different aspects
  - Easy to integrate with other tools
- 🛠️ **Developer Friendly**: 
  - Simple CLI interface
  - Programmatic API available
  - Configurable ignore patterns

## 📦 Installation

```bash
# Using npm
npm install @quick-gen/knowledge --save-dev

# Using yarn
yarn add -D @quick-gen/knowledge

# Using pnpm
pnpm add -D @quick-gen/knowledge
```

## 🚀 Usage

### Command Line Interface

```bash
# Using npx
npx quick-gen knowledge

# Analyze specific directory
npx quick-gen knowledge src/
```

### Integration with package.json

Add a script to your package.json:

```json
{
  "scripts": {
    "analyze": "quick-gen-knowledge"
  }
}
```

## 📊 Output Structure

The tool generates three main JSON files in the `.knowledge` directory:

- `fileSymbols.json`: Contains information about symbols defined in each file
- `fileImports.json`: Maps import/export relationships between files
- `symbolReferences.json`: Tracks symbol usage and references across the codebase

## 🛠️ Requirements

- Node.js >= 14
- JavaScript/TypeScript project

## 📦 Related Packages

- [@quick-gen/cli](https://www.npmjs.com/package/@quick-gen/cli) - Core CLI tool
- [@quick-gen/react](https://www.npmjs.com/package/@quick-gen/react) - React documentation generator

## 🔗 Links

- [GitHub Repository](https://github.com/fufuShih/quick-gen)
- [Bug Reports](https://github.com/fufuShih/quick-gen/issues)
- [npm Organization](https://www.npmjs.com/org/quick-gen)
