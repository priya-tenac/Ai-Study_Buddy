import { NextResponse } from "next/server"
import Groq from "groq-sdk"
import jwt from "jsonwebtoken"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

type ChatMessage = {
  role: "user" | "assistant" | "system"
  content: string
}

type Personality = "friendly" | "professional" | "simple" | "detailed" | "motivational"
type Subject = "math" | "science" | "history" | "english" | "programming" | "general"

const PERSONALITIES = {
  friendly: "You are a friendly and encouraging AI tutor. Explain concepts clearly with examples and analogies. Use casual language and emojis occasionally. Break down complex topics into simple, digestible parts. Always check if the student understands before moving forward.",
  professional: "You are a professional academic tutor. Provide structured, clear explanations with proper terminology. Use formal language and cite concepts accurately. Focus on building strong foundational understanding.",
  simple: "You are a patient tutor who explains things in the simplest way possible. Use everyday examples, avoid technical jargon, and relate concepts to real-life situations. Perfect for beginners. Always use analogies and metaphors.",
  detailed: "You are a thorough tutor who provides comprehensive explanations. Include examples, step-by-step breakdowns, multiple perspectives, and visual descriptions. Help students understand the 'why' behind concepts, not just the 'what'.",
  motivational: "You are an inspiring mentor who teaches and motivates. Include study tips, encouragement, and real-world applications. Show students why the topic matters and how it connects to their goals."
}

const SUBJECT_CONTEXTS = {
  math: "Focus on mathematical concepts with clear explanations. Show step-by-step solutions with reasoning for each step. Use visual descriptions (like 'imagine a number line') and relate to practical scenarios. Always explain WHY a formula works, not just HOW to use it.",
  science: "Explain scientific concepts using real-world examples and everyday observations. Use analogies to make complex ideas simple (e.g., 'atoms are like tiny solar systems'). Connect theory to practical applications students can see around them.",
  history: "Tell history as an engaging story with context and connections. Explain cause and effect, show how events relate to each other, and make it relevant to today. Use memorable details and interesting facts to help retention.",
  english: "Help with grammar, literature, and writing by explaining rules with clear examples. Show correct vs incorrect usage. For literature, explain themes and symbolism in relatable terms. Make language learning practical and applicable.",
  programming: "Explain code concepts using simple analogies first, then show code examples. Break down complex logic into small steps. Use comments to explain what each part does. Relate programming concepts to everyday tasks (e.g., 'a loop is like doing dishes - repeat until done').",
  general: "Adapt to any subject. Focus on clarity and understanding. Use examples, analogies, and step-by-step explanations. Always check comprehension and encourage questions."
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.slice("Bearer ".length)
    try {
      const secret = process.env.JWT_SECRET || "dev-secret"
      jwt.verify(token, secret)
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const body = await req.json()
    const messagesInput = (body?.messages || []) as ChatMessage[]
    const rawContext = typeof body?.context === "string" ? (body.context as string) : null
    const personality = (body?.personality || "friendly") as Personality
    const subject = (body?.subject || "general") as Subject
    const generatePractice = body?.generatePractice === true
    const explainDifferently = body?.explainDifferently === true

    if (!Array.isArray(messagesInput) || messagesInput.length === 0) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 })
    }

    const trimmedContext = rawContext ? rawContext.replace(/\s+/g, " ").slice(0, 7000) : ""

    // Build dynamic system prompt
    let systemPrompt = PERSONALITIES[personality] + "\n\n" + SUBJECT_CONTEXTS[subject]

    if (generatePractice) {
      systemPrompt += "\n\nThe student wants practice problems. First, briefly explain the concept they asked about. Then generate 2-3 practice questions with clear instructions. For each question, provide: 1) The problem statement, 2) A hint to guide them, 3) The solution with step-by-step explanation. Make it educational, not just a list."
    }

    if (explainDifferently) {
      systemPrompt += "\n\nThe student didn't understand the previous explanation. Try a COMPLETELY different approach: 1) Use a real-world analogy or metaphor, 2) Explain it like you're talking to a 10-year-old, 3) Use a story or scenario, 4) Draw comparisons to something familiar. Make it crystal clear and engaging."
    }

    const contextInstruction = trimmedContext
      ? "\n\nStudy context from student's materials (use when relevant):\n" + trimmedContext
      : ""

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: systemPrompt + contextInstruction,
      },
      ...messagesInput.map((m): ChatMessage => ({
        role: m.role === "assistant" || m.role === "system" ? m.role : "user",
        content: String(m.content || ""),
      })),
    ]

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages,
      temperature: explainDifferently ? 0.8 : 0.5,
      max_tokens: generatePractice ? 2000 : 1000,
    })

    const reply =
      (completion.choices[0]?.message?.content || "").trim() ||
      "Sorry, I couldn't generate a response."

    return NextResponse.json({ reply, personality, subject })
  } catch (err) {
    console.error("Chat error", err)
    return NextResponse.json({ error: "Chat failed" }, { status: 500 })
  }
}
