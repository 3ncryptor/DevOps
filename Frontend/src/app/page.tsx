'use client';

import { useQuery } from '@tanstack/react-query';
import { productsService } from '@/api/products';
import { ProductCard } from '@/components/common/ProductCard';

export default function Home() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsService.getProducts({ page: 1, limit: 12 }),
  });

  return (
    <div className="flex flex-col p-6 sm:p-10 space-y-8">
      <div className="space-y-2 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Discover Zentra
        </h1>
        <p className="text-gray-500 text-lg">
          Explore the latest products from across our diverse marketplace of independent sellers.
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-xl aspect-[3/4] w-full" />
          ))}
        </div>
      )}

      {isError && (
        <div className="p-8 text-center bg-red-50 text-red-600 rounded-lg flex flex-col items-center">
          <p>Failed to load products. Please ensure the backend is running.</p>
        </div>
      )}

      {!isLoading && !isError && data?.data?.products && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {data.data.products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
          {data.data.products.length === 0 && (
             <div className="col-span-full py-20 text-center text-gray-500">
               No products found directly from the database yet. 
             </div>
          )}
        </div>
      )}
    </div>
  );
}
