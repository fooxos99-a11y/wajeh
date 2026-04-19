import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json([])
  }

  // Search in notes titles
  const { data: notes, error: notesError } = await supabase
    .from('notes')
    .select(`
      *,
      points (*)
    `)
    .ilike('title', `%${query}%`)
    .order('sort_order', { ascending: true })

  if (notesError) {
    return NextResponse.json({ error: notesError.message }, { status: 500 })
  }

  // Search in points content
  const { data: points, error: pointsError } = await supabase
    .from('points')
    .select(`
      *,
      note:notes (
        *,
        points (*)
      )
    `)
    .ilike('content', `%${query}%`)

  if (pointsError) {
    return NextResponse.json({ error: pointsError.message }, { status: 500 })
  }

  // Combine results and deduplicate by note id
  const noteIds = new Set(notes?.map(n => n.id) || [])
  const additionalNotes = points
    ?.filter(p => p.note && !noteIds.has(p.note.id))
    .map(p => p.note) || []

  const allNotes = [...(notes || []), ...additionalNotes]
  
  // Sort points within each note
  const sortedNotes = allNotes.map(note => ({
    ...note,
    points: note.points?.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order) || []
  }))

  return NextResponse.json(sortedNotes)
}
