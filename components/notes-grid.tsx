"use client"

import { useState } from "react"
import { Plus, FileText, Trash2, Pencil, Check, X, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Category, NoteWithPoints } from "@/lib/types"
import { PointsEditor } from "./points-editor"
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
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface NotesGridProps {
  notes: NoteWithPoints[]
  categories: Category[]
  selectedCategoryId: string | null
  onAddNote: (categoryId: string, title: string) => Promise<void>
  onUpdateNote: (id: string, title: string) => Promise<void>
  onDeleteNote: (id: string) => Promise<void>
  onReorderNotes: (notes: NoteWithPoints[]) => Promise<void>
  onAddPoint: (noteId: string) => Promise<void>
  onUpdatePoint: (pointId: string, content: string) => Promise<void>
  onDeletePoint: (pointId: string) => Promise<void>
  onReorderPoints: (noteId: string, points: { id: string; sort_order: number }[]) => Promise<void>
}

function SortableNoteCard({
  note,
  category,
  isEditing,
  editTitle,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onEditTitleChange,
  onAddPoint,
  onUpdatePoint,
  onDeletePoint,
  onReorderPoints,
  index,
}: {
  note: NoteWithPoints
  category?: Category
  isEditing: boolean
  editTitle: string
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onDelete: () => void
  onEditTitleChange: (title: string) => void
  onAddPoint: () => void
  onUpdatePoint: (pointId: string, content: string) => void
  onDeletePoint: (pointId: string) => void
  onReorderPoints: (points: { id: string; sort_order: number }[]) => void
  index: number
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative border-0 shadow-sm hover:shadow-md rounded-2xl",
        "bg-card/80 backdrop-blur-sm",
        "transition-all duration-300 ease-out",
        "animate-fade-in",
        isDragging && "opacity-60 scale-[1.02] shadow-lg z-50",
        `stagger-${Math.min(index + 1, 5)}`
      )}
    >
      {/* Color accent bar */}
      {category && (
        <div 
          className="absolute top-0 right-0 w-1 h-full rounded-r-xl transition-all duration-300"
          style={{ backgroundColor: category.color }}
        />
      )}
      
      <CardHeader className="pb-3 pr-5 pl-5 pt-5">
        <div className="flex items-start gap-2">
          <button
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 cursor-grab touch-none mt-1 transition-opacity duration-200"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>

          {isEditing ? (
            <div className="flex-1 flex items-center gap-2 animate-scale-in">
              <Input
                value={editTitle}
                onChange={(e) => onEditTitleChange(e.target.value)}
                className="h-9 text-sm font-semibold bg-muted/50 border-0 focus-visible:ring-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveEdit()
                  if (e.key === "Escape") onCancelEdit()
                }}
              />
              <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10" onClick={onSaveEdit}>
                <Check className="h-4 w-4 text-primary" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onCancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg leading-snug text-foreground">{note.title}</h3>
                {category && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm text-muted-foreground font-medium">{category.name}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 hover:bg-muted"
                  onClick={onStartEdit}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={onDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 pr-5 pl-5 pb-5">
        <PointsEditor
          points={note.points}
          onAddPoint={onAddPoint}
          onUpdatePoint={onUpdatePoint}
          onDeletePoint={onDeletePoint}
          onReorderPoints={onReorderPoints}
        />
      </CardContent>
    </Card>
  )
}

