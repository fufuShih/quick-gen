# Genkit

A powerful CLI tool for generating code documentation and more.

## Installation

```bash
npm install -g genkit
```

## Features

- 📝 React Documentation Generation
- 🔄 More features coming soon...

## Usage

### Generate React Documentation

```bash
# Basic usage
genkit react src/components

# Specify output directory
genkit react src/components --output docs/api

# Show help
genkit react --help
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

## Examples

```bash
# Generate docs for src/components
genkit react src/components

# Generate docs with custom output directory
genkit react src/components -o custom/docs

# Show help
genkit --help
```

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b feature/my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/my-new-feature`)
5. Create new Pull Request

## 🛠️ Requirements

- Node.js >= 14
- React project with `.js` or `.jsx` files

## 🔗 Links

- [GitHub Repository](https://github.com/fufuShih/genkit)
- [Bug Reports](https://github.com/fufuShih/genkit/issues)