import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase not configured', configured: false });
  }

  const sb = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await sb.from('pages').select('slug, title, updated_at, blocks').eq('slug', 'home').limit(1);

  return NextResponse.json({
    configured: true,
    error: error?.message || null,
    found: data && data.length > 0,
    page: data?.[0] ? {
      slug: data[0].slug,
      title: data[0].title,
      updated_at: data[0].updated_at,
      blocks_type: typeof data[0].blocks,
      blocks_length: Array.isArray(data[0].blocks) ? data[0].blocks.length : (typeof data[0].blocks === 'string' ? 'STRING' : 'OTHER'),
      first_block_type: Array.isArray(data[0].blocks) && data[0].blocks[0] ? data[0].blocks[0].type : null,
      hero_content: Array.isArray(data[0].blocks) ? data[0].blocks.find((b: any) => b.type === 'hero')?.content : null,
    } : null
  });
}
