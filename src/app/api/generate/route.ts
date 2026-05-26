import { NextRequest, NextResponse } from "next/server";

const MIMO_API_URL = process.env.MIMO_API_URL || "http://localhost:19911/v1/chat/completions";
const MIMO_API_KEY = process.env.MIMO_API_KEY || "";

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

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (MIMO_API_KEY) {
      headers["Authorization"] = `Bearer ${MIMO_API_KEY}`;
    }

    const response = await fetch(MIMO_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "mimo-v2.5-pro",
        messages: [systemMessage, userMessage],
        temperature: 0.5,
        max_tokens: 4096,
        stream: false,
      }),
    });

    if (!response.ok) {
      const fallback = buildFallbackQuiz(material, Number(numQuestions) || 5, quizType || "mixed");
      return NextResponse.json({ questions: fallback, source: "fallback" });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    const questions = parseQuizQuestions(content);
    if (!questions.length) {
      return NextResponse.json({
        questions: buildFallbackQuiz(material, Number(numQuestions) || 5, quizType || "mixed"),
        source: "fallback",
      });
    }

    return NextResponse.json({ questions, source: "mimo" });
  } catch (error) {
    console.error("Quiz generation failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function parseQuizQuestions(content: string) {
  try {
    const cleaned = content
      .replace(/```json\s*/g, "")
      .replace(/```/g, "")
      .trim();
    const first = cleaned.indexOf("[");
    const last = cleaned.lastIndexOf("]");
    const jsonText = first !== -1 && last !== -1 ? cleaned.slice(first, last + 1) : cleaned;
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((q) => q && typeof q.question === "string")
      .map((q) => {
        const type = ["multiple-choice", "true-false", "short-answer"].includes(q.type)
          ? q.type
          : Array.isArray(q.options) && q.options.length === 2
            ? "true-false"
            : "multiple-choice";
        const options = type === "true-false" ? ["True", "False"] : Array.isArray(q.options) ? q.options.slice(0, 4) : [];
        return {
          question: q.question,
          type,
          options: type === "short-answer" ? [] : options,
          correct: String(q.correct || options[0] || ""),
          explanation: String(q.explanation || "This answer follows from the study material."),
        };
      });
  } catch {
    return [];
  }
}

function buildFallbackQuiz(material: string, count: number, quizType: string) {
  const sentences = material
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
  const seed = sentences.length ? sentences : [material.slice(0, 160) || "This study material introduces important concepts."];
  const total = Math.min(Math.max(count, 3), 10);

  return Array.from({ length: total }, (_, index) => {
    const sentence = seed[index % seed.length];
    const type = quizType === "true-false" ? "true-false" : quizType === "short-answer" ? "short-answer" : "multiple-choice";

    if (type === "true-false") {
      return {
        question: `True or False: ${sentence}`,
        type,
        options: ["True", "False"],
        correct: "True",
        explanation: "This statement is taken directly from the provided study material.",
      };
    }

    if (type === "short-answer") {
      return {
        question: `Explain the main idea from this note: "${sentence}"`,
        type,
        options: [],
        correct: sentence.split(" ").slice(0, 8).join(" "),
        explanation: "A strong answer should restate the key concept in your own words.",
      };
    }

    return {
      question: `Which statement best matches the study material?`,
      type: "multiple-choice",
      options: [
        sentence,
        "The material says the opposite of this point.",
        "This topic is unrelated to the provided notes.",
        "The notes do not contain any actionable information.",
      ],
      correct: sentence,
      explanation: "The correct option is the statement grounded in the provided study material.",
    };
  });
}
