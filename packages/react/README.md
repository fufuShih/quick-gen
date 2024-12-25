# @quick-gen/react

[![npm version](https://img.shields.io/npm/v/@quick-gen/react.svg)](https://www.npmjs.com/package/@quick-gen/react)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A powerful tool that automatically generates comprehensive JSDoc documentation for React components. Part of the @quick-gen toolkit.

## 🌟 Features

- 🔍 **Intelligent Component Detection**: 
  - Automatically detects React components in your codebase
  - Supports function declarations, arrow functions, and memo components
  - Skips components that already have JSDoc comments
- 📝 **Smart Props Analysis**:
  - Detects props from object destructuring patterns
  - Identifies props usage in component body
  - Recognizes spread props usage (`...props`, `...rest`)
  - Preserves existing JSDoc comments
- 🎯 **Component Support**:
  - Function declarations (`function Button() {}`)
  - Arrow function components (`const Button = () => {}`)
  - Memo wrapped components (`memo(Button)`)
  - Multiple components in a single file
- 🚀 **Non-Intrusive**: 
  - Preserves existing JSDoc comments
  - Only adds documentation where needed
  - Maintains code formatting and indentation

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
# Using npx
npx quick-gen react src/components
```

### Integration with package.json

Add a script to your package.json:

```json
{
  "scripts": {
    "generate-docs": "quick-gen-react -d 'src/components'"
  }
}
```

### CLI Options

| Option   | Alias | Description                            | Default |
| -------- | ----- | -------------------------------------- | ------- |
| `--dir`  | `-d`  | Directory to scan for React components | `"src"` |

## 📝 Examples

### Basic Component

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
 * @component Button
 * @description React component
 * @param {Object} props Component props
 * @param {*} props.onClick - onClick prop
 * @param {*} props.children - children prop
 * @param {*} props.disabled - disabled prop
 * @returns {JSX.Element} React component
 */
const Button = ({ onClick, children, disabled }) => {
  // ... component implementation
};
```

### Component with Spread Props

**Input:**
```jsx
const Button = ({ onClick, children, ...rest }) => {
  return (
    <button onClick={onClick} {...rest}>
      {children}
    </button>
  );
};
```

**Output:**
```jsx
/**
 * @component Button
 * @description React component
 * @param {Object} props Component props
 * @param {*} props.onClick - onClick prop
 * @param {*} props.children - children prop
 * @param {Object} props.rest - Additional props are spread
 * @returns {JSX.Element} React component
 */
const Button = ({ onClick, children, ...rest }) => {
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
