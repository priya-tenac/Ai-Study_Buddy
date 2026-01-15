# 🏗️ AI Study Buddy - Architecture Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Authentication Flow](#authentication-flow)
6. [API Endpoints](#api-endpoints)
7. [Data Flow](#data-flow)
8. [Database Schema](#database-schema)
9. [AI Integration](#ai-integration)
10. [Deployment Architecture](#deployment-architecture)

---

## 🎯 System Overview

AI Study Buddy is a full-stack Next.js application using the **App Router** architecture. It combines server-side rendering (SSR), API routes, and client-side interactivity to deliver an AI-powered study platform.

### Architecture Pattern
- **Framework**: Next.js 16.1.1 (App Router)
- **Rendering**: Hybrid (SSR + CSR)
- **API**: RESTful API Routes
- **Database**: Supabase (PostgreSQL)
- **AI Provider**: Groq (LLaMA 3.1)
- **Authentication**: JWT + Supabase Auth

---

## 🛠️ Technology Stack

### Frontend
```
React 19.2.3
├── Next.js 16.1.1 (App Router)
├── TypeScript 5
├── Tailwind CSS 4
├── Framer Motion 12.24.7
├── GSAP 3.14.2
├── next-themes 0.4.6
└── Recharts 2.12.7
```

### Backend
```
Next.js API Routes
├── Groq SDK 0.37.0 (AI)
├── Supabase 2.90.0 (Database)
├── JWT (jsonwebtoken 9.0.3)
├── Nodemailer 6.10.1 (Email)
├── pdf-parse 1.1.1
└── bcryptjs 3.0.3
```

---

## 🎨 Frontend Architecture

### Directory Structure
```
app/
├── (pages)
│   ├── page.tsx                 # Home page
│   ├── dashboard/page.tsx       # User dashboard
│   ├── summarize/page.tsx       # AI summarization
│   ├── quiz-battle/page.tsx     # Quiz interface
│   ├── exam-predictor/page.tsx  # Exam prediction
│   ├── study-planner/page.tsx   # Study planning
│   ├── chat-pdf/page.tsx        # PDF chat
│   ├── login/page.tsx           # Login
│   └── register/page.tsx        # Registration
├── (components)
│   ├── Navbar.tsx               # Navigation
│   ├── Footer.tsx               # Footer
│   ├── ThemeToggle.tsx          # Dark/Light mode
│   ├── MouseGlow.tsx            # Custom cursor
│   ├── ChatWidget.tsx           # Chat interface
│   ├── ContactForm.tsx          # Contact form
│   └── AuthContext.tsx          # Auth state management
├── layout.tsx                   # Root layout
└── globals.css                  # Global styles
```

### Component Architecture

#### 1. **Client Components** (`"use client"`)
Used for interactive features requiring browser APIs:
- `MouseGlow.tsx` - Custom cursor with animations
- `ThemeToggle.tsx` - Theme switching
- `ChatWidget.tsx` - Real-time chat
- `AuthContext.tsx` - Authentication state

#### 2. **Server Components** (Default)
Used for data fetching and SEO:
- Page components (dashboard, summarize, etc.)
- Layout components
- Static content sections

### State Management

#### Context API
```typescript
// AuthContext.tsx
interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}
```

#### Local State (useState, useRef)
- Form inputs
- UI toggles
- Animation states
- Temporary data

### Styling Strategy

#### Tailwind CSS Classes
```tsx
// Utility-first approach
<div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900">
```

#### CSS Variables (globals.css)
```css
:root {
  --background: #ffffff;
  --foreground: #000000;
}

[data-theme="dark"] {
  --background: #0a0a0a;
  --foreground: #ededed;
}
```

### Animation System

#### GSAP Animations
```typescript
// Scroll-triggered animations
gsap.from(".feature-card", {
  scrollTrigger: {
    trigger: ".feature-card",
    start: "top 80%",
  },
  y: 50,
  opacity: 0,
  duration: 0.8,
})
```

#### Framer Motion
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
```

---

## ⚙️ Backend Architecture

### API Routes Structure
```
app/api/
├── auth/
│   ├── register/route.ts        # User registration
│   ├── login/route.ts           # User login
│   ├── verify-email/route.ts    # Email verification
│   ├── verify-otp/route.ts      # OTP verification
│   ├── resend-otp/route.ts      # Resend OTP
│   ├── google/route.ts          # Google OAuth
│   ├── email.ts                 # Email utilities
│   ├── supabaseClient.ts        # Supabase client
│   ├── user-repository.ts       # User data access
│   └── users-store.ts           # In-memory user store
├── summarize/route.ts           # AI summarization
├── quiz/generate/route.ts       # Quiz generation
├── exam-predictor/route.ts      # Exam prediction
├── study-plan/route.ts          # Study planning
├── chat/route.ts                # Chat functionality
├── pdf/route.ts                 # PDF processing
├── ocr/route.ts                 # Image text extraction
├── audio/route.ts               # Audio processing
├── tts/route.ts                 # Text-to-speech
├── content/route.ts             # Content processing
└── contact/route.ts             # Contact form
```

### API Route Pattern

#### Standard Structure
```typescript
// app/api/[feature]/route.ts
import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"

export async function POST(req: Request) {
  try {
    // 1. Authentication
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.slice("Bearer ".length)
    jwt.verify(token, process.env.JWT_SECRET!)

    // 2. Request validation
    const body = await req.json()
    if (!body.requiredField) {
      return NextResponse.json({ error: "Missing field" }, { status: 400 })
    }

    // 3. Business logic
    const result = await processData(body)

    // 4. Response
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
```

### Middleware & Utilities

#### JWT Authentication
```typescript
// Verify JWT token
const secret = process.env.JWT_SECRET || "dev-secret"
const decoded = jwt.verify(token, secret)
```

#### Supabase Client
```typescript
// app/api/auth/supabaseClient.ts
import { createClient } from "@supabase/supabase-js"

let client: SupabaseClient | null = null

export function getSupabaseClient() {
  if (client) return client
  
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  client = createClient(url!, key!, {
    auth: { persistSession: false }
  })
  
  return client
}
```

#### Email Service
```typescript
// app/api/auth/email.ts
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendVerificationEmail(email: string, otp: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Verify Your Email",
    html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
  })
}
```

---

## 🔐 Authentication Flow

### Registration Flow
```
1. User submits registration form
   ↓
2. POST /api/auth/register
   - Validate input
   - Hash password (bcrypt)
   - Generate OTP
   - Store user in Supabase
   - Send verification email
   ↓
3. User receives OTP email
   ↓
4. POST /api/auth/verify-otp
   - Verify OTP
   - Mark email as verified
   - Generate JWT token
   ↓
5. Return JWT to client
   ↓
6. Store token in localStorage
   ↓
7. Redirect to dashboard
```

### Login Flow
```
1. User submits login form
   ↓
2. POST /api/auth/login
   - Validate credentials
   - Compare password hash
   - Check email verification
   - Generate JWT token
   ↓
3. Return JWT to client
   ↓
4. Store token in localStorage
   ↓
5. Update AuthContext
   ↓
6. Redirect to dashboard
```

### Google OAuth Flow
```
1. User clicks "Sign in with Google"
   ↓
2. Google OAuth popup
   ↓
3. POST /api/auth/google
   - Verify Google token
   - Check if user exists
   - Create user if new
   - Generate JWT token
   ↓
4. Return JWT to client
   ↓
5. Store token and redirect
```

### Token Verification
```typescript
// Every protected API route
const authHeader = req.headers.get("authorization")
const token = authHeader?.slice("Bearer ".length)

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET!)
  // Proceed with request
} catch {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
```

---

## 🌐 API Endpoints

### Authentication APIs

#### POST `/api/auth/register`
**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```
**Response:**
```json
{
  "message": "Registration successful. Please verify your email.",
  "userId": "uuid"
}
```

#### POST `/api/auth/login`
**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```
**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### POST `/api/auth/verify-otp`
**Request:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```
**Response:**
```json
{
  "message": "Email verified successfully",
  "token": "jwt_token_here"
}
```

### AI Feature APIs

#### POST `/api/summarize`
**Headers:**
```
Authorization: Bearer <jwt_token>
```
**Request:**
```json
{
  "text": "Long text content to summarize...",
  "maxWords": 200,
  "mood": "neutral",
  "targetLang": "en"
}
```
**Response:**
```json
{
  "summary": "Concise summary...",
  "keywords": ["keyword1", "keyword2"],
  "mcqs": [
    {
      "question": "What is...?",
      "options": ["A", "B", "C", "D"],
      "answer": "A",
      "explanation": "Because..."
    }
  ],
  "pptOutline": [
    {
      "title": "Introduction",
      "bullets": ["Point 1", "Point 2"]
    }
  ],
  "mindmap": "mindmap\n  root((Topic))\n    Branch1\n      Sub1",
  "flashcards": [
    {
      "front": "Question?",
      "back": "Answer"
    }
  ]
}
```

#### POST `/api/quiz/generate`
**Headers:**
```
Authorization: Bearer <jwt_token>
```
**Request:**
```json
{
  "topic": "JavaScript Basics",
  "difficulty": "medium",
  "mood": "neutral",
  "numQuestions": 5
}
```
**Response:**
```json
{
  "questions": [
    {
      "question": "What is a closure?",
      "options": ["A", "B", "C", "D"],
      "answer": "A",
      "explanation": "A closure is..."
    }
  ]
}
```

#### POST `/api/exam-predictor`
**Headers:**
```
Authorization: Bearer <jwt_token>
```
**Request:**
```json
{
  "syllabus": "Course syllabus text...",
  "pastPapers": "Past exam questions..."
}
```
**Response:**
```json
{
  "predictions": [
    {
      "topic": "Data Structures",
      "probability": 85,
      "sampleQuestions": ["Q1", "Q2"]
    }
  ]
}
```

#### POST `/api/study-plan`
**Headers:**
```
Authorization: Bearer <jwt_token>
```
**Request:**
```json
{
  "examDate": "2024-06-15",
  "dailyHours": 3,
  "subjects": ["Math", "Physics"]
}
```
**Response:**
```json
{
  "plan": {
    "weeks": [
      {
        "week": 1,
        "days": [
          {
            "day": "Monday",
            "tasks": ["Study Chapter 1", "Practice problems"]
          }
        ]
      }
    ]
  }
}
```

### Utility APIs

#### POST `/api/pdf`
**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```
**Request:**
```
FormData with PDF file
```
**Response:**
```json
{
  "text": "Extracted text from PDF..."
}
```

#### POST `/api/ocr`
**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```
**Request:**
```
FormData with image file
```
**Response:**
```json
{
  "text": "Extracted text from image..."
}
```

#### POST `/api/contact`
**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "I have a question..."
}
```
**Response:**
```json
{
  "message": "Message sent successfully"
}
```

---

## 🔄 Data Flow

### Summarization Flow
```
Frontend (summarize/page.tsx)
  ↓
  User inputs text/uploads file
  ↓
  Extract text (if PDF/image)
  ↓
  POST /api/summarize
    ↓
    Verify JWT token
    ↓
    Validate input
    ↓
    Call Groq API (LLaMA 3.1)
      ↓
      Generate summary
      ↓
      Generate keywords
      ↓
      Generate MCQs
      ↓
      Generate mind map
      ↓
      Generate flashcards
    ↓
    Parse JSON response
    ↓
    Return structured data
  ↓
  Display results in UI
  ↓
  Allow export (PDF/SVG)
```

### Quiz Generation Flow
```
Frontend (quiz-battle/page.tsx)
  ↓
  User selects topic & difficulty
  ↓
  POST /api/quiz/generate
    ↓
    Verify JWT token
    ↓
    Validate parameters
    ↓
    Call Groq API
      ↓
      Generate questions based on:
        - Topic
        - Difficulty level
        - User mood
        - Number of questions
    ↓
    Parse and validate questions
    ↓
    Return question array
  ↓
  Display quiz interface
  ↓
  Track user answers
  ↓
  Calculate score
  ↓
  Store results in Supabase
```

### Authentication Flow
```
Frontend (login/page.tsx)
  ↓
  User enters credentials
  ↓
  POST /api/auth/login
    ↓
    Query Supabase for user
    ↓
    Verify password (bcrypt)
    ↓
    Check email verification
    ↓
    Generate JWT token
    ↓
    Return token + user data
  ↓
  Store token in localStorage
  ↓
  Update AuthContext
  ↓
  Redirect to dashboard
  ↓
  All subsequent API calls include:
    Authorization: Bearer <token>
```

---

## 🗄️ Database Schema

### Supabase Tables

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  otp VARCHAR(6),
  otp_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### study_sessions
```sql
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  session_type VARCHAR(50), -- 'summarize', 'quiz', 'chat'
  duration INTEGER, -- in minutes
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### quiz_results
```sql
CREATE TABLE quiz_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  topic VARCHAR(255),
  difficulty VARCHAR(20),
  score INTEGER,
  total_questions INTEGER,
  time_taken INTEGER, -- in seconds
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### summaries
```sql
CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  original_text TEXT,
  summary TEXT,
  keywords JSONB,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### study_plans
```sql
CREATE TABLE study_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  exam_date DATE,
  daily_hours INTEGER,
  subjects JSONB,
  plan_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🤖 AI Integration

### Groq API Configuration

#### Client Setup
```typescript
import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!
})
```

#### Model Selection
- **Model**: `llama-3.1-8b-instant`
- **Strengths**: Fast inference, good for educational content
- **Context Window**: 8K tokens

#### Prompt Engineering

##### Summarization Prompt
```typescript
const systemPrompt = `
You are AI Study Buddy. You must reply with STRICT JSON only.
${moodInstruction}
${languageInstruction}

The JSON must contain:
- summary: Clear explanation (max ${wordLimit} words)
- keywords: Array of 8-15 important terms
- mcqs: Array of question objects
- pptOutline: Array of slide objects
- mindmap: Mermaid mindmap syntax
- flashcards: Array of front/back objects
`
```

##### Quiz Generation Prompt
```typescript
const systemPrompt = `
You are AI Study Buddy creating quiz questions.
Respond with STRICT JSON only.

Match tone to student mood:
- sleepy: Simple, encouraging, no tricks
- neutral: Balanced classroom style
- energized: Challenging, multi-step questions

JSON format:
{
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "answer": "string",
      "explanation": "string"
    }
  ]
}
`
```

#### Temperature Settings
```typescript
// Summarization: Lower temperature for consistency
temperature: 0.4

// Quiz Generation: Varies by difficulty
temperature: difficulty === "easy" ? 0.5 
           : difficulty === "medium" ? 0.7 
           : 0.9
```

#### Response Parsing
```typescript
// Clean markdown fences
let cleaned = raw.trim()
if (cleaned.startsWith("```")) {
  const firstBrace = cleaned.indexOf("{")
  const lastBrace = cleaned.lastIndexOf("}")
  cleaned = cleaned.slice(firstBrace, lastBrace + 1)
}

// Remove comments
cleaned = cleaned.replace(/\/\/.*$/gm, "")

// Parse JSON
const parsed = JSON.parse(cleaned)
```

---

## 🚀 Deployment Architecture

### Vercel Deployment

#### Build Configuration
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

#### Environment Variables
```
GROQ_API_KEY=***
JWT_SECRET=***
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=***
SMTP_PASS=***
SMTP_FROM=***
APP_BASE_URL=https://your-domain.vercel.app
GOOGLE_CLIENT_ID=***
NEXT_PUBLIC_GOOGLE_CLIENT_ID=***
SUPABASE_URL=***
SUPABASE_SERVICE_ROLE_KEY=***
OCR_SPACE_API_KEY=***
```

#### Deployment Flow
```
1. Push to GitHub (main branch)
   ↓
2. Vercel detects changes
   ↓
3. Install dependencies
   ↓
4. Run build (npm run build)
   ↓
5. Deploy to edge network
   ↓
6. Update production URL
```

### Performance Optimizations

#### Next.js Features
- **Static Generation**: Home, login, register pages
- **Server Components**: Default for all pages
- **Image Optimization**: Automatic with next/image
- **Code Splitting**: Automatic route-based splitting
- **Edge Runtime**: API routes run on edge

#### Caching Strategy
```typescript
// API Route caching
export const revalidate = 3600 // 1 hour

// Static page caching
export const dynamic = 'force-static'
```

#### Bundle Optimization
```typescript
// next.config.ts
const config = {
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  experimental: {
    optimizeCss: true
  }
}
```

---

## 📊 Monitoring & Analytics

### Error Tracking
```typescript
// Global error boundary
try {
  // API logic
} catch (error) {
  console.error("Error:", error)
  // Send to monitoring service
  return NextResponse.json({ error: "Internal error" }, { status: 500 })
}
```

### Performance Metrics
- **Core Web Vitals**: Tracked via Vercel Analytics
- **API Response Times**: Logged in production
- **User Sessions**: Tracked in Supabase

---

## 🔒 Security Best Practices

### Input Validation
```typescript
// Sanitize user input
const sanitizedText = text.trim().slice(0, 10000)

// Validate email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  return NextResponse.json({ error: "Invalid email" }, { status: 400 })
}
```

### Password Security
```typescript
import bcrypt from "bcryptjs"

// Hash password
const hashedPassword = await bcrypt.hash(password, 10)

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword)
```

### JWT Security
```typescript
// Generate token with expiration
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET!,
  { expiresIn: "7d" }
)

// Verify token
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET!)
} catch {
  // Token expired or invalid
}
```

### Environment Variables
- Never commit `.env.local` to Git
- Use different keys for dev/prod
- Rotate secrets regularly

---

## 📝 Summary

This architecture provides:
- ✅ **Scalable**: Serverless functions scale automatically
- ✅ **Secure**: JWT auth, input validation, password hashing
- ✅ **Fast**: Edge deployment, code splitting, caching
- ✅ **Maintainable**: Clear separation of concerns, TypeScript
- ✅ **User-friendly**: SSR for SEO, smooth animations, responsive design

The system is production-ready and can handle thousands of concurrent users with proper monitoring and scaling configurations.
