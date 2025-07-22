# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<workflow>
1. 每当我输入新的需求的时候，为了规范需求质量和验收标准，你首先会搞清楚问题和需求
2. 需求文档和验收标准设计：首先完成需求的设计,按照 EARS 简易需求语法方法来描述，保存在 `specs/spec_name/requirements.md` 中，跟我进行确认，最终确认清楚后，需求定稿，参考格式如下

```markdown
# 需求文档

## 介绍

需求描述

## 需求

### 需求 1 - 需求名称

**用户故事：** 用户故事内容

#### 验收标准

1. 采用 ERAS 描述的子句 While <可选前置条件>, when <可选触发器>, the <系统名称> shall <系统响应>，例如 When 选择"静音"时，笔记本电脑应当抑制所有音频输出。
2. ...
   ...
```

2. 技术方案设计： 在完成需求的设计之后，你会根据当前的技术架构和前面确认好的需求，进行需求的技术方案设计，保存在 `specs/spec_name/design.md` 中，精简但是能够准确的描述技术的架构（例如架构、技术栈、技术选型、数据库/接口设计、测试策略、安全性），必要时可以用 mermaid 来绘图，跟我确认清楚后，才进入下阶段
3. 任务拆分：在完成技术方案设计后，你会根据需求文档和技术方案，细化具体要做的事情，保存在`specs/spec_name/tasks.md` 中, 跟我确认清楚后，才开始正式执行任务，同时更新任务的状态

格式如下

```markdown
# 实施计划

- [ ] 1. 任务信息
- 具体要做的事情
- ...
- \_需求: 相关的需求点的编号
```

当完成某项任务时，根据任务的编号，在 `specs/spec_name/tasks.md` 中更新任务的状态，并更新任务的进度，同时更新任务的完成时间

```markdown
# 实施计划

- [x] 1. 任务信息
- ...
```

</workflow>

## 项目概览

这是一个 Next.js 15 字幕翻译应用程序，使用 AI 在语言之间翻译字幕文件（SRT、VTT、ASS）。支持多个 AI 提供商（OpenAI、Anthropic、Google），并提供实时翻译进度跟踪和并发处理。

## Development Commands

- `pnpm dev` - Start development server with Turbopack (runs on http://localhost:3000)
- `pnpm build` - Build production application
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint for code linting

Please use `pnpm` instead of `npm` to install dependencies.

## Architecture

### Tech Stack

- **Framework**: Next.js 15 with App Router and Server-Sent Events for streaming
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4 with CSS variables and dark mode support
- **UI Components**: shadcn/ui (New York style variant) with Radix UI primitives
- **AI Integration**: Vercel AI SDK with support for OpenAI, Anthropic, and Google AI
- **Language Selection**: Manual language selection with comprehensive language support
- **Subtitle Processing**: subsrt for parsing and generating multiple subtitle formats

shadcn/ui is used for the UI components. The installation method for the components is as follows.

```bash
pnpm dlx shadcn@latest add component-name
```

example: `pnpm dlx shadcn@latest add button`

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
│   ├── language-selector.ts # Language selection utilities
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
- **Manual Selection**: Users manually select source and target languages from comprehensive language list
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
