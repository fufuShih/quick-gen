# quick-gen-docs

[![npm version](https://badge.fury.io/js/quick-gen-docs.svg)](https://www.npmjs.com/package/quick-gen-docs)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

A powerful CLI tool that automatically generates comprehensive JSDoc documentation for React components. Save time and maintain consistent documentation across your React projects with automated JSDoc generation.

## 🌟 Features

- 🔍 **Intelligent Component Detection**: Automatically scans and identifies React components in your codebase
- 📝 **Automated JSDoc Generation**: Creates detailed JSDoc comments for components and their props
- 💪 **Broad Component Support**:
  - Function declarations
  - Arrow function components
  - Class components
- 🎯 **Smart Props Analysis**:
  - Detects props from object destructuring
  - Identifies props usage in component body
  - Recognizes spread props usage
- 🚀 **Non-Intrusive**: Preserves existing JSDoc comments and only adds documentation where needed

## 📦 Installation

```bash
# Using npm
npm install quick-gen-docs --save-dev

# Using yarn
yarn add -D quick-gen-docs

# Using pnpm
pnpm add -D quick-gen-docs
```

## 🚀 Usage

### Command Line Interface

```bash
# Using npx
npx quick-gen-docs --dir src

# Using package script (after adding to package.json)
npm run generate-docs
```

### CLI Options

| Option   | Alias | Description                            | Default |
| -------- | ----- | -------------------------------------- | ------- |
| `--dir`  | `-d`  | Directory to scan for React components | `"src"` |
| `--help` | `-h`  | Show help information                  |         |

### Integration with package.json

Add a script to your package.json for easier access:

```json
{
  "scripts": {
    "generate-docs": "quick-gen-docs --dir src"
  }
}
```

## 📝 Generated Documentation Example

### Input: Original Component

```jsx
const UserProfile = ({ name, age, ...props }) => {
  return (
    <div {...props}>
      <h1>{name}</h1>
      <p>Age: {age}</p>
    </div>
  );
};

export default UserProfile;
```

### Output: Generated JSDoc

```jsx
/**
 * @component UserProfile
 * @param {Object} props
 * @param {string} props.name - User's name
 * @param {number} props.age - User's age
 * @param {...any} props.spread - Additional props are spread
 * @returns {JSX.Element}
 */
const UserProfile = ({ name, age, ...props }) => {
  // Component implementation...
};
```

## 🛠️ Requirements

- Node.js >= 14
- React project with `.js` or `.jsx` files

## 🔗 Links

- [GitHub Repository](https://github.com/fufuShih/quick-gen-docs)
- [Bug Reports](https://github.com/fufuShih/quick-gen-docs/issues)
