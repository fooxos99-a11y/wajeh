"use client"

import { useState, useEffect } from "react"
import { CategoriesSidebar } from "@/components/categories-sidebar"
import { NotesGrid } from "@/components/notes-grid"
import { Button } from "@/components/ui/button"
import { Menu, Sun, Moon } from "lucide-react"
import { toast } from "sonner"
import type { Category, NoteWithPoints } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function NotesApp() {
  const [categories, setCategories] = useState<Category[]>([])
  const [notes, setNotes] = useState<NoteWithPoints[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // --- تفعيل الثيم الليلي ---
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  // --- جلب البيانات ---
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

  // --- وظائف التصنيفات (Categories Handlers) ---
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
      toast.error("خطأ في إضافة التصنيف")
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
      }
    } catch (error) {
      toast.error("خطأ في التحديث")
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" })
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id))
        if (selectedCategoryId === id) setSelectedCategoryId(null)
        toast.success("تم الحذف")
      }
    } catch (error) {
      toast.error("خطأ في الحذف")
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
      console.error(error)
    }
  }

  // --- وظائف الملاحظات (Notes Handlers) ---
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
      }
    } catch (error) {
      toast.error("خطأ في إضافة الملاحظة")
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
      }
    } catch (error) {
      toast.error("خطأ في التحديث")
    }
  }

  const handleDeleteNote = async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" })
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id))
      }
    } catch (error) {
      toast.error("خطأ في الحذف")
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
    } catch (error) {}
  }

  // --- وظائف النقاط (Points Handlers) ---
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
    } catch (error) {}
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
    } catch (error) {}
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
    } catch (error) {}
  }

  const handleReorderPoints = async (noteId: string, points: { id: string; sort_order: number }[]) => {
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
    } catch (error) {}
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 p-2 sm:p-3 gap-3 font-sans transition-colors duration-300 overflow-hidden">
      
      {/* القائمة الجانبية (Sidebar) - تصميم عائم ومصغر */}
      <aside
        className={cn(
          "fixed lg:relative z-50 h-full w-[240px] flex-shrink-0 flex flex-col",
          "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl transition-all duration-300",
          isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex-1 overflow-hidden pt-4 px-2">
          <CategoriesSidebar
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={(id) => { setSelectedCategoryId(id); setIsSidebarOpen(false); }}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            onReorderCategories={handleReorderCategories}
          />
        </div>
      </aside>

      {/* منطقة المحتوى الرئيسي (Main) */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden relative">
        
        {/* أزرار التحكم العلوية (بدون Header كبير) */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10 pointer-events-none">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden w-9 h-9 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur pointer-events-auto"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-9 h-9 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur pointer-events-auto hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-blue-500" />}
          </Button>
        </div>

        {/* شبكة الملاحظات (Notes Grid) - مسافات أصغر وحجم مدمج */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="max-w-5xl mx-auto">
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
        </div>
      </main>

      {/* خلفية معتمة للموبايل */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}
    </div>
  )
}
