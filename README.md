# Engineer Tools for Raycast

A comprehensive collection of essential engineering utilities for developers, migrated from the popular Alfred engineer tools extension. This Raycast extension provides 8 core functionalities to streamline your daily development workflow.

## ✨ Features

### 🔐 **Encode/Decode Tools**

- **Encode**: URL encoding, Base64 encoding, and hexadecimal conversion
- **Decode**: URL decoding, Base64 decoding, hexadecimal decoding, and Unicode character decoding
- Short results appear directly in the list. Results longer than 256 graphemes are previewed with an ellipsis; Copy and Paste always use the complete value.

### Text Input and Long Content

To open a tool with Space instead of Return, assign an **Alias** in Raycast Settings → Engineer tools (or Settings → Shortcuts). Suggested aliases are `encode`, `decode`, `hash`, `datetime`, `filesize`, `ip`, `typeid`, and `uuid`. Type the exact alias, then press Space to open the command. Continue typing or pasting to see results immediately; Return copies the selected result. Typing a command's title without assigning an alias does not enable this behavior.

Aliases are local Raycast settings and are not declared by this extension's manifest. No launch arguments are needed: an argument field would require Return before showing the result list. Raycast introduced alias + Space command navigation in [v1.3.0](https://www.raycast.com/changelog/macos-v1%2F1-3-0); Encode and Decode were verified with this workflow on Raycast 2.8.2.

Encode, Decode, and Hash support these shortcuts:

| Shortcut | Action                                   |
| -------- | ---------------------------------------- |
| `⌘R`     | Read the complete current clipboard text |
| `⌘E`     | Edit input in a multiline form           |
| `↵`      | Copy the selected complete result        |
| `⇧⌘V`    | Paste the selected complete result       |
| `⌘⌫`     | Clear input                              |

The [Raycast List documentation](https://developers.raycast.com/api-reference/user-interface/list) does not publish a search input length limit or a configurable maximum. On Raycast **2.8.2 for macOS**, native paste tests accepted 524,287 and 524,288 ASCII characters, but silently shortened 524,289 characters to **524,288**. Multibyte tests accepted 200,000 Chinese characters (600,000 UTF-8 bytes), so this is a text-field length limit rather than a UTF-8 byte budget. This is an observed limit for this version, not a guaranteed limit for every Raycast release.

At that boundary, these commands stop conversion and ask you to use `⌘R`, so they never silently convert a potentially incomplete paste. Large input and multiline content are stored separately from the search field; the list shows the input's UTF-8 byte count. Ordinary input remains editable in the search field up to 2,048 UTF-16 units. This display budget is separate from Raycast's input limit.

On macOS, clipboard import uses `/usr/bin/pbpaste` with an explicit UTF-8 locale. Raycast 2.8.2's clipboard-history-backed API can return a file reference for large text instead of its contents. Clipboard imports allow up to 64 MiB and fail explicitly if that buffer is exceeded. The multiline editor rejects input at the field limit; use clipboard import for larger content.

Verified in Raycast: importing 1,000,003 bytes, copying the complete 1,333,340-byte Base64 result, decoding it, and copying it back produced the original text byte for byte, including its final marker. Chinese and emoji clipboard imports were also verified with the UTF-8 locale.

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

| Command          | Description                    | Example Usage               |
| ---------------- | ------------------------------ | --------------------------- |
| `Encode`         | Encode text to various formats | URL encode API parameters   |
| `Decode`         | Decode encoded text            | Decode Base64 API responses |
| `UUID Generator` | Generate UUIDs                 | Create unique identifiers   |
| `TypeID`         | Work with TypeIDs              | Generate typed UUIDs        |
| `Hash Generator` | Create cryptographic hashes    | Generate file checksums     |
| `DateTime`       | Convert timestamps             | Debug API timestamps        |
| `File Size`      | Convert file sizes             | Calculate download sizes    |
| `IP Lookup`      | Get IP information             | Debug network issues        |

## 🛠️ Development

### Prerequisites

- Node.js **24.x** (`nvm use`; the repository includes `.nvmrc`)
- npm or yarn
- Raycast account for testing

### Setup Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd raycast-engineer-tools

# Install dependencies
npm install

# Run native Node 24 TypeScript tests and type checking
npm test
npm run typecheck

# Start development mode with hot reload
npm run dev

# Run linting
npm run lint

# Auto-fix linting issues
npm run fix-lint

# Build for production
npm run build -- --environment dist
```

Development uses Node 24, Node 24 type definitions, ES modules, and an ES2024 TypeScript target. Raycast owns the extension runtime: the installed Raycast 2.8.2 bundles Node **22.23.3**, and this project cannot change it with `engines` or `.nvmrc`. Runtime code therefore uses APIs supported by that host, and Raycast's bundler controls the executable JavaScript target. Node 24 runs the development tools and native `.ts` tests without a separate test compiler.

For local installation, run `npm run dev` once to register the extension, then stop it and run `npm run build -- --environment dist`. Raycast keeps the registered commands and the production bundles in `~/.config/raycast/extensions/engineer-tools/`; no Store publication is needed.

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
# Test conversion correctness and long-text preview behavior
npm test
npm run typecheck

# Build the extension
npm run build -- --environment dist

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
