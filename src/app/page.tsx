"use client";

import { useState } from "react";
import {
  Brain,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Trophy,
  BookOpen,
  Zap,
  Target,
  Loader2,
  Lightbulb,
} from "lucide-react";

interface Question {
  question: string;
  type: "multiple-choice" | "true-false" | "short-answer";
  options: string[];
  correct: string;
  explanation: string;
}

type QuizState = "input" | "loading" | "quiz" | "results";

const QUESTION_COUNTS = [5, 10, 15, 20];
const DIFFICULTIES = ["easy", "medium", "hard"];
const QUIZ_TYPES = [
  { id: "mixed", label: "Mixed", icon: Zap },
  { id: "multiple-choice", label: "Multiple Choice", icon: Target },
  { id: "true-false", label: "True / False", icon: CheckCircle2 },
  { id: "short-answer", label: "Short Answer", icon: BookOpen },
];

const SAMPLE_QUIZ: Question[] = [
  {
    question: "Which planet in our solar system is known as the 'Red Planet'?",
    type: "multiple-choice",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correct: "Mars",
    explanation: "Mars is called the Red Planet because of iron oxide (rust) on its surface, which gives it a reddish appearance.",
  },
  {
    question: "The Sun is primarily composed of hydrogen and helium.",
    type: "true-false",
    options: ["True", "False"],
    correct: "True",
    explanation: "The Sun is about 73% hydrogen and 25% helium by mass. These elements fuel nuclear fusion in its core.",
  },
  {
    question: "What is the largest planet in our solar system?",
    type: "short-answer",
    options: [],
    correct: "Jupiter",
    explanation: "Jupiter is the largest planet, with a mass more than twice that of all other planets combined.",
  },
  {
    question: "Which planet has the most known moons in the solar system?",
    type: "multiple-choice",
    options: ["Jupiter", "Saturn", "Uranus", "Neptune"],
    correct: "Saturn",
    explanation: "Saturn has over 140 known moons, surpassing Jupiter's count as of recent discoveries.",
  },
  {
    question: "The asteroid belt is located between the orbits of Mars and Jupiter.",
    type: "true-false",
    options: ["True", "False"],
    correct: "True",
    explanation: "The main asteroid belt lies between Mars and Jupiter, containing millions of rocky objects orbiting the Sun.",
  },
];

