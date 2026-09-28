"use client";

import React, { useState, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SubChapter } from "@/data/syllabus";
import { BookOpen, Sparkles, RefreshCw, MessageSquare, Award } from "lucide-react";

interface StudyViewerProps {
  subjectCode: string;
  subChapter: SubChapter | null;
  cache: Record<string, string>;
  onSaveToCache: (subChapterId: string, content: string) => void;
  onOpenChatWithTopic?: (topic: string) => void;
  onStartQuizForTopic?: (topic: string) => void;
}

// Active Free-Tier Models on Gemini API
const FREE_GEMINI_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-2.0-flash",
];

// Active Free-Tier Models on Groq API
const FREE_GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "llama3-70b-8192",
  "llama3-8b-8192",
];

export function StudyViewer({
  subjectCode,
  subChapter,
  cache,
  onSaveToCache,
  onOpenChatWithTopic,
  onStartQuizForTopic,
}: StudyViewerProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [activeModel, setActiveModel] = useState<string>("");

  useEffect(() => {
    if (!subChapter) return;

    if (cache[subChapter.id]) {
      setContent(cache[subChapter.id]);
      setError(null);
      return;
    }

    generateStudyMaterial(subChapter);
  }, [subChapter]);

  // Helper to fetch from Groq API (Free Tier)
  const fetchGroqResponse = async (
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
            content: `You are an expert ACCA tutor for subject ${subjectCode}.`,
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
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

  const generateStudyMaterial = async (targetSubChapter: SubChapter) => {
    setLoading(true);
    setError(null);

    const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

    const prompt = `
Create comprehensive, clear, and structured study notes for the ACCA ${subjectCode} topic:
"${targetSubChapter.title}"

Format your response cleanly with markdown:
- Key Concepts & Definitions
- Core Theoretical Frameworks / Formulas
- Exam Focus & Common Pitfalls
- A Concise Practical Example
    `;

    // 1. Try Gemini Free Tier Models
    if (geminiApiKey) {
      const genAI = new GoogleGenerativeAI(geminiApiKey);

      for (const modelName of FREE_GEMINI_MODELS) {
        try {
          setActiveModel(`Gemini (${modelName})`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();

          if (text) {
            setContent(text);
            onSaveToCache(targetSubChapter.id, text);
            setLoading(false);
            return;
          }
        } catch (err: any) {
          console.warn(`Gemini model [${modelName}] failed. Trying next free model...`, err?.message || err);
        }
      }
    }

    // 2. Fallback to Groq Free Tier Models
    if (groqApiKey) {
      for (const modelName of FREE_GROQ_MODELS) {
        try {
          setActiveModel(`Groq (${modelName})`);
          const text = await fetchGroqResponse(modelName, prompt, groqApiKey);

          if (text) {
            setContent(text);
            onSaveToCache(targetSubChapter.id, text);
            setLoading(false);
            return;
          }
        } catch (err: any) {
          console.warn(`Groq model [${modelName}] failed. Trying next free model...`, err?.message || err);
        }
      }
    }

    // 3. If all free options fail
    setLoading(false);
    setError(
      "All Gemini and Groq free model attempts failed. Please verify that your API keys are valid and set in .env.local."
    );
  };

  if (!subChapter) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <BookOpen className="w-12 h-12 mb-3 text-slate-600" />
        <p className="text-sm font-medium">Select a chapter from the sidebar to start studying.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              {subjectCode}
            </span>
            {activeModel && !loading && (
              <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                Powered by {activeModel}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-2">{subChapter.title}</h2>
        </div>

        <div className="flex items-center gap-2">
          {onOpenChatWithTopic && (
            <button
              onClick={() => onOpenChatWithTopic(subChapter.title)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Ask AI</span>
            </button>
          )}

          {onStartQuizForTopic && (
            <button
              onClick={() => onStartQuizForTopic(subChapter.title)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              <Award className="w-4 h-4 text-indigo-400" />
              <span>Quiz</span>
            </button>
          )}

          <button
            onClick={() => generateStudyMaterial(subChapter)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Regenerate</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
          <p className="text-xs font-medium">
            Generating study notes with {activeModel || "Free AI model"}...
          </p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs leading-relaxed">
          <p className="font-bold mb-1">Generation Error:</p>
          <p>{error}</p>
        </div>
      ) : (
        <div className="prose prose-invert prose-slate max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      )}
    </div>
  );
}