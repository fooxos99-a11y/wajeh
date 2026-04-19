import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  }

  if (body.title !== undefined) updateData.title = body.title
  if (body.category_id !== undefined) updateData.category_id = body.category_id
  if (body.sort_order !== undefined) updateData.sort_order = body.sort_order

  const { data, error } = await supabase
    .from('notes')
    .update(updateData)
    .eq('id', id)
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
