import { notFound } from 'next/navigation';
import { supabase, cachedFetch } from '@/lib/supabase';
import AddProductsClient from './add-products-client';

export const dynamic = 'force-dynamic';

async function getBoxData(id: string) {
  return cachedFetch(`box-detail-data-${id}`, async () => {
    try {
      const { data: box, error } = await supabase
        .from('boxes')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !box) return null;
      return box;
    } catch (error) {
      console.error(error);
      return null;
    }
  }, 5000);
}

interface PageProps {
  params: {
    id: string;
  };
}

export default async function AddProductsPage({ params }: PageProps) {
  const box = await getBoxData(params.id);
  if (!box) {
    notFound();
  }

  return (
    <div className="bg-brand-bg/50 min-h-screen py-10 pt-32">
      <AddProductsClient box={box as any} />
    </div>
  );
}
