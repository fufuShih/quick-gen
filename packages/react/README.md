# @quickgen/react

[![npm version](https://badge.fury.io/js/@quickgen/react.svg)](https://www.npmjs.com/package/@quickgen/react)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A powerful tool that automatically generates comprehensive JSDoc documentation for React components. Part of the @quickgen toolkit.

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

### Install CLI Tool (Required)
```bash
# Using npm
npm install -g @quickgen/cli

# Using yarn
yarn global add @quickgen/cli

# Using pnpm
pnpm add -g @quickgen/cli
```

### Install React Plugin
```bash
# Using npm
npm install @quickgen/react --save-dev

# Using yarn
yarn add -D @quickgen/react

# Using pnpm
pnpm add -D @quickgen/react
```

## 🚀 Usage

### Command Line Interface

```bash
# Using global CLI
quickgen react src/components

# Using local installation
npx quickgen react src/components
```

### CLI Options

| Option   | Alias | Description                            | Default |
| -------- | ----- | -------------------------------------- | ------- |
| `--dir`  | `-d`  | Directory to scan for React components | `"src"` |
| `--output` | `-o` | Output directory for documentation | `"docs"` |
| `--help` | `-h`  | Show help information                  |         |

### Integration with package.json

Add a script to your package.json for easier access:

```json
{
  "scripts": {
    "generate-docs": "quickgen react src/components"
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
- @quickgen/cli installed

## 📦 Related Packages

- [@quickgen/cli](https://www.npmjs.com/package/@quickgen/cli) - Core CLI tool
- [@quickgen/react](https://www.npmjs.com/package/@quickgen/react) - React documentation generator

## 🔗 Links

- [GitHub Repository](https://github.com/fufuShih/genkit)
- [Bug Reports](https://github.com/fufuShih/genkit/issues)
- [npm Organization](https://www.npmjs.com/org/quickgen)

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b feature/my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/my-new-feature`)
5. Create new Pull Request
