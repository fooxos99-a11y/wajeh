"use client"

import { useState, useEffect } from "react"
import { CategoriesSidebar } from "@/components/categories-sidebar"
import { NotesGrid } from "@/components/notes-grid"
import { Button } from "@/components/ui/button"
import { Menu, Sparkles } from "lucide-react"
import { toast } from "sonner"
import type { Category, NoteWithPoints } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function NotesApp() {
  const [categories, setCategories] = useState<Category[]>([])
  const [notes, setNotes] = useState<NoteWithPoints[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch initial data
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

  // Category handlers
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
        toast.success("تم إضافة التصنيف بنجاح")
      }
    } catch (error) {
      console.error("Error adding category:", error)
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
      console.error("Error updating category:", error)
      toast.error("حدث خطأ في تحديث التصنيف")
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" })

      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id))
        setNotes((prev) => prev.filter((n) => n.category_id !== id))
        if (selectedCategoryId === id) {
          setSelectedCategoryId(null)
        }
        toast.success("تم حذف التصنيف")
      }
    } catch (error) {
      console.error("Error deleting category:", error)
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
      console.error("Error reordering categories:", error)
      toast.error("حدث خطأ في ترتيب التصنيفات")
    }
  }

  // Note handlers
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
      console.error("Error adding note:", error)
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
      console.error("Error updating note:", error)
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
      console.error("Error deleting note:", error)
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
      console.error("Error reordering notes:", error)
      toast.error("حدث خطأ في ترتيب الملاحظات")
    }
  }

  // Point handlers
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
      console.error("Error adding point:", error)
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
      console.error("Error updating point:", error)
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
      console.error("Error deleting point:", error)
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
          .map((p) => ({
            ...p,
            sort_order: pointMap.get(p.id) ?? p.sort_order,
          }))
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
      console.error("Error reordering points:", error)
      toast.error("حدث خطأ في ترتيب النقاط")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col items-center gap-6 relative z-10 animate-in fade-in duration-700">
          <div className="relative flex items-center justify-center w-20 h-20 bg-background/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50">
            <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              جاري تجهيز مساحة العمل
            </h2>
            <p className="text-sm text-muted-foreground animate-pulse">
              لحظات ونبدأ الإبداع...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-background overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Mobile sidebar overlay with smooth blur transition */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/60 backdrop-blur-md z-40 lg:hidden transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Added subtle borders and shadow */}
      <div
        className={cn(
          "fixed lg:relative z-50 lg:z-auto h-full flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:transition-none bg-background/95 backdrop-blur-xl border-l border-border/40 shadow-2xl lg:shadow-none w-72",
          isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
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
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Modern Header */}
        <header className="sticky top-0 z-30 flex items-center gap-4 px-6 py-4 border-b border-border/40 bg-background/70 backdrop-blur-xl transition-all">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-10 w-10 rounded-xl hover:bg-muted/80 transition-colors duration-200"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-5 w-5 text-foreground" />
          </Button>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">ملاحظاتي</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                نظم أفكارك ومهامك بفاعلية
              </p>
            </div>
          </div>
        </header>

        {/* Notes grid Wrapper - Added smooth scrolling and padding */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
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
    </div>
  )
}
