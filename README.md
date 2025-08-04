# Engineer Tools for Raycast

A comprehensive collection of essential engineering utilities for developers, migrated from the popular Alfred engineer tools extension. This Raycast extension provides 8 core functionalities to streamline your daily development workflow.

## ✨ Features

### 🔐 **Encode/Decode Tools**
- **Encode**: URL encoding, Base64 encoding, and hexadecimal conversion
- **Decode**: URL decoding, Base64 decoding, hexadecimal decoding, and Unicode character decoding

### 🆔 **ID Generation**
- **UUID Generator**: Generate both UUID v4 (random) and UUID v7 (time-ordered) identifiers
- **TypeID**: Encode and decode TypeID format strings (type-prefixed UUIDs)

### 🔐 **Security Tools**
- **Hash Generator**: Generate MD5, SHA1, and SHA256 hashes from text input

### 📅 **Date & Time Utilities**
- **DateTime**: Convert between Unix timestamps and human-readable dates, with timezone support

### 📁 **File Utilities**
- **File Size**: Convert between bytes and human-readable file sizes (KB, MB, GB, etc.)

### 🌐 **Network Tools**
- **IP Lookup**: Get detailed information about IP addresses including location, ISP, and ASN data

## 🚀 Quick Start

1. **Install the extension** from the [Raycast Store](https://www.raycast.com/)
2. **Open Raycast** and search for any of the available commands
3. **Start using the tools** immediately - no configuration required

## 📋 Available Commands

| Command | Description | Example Usage |
|---------|-------------|---------------|
| `Encode` | Encode text to various formats | URL encode API parameters |
| `Decode` | Decode encoded text | Decode Base64 API responses |
| `UUID Generator` | Generate UUIDs | Create unique identifiers |
| `TypeID` | Work with TypeIDs | Generate typed UUIDs |
| `Hash Generator` | Create cryptographic hashes | Generate file checksums |
| `DateTime` | Convert timestamps | Debug API timestamps |
| `File Size` | Convert file sizes | Calculate download sizes |
| `IP Lookup` | Get IP information | Debug network issues |

## 🛠️ Development

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Raycast account for testing

### Setup Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd raycast-engineer-tools

# Install dependencies
npm install

# Start development mode with hot reload
npm run dev

# Run linting
npm run lint

# Auto-fix linting issues
npm run fix-lint

# Build for production
npm run build
```

### Project Structure

```
raycast-engineer-tools/
├── src/
│   ├── encode.tsx          # URL/Base64/Hex encoding
│   ├── decode.tsx          # Multi-format decoding
│   ├── uuid.tsx           # UUID v4/v7 generation
│   ├── typeid.tsx         # TypeID encode/decode
│   ├── hash.tsx           # MD5/SHA1/SHA256 hashing
│   ├── datetime.tsx       # Timestamp conversion
│   ├── filesize.tsx       # File size conversion
│   ├── ip-lookup.tsx      # IP address information
│   └── utils/             # Shared utility functions
│       ├── encoding.ts    # Encoding/decoding utilities
│       ├── uuid.ts        # UUID generation utilities
│       ├── typeid.ts      # TypeID utilities
│       ├── datetime.ts    # Date/time utilities
│       ├── filesize.ts    # File size utilities
│       └── network.ts     # Network/IP utilities
├── package.json
├── tsconfig.json
└── README.md
```

### Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature`
3. **Make your changes** following the existing code style
4. **Test your changes**: `npm run build && npm run lint`
5. **Submit a pull request** with a clear description

### Code Style

This project uses:
- **TypeScript** with strict type checking
- **ESLint** with `@raycast/eslint-config` for consistent code style
- **React** with functional components and hooks
- **Raycast API** for all UI components

### Testing

Before submitting changes:

```bash
# Build the extension
npm run build

# Check for linting issues
npm run lint

# Auto-fix linting issues
npm run fix-lint
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Originally migrated from the Alfred engineer tools extension
- Built with the [Raycast API](https://developers.raycast.com/)
- Icons and design inspiration from Raycast's design system

## 🔗 Links

- [Raycast Store](https://www.raycast.com/) - Download Raycast
- [Developer Documentation](https://developers.raycast.com/) - Raycast API docs
- [Issues](https://github.com/your-repo/issues) - Report bugs and request features