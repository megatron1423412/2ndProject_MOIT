import React from "react";
import { resolveProductImagePath } from "../../features/product-catalog/presentation/productImage";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface Props {
  productId: string;
  imagePath: string | null | undefined;
  alt: string;
  className?: string;
}

/** Shared image boundary for catalog cards, details, favorites, and timeline snapshots. */
export default function ProductImage({ productId, imagePath, alt, className }: Props) {
  const src = resolveProductImagePath(imagePath);
  return <ImageWithFallback src={src} alt={alt} className={className} resetKey={`${productId}:${src ?? "missing"}`} />;
}
