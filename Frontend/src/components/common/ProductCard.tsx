import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "./Button";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
}

export const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const primaryImage =
    product.images?.find((img, i) => i === 0) ?? product.images?.[0];
  const imageUrl =
    primaryImage?.url ?? "https://placehold.co/400x400?text=No+Image";
  const imageAlt = primaryImage?.altText ?? product.identity.title;

  const activePrice = product.pricing?.[product.pricing.length - 1];
  const storeName =
    typeof product.storeId === "object"
      ? product.storeId.storeIdentity.name
      : "Vendor";
  const brand = product.attributes?.brand;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md">
      <Link
        href={`/products/${product._id}`}
        className="block overflow-hidden bg-gray-50 aspect-square relative"
      >
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </Link>

      <div className="flex flex-col flex-1 p-4">
        <div className="text-xs text-gray-400 mb-1 font-medium truncate">
          {brand && <span>{brand} • </span>}
          <span>{storeName}</span>
        </div>
        <Link href={`/products/${product._id}`} className="mt-1">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
            {product.identity.title}
          </h3>
        </Link>
        {product.identity.description && (
          <p className="mt-1 text-xs text-gray-400 line-clamp-2 mb-4">
            {product.identity.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <p className="text-base font-bold text-gray-900">
            {activePrice
              ? `${activePrice.currency} ${activePrice.price.toFixed(2)}`
              : "Price N/A"}
          </p>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-full hover:bg-black hover:text-white"
            title="Add to Cart"
            onClick={(e) => {
              e.preventDefault();
              onAddToCart?.(product._id);
            }}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
