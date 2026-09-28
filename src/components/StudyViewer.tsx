"use client";

import React, { useState, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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

// Full Model Preference Lists
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
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

  // Helper to fetch from Groq REST API
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
            content: `You are an expert ACCA tutor for subject ${subjectCode}. Format your responses clearly using structured Markdown with high visual appeal.`,
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

    // Structured Prompt for visual layouts, diagrams, tables, and callouts
    const prompt = `
Create comprehensive, highly visual, and structured study notes for the ACCA ${subjectCode} topic:
"${targetSubChapter.title}"

Format requirements:
1. **Key Concepts & Definitions**: Use Markdown blockquotes (>) for core definitions. Highlight key terms with bold styling.
2. **Visual Flowcharts & Conceptual Maps**: Include detailed ASCII text-based flowcharts inside plain code blocks (\`\`\`...\`\`\`) to explain key processes, hierarchies, or decision trees visually.
3. **Structured Comparison Tables**: Present comparisons, features, pros & cons using clean Markdown tables with header rows.
4. **Exam Focus & Common Pitfalls**: Create callout blocks using blockquotes (>) with bold headers (e.g., "> **1. Key Exam Rule**") to emphasize common student traps and key exam tips.
5. **Practical Example / Case Walkthrough**: Provide a step-by-step practical scenario walkthrough featuring an ASCII timeline or stage diagram (e.g., Stage 1 -> Stage 2 -> Stage 3).

DO NOT output raw LaTeX math expressions unless necessary. Keep formatting clean, well-spaced, and readable.
    `;

    // 1. Try Gemini Models first
    if (geminiApiKey) {
      const genAI = new GoogleGenerativeAI(geminiApiKey);

      for (const modelName of GEMINI_MODELS) {
        try {
          setActiveModel(`Gemini (${modelName})`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const text = result.response.text();

          if (text) {
            setContent(text);
            onSaveToCache(targetSubChapter.id, text);
            setLoading(false);
            return;
          }
        } catch (err: any) {
          console.warn(
            `Gemini model [${modelName}] failed. Trying next model...`,
            err.message
          );
        }
      }
    }

    // 2. Fallback to Groq Models if Gemini attempts failed or key is missing
    if (groqApiKey) {
      for (const modelName of GROQ_MODELS) {
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
          console.warn(
            `Groq model [${modelName}] failed. Trying next model...`,
            err.message
          );
        }
      }
    }

    // 3. If all providers and models failed
    setLoading(false);
    setError(
      "All Gemini and Groq models failed or API keys are missing. Please verify NEXT_PUBLIC_GEMINI_API_KEY and NEXT_PUBLIC_GROQ_API_KEY in your .env.local file."
    );
  };

  if (!subChapter) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 min-h-[400px]">
        <BookOpen className="w-12 h-12 mb-3 text-slate-600" />
        <p className="text-sm font-medium">Select a chapter from the sidebar to start studying.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
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
            Generating study notes with {activeModel || "AI model"}...
          </p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs leading-relaxed">
          <p className="font-bold mb-1">Generation Error:</p>
          <p>{error}</p>
        </div>
      ) : (
        <div className="prose prose-invert prose-indigo max-w-none text-slate-300 text-sm leading-relaxed
                        prose-headings:text-slate-100 prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-lg prose-h2:border-b prose-h2:border-slate-800 prose-h2:pb-2 prose-h3:text-base
                        prose-p:my-3 prose-ul:my-2 prose-li:my-0.5
                        prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-950/20 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-slate-200
                        prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-pre:text-indigo-300 prose-pre:rounded-xl prose-pre:p-4
                        prose-table:border-collapse prose-table:w-full prose-table:my-4 prose-th:border prose-th:border-slate-700 prose-th:bg-slate-800/60 prose-th:p-2.5 prose-th:text-slate-200 prose-td:border prose-td:border-slate-800 prose-td:p-2.5">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}