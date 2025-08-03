# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a Raycast extension called "Engineer tools" that provides engineering utilities through the Raycast interface. The extension is built with TypeScript and React, using the Raycast API. Migrated from Alfred engineer tools with 8 core functionalities.

## Available Commands
- **Encode** (`src/encode.tsx`) - URL, Base64, and Hex encoding
- **Decode** (`src/decode.tsx`) - URL, Base64, Hex, and Unicode decoding
- **UUID Generator** (`src/uuid.tsx`) - Generate UUID v4 and v7 strings
- **TypeID** (`src/typeid.tsx`) - Encode/decode TypeID format
- **Hash Generator** (`src/hash.tsx`) - MD5, SHA1, and SHA256 hashing
- **DateTime** (`src/datetime.tsx`) - Timestamp and date conversion
- **File Size** (`src/filesize.tsx`) - Bytes and human-readable file size conversion
- **IP Lookup** (`src/ip-lookup.tsx`) - IP address information lookup

## Development Commands
- `npm run dev` - Start development mode with hot reload
- `npm run build` - Build the extension for production
- `npm run lint` - Run ESLint to check code quality
- `npm run fix-lint` - Auto-fix ESLint issues
- `npm run publish` - Publish to Raycast Store

## Architecture
- **Commands**: 8 separate commands as defined in package.json
- **Utilities**: Shared utility functions in `src/utils/` directory
- **TypeScript**: Uses strict TypeScript with React JSX
- **Dependencies**: Uses `@raycast/api`, `@raycast/utils`, and `uuid`
- **Linting**: Uses `@raycast/eslint-config` for consistent code style

## Utility Modules
- `src/utils/encoding.ts` - Encoding/decoding and hashing utilities
- `src/utils/uuid.ts` - UUID generation utilities
- `src/utils/typeid.ts` - TypeID encoding/decoding
- `src/utils/datetime.ts` - Date and timestamp conversion
- `src/utils/filesize.ts` - File size conversion utilities
- `src/utils/network.ts` - IP lookup and network utilities