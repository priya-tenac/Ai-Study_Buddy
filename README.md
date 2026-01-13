# 🤖 AI Study Buddy - Next.js

> **Your AI-powered study companion for smarter, faster learning**

AI Study Buddy is a comprehensive Next.js application that transforms how students study by leveraging artificial intelligence to create summaries, generate quizzes, predict exam topics, and track progress. Built with modern web technologies and designed for students who want to study smarter, not harder.

![AI Study Buddy](https://img.shields.io/badge/Next.js-16.1.1-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react)

## ✨ Features

### 🧠 Smart Notes & Summaries
- **Multi-format Support**: Upload PDFs, paste text, URLs, or YouTube links
- **AI-Powered Summarization**: Get clean, exam-focused summaries in seconds
- **Multiple Output Formats**: Summaries, MCQs, flashcards, and mind maps
- **Mood-Based Learning**: Adjust AI explanation style (Gentle, Balanced, Challenge)
- **Export Options**: Download summaries as PDF or SVG mind maps

### 📅 Personalized Study Planner
- **Smart Scheduling**: Set exam dates and daily study hours
- **AI-Generated Plans**: Realistic weekly and daily study schedules
- **Progress Tracking**: Monitor completion rates and study streaks
- **Habit Building**: Track daily study sessions and maintain streaks

### 📊 Progress & Analytics
- **Comprehensive Stats**: PDFs summarized, MCQs attempted, accuracy rates
- **Visual Charts**: Daily activity charts and quiz performance trends
- **Study Streaks**: Current and best streak tracking with gamification
- **Performance Insights**: Detailed analytics on learning patterns

### 🎯 AI Exam Predictor
- **Topic Prediction**: Analyze syllabus and past papers for high-probability topics
- **Sample Questions**: Generate likely exam questions for each topic
- **Strategic Guidance**: AI-powered study strategy recommendations
- **Multi-Input Support**: Text, PDF, and image upload for syllabus analysis

### ⚔️ AI Quiz Battle
- **Solo & Multiplayer**: Play alone or challenge friends
- **Adaptive Difficulty**: Easy, medium, and hard question levels
- **Real-time Scoring**: Accuracy and speed-based scoring system
- **Topic Customization**: Generate quizzes on specific subjects

### 💬 Interactive Chat Features
- **PDF Chat**: Ask questions about uploaded documents
- **Context-Aware**: AI remembers your study materials and preferences
- **Natural Language**: Conversational interface for easy interaction

### 🎨 Modern UI/UX
- **Dark/Light Themes**: Seamless theme switching with next-themes
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Smooth Animations**: GSAP-powered animations and transitions
- **Physics-Based Interactions**: Engaging button animations and effects

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm**, **yarn**, **pnpm**, or **bun**
- **Supabase Account** (for authentication and data storage)
- **Groq API Key** (for AI functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/next-study-buddy.git
   cd next-study-buddy
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Environment Setup**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # AI Configuration
   GROQ_API_KEY=your_groq_api_key

   # JWT Secret
   JWT_SECRET=your_jwt_secret_key

   # Email Configuration (Optional)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗️ Project Structure

```
next-study-buddy/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── chat/                 # Chat functionality
│   │   ├── content/              # Content processing
│   │   ├── exam-predictor/       # Exam prediction API
│   │   ├── ocr/                  # Image text extraction
│   │   ├── pdf/                  # PDF processing
│   │   ├── quiz/                 # Quiz generation
│   │   ├── study-plan/           # Study planning
│   │   ├── summarize/            # Text summarization
│   │   └── tts/                  # Text-to-speech
│   ├── chat-pdf/                 # PDF chat interface
│   ├── dashboard/                # User dashboard
│   ├── exam-predictor/           # Exam prediction page
│   ├── login/                    # Authentication pages
│   ├── quiz-battle/              # Quiz game interface
│   ├── register/                 # User registration
│   ├── study-planner/            # Study planning interface
│   ├── summarize/                # Main summarization tool
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── public/                       # Static assets
├── components/                   # Reusable components
├── .env.local                    # Environment variables
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies
├── tailwind.config.js            # Tailwind CSS config
└── tsconfig.json                 # TypeScript config
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 16.1.1** - React framework with App Router
- **React 19.2.3** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Utility-first CSS framework
- **Framer Motion 12.24.7** - Animation library
- **GSAP 3.14.2** - Advanced animations
- **next-themes 0.4.6** - Theme management

### Backend & APIs
- **Next.js API Routes** - Server-side functionality
- **Supabase** - Authentication and database
- **Groq SDK 0.37.0** - AI/LLM integration
- **JWT** - Token-based authentication
- **Nodemailer** - Email functionality

### Data Processing
- **pdf-parse 1.1.1** - PDF text extraction
- **Google Auth Library** - OCR capabilities
- **Canvas API** - Image processing
- **Mermaid 10.9.1** - Diagram generation

### UI Components & Visualization
- **Recharts 2.12.7** - Data visualization
- **React Markdown 9.1.0** - Markdown rendering
- **jsPDF 2.5.2** - PDF generation
- **Canvg 4.0.2** - SVG to Canvas conversion
- **PptxGenJS 3.12.0** - PowerPoint generation

## 📱 Key Pages & Features

### 🏠 Home Page (`/`)
- Hero section with animated elements
- Feature overview cards
- Quick start guide
- FAQ section
- Responsive design with GSAP animations

### 📝 Smart Notes (`/summarize`)
- Multi-input support (text, URL, PDF, audio, image)
- Mood-based AI responses
- Real-time summarization
- Export functionality (PDF, SVG)
- History tracking with favorites

### 📊 Dashboard (`/dashboard`)
- Progress tracking and analytics
- Study session history
- Performance charts
- Streak monitoring
- Quick access to all tools

### 🎯 Exam Predictor (`/exam-predictor`)
- Syllabus analysis
- Past paper pattern recognition
- Topic probability scoring
- Sample question generation
- Multi-format input support

### ⚔️ Quiz Battle (`/quiz-battle`)
- Solo and multiplayer modes
- Difficulty selection
- Real-time scoring
- Performance tracking
- Topic customization

### 💬 PDF Chat (`/chat-pdf`)
- Interactive PDF conversations
- Context-aware responses
- Document analysis
- Question answering

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Set up authentication providers
3. Create necessary tables for user data
4. Configure RLS (Row Level Security) policies

### Groq API Setup
1. Sign up for Groq API access
2. Generate API key
3. Configure rate limits and usage

### Email Configuration (Optional)
1. Set up Gmail app password
2. Configure SMTP settings
3. Test email functionality

## 🎨 Customization

### Themes
The app supports both light and dark themes using `next-themes`. Customize colors in:
- `app/globals.css` - CSS custom properties
- `tailwind.config.js` - Tailwind theme configuration

### Animations
GSAP animations can be customized in:
- `app/page.tsx` - Home page animations
- Individual component files
- `app/globals.css` - CSS animations

### AI Behavior
Modify AI responses and behavior in:
- `app/api/summarize/route.ts` - Summarization logic
- `app/api/quiz/route.ts` - Quiz generation
- `app/api/exam-predictor/route.ts` - Prediction algorithms

## 📈 Performance Optimization

- **Code Splitting**: Automatic with Next.js App Router
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Use `npm run build` to analyze
- **Caching**: API route caching and browser caching
- **Lazy Loading**: Components and routes loaded on demand

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured for API routes
- **Environment Variables**: Sensitive data in env files
- **Supabase RLS**: Row-level security for data access

## 🧪 Testing

```bash
# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm run start
```

## 📦 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Other Platforms
- **Netlify**: Configure build settings
- **Railway**: Set up environment variables
- **Docker**: Create Dockerfile for containerization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing React framework
- **Vercel** - For hosting and deployment platform
- **Supabase** - For backend-as-a-service
- **Groq** - For AI/LLM capabilities
- **Tailwind CSS** - For utility-first CSS framework
- **GSAP** - For smooth animations

## 📞 Support

- **Documentation**: Check the code comments and this README
- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions

---

**Built with ❤️ for students who want to study smarter, not harder.**

*Transform your study routine with AI-powered tools designed to help you learn faster, remember more, and ace your exams.*