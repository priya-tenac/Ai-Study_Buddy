import { NextResponse } from "next/server"
import Groq from "groq-sdk"
import jwt from "jsonwebtoken"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

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
    const topic = typeof body.topic === "string" ? body.topic.trim() : ""
    const difficulty = body.difficulty === "easy" || body.difficulty === "medium" || body.difficulty === "hard" ? body.difficulty : "medium"
    const mood = body.mood === "sleepy" || body.mood === "energized" || body.mood === "neutral" ? body.mood : "neutral"
    const numQuestionsRaw = Number(body.numQuestions)
    const numQuestions = Number.isFinite(numQuestionsRaw) ? Math.min(Math.max(Math.round(numQuestionsRaw), 3), 15) : 5

    if (!topic) {
      return NextResponse.json({ error: "Topic or syllabus is required" }, { status: 400 })
    }

    const chat = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are AI Study Buddy creating multiple-choice quiz questions. Respond with STRICT JSON only (no markdown, no backticks). Match your tone to the student's current mood: if they feel sleepy, keep language simple and encouraging and avoid trick questions; if neutral, use a balanced classroom style; if energized, you can include a few more challenging or multi-step conceptual questions. The JSON must be an object with a single field 'questions', which is an array of objects. Each question object must have: question (string), options (array of 4 short strings), answer (string, exactly matching one of options), and explanation (string, short why the answer is correct). Make the questions suitable for a student quiz.",
        },
        {
          role: "user",
          content:
            `Create ${numQuestions} multiple-choice questions for this syllabus or topic, with overall difficulty level '${difficulty}' and with the student's mood set to '${mood}'. Vary questions within that level. Topic / syllabus: ` + topic,
        },
      ],
      temperature: difficulty === "easy" ? 0.5 : difficulty === "medium" ? 0.7 : 0.9,
    })

    const raw = chat.choices[0]?.message?.content || ""

    try {
      let cleaned = raw.trim()
      if (cleaned.startsWith("```")) {
        const firstBrace = cleaned.indexOf("{")
        const lastBrace = cleaned.lastIndexOf("}")
        cleaned =
          firstBrace !== -1 && lastBrace !== -1
            ? cleaned.slice(firstBrace, lastBrace + 1)
            : cleaned
      }
      cleaned = cleaned.replace(/\/\/.*$/gm, "")

      const jsonStart = cleaned.indexOf("{")
      const jsonEnd = cleaned.lastIndexOf("}")
      const jsonString =
        jsonStart !== -1 && jsonEnd !== -1 ? cleaned.slice(jsonStart, jsonEnd + 1) : cleaned

      const parsed = JSON.parse(jsonString)

      const questionsRaw = Array.isArray(parsed.questions) ? parsed.questions : []
      const questions = questionsRaw
        .map((q: any) => {
          if (!q || typeof q !== "object") return null
          const question = typeof q.question === "string" ? q.question : ""
          const options = Array.isArray(q.options) ? q.options.map((o: any) => String(o)) : []
          const answer = typeof q.answer === "string" ? q.answer : ""
          const explanation = typeof q.explanation === "string" ? q.explanation : ""
          if (!question || options.length < 2 || !answer) return null
          if (!options.includes(answer)) options.push(answer)
          return { question, options: options.slice(0, 4), answer, explanation }
        })
        .filter(Boolean)

      if (!questions.length) {
        return NextResponse.json({ error: "Could not generate quiz questions" }, { status: 500 })
      }

      return NextResponse.json({ questions })
    } catch (e) {
      console.error("Failed to parse Groq quiz JSON response", e, "raw:", raw)
      return NextResponse.json({ error: "Quiz generation failed" }, { status: 500 })
    }
  } catch (err) {
    console.error("Quiz generation error", err)
    return NextResponse.json({ error: "Quiz generation failed" }, { status: 500 })
  }
}
