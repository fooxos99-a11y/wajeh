"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, Trash2, GripVertical, Circle, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Point } from "@/lib/types"
import { toast } from "sonner"
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

interface PointsEditorProps {
  points: Point[]
  onAddPoint: () => void
  onUpdatePoint: (pointId: string, content: string) => void
  onDeletePoint: (pointId: string) => void
  onReorderPoints: (points: { id: string; sort_order: number }[]) => void
}

function SortablePointItem({
  point,
  onUpdate,
  onDelete,
  index,
}: {
  point: Point
  onUpdate: (content: string) => void
  onDelete: () => void
  index: number
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(point.content)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: point.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  useEffect(() => {
    setContent(point.content)
  }, [point.content])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.setSelectionRange(
        inputRef.current.value.length,
        inputRef.current.value.length
      )
    }
  }, [isEditing])

  const handleBlur = () => {
    setIsEditing(false)
    if (content !== point.content) {
      onUpdate(content)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleBlur()
    }
    if (e.key === "Escape") {
      setContent(point.content)
      setIsEditing(false)
    }
  }

  const handleCopy = async () => {
    const text = content.trim()
    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
      toast.success("تم نسخ النص الفرعي")
    } catch (error) {
      console.error("Error copying point text:", error)
      toast.error("تعذر نسخ النص")
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-start gap-2.5 py-2 px-1 -mx-1 rounded-lg",
        "transition-all duration-200 ease-out",
        isDragging && "opacity-50 bg-muted/50 scale-[1.01]",
        !isDragging && "hover:bg-muted/30"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-100 cursor-grab touch-none mt-1 flex-shrink-0 transition-opacity duration-200"
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </button>

      <Circle className="h-1.5 w-1.5 mt-2 flex-shrink-0 fill-primary/50 text-primary/50" />

      {isEditing ? (
        <textarea
          ref={inputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex-1 resize-none bg-muted/40 rounded-md px-2 py-1 border-0",
            "text-base min-h-[32px] leading-relaxed",
            "focus:ring-1 focus:ring-primary/40 focus:bg-background",
            "transition-all duration-200"
          )}
          rows={1}
          style={{ height: "auto" }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = "auto"
            target.style.height = target.scrollHeight + "px"
          }}
        />
      ) : (
        <span
          className={cn(
            "flex-1 text-base leading-relaxed cursor-text min-h-[28px]",
            "transition-colors duration-200",
            !content && "text-muted-foreground italic"
          )}
          style={{ whiteSpace: 'pre-line' }}
          onClick={() => setIsEditing(true)}
        >
          {content || "أضف نص..."}
        </span>
      )}

      <Button
        size="icon"
        variant="ghost"
        className={cn(
          "h-7 w-7 opacity-0 group-hover:opacity-100 flex-shrink-0",
          "text-muted-foreground hover:text-foreground hover:bg-muted",
          "transition-all duration-200"
        )}
        onClick={handleCopy}
        disabled={!content.trim()}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>

      <Button
        size="icon"
        variant="ghost"
        className={cn(
          "h-7 w-7 opacity-0 group-hover:opacity-100 flex-shrink-0",
          "text-destructive/70 hover:text-destructive hover:bg-destructive/10",
          "transition-all duration-200"
        )}
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

export function PointsEditor({
  points,
  onAddPoint,
  onUpdatePoint,
  onDeletePoint,
  onReorderPoints,
}: PointsEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = points.findIndex((p) => p.id === active.id)
    const newIndex = points.findIndex((p) => p.id === over.id)

    const newPoints = arrayMove(points, oldIndex, newIndex).map((point, idx) => ({
      id: point.id,
      sort_order: idx,
    }))

    onReorderPoints(newPoints)
  }

  const sortedPoints = [...points].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="space-y-1">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedPoints.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {sortedPoints.map((point, index) => (
            <SortablePointItem
              key={point.id}
              point={point}
              onUpdate={(content) => onUpdatePoint(point.id, content)}
              onDelete={() => onDeletePoint(point.id)}
              index={index}
            />
          ))}
        </SortableContext>
      </DndContext>

      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-9 w-9 rounded-full p-0 mt-3",
          "text-muted-foreground hover:text-primary hover:bg-primary/5",
          "transition-all duration-200"
        )}
        onClick={onAddPoint}
        aria-label="إضافة نقطة"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
