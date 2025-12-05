import Image from 'next/image';
import React from 'react';

/**
 * Usage:
 *  <PublicImage src="/payments/visa.png" alt="visa" width={40} height={24} />
 *  <PublicImage src="https://example.com/icon.png" alt="ext" width={40} height={24} />
 *
 * Notes:
 *  - Place files in /public and reference them as "/filename.png" (case-sensitive).
 *  - If width/height not provided, falls back to plain <img>.
 */
export default function PublicImage({ src, alt = '', width, height, className, style, ...props }) {
  if (!src) return null;

  // Normalize accidental "/public/..." usage and ensure leading slash for local files
  let outSrc = src;
  if (outSrc.startsWith('/public/')) outSrc = outSrc.replace(/^\/public/, '');
  if (!outSrc.startsWith('/') && !/^https?:\/\//i.test(outSrc)) outSrc = `/${outSrc}`;

  const isExternal = /^https?:\/\//i.test(outSrc);

  // If width/height provided use Next.js Image for optimization (works for public and allowed external hosts)
  if (width && height) {
    return (
      <Image
        src={outSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
        {...props}
      />
    );
  }

  // Fallback to plain img when dimensions not provided (keeps layout flexible)
  return <img src={outSrc} alt={alt} className={className} style={style} {...props} />;
}
