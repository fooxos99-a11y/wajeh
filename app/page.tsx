"use client"

import { useState, useEffect } from "react"
import { CategoriesSidebar } from "@/components/categories-sidebar"
import { NotesGrid } from "@/components/notes-grid"
import { Button } from "@/components/ui/button"
import { Menu, Sun, Moon, Command, Sparkles } from "lucide-react"
import { toast } from "sonner"
import type { Category, NoteWithPoints } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function NotesApp() {
  const [categories, setCategories] = useState<Category[]>([])
  const [notes, setNotes] = useState<NoteWithPoints[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // نظام الوضع الليلي (Dark Mode)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // تطبيق الوضع الليلي على مستوى النظام (HTML)
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  // جلب البيانات الأساسية
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

  // --- Category Handlers ---
  const handleAddCategory = async (name: string, color: string) => { /* ... نفس الكود السابق ... */ }
  const handleUpdateCategory = async (id: string, name: string, color: string) => { /* ... نفس الكود السابق ... */ }
  const handleDeleteCategory = async (id: string) => { /* ... نفس الكود السابق ... */ }
  const handleReorderCategories = async (newCategories: Category[]) => { /* ... نفس الكود السابق ... */ }

  // --- Note Handlers ---
  const handleAddNote = async (categoryId: string, title: string, color = "#3b82f6") => { /* ... نفس الكود السابق ... */ }
  const handleUpdateNote = async (id: string, title: string) => { /* ... نفس الكود السابق ... */ }
  const handleDeleteNote = async (id: string) => { /* ... نفس الكود السابق ... */ }
  const handleReorderNotes = async (newNotes: NoteWithPoints[]) => { /* ... نفس الكود السابق ... */ }

  // --- Point Handlers ---
  const handleAddPoint = async (noteId: string) => { /* ... نفس الكود السابق ... */ }
  const handleUpdatePoint = async (pointId: string, content: string) => { /* ... نفس الكود السابق ... */ }
  const handleDeletePoint = async (pointId: string) => { /* ... نفس الكود السابق ... */ }
  const handleReorderPoints = async (noteId: string, points: { id: string; sort_order: number }[]) => { /* ... نفس الكود السابق ... */ }

  // شاشة التحميل الجديدة
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-500">
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <div className="w-16 h-16 rounded-3xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shadow-inner">
            <Command className="w-8 h-8 text-zinc-400 dark:text-zinc-500 animate-spin-slow" />
          </div>
          <div className="w-32 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
        </div>
      </div>
    )
  }

  return (
    // الخلفية الرئيسية للتطبيق (وراء البطاقات العائمة)
    <div className="flex h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 p-2 sm:p-4 lg:p-6 gap-6 font-sans transition-colors duration-300 overflow-hidden">
      
      {/* خلفية معتمة للموبايل */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* القائمة الجانبية (تصميم عائم بدلاً من الملتصق) */}
      <aside
        className={cn(
          "fixed lg:relative z-50 h-full w-[280px] flex-shrink-0 flex flex-col",
          "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl lg:shadow-sm rounded-[2rem]",
          "transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-md">
            <Command className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg tracking-tight">مساحة العمل</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">دفتر الملاحظات الذكي</p>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
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
      </aside>

      {/* القسم الرئيسي (الملاحظات) - بطاقة عائمة أيضاً */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-[2rem] overflow-hidden relative">
        
        {/* شريط الأدوات العلوي */}
        <header className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden w-10 h-10 rounded-full border-zinc-200 dark:border-zinc-700 bg-transparent"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {selectedCategoryId 
                ? categories.find(c => c.id === selectedCategoryId)?.name 
                : "جميع الملاحظات"}
              <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
            </h1>
          </div>

          {/* زر تبديل الوضع الليلي/النهاري */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-10 h-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-zinc-400 hover:text-yellow-400 transition-colors" />
            ) : (
              <Moon className="h-5 w-5 text-zinc-600 hover:text-indigo-500 transition-colors" />
            )}
          </Button>
        </header>

        {/* شبكة الملاحظات */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
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
