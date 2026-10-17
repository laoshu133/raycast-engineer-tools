# Engineer Tools Changelog

All notable changes to this Raycast extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Reliable IP Lookup

- Use ipwho.is as the primary HTTPS lookup service, falling back to ipapi.co when a request fails, is rate limited, or returns an error payload.
- Cache successful lookups for five minutes (up to 100 addresses), cancel requests for old input, and limit each service request to five seconds.
- Display the result source, omit unavailable fields, and show actionable failure details with a Retry Lookup action instead of treating errors as copyable IP data.
- Accept standard compressed IPv6 addresses and validate current-IP responses.
- Add regression coverage for provider fallback, API errors, cache expiry, cancellation, and IPv4/IPv6 validation.

### Clipboard Input on Entry

- Read clipboard text once per entry for all seven text-input tools and display it as the initial selected input, ready to replace by typing.
- Mount the input after the read completes, reuse the read across effect replays, and ignore completion after leaving the tool. Empty or unavailable clipboard text opens an empty input.
- Replace automatic selected-text reads, fixing the IP startup flash and preventing late reads from clearing or overwriting input.
- Share complete input storage and search-field echo protection, preserving large and multiline clipboard text.
- Debounce IP queries and ignore stale results when input changes; avoid duplicate lookups when selecting a domain address.
- Handle out-of-range clipboard timestamps without crashing and shorten TypeID list previews while keeping copy and paste complete.
- Add regression checks for startup lifecycle, empty/failed clipboard reads, input replacement, and large Unicode content.

### Space Navigation

- Document Raycast's exact alias + Space navigation for opening a tool and displaying results while typing, without pressing Return. Configure aliases in Raycast settings; no launch arguments are needed.

### Long Text and Node 24

- Keep short Encode/Decode/Hash results directly in the list and truncate only display previews after 256 graphemes; copy and paste retain full results.
- Add complete clipboard import, multiline editing, input byte counts, and protection against search-field truncation observed at 524,288 characters on Raycast 2.8.2.
- Read the macOS pasteboard directly with a UTF-8 locale, avoiding clipboard history file references and non-ASCII replacement.
- Separate conversion errors from result data; validate Base64/Hex and UTF-8, preserve whitespace input, and support Base64URL and Unicode code-point escapes.
- Share text-command UI, debounce large input, and prevent asynchronous selection/clipboard reads from overwriting newer input.
- Adopt Node 24 development tooling, ESM, ES2024, Node 24 types, native TypeScript tests, and a dedicated type-check script. Raycast's bundled Node runtime remains host-managed.
- Fix existing type-check and lint failures and avoid generating an unused second UUID per result.

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
