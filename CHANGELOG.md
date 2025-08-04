# Engineer Tools Changelog

All notable changes to this Raycast extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Enhanced error handling across all commands
- Improved loading states for better user experience
- Added copy-to-clipboard notifications

### Changed
- Optimized IP lookup response caching
- Improved TypeID validation and error messages

### Fixed
- Fixed edge cases in file size conversion
- Improved handling of special characters in encoding/decoding

## [1.0.0] - 2024-08-04

### Added
- **Initial release** with 8 core engineering utilities:
  - **Encode**: URL, Base64, and Hex encoding functionality
  - **Decode**: URL, Base64, Hex, and Unicode decoding
  - **UUID Generator**: Generate UUID v4 and v7 strings
  - **TypeID**: Encode/decode TypeID format (type-prefixed UUIDs)
  - **Hash Generator**: MD5, SHA1, and SHA256 hashing
  - **DateTime**: Unix timestamp and date conversion with timezone support
  - **File Size**: Bytes to human-readable file size conversion
  - **IP Lookup**: IP address information lookup with location and ISP data

### Features
- **Instant results** with real-time processing
- **Clipboard integration** - automatically copy results to clipboard
- **Clean, intuitive interface** following Raycast design guidelines
- **TypeScript** implementation with full type safety
- **Error handling** for invalid inputs and network issues
- **Responsive design** that works with any Raycast window size

### Technical
- **Migrated from Alfred** engineer tools extension
- **Built with Raycast API** using React and TypeScript
- **ESLint integration** with consistent code style
- **Hot reload development** for faster iteration
- **Production-ready build** with optimized bundles

### Commands Available
- `encode` - Encode text to various formats
- `decode` - Decode encoded text
- `uuid` - Generate UUID strings
- `typeid` - Work with TypeID format
- `hash` - Generate cryptographic hashes
- `datetime` - Convert timestamps and dates
- `filesize` - Convert file sizes
- `ip-lookup` - Get IP address information