export default function Home() {
  const [material, setMaterial] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [quizType, setQuizType] = useState("mixed");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showAnswer, setShowAnswer] = useState(false);
  const [state, setState] = useState<QuizState>("input");
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!material.trim()) return;
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material, numQuestions, quizType, difficulty }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setState("input");
      } else if (!data.questions?.length) {
        setError("No questions generated. Try different material.");
        setState("input");
      } else {
        setQuestions(data.questions);
        setCurrentQ(0);
        setAnswers({});
        setShowAnswer(false);
        setState("quiz");
      }
    } catch {
      setError("Network error. Please try again.");
      setState("input");
    }
  };

  const handleExample = () => {
    setMaterial(
      "The Solar System consists of the Sun and the celestial bodies bound to it by gravity, including eight planets, their moons, dwarf planets, asteroids, and comets. The four inner planets — Mercury, Venus, Earth, and Mars — are rocky terrestrial worlds, while the outer four — Jupiter, Saturn, Uranus, and Neptune — are massive gas and ice giants. The Sun itself contains about 99.86% of the total mass of the Solar System and provides the energy that sustains life on Earth."
    );
    setNumQuestions(5);
    setDifficulty("medium");
    setQuizType("mixed");
    setQuestions(SAMPLE_QUIZ);
    setCurrentQ(0);
    setAnswers({});
    setShowAnswer(false);
    setState("quiz");
  };

  const handleAnswer = (answer: string) => {
    if (showAnswer) return;
    setAnswers((prev) => ({ ...prev, [currentQ]: answer }));
    setShowAnswer(true);
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((prev) => prev + 1);
      setShowAnswer(false);
    } else {
      setState("results");
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) {
      setCurrentQ((prev) => prev - 1);
      setShowAnswer(!!answers[currentQ - 1]);
    }
  };

  const handleReset = () => {
    setMaterial("");
    setQuestions([]);
    setAnswers({});
    setCurrentQ(0);
    setShowAnswer(false);
    setState("input");
    setError("");
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentQ(0);
    setShowAnswer(false);
    setState("quiz");
  };

  const getScore = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i]?.toLowerCase().trim() === q.correct.toLowerCase().trim()) {
        correct++;
      }
    });
    return correct;
  };

  const getPercentage = () => {
    return questions.length > 0 ? Math.round((getScore() / questions.length) * 100) : 0;
  };

  // INPUT STATE
  if (state === "input") {
    return (
      <main className="min-h-screen px-4 py-8 md:px-8">
        <header className="max-w-4xl mx-auto mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Brain className="w-10 h-10" style={{ color: "var(--accent-cyan)" }} />
            <h1 className="text-4xl md:text-5xl font-extrabold gradient-text">QuizMaster</h1>
          </div>
          <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
            AI Quiz Generator — Turn any material into a quiz
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <Sparkles className="w-4 h-4" style={{ color: "var(--accent-glow)" }} />
            <span>Generated by MiMo v2.5 Pro</span>
          </div>
        </header>

        <div className="max-w-4xl mx-auto space-y-5">
          {/* Try Example Button */}
          <button
            onClick={handleExample}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01]"
            style={{
              border: "2px dashed var(--accent-cyan)",
              background: "rgba(6, 182, 212, 0.06)",
              color: "var(--accent-cyan)",
            }}
          >
            ⚡ Try Example — Solar System Quiz
          </button>

          {/* Material Input */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              📚 Study Material
            </h2>
            <textarea
              className="input-field"
              placeholder="Paste your study material here... (textbook chapter, lecture notes, article, etc.)"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              rows={6}
            />
          </div>

          {/* Settings */}
          <div className="glass-card p-6 space-y-5">
            {/* Quiz Type */}
            <div>
              <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                📝 Quiz Type
              </h2>
              <div className="flex flex-wrap gap-2">
                {QUIZ_TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setQuizType(t.id)}
                      className={`quiz-tab flex items-center gap-2 ${quizType === t.id ? "active" : ""}`}
                    >
                      <Icon className="w-4 h-4" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Number of Questions */}
            <div>
              <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                🔢 Number of Questions
              </h2>
              <div className="flex gap-2">
                {QUESTION_COUNTS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setNumQuestions(n)}
                    className={`quiz-tab ${numQuestions === n ? "active" : ""}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                🎯 Difficulty
              </h2>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`quiz-tab capitalize ${difficulty === d ? "active" : ""}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="glass-card p-4" style={{ borderColor: "var(--wrong)" }}>
              <p className="text-sm" style={{ color: "var(--wrong)" }}>{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <button
            className="glow-button w-full flex items-center justify-center gap-2 text-base"
            onClick={handleGenerate}
            disabled={!material.trim()}
          >
            <Sparkles className="w-5 h-5" />
            <span>Generate Quiz</span>
          </button>
        </div>

        <footer className="max-w-4xl mx-auto mt-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          QuizMaster — Generated by MiMo v2.5 Pro
        </footer>
      </main>
    );
  }

  // LOADING STATE
  if (state === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-10 text-center max-w-md fade-in">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: "var(--accent-cyan)" }} />
          <h2 className="text-xl font-bold gradient-text mb-2">Generating Quiz...</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Analyzing your material and crafting {numQuestions} questions
          </p>
        </div>
      </main>
    );
  }

  // RESULTS STATE
  if (state === "results") {
    const score = getScore();
    const pct = getPercentage();
    return (
      <main className="min-h-screen px-4 py-8 md:px-8">
        <div className="max-w-2xl mx-auto text-center fade-in">
          <div className="glass-card p-8 mb-6">
            <Trophy className="w-16 h-16 mx-auto mb-4" style={{ color: pct >= 70 ? "var(--correct)" : pct >= 40 ? "#f59e0b" : "var(--wrong)" }} />
            <h2 className="text-3xl font-extrabold gradient-text mb-2">Quiz Complete!</h2>

            <div className="score-ring mx-auto my-6">
              <span className="text-3xl font-extrabold" style={{ color: "var(--accent-cyan)" }}>{pct}%</span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{score}/{questions.length}</span>
            </div>

            <p className="text-lg mb-2" style={{ color: "var(--text-secondary)" }}>
              {pct >= 80 ? "🎉 Excellent! Outstanding performance!" :
               pct >= 60 ? "👍 Good job! Keep studying!" :
               pct >= 40 ? "📚 Not bad, but room for improvement." :
               "💪 Keep practicing, you'll get there!"}
            </p>
          </div>

          {/* Review Answers */}
          <div className="space-y-3 mb-6 text-left">
            {questions.map((q, i) => {
              const userAnswer = answers[i] || "No answer";
              const isCorrect = userAnswer.toLowerCase().trim() === q.correct.toLowerCase().trim();
              return (
                <div key={i} className="glass-card p-4">
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--correct)" }} />
                    ) : (
                      <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--wrong)" }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                        Q{i + 1}: {q.question}
                      </p>
                      <p className="text-xs" style={{ color: isCorrect ? "var(--correct)" : "var(--wrong)" }}>
                        Your answer: {userAnswer}
                      </p>
                      {!isCorrect && (
                        <p className="text-xs" style={{ color: "var(--correct)" }}>
                          Correct: {q.correct}
                        </p>
                      )}
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                        💡 {q.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={handleRetry} className="glow-button flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Retry Quiz
            </button>
            <button onClick={handleReset} className="glow-button flex items-center gap-2" style={{ background: "rgba(59,130,246,0.2)", boxShadow: "none" }}>
              <BookOpen className="w-4 h-4" /> New Quiz
            </button>
          </div>
        </div>
      </main>
    );
  }

  // QUIZ STATE
  const q = questions[currentQ];
  const userAnswer = answers[currentQ];
  const isCorrect = userAnswer?.toLowerCase().trim() === q.correct.toLowerCase().trim();

  return (
    <main className="min-h-screen px-4 py-8 md:px-8">
      <div className="max-w-3xl mx-auto fade-in">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="question-counter">
              Question {currentQ + 1} of {questions.length}
            </span>
            <span className="difficulty-badge difficulty-{difficulty}">
              {difficulty}
            </span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: "rgba(59,130,246,0.1)" }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                background: "var(--gradient-accent)",
                width: `${((currentQ + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="glass-card p-6 mb-5">
          <p className="text-lg font-semibold leading-relaxed" style={{ color: "var(--text-primary)" }}>
            {q.question}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-5">
          {q.type === "short-answer" ? (
            <div>
              <input
                className="input-field"
                placeholder="Type your answer..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !showAnswer) {
                    handleAnswer((e.target as HTMLInputElement).value);
                  }
                }}
                disabled={showAnswer}
              />
              {!showAnswer && (
                <button
                  onClick={() => {
                    const input = document.querySelector(".input-field") as HTMLInputElement;
                    if (input?.value) handleAnswer(input.value);
                  }}
                  className="glow-button mt-3 text-sm"
                >
                  Submit Answer
                </button>
              )}
            </div>
          ) : (
            q.options.map((opt, i) => {
              let className = "option-button";
              if (showAnswer) {
                if (opt === q.correct) className += " correct";
                else if (opt === userAnswer && !isCorrect) className += " wrong";
              } else if (opt === userAnswer) {
                className += " selected";
              }

              return (
                <button
                  key={i}
                  className={className}
                  onClick={() => handleAnswer(opt)}
                >
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: "rgba(59,130,246,0.15)", color: "var(--accent-cyan)" }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {showAnswer && opt === q.correct && (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "var(--correct)" }} />
                  )}
                  {showAnswer && opt === userAnswer && !isCorrect && opt !== q.correct && (
                    <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: "var(--wrong)" }} />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Explanation */}
        {showAnswer && (
          <div className="glass-card p-4 mb-5 fade-in" style={{ borderColor: isCorrect ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)" }}>
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#f59e0b" }} />
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: isCorrect ? "var(--correct)" : "var(--wrong)" }}>
                  {isCorrect ? "✅ Correct!" : "❌ Incorrect"}
                </p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {q.explanation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentQ === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: "rgba(59,130,246,0.1)", color: "var(--text-secondary)", opacity: currentQ === 0 ? 0.3 : 1 }}
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <div className="flex items-center gap-1.5">
            {questions.map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: i === currentQ ? "var(--accent-cyan)" : answers[i] ? "var(--accent-blue)" : "rgba(59,130,246,0.2)",
                }}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={!showAnswer}
            className="glow-button flex items-center gap-2 text-sm"
          >
            {currentQ === questions.length - 1 ? "See Results" : "Next"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </main>
  );
}
