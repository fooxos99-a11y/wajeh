import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get('categoryId')
  const search = searchParams.get('search')

  let query = supabase
    .from('notes')
    .select(`
      *,
      points (*)
    `)
    .order('sort_order', { ascending: true })

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%`)
  }

  const { data: notes, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Sort points within each note
  const sortedNotes = notes?.map(note => ({
    ...note,
    points: note.points?.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order) || []
  }))

  return NextResponse.json(sortedNotes)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  // Get the max sort_order for this category
  const { data: maxOrder } = await supabase
    .from('notes')
    .select('sort_order')
    .eq('category_id', body.category_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const sort_order = (maxOrder?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('notes')
    .insert({ 
      category_id: body.category_id,
      title: body.title,
      color: body.color || '#3b82f6',
      sort_order 
    })
    .select(`
      *,
      points (*)
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
