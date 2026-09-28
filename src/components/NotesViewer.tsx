"use client";

import React, { useState, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SubChapter } from "@/data/syllabus";
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  Clock,
  Search,
  Bookmark,
  FileText,
  AlertTriangle,
  Lightbulb,
  Check,
  RotateCcw,
} from "lucide-react";

interface NotesViewerProps {
  subjectCode: string;
  subChapter: SubChapter | null;
  onStartQuiz?: () => void;
}

interface NoteSection {
  title: string;
  content: string;
  keyPoints?: string[];
  examTips?: string[];
}

interface StudyNotesData {
  summary: string;
  estimatedReadTime: string;
  keyConcepts: NoteSection[];
  examFocus: {
    highYieldTopics: string[];
    commonPitfalls: string[];
  };
  definitionsAndFormulae: {
    termOrFormula: string;
    definitionOrExplanation: string;
  }[];
  quickCheckQuestions: {
    question: string;
    answer: string;
  }[];
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

export function NotesViewer({
  subjectCode,
  subChapter,
  onStartQuiz,
}: NotesViewerProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<StudyNotesData | null>(null);
  const [activeTab, setActiveTab] = useState<
    "concepts" | "exam" | "definitions" | "questions"
  >("concepts");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isMastered, setIsMastered] = useState<boolean>(false);

  useEffect(() => {
    if (subChapter) {
      setIsMastered(false);
      generateNotes(subChapter);
    }
  }, [subChapter]);

