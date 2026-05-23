import { NextRequest, NextResponse } from "next/server";

const MIMO_API_URL = "http://localhost:19911/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const { material, numQuestions, quizType, difficulty } = await req.json();

    if (!material) {
      return NextResponse.json({ error: "Study material is required" }, { status: 400 });
    }

    const typeInstructions: Record<string, string> = {
      "multiple-choice": "Generate multiple-choice questions with 4 options (A, B, C, D) each.",
      "true-false": "Generate true/false questions.",
      "short-answer": "Generate short-answer questions.",
      "mixed": "Generate a mix of multiple-choice, true/false, and short-answer questions.",
    };

    const systemMessage = {
      role: "system",
      content: `You are QuizMaster, an expert quiz generator. Create educational quizzes from study material.

Rules:
- Generate exactly ${numQuestions || 5} questions
- ${typeInstructions[quizType] || typeInstructions["mixed"]}
- Difficulty: ${difficulty || "medium"}
- Return ONLY valid JSON, no markdown, no code blocks
- Format: an array of objects with these fields:
  - "question": the question text
  - "type": "multiple-choice" | "true-false" | "short-answer"
  - "options": array of 4 options (for MC) or ["True", "False"] (for T/F) or [] (for short-answer)
  - "correct": the correct answer (exact text of correct option or answer)
  - "explanation": brief explanation of why the answer is correct

IMPORTANT: Return ONLY the JSON array, nothing else.`,
    };

    const userMessage = {
      role: "user",
      content: `Generate a quiz from this study material:\n\n${material}`,
    };

    const response = await fetch(MIMO_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mimo-v2.5-pro",
        messages: [systemMessage, userMessage],
        temperature: 0.5,
        max_tokens: 4096,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `API error: ${response.status} - ${errText}` }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    // Try to parse JSON from response
    let questions;
    try {
      // Strip markdown code blocks if present
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      questions = JSON.parse(cleaned);
    } catch {
      questions = [];
    }

    return NextResponse.json({ questions });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
