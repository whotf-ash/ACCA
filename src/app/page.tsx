"use client";

import React, { useState } from "react";
import { syllabusData, SubChapter, Subject } from "@/data/syllabus";
import { StudyViewer } from "@/components/StudyViewer";
import { QuizViewer } from "@/components/QuizViewer";
import { NotesViewer } from "@/components/NotesViewer";
import {
  BookOpen,
  HelpCircle,
  FileText,
  Bookmark,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

type NavTab = "study" | "quiz" | "notes" | "vault";

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>("study");
  const [activeSubjectCode, setActiveSubjectCode] = useState<string>("BT");

  // Get active subject object from syllabus array
  const currentSubject: Subject | undefined =
    syllabusData.find((s) => s.code === activeSubjectCode) || syllabusData[0];

  // Default selection to first subchapter of the active subject
  const [selectedSubChapter, setSelectedSubChapter] =
    useState<SubChapter | null>(
      currentSubject?.chapters?.[0]?.subChapters?.[0] || null
    );

  const [studyCache, setStudyCache] = useState<Record<string, string>>({});
  const [expandedChapters, setExpandedChapters] = useState<
    Record<string, boolean>
  >({
    [currentSubject?.chapters?.[0]?.id || ""]: true,
  });

  const handleSaveToCache = (subChapterId: string, content: string) => {
    setStudyCache((prev) => ({ ...prev, [subChapterId]: content }));
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const handleSubjectChange = (subjectCode: string) => {
    setActiveSubjectCode(subjectCode);
    const newSubject = syllabusData.find((s) => s.code === subjectCode);
    if (newSubject) {
      const firstChapter = newSubject.chapters[0];
      const firstSubChapter = firstChapter?.subChapters[0] || null;
      setSelectedSubChapter(firstSubChapter);
      if (firstChapter) {
        setExpandedChapters((prev) => ({ ...prev, [firstChapter.id]: true }));
      }
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
        {/* App Title Header */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-100">ACCA Mastery</h1>
            <p className="text-[11px] text-slate-400">Study Hub & AI Assistant</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1 p-2 border-b border-slate-800 bg-slate-950/50">
          <button
            onClick={() => setActiveTab("study")}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-medium transition ${
              activeTab === "study"
                ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Study</span>
          </button>
          <button
            onClick={() => setActiveTab("quiz")}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-medium transition ${
              activeTab === "quiz"
                ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Quiz</span>
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-medium transition ${
              activeTab === "notes"
                ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Notes</span>
          </button>
          <button
            onClick={() => setActiveTab("vault")}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-medium transition ${
              activeTab === "vault"
                ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Vault</span>
          </button>
        </div>

        {/* Subject Selectors */}
        <div className="flex gap-2 p-3 border-b border-slate-800">
          {syllabusData.map((subject) => (
            <button
              key={subject.code}
              onClick={() => handleSubjectChange(subject.code)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                activeSubjectCode === subject.code
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {subject.code}
            </button>
          ))}
        </div>

        {/* Syllabus Accordion */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
          {currentSubject?.chapters.map((chapter) => {
            const isExpanded = expandedChapters[chapter.id];
            return (
              <div
                key={chapter.id}
                className="rounded-xl border border-slate-800/80 bg-slate-900/40 overflow-hidden transition"
              >
                {/* Chapter Title Bar */}
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className="w-full p-2.5 text-left font-semibold text-slate-300 hover:text-indigo-300 flex items-start justify-between gap-2 transition"
                >
                  <span className="leading-snug">
                    <span className="text-indigo-400 font-bold mr-1.5">
                      {chapter.code}.
                    </span>
                    {chapter.title}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  )}
                </button>

                {/* SubChapter Items */}
                {isExpanded && (
                  <div className="px-1.5 pb-2 space-y-1 border-t border-slate-800/50 pt-1.5">
                    {chapter.subChapters.map((sub) => {
                      const isSelected = selectedSubChapter?.id === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => setSelectedSubChapter(sub)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition leading-normal ${
                            isSelected
                              ? "bg-indigo-600/25 text-indigo-200 border border-indigo-500/40 font-medium"
                              : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                          }`}
                        >
                          {sub.title}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 bg-slate-950">
        {activeTab === "study" && (
          <StudyViewer
            subjectCode={activeSubjectCode}
            subChapter={selectedSubChapter}
            cache={studyCache}
            onSaveToCache={handleSaveToCache}
            onOpenChatWithTopic={() => {}}
            onStartQuizForTopic={() => setActiveTab("quiz")}
          />
        )}

        {activeTab === "quiz" && (
          <QuizViewer
            subjectCode={activeSubjectCode}
            subChapter={selectedSubChapter}
            onOpenStudyNotes={() => setActiveTab("study")}
          />
        )}

        {activeTab === "notes" && (
          <NotesViewer
            subjectCode={activeSubjectCode}
            subChapter={selectedSubChapter}
            onStartQuiz={() => setActiveTab("quiz")}
          />
        )}

        {activeTab === "vault" && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20">
            <Bookmark className="w-12 h-12 mb-3 text-slate-600" />
            <p className="text-sm font-medium">Vault module coming next.</p>
          </div>
        )}
      </main>
    </div>
  );
}