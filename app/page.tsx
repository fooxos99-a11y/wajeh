"use client"

import { useState, useEffect } from "react"
import { CategoriesSidebar } from "@/components/categories-sidebar"
import { NotesGrid } from "@/components/notes-grid"
import { Button } from "@/components/ui/button"
import { Menu, X, StickyNote } from "lucide-react"
import { toast } from "sonner"
import type { Category, NoteWithPoints } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function NotesApp() {
  const [categories, setCategories] = useState<Category[]>([])
  const [notes, setNotes] = useState<NoteWithPoints[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, notesRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/notes"),
        ])

        if (categoriesRes.ok && notesRes.ok) {
          const [categoriesData, notesData] = await Promise.all([
            categoriesRes.json(),
            notesRes.json(),
          ])
          setCategories(categoriesData)
          setNotes(notesData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("حدث خطأ في تحميل البيانات")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleAddCategory = async (name: string, color: string) => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      })
      if (res.ok) {
        const newCategory = await res.json()
        setCategories((prev) => [...prev, newCategory])
        toast.success("تم إضافة التصنيف")
      }
    } catch (error) {
      toast.error("حدث خطأ في إضافة التصنيف")
    }
  }

  const handleUpdateCategory = async (id: string, name: string, color: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      })
      if (res.ok) {
        const updated = await res.json()
        setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)))
        toast.success("تم تحديث التصنيف")
      }
    } catch (error) {
      toast.error("حدث خطأ في تحديث التصنيف")
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" })
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id))
        setNotes((prev) => prev.filter((n) => n.category_id !== id))
        if (selectedCategoryId === id) setSelectedCategoryId(null)
        toast.success("تم حذف التصنيف")
      }
    } catch (error) {
      toast.error("حدث خطأ في حذف التصنيف")
    }
  }

  const handleReorderCategories = async (newCategories: Category[]) => {
    setCategories(newCategories)
    try {
      await Promise.all(
        newCategories.map((cat) =>
          fetch(`/api/categories/${cat.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sort_order: cat.sort_order }),
          })
        )
      )
    } catch (error) {
      toast.error("حدث خطأ في ترتيب التصنيفات")
    }
  }

  const handleAddNote = async (categoryId: string, title: string, color = "#3b82f6") => {
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: categoryId, title, color }),
      })
      if (res.ok) {
        const newNote = await res.json()
        setNotes((prev) => [...prev, newNote])
        toast.success("تم إضافة الملاحظة")
      }
    } catch (error) {
      toast.error("حدث خطأ في إضافة الملاحظة")
    }
  }

  const handleUpdateNote = async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
      if (res.ok) {
        const updated = await res.json()
        setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)))
        toast.success("تم تحديث الملاحظة")
      }
    } catch (error) {
      toast.error("حدث خطأ في تحديث الملاحظة")
    }
  }

  const handleDeleteNote = async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" })
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id))
        toast.success("تم حذف الملاحظة")
      }
    } catch (error) {
      toast.error("حدث خطأ في حذف الملاحظة")
    }
  }

  const handleReorderNotes = async (newNotes: NoteWithPoints[]) => {
    setNotes((prev) => {
      const noteIds = new Set(newNotes.map((n) => n.id))
      const otherNotes = prev.filter((n) => !noteIds.has(n.id))
      return [...otherNotes, ...newNotes].sort((a, b) => a.sort_order - b.sort_order)
    })
    try {
      await Promise.all(
        newNotes.map((note) =>
          fetch(`/api/notes/${note.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sort_order: note.sort_order }),
          })
        )
      )
    } catch (error) {
      toast.error("حدث خطأ في ترتيب الملاحظات")
    }
  }

  const handleAddPoint = async (noteId: string) => {
    try {
      const res = await fetch("/api/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_id: noteId, content: "" }),
      })
      if (res.ok) {
        const newPoint = await res.json()
        setNotes((prev) =>
          prev.map((n) =>
            n.id === noteId ? { ...n, points: [...n.points, newPoint] } : n
          )
        )
      }
    } catch (error) {
      toast.error("حدث خطأ في إضافة النقطة")
    }
  }

  const handleUpdatePoint = async (pointId: string, content: string) => {
    try {
      const res = await fetch(`/api/points/${pointId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        const updated = await res.json()
        setNotes((prev) =>
          prev.map((n) => ({
            ...n,
            points: n.points.map((p) => (p.id === pointId ? updated : p)),
          }))
        )
      }
    } catch (error) {
      toast.error("حدث خطأ في تحديث النقطة")
    }
  }

  const handleDeletePoint = async (pointId: string) => {
    try {
      const res = await fetch(`/api/points/${pointId}`, { method: "DELETE" })
      if (res.ok) {
        setNotes((prev) =>
          prev.map((n) => ({
            ...n,
            points: n.points.filter((p) => p.id !== pointId),
          }))
        )
      }
    } catch (error) {
      toast.error("حدث خطأ في حذف النقطة")
    }
  }

  const handleReorderPoints = async (
    noteId: string,
    points: { id: string; sort_order: number }[]
  ) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== noteId) return n
        const pointMap = new Map(points.map((p) => [p.id, p.sort_order]))
        const sortedPoints = [...n.points]
          .map((p) => ({ ...p, sort_order: pointMap.get(p.id) ?? p.sort_order }))
          .sort((a, b) => a.sort_order - b.sort_order)
        return { ...n, points: sortedPoints }
      })
    )
    try {
      await Promise.all(
        points.map((point) =>
          fetch(`/api/points/${point.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sort_order: point.sort_order }),
          })
        )
      )
    } catch (error) {
      toast.error("حدث خطأ في ترتيب النقاط")
    }
  }

  /* ─── Loading Screen ─── */
  if (isLoading) {
    return (
      <div className="notes-app-shell flex items-center justify-center h-screen">
        <style>{globalStyles}</style>
        <div className="loading-container">
          <div className="loading-orb" />
          <p className="loading-text">جاري التحميل…</p>
        </div>
      </div>
    )
  }

  /* ─── Main Layout ─── */
  return (
    <div className="notes-app-shell flex h-screen overflow-hidden" dir="rtl">
      <style>{globalStyles}</style>

      {/* Mobile Overlay */}
      <div
        className={cn(
          "mobile-overlay",
          isSidebarOpen ? "mobile-overlay--visible" : "mobile-overlay--hidden"
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "sidebar-wrapper",
          isSidebarOpen ? "sidebar-wrapper--open" : ""
        )}
      >
        <CategoriesSidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={(id) => {
            setSelectedCategoryId(id)
            setIsSidebarOpen(false)
          }}
          onAddCategory={handleAddCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
          onReorderCategories={handleReorderCategories}
        />
      </aside>

      {/* Main */}
      <main className="main-content flex flex-col min-w-0 flex-1">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-inner">
            {/* Hamburger — mobile only */}
            <Button
              variant="ghost"
              size="icon"
              className="topbar-menu-btn lg:hidden"
              onClick={() => setIsSidebarOpen((v) => !v)}
              aria-label="القائمة"
            >
              {isSidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

            {/* Brand */}
            <div className="topbar-brand">
              <span className="topbar-brand-icon">
                <StickyNote className="h-4 w-4" />
              </span>
              <span className="topbar-brand-text">ملاحظاتي</span>
            </div>

            {/* Category pill */}
            {selectedCategoryId && (
              <div className="topbar-category-pill">
                <span
                  className="topbar-category-dot"
                  style={{
                    background:
                      categories.find((c) => c.id === selectedCategoryId)?.color ??
                      "#6366f1",
                  }}
                />
                <span className="topbar-category-name">
                  {categories.find((c) => c.id === selectedCategoryId)?.name}
                </span>
                <button
                  className="topbar-category-clear"
                  onClick={() => setSelectedCategoryId(null)}
                  aria-label="مسح التصفية"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Notes grid */}
        <div className="notes-scroll-area">
          <NotesGrid
            notes={notes}
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onReorderNotes={handleReorderNotes}
            onAddPoint={handleAddPoint}
            onUpdatePoint={handleUpdatePoint}
            onDeletePoint={handleDeletePoint}
            onReorderPoints={handleReorderPoints}
          />
        </div>
      </main>
    </div>
  )
}

/* ═══════════════════════════════════════════
   Global styles — injected via <style> tag
   so no Tailwind config changes are needed
═══════════════════════════════════════════ */
const globalStyles = `
  /* ── Palette ── */
  :root {
    --app-bg:        #0f1117;
    --surface:       #181c27;
    --surface-2:     #1e2333;
    --surface-3:     #252a3a;
    --border:        rgba(255,255,255,0.07);
    --border-hover:  rgba(255,255,255,0.13);
    --accent:        #6c63ff;
    --accent-soft:   rgba(108,99,255,0.15);
    --accent-glow:   rgba(108,99,255,0.35);
    --text-primary:  #f0f2f8;
    --text-secondary:#8b92a8;
    --text-muted:    #50566a;
    --radius-sm:     8px;
    --radius-md:     14px;
    --radius-lg:     20px;
    --sidebar-w:     260px;
    --topbar-h:      60px;
    --transition:    0.22s cubic-bezier(0.4,0,0.2,1);
  }

  /* ── Shell ── */
  .notes-app-shell {
    background: var(--app-bg);
    color: var(--text-primary);
    font-family: 'Tajawal', 'IBM Plex Sans Arabic', system-ui, sans-serif;
    direction: rtl;
  }

  /* ── Loading ── */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .loading-orb {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 2.5px solid var(--border);
    border-top-color: var(--accent);
    animation: spin 0.9s linear infinite;
  }
  .loading-text {
    font-size: 14px;
    color: var(--text-secondary);
    letter-spacing: 0.03em;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Mobile overlay ── */
  .mobile-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    z-index: 40;
    transition: opacity var(--transition), visibility var(--transition);
  }
  .mobile-overlay--hidden {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }
  .mobile-overlay--visible {
    opacity: 1;
    visibility: visible;
  }

  /* ── Sidebar wrapper ── */
  .sidebar-wrapper {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: var(--sidebar-w);
    z-index: 50;
    transform: translateX(100%);
    transition: transform var(--transition);
    background: var(--surface);
    border-left: 1px solid var(--border);
    box-shadow: -4px 0 30px rgba(0,0,0,0.35);
  }
  @media (min-width: 1024px) {
    .sidebar-wrapper {
      position: relative;
      top: auto; right: auto; bottom: auto;
      transform: none !important;
      box-shadow: none;
      border-left: 1px solid var(--border);
      border-right: none;
    }
  }
  .sidebar-wrapper--open {
    transform: translateX(0);
  }

  /* ── Topbar ── */
  .topbar {
    height: var(--topbar-h);
    flex-shrink: 0;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 30;
  }
  .topbar-inner {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 100%;
    padding: 0 20px;
  }

  /* Menu button */
  .topbar-menu-btn {
    width: 36px !important;
    height: 36px !important;
    border-radius: var(--radius-sm) !important;
    color: var(--text-secondary) !important;
    background: transparent !important;
    border: 1px solid var(--border) !important;
    transition: background var(--transition), border-color var(--transition), color var(--transition) !important;
  }
  .topbar-menu-btn:hover {
    background: var(--surface-2) !important;
    border-color: var(--border-hover) !important;
    color: var(--text-primary) !important;
  }

  /* Brand */
  .topbar-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-right: auto;
  }
  .topbar-brand-icon {
    width: 30px;
    height: 30px;
    border-radius: var(--radius-sm);
    background: var(--accent-soft);
    border: 1px solid var(--accent-glow);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
  }
  .topbar-brand-text {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: 0.01em;
  }

  /* Category pill */
  .topbar-category-pill {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 5px 12px 5px 8px;
    background: var(--surface-3);
    border: 1px solid var(--border);
    border-radius: 999px;
    font-size: 13px;
    color: var(--text-secondary);
    animation: pill-in 0.2s ease;
  }
  @keyframes pill-in {
    from { opacity: 0; transform: translateY(-4px) scale(0.96); }
    to   { opacity: 1; transform: none; }
  }
  .topbar-category-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .topbar-category-name {
    color: var(--text-primary);
    font-weight: 500;
  }
  .topbar-category-clear {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--border);
    color: var(--text-secondary);
    border: none;
    cursor: pointer;
    transition: background var(--transition), color var(--transition);
  }
  .topbar-category-clear:hover {
    background: var(--border-hover);
    color: var(--text-primary);
  }

  /* ── Notes scroll area ── */
  .notes-scroll-area {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--surface-3) transparent;
  }
  .notes-scroll-area::-webkit-scrollbar { width: 5px; }
  .notes-scroll-area::-webkit-scrollbar-track { background: transparent; }
  .notes-scroll-area::-webkit-scrollbar-thumb {
    background: var(--surface-3);
    border-radius: 99px;
  }

  /* ── Main content ── */
  .main-content {
    background: var(--app-bg);
  }
`
