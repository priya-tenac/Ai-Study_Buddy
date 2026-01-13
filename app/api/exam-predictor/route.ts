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
    const syllabus = typeof body.syllabus === "string" ? body.syllabus.trim() : ""
    const pastPapers = typeof body.pastPapers === "string" ? body.pastPapers.trim() : ""
    const examName = typeof body.examName === "string" ? body.examName.trim() : ""

    if (!syllabus && !pastPapers) {
      return NextResponse.json(
        { error: "Please paste your syllabus and/or past paper questions." },
        { status: 400 }
      )
    }

    const chat = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are AI Study Buddy acting as an exam prediction assistant. You analyse official syllabus, past papers and marking patterns. You ONLY return STRICT JSON (no markdown, no backticks, no extra commentary). The JSON must be a single object with fields: overview (string, a short explanation of the pattern you see), strategy (string, how the student should prepare), topics (array of objects), and meta (object). Each item in topics must have: topic (string, a specific area or chapter), reason (string, why it is high probability), probability (number between 0 and 1 representing rough probability of appearance), and sampleQuestions (array of 1-4 short exam-style questions as strings). The meta object must have: caution (string reminding that this is not a guarantee and the student must still cover the full syllabus). Be concrete, exam-focused, and conservative in probability values.",
        },
        {
          role: "user",
          content:
            (examName ? `Exam name: ${examName}.` : "") +
            "\nSyllabus / official topics:\n" +
            (syllabus || "(not provided)") +
            "\n\nPast papers and observed patterns (you may see raw questions, topics, or notes):\n" +
            (pastPapers || "(not provided)") +
            "\n\nFrom this, predict high-probability topics and question angles, with probabilities and sample questions.",
        },
      ],
      temperature: 0.5,
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

      const overview = typeof parsed.overview === "string" ? parsed.overview : ""
      const strategy = typeof parsed.strategy === "string" ? parsed.strategy : ""
      const topics = Array.isArray(parsed.topics) ? parsed.topics : []
      const meta = parsed.meta && typeof parsed.meta === "object" ? parsed.meta : {}

      return NextResponse.json({ overview, strategy, topics, meta })
    } catch (e) {
      console.error("Failed to parse Groq exam predictor JSON response", e, "raw:", raw)
      return NextResponse.json({
        overview: raw,
        strategy: "",
        topics: [],
        meta: { caution: "Predictions could not be fully structured. Treat this as rough guidance only." },
      })
    }
  } catch (err) {
    console.error("Exam predictor error", err)
    return NextResponse.json({ error: "Exam prediction failed" }, { status: 500 })
  }
}
