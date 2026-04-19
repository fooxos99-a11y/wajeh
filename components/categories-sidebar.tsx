"use client"

import { useState } from "react"
import { Plus, FolderOpen, Trash2, Pencil, Check, X, GripVertical, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { Category } from "@/lib/types"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface CategoriesSidebarProps {
  categories: Category[]
  selectedCategoryId: string | null
  onSelectCategory: (id: string | null) => void
  onAddCategory: (name: string, color: string) => Promise<void>
  onUpdateCategory: (id: string, name: string, color: string) => Promise<void>
  onDeleteCategory: (id: string) => Promise<void>
  onReorderCategories: (categories: Category[]) => Promise<void>
}

const COLORS = [
  "#0d9488", // teal
  "#0891b2", // cyan
  "#2563eb", // blue
  "#7c3aed", // violet
  "#db2777", // pink
  "#ea580c", // orange
  "#16a34a", // green
  "#64748b", // slate
]

function SortableCategoryItem({
  category,
  isSelected,
  isEditing,
  editName,
  editColor,
  onSelect,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onEditNameChange,
  onEditColorChange,
  index,
}: {
  category: Category
  isSelected: boolean
  isEditing: boolean
  editName: string
  editColor: string
  onSelect: () => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onDelete: () => void
  onEditNameChange: (name: string) => void
  onEditColorChange: (color: string) => void
  index: number
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer",
        "transition-all duration-200 ease-out animate-fade-in",
        isSelected 
          ? "bg-primary/10 text-primary shadow-sm" 
          : "hover:bg-muted/80",
        isDragging && "opacity-50 scale-[1.02]",
        `stagger-${Math.min(index + 1, 5)}`
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-100 cursor-grab touch-none transition-opacity duration-200"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {isEditing ? (
        <div className="flex-1 flex flex-col gap-2 animate-scale-in">
          <Input
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            className="h-8 text-sm bg-background/50"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit()
              if (e.key === "Escape") onCancelEdit()
            }}
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className={cn(
                    "w-5 h-5 rounded-full transition-all duration-200",
                    editColor === color 
                      ? "ring-2 ring-offset-2 ring-foreground/30 scale-110" 
                      : "hover:scale-110"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => onEditColorChange(color)}
                />
              ))}
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onSaveEdit}>
                <Check className="h-3.5 w-3.5 text-primary" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onCancelEdit}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
            className="w-3 h-3 rounded-full flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
            style={{ backgroundColor: category.color }}
          />
          <span 
            className="flex-1 truncate font-medium text-sm" 
            onClick={onSelect}
          >
            {category.name}
          </span>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 hover:bg-background/80"
              onClick={(e) => {
                e.stopPropagation()
                onStartEdit()
              }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export function CategoriesSidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategories,
}: CategoriesSidebarProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState(COLORS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleAddCategory = async () => {
    if (!newName.trim()) return
    await onAddCategory(newName.trim(), newColor)
    setNewName("")
    setNewColor(COLORS[0])
    setIsAdding(false)
  }

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id)
    setEditName(category.name)
    setEditColor(category.color)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return
    await onUpdateCategory(editingId, editName.trim(), editColor)
    setEditingId(null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = categories.findIndex((c) => c.id === active.id)
    const newIndex = categories.findIndex((c) => c.id === over.id)

    const newCategories = arrayMove(categories, oldIndex, newIndex).map((cat, idx) => ({
      ...cat,
      sort_order: idx,
    }))

    await onReorderCategories(newCategories)
  }

  return (
    <aside className="w-72 border-l bg-sidebar/50 backdrop-blur-sm flex flex-col h-screen">
      {/* Header */}
      <div className="p-5 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">ملاحظاتي</h1>
            <p className="text-xs text-muted-foreground">نظم أفكارك</p>
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <button
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer",
            "transition-all duration-200 ease-out",
            selectedCategoryId === null 
              ? "bg-primary/10 text-primary shadow-sm" 
              : "hover:bg-muted/80"
          )}
          onClick={() => onSelectCategory(null)}
        >
          <FolderOpen className="h-4 w-4" />
          <span className="font-medium text-sm">جميع الملاحظات</span>
          <span className="mr-auto text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {categories.reduce((acc, c) => acc, 0) || ""}
          </span>
        </button>

        <div className="h-px bg-border/50 my-3" />

        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            التصنيفات
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 hover:bg-primary/10 hover:text-primary transition-colors duration-200"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {categories.map((category, index) => (
              <SortableCategoryItem
                key={category.id}
                category={category}
                isSelected={selectedCategoryId === category.id}
                isEditing={editingId === category.id}
                editName={editName}
                editColor={editColor}
                onSelect={() => onSelectCategory(category.id)}
                onStartEdit={() => handleStartEdit(category)}
                onCancelEdit={() => setEditingId(null)}
                onSaveEdit={handleSaveEdit}
                onDelete={() => onDeleteCategory(category.id)}
                onEditNameChange={setEditName}
                onEditColorChange={setEditColor}
                index={index}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Add Category Form */}
      {isAdding && (
        <div className="p-4 border-t border-sidebar-border/50 animate-slide-in">
          <div className="space-y-3 p-3 rounded-xl bg-muted/50">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="اسم التصنيف الجديد..."
              className="text-sm bg-background/80 border-0 focus-visible:ring-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCategory()
                if (e.key === "Escape") setIsAdding(false)
              }}
            />
            <div className="flex gap-1.5 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className={cn(
                    "w-6 h-6 rounded-full transition-all duration-200",
                    newColor === color 
                      ? "ring-2 ring-offset-2 ring-foreground/30 scale-110" 
                      : "hover:scale-110"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewColor(color)}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="flex-1 bg-primary hover:bg-primary/90 transition-colors duration-200" 
                onClick={handleAddCategory}
              >
                <Plus className="h-3.5 w-3.5 ml-1" />
                إضافة
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="hover:bg-background/80"
                onClick={() => setIsAdding(false)}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Button (when not adding) */}
      {!isAdding && (
        <div className="p-4 border-t border-sidebar-border/50">
          <Button
            variant="outline"
            className="w-full justify-center gap-2 h-11 rounded-xl border-dashed border-2 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4" />
            إضافة تصنيف جديد
          </Button>
        </div>
      )}
    </aside>
  )
}
