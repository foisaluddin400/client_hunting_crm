"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/context/toast-context";
import { Save, StickyNote, Clock, Plus, X, FileText } from "lucide-react";

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

interface NoteItem {
  id: string;
  title: string;
  content: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function NotesPage() {
  const editor = useRef(null);
  const contentRef = useRef<string>("");
  const { showToast } = useToast();

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string>("");
  const [activeTitle, setActiveTitle] = useState<string>("");
  const [activeContent, setActiveContent] = useState<string>("");
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
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
            const loadedNotes: NoteItem[] = Array.isArray(data.notes) ? data.notes : [];
            if (loadedNotes.length > 0) {
              setNotes(loadedNotes);
              const firstNote = loadedNotes[0];
              setActiveNoteId(firstNote.id);
              setActiveTitle(firstNote.title || "Client Hunting");
              setActiveContent(firstNote.content || "");
              contentRef.current = firstNote.content || "";
              if (firstNote.updatedAt) {
                setLastSavedTime(
                  new Date(firstNote.updatedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    month: "short",
                    day: "numeric",
                  })
                );
              }
            } else {
              // Create default fallback note if empty
              const defaultNote: NoteItem = {
                id: "default-note",
                title: "Client Hunting",
                content: data.content || "",
              };
              setNotes([defaultNote]);
              setActiveNoteId(defaultNote.id);
              setActiveTitle(defaultNote.title);
              setActiveContent(defaultNote.content);
              contentRef.current = defaultNote.content || "";
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

  // Handle Tab Switch
  const handleSwitchTab = (targetId: string) => {
    if (targetId === activeNoteId) return;

    const currentText = contentRef.current ?? activeContent;

    // First save the current draft into notes state
    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeNoteId
          ? { ...n, title: activeTitle, content: currentText }
          : n
      )
    );

