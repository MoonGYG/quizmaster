# QuizMaster

AI Quiz Generator — Turn any study material into an interactive quiz.

## Features

- 📚 **Material Input**: Paste any text — textbook, notes, articles
- 📝 **4 Quiz Types**: Multiple Choice, True/False, Short Answer, Mixed
- 🎯 **3 Difficulty Levels**: Easy, Medium, Hard
- 🔢 **Flexible Count**: 5, 10, 15, or 20 questions
- ✅ **Interactive Quiz**: Click to answer, see instant feedback
- 💡 **Explanations**: Every answer comes with an explanation
- 📊 **Score Tracking**: Percentage score + review all answers
- 🔄 **Retry**: Take the same quiz again or generate a new one

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS with dark blue/navy gradient theme
- Lucide React icons
- MiMo AI API (no-auth via local proxy)

## Getting Started

```bash
npm run dev
# Open http://localhost:3104
```

## API

POST `/api/generate`

```json
{
  "material": "Your study material text...",
  "numQuestions": 5,
  "quizType": "mixed",
  "difficulty": "medium"
}
```

Quiz types: `multiple-choice`, `true-false`, `short-answer`, `mixed`
Difficulties: `easy`, `medium`, `hard`
