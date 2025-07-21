# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 subtitle translation application that uses AI to translate subtitle files (SRT, VTT, ASS) between languages. The app features automatic language detection using franc, supports multiple AI providers (OpenAI, Anthropic, Google), and provides real-time translation progress tracking with concurrent processing.

## Development Commands

- `npm run dev` - Start development server with Turbopack (runs on http://localhost:3000)
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code linting

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router and Server-Sent Events for streaming
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4 with CSS variables and dark mode support
- **UI Components**: shadcn/ui (New York style variant) with Radix UI primitives
- **AI Integration**: Vercel AI SDK with support for OpenAI, Anthropic, and Google AI
- **Language Detection**: franc for automatic language detection with 186+ language support
- **Subtitle Processing**: subsrt for parsing and generating multiple subtitle formats

### Project Structure
```
src/
├── app/
│   ├── api/           # API routes for upload, translate, export
│   ├── page.tsx       # Main application interface
│   └── layout.tsx     # Root layout with fonts
├── components/
│   ├── ui/            # shadcn/ui base components
│   ├── upload/        # File upload with drag-and-drop
│   ├── language/      # Language detection and selection
│   ├── settings/      # AI provider configuration
│   ├── progress/      # Real-time translation progress
│   └── output/        # Export and download functionality
├── lib/
│   ├── config-manager.ts    # AI provider configuration management
│   ├── language-detector.ts # franc integration for language detection
│   ├── subtitle-parser.ts   # subsrt wrapper for subtitle processing
│   └── translator.ts        # AI translation with concurrency control
├── types/
│   └── translation.ts       # TypeScript definitions
└── config/
    └── translation-config.json # Default AI provider settings
```

### Key Features

#### Subtitle Processing
- **Multi-format Support**: SRT, VTT, ASS, SSA subtitle formats
- **Automatic Detection**: Uses franc to detect source language with confidence scoring
- **Text Extraction**: Parses subtitle files and extracts text while preserving timing information
- **Format Validation**: Validates subtitle file structure before processing

#### AI Translation System
- **Multi-provider Support**: OpenAI, Anthropic, Google AI with unified interface via Vercel AI SDK
- **Concurrent Processing**: Configurable concurrency (1-10 simultaneous translations) with retry logic
- **Progress Tracking**: Real-time progress updates via Server-Sent Events
- **Error Handling**: Automatic retry with exponential backoff for failed translations

#### Configuration Management
- **Provider Setup**: API key management for multiple AI providers
- **Model Selection**: Dynamic model selection per provider
- **Settings Persistence**: localStorage-based configuration with browser sync
- **Connection Testing**: Built-in API connection testing for each provider

#### Export Options
- **Dual Language Output**: Original text on top/bottom or translation on top/bottom
- **Multiple Formats**: Export to SRT, VTT, or ASS with preserved timing
- **Custom Naming**: User-configurable output filenames
- **Preview**: Live preview of final subtitle format before export

### API Routes
- **POST /api/upload**: Handles file upload, parsing, and language detection
- **POST /api/translate**: Streaming translation endpoint with progress updates  
- **GET /api/translate**: Connection testing for AI providers
- **POST /api/export**: Generates and downloads translated subtitle files

### Configuration
- **AI Providers**: Configured in `src/config/translation-config.json`
- **Default Settings**: 3 concurrent translations, original-on-top layout, 2 max retries
- **Path Aliases**: `@/components`, `@/lib`, `@/types`, `@/config`
- **Environment**: Supports API keys via configuration panel (no .env file needed)

### Development Notes
- **Language Support**: Uses ISO 639-3 language codes with langs package for human-readable names
- **Streaming**: Server-Sent Events for real-time progress updates during translation
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Accessibility**: Full keyboard navigation and screen reader support via Radix UI
- **Performance**: Turbopack for fast development builds, optimized bundle for production