    // Auto-save previous note draft to backend in background
    if (activeNoteId && activeNoteId !== "default-note") {
      fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeNoteId,
          title: activeTitle.trim() || "Untitled Note",
          content: currentText,
        }),
      }).catch((e) => console.error("Auto-save on tab switch error:", e));
    }

    // Find target note
    const targetNote = notes.find((n) => n.id === targetId);
    if (targetNote) {
      setActiveNoteId(targetNote.id);
      setActiveTitle(targetNote.title || "");
      setActiveContent(targetNote.content || "");
      contentRef.current = targetNote.content || "";
      if (targetNote.updatedAt) {
        setLastSavedTime(
          new Date(targetNote.updatedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            month: "short",
            day: "numeric",
          })
        );
      }
    }
  };

  // Add a new note tab
  const handleAddNewNote = async () => {
    try {
      setIsAddingNote(true);
      const currentText = contentRef.current ?? activeContent;

      // Persist in-flight draft of current active note first
      if (activeNoteId) {
        setNotes((prev) =>
          prev.map((n) =>
            n.id === activeNoteId
              ? { ...n, title: activeTitle, content: currentText }
              : n
          )
        );

        if (activeNoteId !== "default-note") {
          fetch("/api/notes", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: activeNoteId,
              title: activeTitle.trim() || "Untitled Note",
              content: currentText,
            }),
          }).catch((e) => console.error("Auto-save on add note error:", e));
        }
      }

      // Generate next note title (e.g. New Note, New Note 2...)
      let newTitle = "New Note";
      const existingTitles = new Set(notes.map((n) => n.title.toLowerCase().trim()));
      if (existingTitles.has("new note")) {
        let counter = 2;
        while (existingTitles.has(`new note ${counter}`)) {
          counter++;
        }
        newTitle = `New Note ${counter}`;
      }

      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, content: "" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create new note.");
      }

      const createdNote: NoteItem = data.note;
      setNotes((prev) => [...prev, createdNote]);
      setActiveNoteId(createdNote.id);
      setActiveTitle(createdNote.title);
      setActiveContent(createdNote.content || "");
      contentRef.current = createdNote.content || "";
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
        title: "New Note Created",
        message: `Created "${newTitle}" tab.`,
      });
    } catch (err: any) {
      console.error("Create note error:", err);
      showToast({
        type: "error",
        title: "Failed to Add Note",
        message: err.message || "An error occurred while creating a new note.",
      });
    } finally {
      setIsAddingNote(false);
    }
  };

  // Delete a note tab
  const handleDeleteTab = async (noteIdToDelete: string) => {
    const noteToDelete = notes.find((n) => n.id === noteIdToDelete);
    if (!noteToDelete) return;

    if (notes.length <= 1) {
      showToast({
        type: "warning",
        title: "Cannot Delete",
        message: "You must keep at least one note tab.",
      });
      return;
    }

    if (!window.confirm(`Delete "${noteToDelete.title || "this note"}"?`)) {
      return;
    }

    try {
      await fetch(`/api/notes?id=${noteIdToDelete}`, { method: "DELETE" });

      const remainingNotes = notes.filter((n) => n.id !== noteIdToDelete);
      setNotes(remainingNotes);

      // If we deleted the active note, switch to the first remaining
      if (activeNoteId === noteIdToDelete) {
        const nextActive = remainingNotes[0];
        setActiveNoteId(nextActive.id);
        setActiveTitle(nextActive.title);
        setActiveContent(nextActive.content || "");
        contentRef.current = nextActive.content || "";
      }

      showToast({
        type: "info",
        title: "Note Deleted",
        message: `"${noteToDelete.title}" removed.`,
      });
    } catch (err: any) {
      console.error("Delete note error:", err);
      showToast({
        type: "error",
        title: "Failed to delete note",
        message: err.message,
      });
    }
  };

  // Handle Title Input Change (updates both local input and tab strip title)
  const handleTitleChange = (newTitle: string) => {
    setActiveTitle(newTitle);
    setNotes((prev) =>
      prev.map((n) => (n.id === activeNoteId ? { ...n, title: newTitle } : n))
    );
  };

  // Handle Editor Content Change (syncs with local state and ref)
  const handleContentChange = useCallback((newContent: string) => {
    contentRef.current = newContent;
  }, []);

  const handleContentBlur = useCallback((newContent: string) => {
    contentRef.current = newContent;
    setActiveContent(newContent);
    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeNoteId ? { ...n, content: newContent } : n
      )
    );
  }, [activeNoteId]);

  // Handle Save / Update active note to backend
  const handleUpdate = async () => {
    if (!activeNoteId) return;

    const currentText = contentRef.current ?? activeContent;

    try {
      setIsSaving(true);
      const res = await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeNoteId,
          title: activeTitle.trim() || "Untitled Note",
          content: currentText,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error || data?.details || `Failed to update note (Status: ${res.status}).`
        );
      }

      const savedTime = data?.note?.updatedAt
        ? new Date(data.note.updatedAt)
        : new Date();

      setLastSavedTime(
        savedTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          month: "short",
          day: "numeric",
        })
      );

      // Update in notes state
      setNotes((prev) =>
        prev.map((n) =>
          n.id === activeNoteId
            ? {
                ...n,
                title: activeTitle.trim() || "Untitled Note",
                content: currentText,
                updatedAt: savedTime.toISOString(),
              }
            : n
        )
      );

      showToast({
        type: "success",
        title: "Note Saved 📝",
        message: `"${activeTitle.trim() || "Untitled Note"}" saved successfully.`,
      });
    } catch (err: any) {
      console.error("Save note error:", err);
      showToast({
        type: "error",
        title: "Update Failed",
        message: err.message || "An error occurred while saving your note.",
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
      minHeight: 480,
      height: 560,
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
              Multi-document scratchpad for client hunting strategies, call transcripts, and research.
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
            disabled={isLoading || notes.length === 0}
            leftIcon={<Save className="w-4 h-4" />}
            className="font-bold shadow-sm shadow-indigo-500/20 px-5"
          >
            Update
          </Button>
        </div>
      </div>

      {/* Editor Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden p-4 sm:p-6 space-y-5">
        {isLoading && !initialLoaded ? (
          <div className="h-[520px] w-full bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium">Loading your notes...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Multi-Tab Note System Navigation Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-slate-100">
              {notes.map((note) => {
                const isActive = note.id === activeNoteId;
                return (
                  <div
                    key={note.id}
                    className={`group relative flex items-center rounded-xl transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm font-bold"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSwitchTab(note.id)}
                      className="px-3.5 py-2 text-xs flex items-center gap-1.5 truncate max-w-[170px] focus:outline-none"
                    >
                      <StickyNote
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? "text-indigo-200" : "text-slate-400"
                        }`}
                      />
                      <span className="truncate">{note.title || "Untitled Note"}</span>
                    </button>
                    {notes.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTab(note.id);
                        }}
                        className={`p-1 mr-1.5 rounded-md transition-colors ${
                          isActive
                            ? "text-indigo-200 hover:text-white hover:bg-indigo-700"
                            : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        }`}
                        title="Delete note"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* + Add New Note Tab Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddNewNote}
                disabled={isAddingNote}
                leftIcon={<Plus className="w-3.5 h-3.5 text-indigo-600" />}
                className="rounded-xl text-xs font-bold text-indigo-600 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 shrink-0 h-[34px] px-3"
              >
                Add
              </Button>
            </div>

            {/* Note Title Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Note Title
              </label>
              <div className="relative flex items-center">
                <FileText className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={activeTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Client Hunting, Website Ideas, Development Tasks..."
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            {/* Jodit Editor Container with Key for Clean Tab Isolation */}
            <div className="jodit-notes-wrapper">
              <JoditEditor
                key={activeNoteId}
                ref={editor}
                value={activeContent}
                config={config}
                onBlur={handleContentBlur}
                onChange={handleContentChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