  const fetchGroqNotes = async (
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
              "You are an expert ACCA subject mentor and author. Return valid JSON only with no markdown wrapping.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
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

  const generateNotes = async (targetSubChapter: SubChapter) => {
    setLoading(true);
    setError(null);
    setNotes(null);

    const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

    const prompt = `Generate comprehensive, exam-focused ACCA study notes for Subject: ${subjectCode}, Sub-topic: "${targetSubChapter.title}".

Output MUST strictly follow this JSON schema:
{
  "summary": "High-level overview summary of the sub-chapter (2-3 sentences).",
  "estimatedReadTime": "8 mins",
  "keyConcepts": [
    {
      "title": "Concept Title",
      "content": "Detailed explanation of the concept tailored for ACCA exams.",
      "keyPoints": ["Bullet point 1", "Bullet point 2"],
      "examTips": ["Crucial exam tip regarding this concept."]
    }
  ],
  "examFocus": {
    "highYieldTopics": ["Top examiner focus point 1", "Top examiner focus point 2"],
    "commonPitfalls": ["Common student mistake 1", "Common mistake 2"]
  },
  "definitionsAndFormulae": [
    {
      "termOrFormula": "Term or Formula Name",
      "definitionOrExplanation": "Clear, concise definition or mathematical formula."
    }
  ],
  "quickCheckQuestions": [
    {
      "question": "Short retention check question?",
      "answer": "Concise factual answer."
    }
  ]
}`;

    const parseNotes = (jsonStr: string): StudyNotesData => {
      try {
        const cleanJson = jsonStr
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();
        return JSON.parse(cleanJson);
      } catch (e) {
        throw new Error("Failed to parse study notes response into valid JSON.");
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
          const parsed = parseNotes(text);

          if (parsed && parsed.keyConcepts) {
            setNotes(parsed);
            setLoading(false);
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
          const text = await fetchGroqNotes(modelName, prompt, groqApiKey);
          const parsed = parseNotes(text);

          if (parsed && parsed.keyConcepts) {
            setNotes(parsed);
            setLoading(false);
            return;
          }
        } catch (err: any) {
          console.warn(`Groq model [${modelName}] failed:`, err?.message || err);
        }
      }
    }

    setLoading(false);
    setError(
      "Failed to generate study notes. Please check your API key settings or refresh to retry."
    );
  };

  if (!subChapter) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20">
        <BookOpen className="w-12 h-12 mb-3 text-slate-600" />
        <p className="text-sm font-medium">Select a chapter from the syllabus to open study notes.</p>
      </div>
    );
  }

  const filteredConcepts = notes?.keyConcepts.filter(
    (concept) =>
      concept.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      concept.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              {subjectCode}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Chapter Notes
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">{subChapter.title}</h2>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMastered((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              isMastered
                ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/40"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isMastered ? "Mastered" : "Mark as Mastered"}</span>
          </button>

          <button
            onClick={() => generateNotes(subChapter)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Regenerate</span>
          </button>

          {onStartQuiz && (
            <button
              onClick={onStartQuiz}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Practice Quiz</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
          <p className="text-xs font-medium">Synthesizing ACCA study notes & exam tips...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs leading-relaxed">
          <p className="font-bold mb-1">Notes Generation Error:</p>
          <p>{error}</p>
        </div>
      ) : notes ? (
        <div className="space-y-6">
          {/* Summary Header Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-indigo-400 font-medium">
                <Bookmark className="w-3.5 h-3.5" /> Core Overview
              </span>
              <span className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                <Clock className="w-3 h-3 text-slate-400" />
                {notes.estimatedReadTime} read
              </span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">{notes.summary}</p>
          </div>

          {/* Navigation Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto">
              {[
                { id: "concepts", label: "Key Concepts" },
                { id: "exam", label: "Exam Focus" },
                { id: "definitions", label: "Formulae & Terms" },
                { id: "questions", label: "Quick Check" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filter Input */}
            {activeTab === "concepts" && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter concepts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-48"
                />
              </div>
            )}
          </div>

          {/* Tab 1: Key Concepts */}
          {activeTab === "concepts" && (
            <div className="space-y-4">
              {filteredConcepts && filteredConcepts.length > 0 ? (
                filteredConcepts.map((concept, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3"
                  >
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span className="text-xs bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded border border-indigo-800/50">
                        {idx + 1}
                      </span>
                      {concept.title}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {concept.content}
                    </p>

                    {/* Key Points */}
                    {concept.keyPoints && concept.keyPoints.length > 0 && (
                      <ul className="space-y-1.5 pt-1">
                        {concept.keyPoints.map((pt, pIdx) => (
                          <li
                            key={pIdx}
                            className="flex items-start gap-2 text-xs text-slate-400"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Exam Tips Callout */}
                    {concept.examTips && concept.examTips.length > 0 && (
                      <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-200/90 text-xs space-y-1 mt-2">
                        <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>Examiner Insight</span>
                        </div>
                        {concept.examTips.map((tip, tIdx) => (
                          <p key={tIdx} className="leading-relaxed pl-5">
                            • {tip}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-8">
                  No concepts matching "{searchQuery}"
                </p>
              )}
            </div>
          )}

          {/* Tab 2: Exam Focus */}
          {activeTab === "exam" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* High Yield Topics */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs border-b border-slate-800 pb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>High Yield Topics</span>
                </div>
                <ul className="space-y-2">
                  {notes.examFocus.highYieldTopics.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-300 flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Common Pitfalls */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs border-b border-slate-800 pb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Common Student Pitfalls</span>
                </div>
                <ul className="space-y-2">
                  {notes.examFocus.commonPitfalls.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-300 flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Tab 3: Definitions & Formulae */}
          {activeTab === "definitions" && (
            <div className="grid grid-cols-1 gap-3">
              {notes.definitionsAndFormulae.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <span className="text-xs font-bold text-indigo-300 sm:w-1/3">
                    {item.termOrFormula}
                  </span>
                  <span className="text-xs text-slate-300 sm:w-2/3 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono">
                    {item.definitionOrExplanation}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tab 4: Quick Check Retention Questions */}
          {activeTab === "questions" && (
            <div className="space-y-3">
              {notes.quickCheckQuestions.map((q, idx) => (
                <details
                  key={idx}
                  className="group p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs cursor-pointer transition"
                >
                  <summary className="font-semibold text-slate-200 flex items-center justify-between list-none">
                    <span>
                      Q{idx + 1}. {q.question}
                    </span>
                    <span className="text-indigo-400 text-[10px] group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </summary>
                  <p className="mt-3 pt-3 border-t border-slate-800 text-slate-400 leading-relaxed">
                    <strong className="text-emerald-400">Answer: </strong>
                    {q.answer}
                  </p>
                </details>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}