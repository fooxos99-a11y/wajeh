import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  // Get the max sort_order for this note
  const { data: maxOrder } = await supabase
    .from('points')
    .select('sort_order')
    .eq('note_id', body.note_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const sort_order = (maxOrder?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('points')
    .insert({ 
      note_id: body.note_id,
      content: body.content || '',
      sort_order 
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