export function NotesGrid({
  notes,
  categories,
  selectedCategoryId,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onReorderNotes,
  onAddPoint,
  onUpdatePoint,
  onDeletePoint,
  onReorderPoints,
}: NotesGridProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newCategoryId, setNewCategoryId] = useState<string>("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleAddNote = async () => {
    const categoryId = selectedCategoryId || newCategoryId
    if (!newTitle.trim() || !categoryId) return
    await onAddNote(categoryId, newTitle.trim())
    setNewTitle("")
    setNewCategoryId("")
    setIsAdding(false)
  }

  const handleStartEdit = (note: NoteWithPoints) => {
    setEditingId(note.id)
    setEditTitle(note.title)
  }

  const handleSaveEdit = async (noteId: string) => {
    if (!editTitle.trim()) return
    await onUpdateNote(noteId, editTitle.trim())
    setEditingId(null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = notes.findIndex((n) => n.id === active.id)
    const newIndex = notes.findIndex((n) => n.id === over.id)

    const newNotes = arrayMove(notes, oldIndex, newIndex).map((note, idx) => ({
      ...note,
      sort_order: idx,
    }))

    await onReorderNotes(newNotes)
  }

  const getCategoryForNote = (note: NoteWithPoints) => {
    return categories.find((c) => c.id === note.category_id)
  }

  const filteredNotes = selectedCategoryId
    ? notes.filter((n) => n.category_id === selectedCategoryId)
    : notes

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)

  return (
    <div className="flex-1 p-6 md:p-7 overflow-y-auto bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            {selectedCategory?.name || "جميع الملاحظات"}
          </h2>
          <p className="text-base text-muted-foreground mt-1.5">
            {filteredNotes.length} ملاحظة
          </p>
        </div>
        <Button 
          onClick={() => setIsAdding(true)} 
          className="gap-2 h-11 px-5 rounded-xl bg-primary hover:bg-primary/90 shadow-sm hover:shadow transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          ملاحظة جديدة
        </Button>
      </div>

      {/* Add Note Form */}
      {isAdding && (
        <Card className="mb-6 border-0 shadow-md bg-card/90 backdrop-blur-sm animate-scale-in rounded-2xl">
          <CardContent className="pt-5 pb-5">
            <div className="space-y-4">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="عنوان الملاحظة..."
                className="h-12 text-base bg-muted/50 border-0 focus-visible:ring-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddNote()
                  if (e.key === "Escape") setIsAdding(false)
                }}
              />
              {!selectedCategoryId && (
                <select
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border-0 bg-muted/50 text-base focus:ring-1 focus:ring-ring transition-all duration-200"
                >
                  <option value="">اختر التصنيف...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
              <div className="flex gap-3">
                <Button 
                  onClick={handleAddNote}
                  className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 transition-colors duration-200"
                >
                  إضافة
                </Button>
                <Button 
                  variant="ghost" 
                  className="h-11 px-6 rounded-xl hover:bg-muted"
                  onClick={() => setIsAdding(false)}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredNotes.length === 0 && !isAdding ? (
        <div className="flex flex-col items-center justify-center h-80 text-muted-foreground animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
            <FileText className="h-10 w-10" />
          </div>
          <p className="text-xl font-medium text-foreground mb-2">لا توجد ملاحظات</p>
          <p className="text-sm mb-6">ابدأ بإضافة ملاحظة جديدة لتنظيم أفكارك</p>
          <Button 
            onClick={() => setIsAdding(true)}
            variant="outline"
            className="gap-2 h-11 px-6 rounded-xl border-dashed border-2 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            إضافة ملاحظة
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredNotes.map((n) => n.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredNotes.map((note, index) => (
                <SortableNoteCard
                  key={note.id}
                  note={note}
                  category={getCategoryForNote(note)}
                  isEditing={editingId === note.id}
                  editTitle={editTitle}
                  onStartEdit={() => handleStartEdit(note)}
                  onCancelEdit={() => setEditingId(null)}
                  onSaveEdit={() => handleSaveEdit(note.id)}
                  onDelete={() => onDeleteNote(note.id)}
                  onEditTitleChange={setEditTitle}
                  onAddPoint={() => onAddPoint(note.id)}
                  onUpdatePoint={onUpdatePoint}
                  onDeletePoint={onDeletePoint}
                  onReorderPoints={(points) => onReorderPoints(note.id, points)}
                  index={index}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
