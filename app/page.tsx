"use client"

import { useState, useEffect } from "react"
import { CategoriesSidebar } from "@/components/categories-sidebar"
import { NotesGrid } from "@/components/notes-grid"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
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
        toast.success("تم إضافة التصنيف")
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
    // Update local state with the new order for filtered notes
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
    // Update local state
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
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:relative z-50 lg:z-auto transition-all duration-300 ease-out lg:transition-none",
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
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-4 p-4 border-b border-border/50 bg-background/80 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-10 w-10 rounded-xl hover:bg-muted transition-colors duration-200"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        {/* Notes grid */}
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
      </main>
    </div>
  )
}
