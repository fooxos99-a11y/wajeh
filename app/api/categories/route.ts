import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(categories)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  // Get the max sort_order
  const { data: maxOrder } = await supabase
    .from('categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const sort_order = (maxOrder?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('categories')
    .insert({ 
      name: body.name, 
      color: body.color || '#3b82f6',
      sort_order 
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
