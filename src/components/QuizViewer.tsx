"use client";

import React, { useState, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SubChapter } from "@/data/syllabus";
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  BookOpen,
} from "lucide-react";

export interface Question {
  id: number;
  question: string;
  type: "single" | "true_false";
  options: string[];
  correctAnswer: number; // index 0-3
  explanation: string;
  examTip?: string;
}

interface QuizViewerProps {
  subjectCode: string;
  subChapter: SubChapter | null;
  onOpenStudyNotes?: (topic: string) => void;
}

// Active Free-Tier Gemini Models
const FREE_GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

// Active Free-Tier Groq Models
const FREE_GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
];

export function QuizViewer({
  subjectCode,
  subChapter,
  onOpenStudyNotes,
}: QuizViewerProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [mode, setMode] = useState<"practice" | "exam">("practice");
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes timer for exam mode
  const [timerActive, setTimerActive] = useState<boolean>(false);

  useEffect(() => {
    if (subChapter) {
      generateQuiz(subChapter);
    }
  }, [subChapter]);

  // Exam Mode Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerActive && timeLeft > 0 && !quizSubmitted) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive && !quizSubmitted) {
      handleSubmitQuiz();
    }
    return () => clearInterval(timer);
  }, [timerActive, timeLeft, quizSubmitted]);

  const fetchGroqQuiz = async (
    modelName: string,
    prompt: string,
    apiKey: string
  ): Promise<string> => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: "system",
            content:
              "You are an ACCA exam writer. Return valid JSON only. Do not add markdown formatting outside the JSON object.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(
        `Groq [${modelName}] failed (${res.status}): ${
          errData?.error?.message || res.statusText
        }`
      );
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  };

  const generateQuiz = async (targetSubChapter: SubChapter) => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    setCurrentIndex(0);
    setUserAnswers({});
    setQuizSubmitted(false);
    setTimeLeft(300);
    setTimerActive(false);

    const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

    const prompt = `Generate 5 multiple-choice questions for ACCA subject ${subjectCode}, topic: "${targetSubChapter.title}".

Format output strictly as JSON with this exact structure:
{
  "questions": [
    {
      "id": 1,
      "question": "Clear question text here?",
      "type": "single",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Detailed rationale explaining why Option A is right and others are incorrect.",
      "examTip": "A key ACCA exam tip related to this concept."
    }
  ]
}
Ensure 'correctAnswer' is an integer index (0 to 3) representing the correct option from 'options'.`;

    const parseQuestions = (jsonStr: string): Question[] => {
      try {
        const cleanJson = jsonStr
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();
        const parsed = JSON.parse(cleanJson);
        return parsed.questions || parsed;
      } catch (e) {
        throw new Error("Failed to parse AI quiz response into valid JSON.");
      }
    };

    // 1. Try Gemini Models
    if (geminiApiKey) {
      const genAI = new GoogleGenerativeAI(geminiApiKey);

      for (const modelName of FREE_GEMINI_MODELS) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: "application/json" },
          });
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          const parsedQs = parseQuestions(text);

          if (parsedQs && parsedQs.length > 0) {
            setQuestions(parsedQs);
            setLoading(false);
            if (mode === "exam") setTimerActive(true);
            return;
          }
        } catch (err: any) {
          console.warn(`Gemini model [${modelName}] failed:`, err?.message || err);
        }
      }
    }

    // 2. Fallback to Groq Models
    if (groqApiKey) {
      for (const modelName of FREE_GROQ_MODELS) {
        try {
          const text = await fetchGroqQuiz(modelName, prompt, groqApiKey);
          const parsedQs = parseQuestions(text);

          if (parsedQs && parsedQs.length > 0) {
            setQuestions(parsedQs);
            setLoading(false);
            if (mode === "exam") setTimerActive(true);
            return;
          }
        } catch (err: any) {
          console.warn(`Groq model [${modelName}] failed:`, err?.message || err);
        }
      }
    }

    setLoading(false);
    setError(
      "Failed to generate quiz questions. Please check your API key permissions in .env.local or try refreshing."
    );
  };

  const handleSelectOption = (optionIndex: number) => {
    if (quizSubmitted && mode === "exam") return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
  };

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true);
    setTimerActive(false);
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) score++;
    });
    return score;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (!subChapter) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20">
        <Award className="w-12 h-12 mb-3 text-slate-600" />
        <p className="text-sm font-medium">Select a chapter from the sidebar to take a quiz.</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isAnswered = userAnswers[currentIndex] !== undefined;
  const score = calculateScore();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              {subjectCode} Quiz
            </span>
            <span className="text-xs text-slate-400 font-medium">{subChapter.title}</span>
          </div>
        </div>

        {/* Mode Selector & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => {
                setMode("practice");
                setTimerActive(false);
              }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                mode === "practice"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Practice
            </button>
            <button
              onClick={() => {
                setMode("exam");
                if (!quizSubmitted && questions.length > 0) setTimerActive(true);
              }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                mode === "exam"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Exam Mode
            </button>
          </div>

          <button
            onClick={() => generateQuiz(subChapter)}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
          <p className="text-xs font-medium">Generating ACCA exam questions...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs leading-relaxed">
          <p className="font-bold mb-1">Quiz Load Error:</p>
          <p>{error}</p>
        </div>
      ) : quizSubmitted ? (
        /* Results Summary Screen */
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Quiz Complete!</h3>
            <p className="text-slate-400 text-xs">
              You scored <span className="text-indigo-400 font-bold text-sm">{score}</span> out of{" "}
              <span className="font-bold text-sm">{questions.length}</span> (
              {Math.round((score / questions.length) * 100)}%)
            </p>
          </div>

          {/* Detailed Question Review */}
          <div className="space-y-4 divide-y divide-slate-800/60">
            {questions.map((q, qIdx) => {
              const uAns = userAnswers[qIdx];
              const isCorrect = uAns === q.correctAnswer;
              return (
                <div key={q.id} className="pt-4 space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <span className="font-semibold text-slate-200">
                      Q{qIdx + 1}. {q.question}
                    </span>
                  </div>

                  <div className="pl-6 space-y-1">
                    <p className="text-slate-400">
                      Your answer:{" "}
                      <span className={isCorrect ? "text-emerald-400" : "text-rose-400"}>
                        {uAns !== undefined ? q.options[uAns] : "Not answered"}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="text-slate-300">
                        Correct answer:{" "}
                        <span className="text-emerald-400 font-medium">
                          {q.options[q.correctAnswer]}
                        </span>
                      </p>
                    )}
                    <p className="text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800 mt-2">
                      <strong className="text-slate-300">Explanation: </strong>
                      {q.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            {onOpenStudyNotes && (
              <button
                onClick={() => onOpenStudyNotes(subChapter.title)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Review Study Notes</span>
              </button>
            )}

            <button
              onClick={() => generateQuiz(subChapter)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Quiz</span>
            </button>
          </div>
        </div>
      ) : (
        /* Active Question Display */
        questions.length > 0 && (
          <div className="space-y-6">
            {/* Header / Progress Status */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                Question <strong className="text-indigo-400">{currentIndex + 1}</strong> of{" "}
                {questions.length}
              </span>

              {mode === "exam" && (
                <div className="flex items-center gap-1.5 text-amber-400 bg-amber-950/30 px-2.5 py-1 rounded-md border border-amber-800/40 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              )}
            </div>

            {/* Question Card */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              <h3 className="text-base font-semibold text-slate-100 leading-relaxed">
                {currentQ.question}
              </h3>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = userAnswers[currentIndex] === optIdx;
                  const isCorrect = currentQ.correctAnswer === optIdx;

                  let optionStyle =
                    "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700";

                  if (mode === "practice" && isAnswered) {
                    if (isCorrect) {
                      optionStyle =
                        "bg-emerald-950/40 border-emerald-600/60 text-emerald-200 font-medium";
                    } else if (isSelected && !isCorrect) {
                      optionStyle = "bg-rose-950/40 border-rose-600/60 text-rose-200";
                    }
                  } else if (isSelected) {
                    optionStyle = "bg-indigo-950/50 border-indigo-500 text-indigo-200 font-medium";
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs leading-relaxed transition flex items-start gap-3 ${optionStyle}`}
                    >
                      <span className="font-semibold text-slate-400 shrink-0">
                        {String.fromCharCode(65 + optIdx)}.
                      </span>
                      <span className="flex-1">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Practice Mode Rationale */}
              {mode === "practice" && isAnswered && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-indigo-400">
                    <HelpCircle className="w-4 h-4" />
                    <span>Explanation & Exam Rationale</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{currentQ.explanation}</p>
                  {currentQ.examTip && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 text-amber-300/90 italic">
                      <strong>Exam Tip: </strong>
                      {currentQ.examTip}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-medium transition"
              >
                Previous
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}