import { z } from 'zod'
import { supabaseAdmin } from '../supabase.js'

const rowSchema = z.object({
  id: z.number().optional(),
  day: z.string().optional(),
  date: z.string(),
  time_start: z.string().optional(),
  time_end: z.string().optional(),
  total_hours: z.number(),
  branches: z.number().optional(),
  orders_input: z.number().optional(),
  disputed_orders: z.number().optional(),
  emails_followed_up: z.number().optional(),
  updated_orders: z.number().optional(),
  videos_uploaded: z.number().optional(),
  platform_used: z.string().optional(),
  remarks: z.string().optional(),
})

export function normalizeRow(input) {
  return rowSchema.parse(input)
}

export async function upsertRows(userId, rows) {
  const normalized = rows.map((row) => {
    const parsed = normalizeRow(row)
    const copy = { ...parsed, user_id: userId }
    if (!copy.id) delete copy.id
    return copy
  })

  const toInsert = normalized.filter((row) => !row.id)
  const toUpdate = normalized.filter((row) => row.id)

  if (toInsert.length > 0) {
    const { error } = await supabaseAdmin.from('progress_rows').insert(toInsert)
    if (error) throw error
  }

  if (toUpdate.length > 0) {
    // For identity columns, skip assigning id in update payload; use it only for filtering.
    for (const row of toUpdate) {
      const { id, ...rest } = row
      const { error } = await supabaseAdmin
        .from('progress_rows')
        .update(rest)
        .eq('id', id)
        .eq('user_id', userId)
      if (error) throw error
    }
  }

  return { count: normalized.length }
}

export async function listRows(userId, limit = 2000) {
  const { data, error } = await supabaseAdmin
    .from('progress_rows')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}
