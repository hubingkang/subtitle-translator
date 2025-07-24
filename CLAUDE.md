# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

这是一个 Next.js 15 字幕翻译和格式转换应用程序，支持 9 种字幕格式（SUB、SRT、SBV、VTT、SSA、ASS、SMI、LRC、JSON）的相互转换和 AI 智能翻译。集成了 4 个主流 AI 提供商（OpenAI、Anthropic、Google AI、SiliconFlow）以及自定义提供商支持，提供实时翻译进度跟踪、批量处理和客户端本地处理能力。

## Development Commands

- `pnpm dev` - Start development server with Turbopack (runs on http://localhost:3000)
- `pnpm build` - Build production application
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint for code linting

Please use `pnpm` instead of `npm` to install dependencies.

## Architecture

### Tech Stack

- **Framework**: Next.js 15 with App Router, React 19, and client-side processing
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4 with CSS variables and dark/light theme support
- **UI Components**: shadcn/ui (New York style variant) with Radix UI primitives
- **AI Integration**: Vercel AI SDK with support for OpenAI, Anthropic, Google AI, SiliconFlow, and custom providers
- **Language Selection**: Manual language selection with comprehensive language support (ISO 639-3 codes)
- **Subtitle Processing**: subsrt-ts for client-side parsing and generating 9 subtitle formats
- **State Management**: React hooks with localStorage persistence and browser sync

shadcn/ui is used for the UI components. The installation method for the components is as follows.

```bash
pnpm dlx shadcn@latest add component-name
```

example: `pnpm dlx shadcn@latest add button`

### Project Structure

```
src/
├── app/
│   ├── page.tsx           # Main translation interface
│   ├── converter/         # Format conversion page
│   │   └── page.tsx       # Converter interface
│   └── layout.tsx         # Root layout with theme provider
├── components/
│   ├── ui/                # shadcn/ui base components
│   ├── upload/            # File upload with drag-and-drop validation
│   ├── language/          # Language selection components
│   ├── settings/          # AI provider configuration modals
│   ├── progress/          # Real-time translation progress tracking
│   ├── output/            # Export and download functionality
│   └── converter/         # Format conversion components
├── lib/
│   ├── client/            # Client-side processing utilities
│   │   └── subtitle-parser-client.ts # Client-side subtitle parsing
│   ├── config-manager.ts  # AI provider configuration management
│   ├── language-selector.ts # Language selection utilities
│   ├── subtitle-parser.ts # Server-side subtitle processing
│   ├── translator.ts      # AI translation with batch processing
│   └── theme-provider.tsx # Dark/light theme context
├── types/
│   └── translation.ts     # TypeScript definitions
└── config/
    └── translation-config.json # Default AI provider settings
```

### Key Features

#### Subtitle Format Support & Conversion

- **9 Format Support**: SUB, SRT, SBV, VTT, SSA, ASS, SMI, LRC, JSON with bidirectional conversion
- **Format Converter**: Dedicated converter page (`/converter`) for pure format conversion without translation
- **Client-side Processing**: All subtitle parsing and format conversion happens in the browser
- **Format Validation**: Comprehensive validation and error handling for each subtitle format
- **Batch Processing**: Support for multiple file processing with progress tracking

#### AI Translation System

- **4 AI Providers**: OpenAI, Anthropic, Google AI, SiliconFlow with unified interface via Vercel AI SDK
- **Custom Provider Support**: Ability to add custom AI providers with configurable endpoints
- **Dual Translation Modes**: Main translation page (`/`) and format conversion page (`/converter`)
- **Batch Translation**: Process multiple subtitle files simultaneously with concurrency control
- **Progress Tracking**: Real-time progress updates with detailed status information
- **Error Handling**: Automatic retry with exponential backoff and comprehensive error reporting

#### Advanced Configuration

- **Multi-provider Management**: API key management and model selection for each provider
- **Connection Testing**: Built-in API connection testing and validation
- **Settings Persistence**: localStorage-based configuration with cross-browser synchronization
- **Theme Support**: Full dark/light theme integration with system preference detection
- **Responsive Design**: Mobile-first responsive design with touch-optimized interfaces

#### Export & Output Options

- **Flexible Layout Options**: Original on top/bottom, translation on top/bottom configurations
- **Multi-format Export**: Export to any of the 9 supported subtitle formats
- **Custom File Naming**: User-configurable output filenames with format extensions
- **Batch Download**: Support for downloading multiple processed files
- **Live Preview**: Real-time preview of subtitle output before download

### Configuration

- **AI Providers**: Configured in `src/config/translation-config.json` with 4 default providers
- **Custom Providers**: Support for adding custom AI endpoints and configurations
- **Default Settings**: 3 concurrent translations, original-on-top layout, 2 max retries
- **Path Aliases**: `@/components`, `@/lib`, `@/types`, `@/config`
- **Environment**: API keys managed via configuration panel (no .env file needed)
- **Theme Configuration**: Automatic dark/light mode detection with manual override

### Application Routes

- **Main Translation** (`/`): Full AI translation interface with multi-provider support
- **Format Converter** (`/converter`): Pure format conversion without AI translation
- **Responsive Navigation**: Mobile-optimized navigation with theme toggle

### Development Notes

- **Language Support**: Uses ISO 639-3 language codes with langs package for human-readable names
- **Client-side Architecture**: All subtitle processing happens in the browser using subsrt-ts
- **Performance Optimization**: Turbopack for fast development builds, optimized bundle for production
- **Error Handling**: Comprehensive error handling with user-friendly messages and retry mechanisms
- **Accessibility**: Full keyboard navigation and screen reader support via Radix UI primitives
- **Type Safety**: Strict TypeScript configuration with comprehensive type definitions
- **State Management**: React hooks pattern with localStorage persistence and cross-tab synchronization

## 重要

当代码内容新增重要功能或者对上面现有功能有较大改动更新时，及时同步到当前 CLAUDE.md 文件中，避免内容过时
