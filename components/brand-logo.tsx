'use client';

import { useState } from 'react';

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  alt?: string;
  showText?: boolean;
  text?: string;
  src?: string;
};

const FALLBACK_SOURCES = [
  '/brand/pedezap-logo.png',
  '/brand/pedezap-logo.jpg',
  '/brand/pedezap-logo.jpeg',
  '/brand/pedezap-logo.webp',
  '/brand/pedezap-logo.svg',
  '/logo.png',
  '/logo.svg'
];

export function BrandLogo({
  className,
  imageClassName,
  textClassName,
  alt = 'PedeZap',
  showText = false,
  text = 'PedeZap',
  src
}: BrandLogoProps) {
  const sources = src ? [src, ...FALLBACK_SOURCES.filter((item) => item !== src)] : FALLBACK_SOURCES;
  const [sourceIndex, setSourceIndex] = useState(0);
  const currentSource = sources[sourceIndex];

  if (!currentSource) {
    return (
      <div className={className}>
        <span className={textClassName ?? 'font-bold text-inherit'}>{text}</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <img
        src={currentSource}
        alt={alt}
        className={imageClassName ?? 'h-12 w-auto object-contain'}
        onError={() => setSourceIndex((prev) => prev + 1)}
      />
      {showText ? <span className={textClassName}>{text}</span> : null}
    </div>
  );
}
