export interface Category {
  id: string
  name: string
  color: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  category_id: string
  title: string
  sort_order: number
  created_at: string
  updated_at: string
  points?: Point[]
}

export interface Point {
  id: string
  note_id: string
  content: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface NoteWithPoints extends Note {
  points: Point[]
}

export interface CategoryWithNotes extends Category {
  notes: NoteWithPoints[]
}
