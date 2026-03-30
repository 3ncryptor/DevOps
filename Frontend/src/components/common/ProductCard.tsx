import Link from 'next/link';
import { Product } from '@/api/products';
import { ShoppingCart } from 'lucide-react';
import { Button } from './Button';

export const ProductCard = ({ product }: { product: Product }) => {
  // Extract primary image or fallback
  const primaryImage = product.attributes.images.find((img) => img.isPrimary) || product.attributes.images[0];
  const imageUrl = primaryImage?.url || 'https://placehold.co/400x400?text=No+Image';

  // Current active price
  const activePrice = product.pricing?.[product.pricing.length - 1];

  // Store name safely
  const storeName = typeof product.storeId === 'object' ? product.storeId.identity.storeName : 'Vendor';

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md">
      <Link href={`/products/${product._id}`} className="block overflow-hidden bg-gray-50 aspect-square">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={primaryImage?.alt || product.identity.productName}
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
      </Link>
      
      <div className="flex flex-col flex-1 p-4">
        <div className="text-xs text-gray-500 mb-1 font-medium">{product.identity.brand} • {storeName}</div>
        <Link href={`/products/${product._id}`} className="mt-1">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
            {product.identity.productName}
          </h3>
        </Link>
        <p className="mt-1 text-xs text-gray-500 line-clamp-2 mb-4">
          {product.identity.description}
        </p>
        
        <div className="mt-auto flex items-center justify-between">
          <p className="text-lg font-bold text-gray-900">
            {activePrice ? `${activePrice.currency} ${activePrice.price.toFixed(2)}` : 'Pricing Unavailable'}
          </p>
          <Button size="icon" variant="outline" className="h-8 w-8 rounded-full hover:bg-black hover:text-white" title="Add to Context Cart">
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
