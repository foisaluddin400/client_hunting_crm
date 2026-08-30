"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/context/toast-context";
import { Save, StickyNote, Clock } from "lucide-react";

// Dynamically import JoditEditor to prevent SSR window reference errors
const JoditEditor = dynamic(() => import("jodit-react"), {
  ssr: false,
  loading: () => (
    <div className="h-[520px] w-full bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2.5 text-slate-400">
        <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium">Loading rich text editor...</span>
      </div>
    </div>
  ),
});

export default function NotesPage() {
  const editor = useRef(null);
  const { showToast } = useToast();

  const [content, setContent] = useState("");
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Load user's saved notes from MongoDB on mount
  useEffect(() => {
    let isMounted = true;
    async function loadNotes() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/notes");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setContent(data.content || "");
            if (data.updatedAt) {
              setLastSavedTime(
                new Date(data.updatedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  month: "short",
                  day: "numeric",
                })
              );
            }
          }
        } else if (res.status === 401) {
          window.location.href = "/login";
        }
      } catch (err: any) {
        console.error("Failed to load notes:", err);
        showToast({
          type: "error",
          title: "Failed to load notes",
          message: "Could not retrieve your saved notes from the database.",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setInitialLoaded(true);
        }
      }
    }

    loadNotes();
    return () => {
      isMounted = false;
    };
  }, [showToast]);

  // Handle Save / Update
  const handleUpdate = async () => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update notes.");
      }

      setLastSavedTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          month: "short",
          day: "numeric",
        })
      );

      showToast({
        type: "success",
        title: "Notes Updated 📝",
        message: "Your notes have been saved successfully to the database.",
      });
    } catch (err: any) {
      console.error("Save notes error:", err);
      showToast({
        type: "error",
        title: "Update Failed",
        message: err.message || "An error occurred while saving your notes.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Jodit Editor Configuration
  const config = useMemo(
    () => ({
      readonly: false,
      placeholder:
        "Start typing your client hunting notes, call scripts, outreach playbooks, or reminders here...",
      minHeight: 520,
      height: 600,
      theme: "default",
      toolbarButtonSize: "middle" as const,
      buttons: [
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "|",
        "ul",
        "ol",
        "|",
        "font",
        "fontsize",
        "paragraph",
        "lineHeight",
        "|",
        "table",
        "link",
        "image",
        "hr",
        "|",
        "align",
        "undo",
        "redo",
        "|",
        "source",
        "fullsize",
      ],
      uploader: {
        insertImageAsBase64URI: true,
      },
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      defaultActionOnPaste: "insert_clear_html" as const,
      statusbar: true,
      showCharsCounter: true,
      showWordsCounter: true,
      showXPathInStatusbar: false,
    }),
    []
  );

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
            <StickyNote className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Personal Notes
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Persistent workspace scratchpad for strategies, call transcripts, and lead hunting records.
            </p>
          </div>
        </div>

        {/* Action Area: Last Saved indicator + Update Button */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {lastSavedTime && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Saved: {lastSavedTime}</span>
            </div>
          )}

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleUpdate}
            isLoading={isSaving}
            disabled={isLoading}
            leftIcon={<Save className="w-4 h-4" />}
            className="font-bold shadow-sm shadow-indigo-500/20 px-5"
          >
            Update
          </Button>
        </div>
      </div>

      {/* Editor Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden p-4 sm:p-6">
        {isLoading && !initialLoaded ? (
          <div className="h-[520px] w-full bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium">Loading your notes...</span>
            </div>
          </div>
        ) : (
          <div className="jodit-notes-wrapper">
            <JoditEditor
              ref={editor}
              value={content}
              config={config}
              onBlur={(newContent) => setContent(newContent)}
              onChange={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}
