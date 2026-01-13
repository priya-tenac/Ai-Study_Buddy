
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


    const { text, maxWords, mood, targetLang } = await req.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const wordLimit =
      typeof maxWords === "number" && maxWords > 0 && maxWords <= 400
        ? maxWords
        : 200

    const moodValue =
      mood === "sleepy" || mood === "energized" || mood === "neutral" ? mood : "neutral"

    let moodInstruction = ""
    if (moodValue === "sleepy") {
      moodInstruction =
        "The student feels tired. Use very gentle, encouraging language, keep the difficulty on the easier side, avoid heavy jargon, and add small motivational touches.";
    } else if (moodValue === "energized") {
      moodInstruction =
        "The student feels energized and motivated. You can go a bit deeper, include a few challenging insights, and invite the student to reflect with 1-2 short prompts.";
    } else {
      moodInstruction =
        "Use a balanced, clear teaching style suitable for an average student with neutral energy.";
    }

    let languageInstruction = "";
    if (targetLang && targetLang !== "en") {
      const langMap: Record<string, string> = {
        hi: "Hindi",
        ur: "Urdu",
        es: "Spanish",
        de: "German",
        fr: "French",
        it: "Italian",
        zh: "Chinese",
        ar: "Arabic",
        ru: "Russian",
        ja: "Japanese",
      };
      const langName = langMap[targetLang] || targetLang;
      languageInstruction = ` All output must be in ${langName}.`;
    }

    const chat = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are AI Study Buddy. You must reply with STRICT JSON only (no markdown, no backticks, no extra text). " +
            moodInstruction +
            languageInstruction +
            " The JSON must be a single object with these fields: summary (string, clear explanation for a student, maximum " +
            wordLimit +
            " words), keywords (array of 8-15 short important terms as strings), mcqs (array of objects with fields: question, options, answer, explanation), pptOutline (array of objects with fields: title and bullets where bullets is an array of short strings), mindmap (string), and flashcards (array of objects with fields: front and back where front is a short question or prompt and back is the concise answer or explanation). The mindmap MUST be a creative Mermaid mind-map using 'mindmap' syntax with: a single central node for the main topic, 3-6 big branches for major ideas, and 2-4 sub-branches each. Use short phrases, emojis for categories when helpful, and keep the diagram compact. Example shape (do NOT output this literally): mindmap -> (Topic) -> Branch -> Sub-idea. Respond with JUST the JSON object.",
        },
        {
          role: "user",
          content:
            "Create a study pack (summary, keywords, MCQs, PPT outline, mind map, and flashcards) for this content:\n\n" + text,
        },
      ],
      temperature: 0.4,
    })

    const raw = chat.choices[0]?.message?.content || ""

    try {
      // Clean potential markdown fences and JS-style comments the model might add
      let cleaned = raw.trim()
      if (cleaned.startsWith("```")) {
        const firstBrace = cleaned.indexOf("{")
        const lastBrace = cleaned.lastIndexOf("}")
        cleaned =
          firstBrace !== -1 && lastBrace !== -1
            ? cleaned.slice(firstBrace, lastBrace + 1)
            : cleaned
      }
      // Remove line comments like // ... which break JSON.parse
      cleaned = cleaned.replace(/\/\/.*$/gm, "")

      const jsonStart = cleaned.indexOf("{")
      const jsonEnd = cleaned.lastIndexOf("}")
      const jsonString =
        jsonStart !== -1 && jsonEnd !== -1 ? cleaned.slice(jsonStart, jsonEnd + 1) : cleaned

      const parsed = JSON.parse(jsonString)

      const summary = typeof parsed.summary === "string" ? parsed.summary : raw
      const keywords: string[] = Array.isArray(parsed.keywords)
        ? parsed.keywords.map((k: unknown) => String(k))
        : []
      const mcqs = Array.isArray(parsed.mcqs) ? parsed.mcqs : []
      const pptOutline = Array.isArray(parsed.pptOutline) ? parsed.pptOutline : []
      const mindmap = typeof parsed.mindmap === "string" ? parsed.mindmap : ""
      const flashcards = Array.isArray(parsed.flashcards) ? parsed.flashcards : []

      return NextResponse.json({
        summary,
        keywords,
        mcqs,
        pptOutline,
        mindmap,
        flashcards,
      })
    } catch (e) {
      console.error("Failed to parse Groq JSON response", e, "raw:", raw)
      // Fallback: return the raw AI text as a normal summary so the UI keeps working
      return NextResponse.json({
        summary: raw,
        keywords: [],
        mcqs: [],
        pptOutline: [],
        mindmap: "",
        flashcards: [],
      })
    }
  } catch (err) {
    console.error("Summarization error", err)
    return NextResponse.json(
      { error: "Summarization failed" },
      { status: 500 }
    )
  }
}
