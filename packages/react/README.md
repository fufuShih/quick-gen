# @quick-gen/react

[![npm version](https://img.shields.io/npm/v/@quick-gen/react.svg)](https://www.npmjs.com/package/@quick-gen/react)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A powerful tool that automatically generates comprehensive JSDoc documentation for React components. Part of the @quick-gen toolkit.

## 🌟 Features

- 🔍 **Intelligent Component Detection**: 
  - Automatically detects React components in your codebase
  - Supports function declarations, arrow functions, and memo/forwardRef components
  - Skips components that already have JSDoc comments
  - Handles default exports and named exports
- 📝 **Smart Props Analysis**:
  - Detects props from object destructuring patterns
  - Identifies props usage throughout component body
  - Recognizes spread props usage (`...props`, `...rest`)
  - Handles nested component structures
- 🎯 **Component Support**:
  - Function declarations (`function Button() {}`)
  - Arrow function components (`const Button = () => {}`)
  - Memo wrapped components (`memo(Button)`)
  - ForwardRef components (`forwardRef((props, ref) => {})`)
  - Multiple components in a single file
- 🚀 **Non-Intrusive**: 
  - Preserves existing JSDoc comments
  - Only adds documentation where needed
  - Maintains code formatting and indentation
  - Provides detailed console output during generation

## 📦 Installation

```bash
# Using npm
npm install @quick-gen/react --save-dev

# Using yarn
yarn add -D @quick-gen/react

# Using pnpm
pnpm add -D @quick-gen/react
```

## 🚀 Usage

### Command Line Interface

```bash
# Basic usage - scans src directory by default
npx quick-gen-react

# Specify custom directory
npx quick-gen-react -d src/components

# Get help
npx quick-gen-react --help
```

### Integration with package.json

Add a script to your package.json:

```json
{
  "scripts": {
    "generate-docs": "quick-gen-react -d src/components"
  }
}
```

### CLI Options

| Option   | Alias | Description                            | Default |
| -------- | ----- | -------------------------------------- | ------- |
| `--dir`  | `-d`  | Directory to scan for React components | `"src"` |
| `--help` | `-h`  | Show help                              | -       |

## 📝 Examples

### Basic Function Component

**Input:**
```jsx
const Button = ({ onClick, children, disabled }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};
```

**Output:**
```jsx
/** 
 * @generated 1700000000000
 * @typedef {any} AutoGen
 * 
 * @typedef {{
 *   onClick: AutoGen,
 *   children: AutoGen,
 *   disabled: AutoGen
 * }} ButtonProps
 */

/** @type {(props: ButtonProps) => JSX.Element} */
const Button = ({ onClick, children, disabled }) => {
  // ... component implementation
};
```

## 🛠️ Requirements

- Node.js >= 14
- React project with `.js` or `.jsx` files

## 📦 Related Packages

- [@quick-gen/cli](https://www.npmjs.com/package/@quick-gen/cli) - Core CLI tool

## 🔗 Links

- [GitHub Repository](https://github.com/fufuShih/quick-gen)
- [Bug Reports](https://github.com/fufuShih/quick-gen/issues)
- [npm Organization](https://www.npmjs.com/org/quick-gen)

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b feature/my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/my-new-feature`)
5. Create new Pull Request
