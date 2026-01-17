# Subtitle Translator & Converter

A powerful Next.js 15 application for subtitle translation and format conversion, supporting 9 subtitle formats with AI-powered translation capabilities.

![Next.js](https://img.shields.io/badge/Next.js-15.4.2-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)

## ✨ Features

### 🎬 Subtitle Format Support
Convert between 9 popular subtitle formats:
- **SUB** - MicroDVD subtitle format
- **SRT** - SubRip subtitle format  
- **SBV** - YouTube subtitle format
- **VTT** - WebVTT subtitle format
- **SSA** - Sub Station Alpha format
- **ASS** - Advanced Sub Station Alpha format
- **SMI** - SAMI subtitle format
- **LRC** - Lyric file format
- **JSON** - Custom JSON subtitle format

### 🤖 AI Translation
Integrated with multiple AI providers for intelligent subtitle translation:
- **OpenAI** (GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-3.5-turbo)
- **Google AI** (Gemini 1.5 Pro, Gemini 1.5 Flash)
- **SiliconFlow** (DeepSeek-V3)
- **DeepSeek** (deepseek-chat)
- **Alibaba Cloud** (Qwen-VL-Max)
- **Custom Providers** - Add your own AI endpoints

### 🚀 Advanced Capabilities
- **Client-side Processing** - All subtitle parsing happens in your browser
- **Batch Processing** - Handle multiple files simultaneously with progress tracking
- **Real-time Progress** - Live translation progress with detailed status updates
- **Format Conversion** - Pure format conversion without translation
- **Dual Modes** - Translation mode (`/`) and Converter mode (`/converter`)
- **Theme Support** - Full dark/light theme with system detection
- **Internationalization** - English and Chinese language support
- **Mobile Optimized** - Responsive design with touch-friendly interfaces

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended package manager)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/subtitle-translator.git
cd subtitle-translator
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev
```

4. Open your browser and navigate to:
- **Main Translation App**: [http://localhost:3000](http://localhost:3000)
- **Format Converter**: [http://localhost:3000/converter](http://localhost:3000/converter)

## 📖 Usage Guide

### Translation Mode
1. **Upload Subtitles** - Drag and drop or select subtitle files (supports all 9 formats)
2. **Configure AI Provider** - Set up your preferred AI provider and API key in settings
3. **Select Languages** - Choose source and target languages from 100+ supported languages
4. **Start Translation** - Begin batch translation with real-time progress tracking
5. **Export Results** - Download translated subtitles in your preferred format and layout

### Converter Mode
1. **Upload Files** - Select subtitle files you want to convert
2. **Choose Output Format** - Pick from any of the 9 supported subtitle formats
3. **Convert** - Process files instantly with client-side conversion
4. **Download** - Get your converted subtitle files

### Configuration Options
- **Concurrent Translations** - Process multiple subtitles simultaneously (default: 3)
- **Output Layout** - Choose original-on-top or translation-on-top layouts
- **Retry Settings** - Configure automatic retry attempts (default: 2)
- **Batch Size** - Set subtitle segment batch size for processing (default: 5)

## ⚙️ AI Provider Configuration

### Supported Providers

| Provider | Models | API Endpoint |
|----------|--------|--------------|
| OpenAI | GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-3.5-turbo | https://api.openai.com/v1 |
| Google AI | Gemini 1.5 Pro, Gemini 1.5 Flash | https://generativelanguage.googleapis.com/v1beta |
| SiliconFlow | DeepSeek-V3 | https://api.siliconflow.cn/v1 |
| DeepSeek | deepseek-chat | https://api.deepseek.com/v1 |
| Alibaba Cloud | Qwen-VL-Max | https://dashscope.aliyuncs.com/compatible-mode/v1 |

### Setup Instructions
1. Open the settings panel in the application
2. Select your preferred AI provider
3. Enter your API key (obtained from the provider's dashboard)
4. Test the connection to verify setup
5. Choose your preferred model from available options

### Custom Providers
Add custom AI providers by configuring:
- Provider name and display name
- API base URL
- Available models list
- Default model selection

## 🛠️ Development

### Available Scripts
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build production application  
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint for code linting

### Project Structure
```
src/
├── app/                    # Next.js 15 App Router
│   ├── page.tsx           # Main translation interface  
│   └── converter/         # Format conversion page
├── components/            # React components
│   ├── ui/               # shadcn/ui base components
│   ├── upload/           # File upload with validation
│   ├── language/         # Language selection
│   ├── settings/         # AI provider configuration
│   ├── progress/         # Translation progress tracking
│   └── converter/        # Format conversion components
├── lib/                  # Utility libraries
│   ├── client/          # Client-side processing
│   ├── config-manager.ts # AI provider management
│   ├── translator.ts    # AI translation logic
│   └── subtitle-parser.ts # Subtitle processing
└── types/               # TypeScript definitions
```

### Tech Stack
- **Framework**: Next.js 15 with App Router and React 19
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4 with CSS variables
- **UI Components**: shadcn/ui (New York variant) with Radix UI
- **AI Integration**: Vercel AI SDK for unified provider interface
- **Subtitle Processing**: subsrt-ts for client-side parsing
- **Internationalization**: next-intl for multi-language support
- **State Management**: React hooks with localStorage persistence

## 🔧 Technical Details

### Subtitle Format Support
All subtitle processing happens client-side using the `subsrt-ts` library:
- **Parsing** - Intelligent format detection and parsing
- **Validation** - Comprehensive format validation and error handling  
- **Conversion** - Bidirectional conversion between all supported formats
- **Preservation** - Maintains timing, styling, and metadata during conversion

### AI Integration Architecture
- **Unified Interface** - Single API using Vercel AI SDK
- **Provider Abstraction** - Easy switching between AI providers
- **Batch Processing** - Efficient subtitle segment batching
- **Error Handling** - Automatic retry with exponential backoff
- **Progress Tracking** - Real-time translation status updates

### Client-side Benefits
- **Privacy** - No server-side file storage or processing
- **Performance** - Instant format conversion and preview
- **Offline Capability** - Format conversion works without internet
- **Security** - Files never leave your browser

## 🌍 Internationalization

The application supports:
- **English (en)** - Full interface translation
- **Chinese (zh)** - Complete Chinese localization
- **100+ Languages** - Translation target languages using ISO 639-3 codes
- **Language Detection** - Automatic browser language detection
- **Manual Override** - User-selectable interface language

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and ensure they follow the project conventions
4. Run linting: `pnpm lint`
5. Test your changes thoroughly
6. Commit your changes: `git commit -m 'Add feature description'`
7. Push to your branch: `git push origin feature-name`
8. Open a Pull Request

### Development Guidelines
- Follow existing code conventions and patterns
- Use TypeScript for type safety
- Maintain existing component structure
- Test with multiple subtitle formats
- Ensure responsive design compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Vercel AI SDK](https://sdk.vercel.ai/) - AI provider integration
- [subsrt-ts](https://www.npmjs.com/package/subsrt-ts) - Subtitle processing
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Radix UI](https://www.radix-ui.com/) - Primitive components
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework

---

Built with ❤️ using Next.js 15, React 19, and modern web technologies.