"use client";

import NextImage, { ImageProps as NextImageProps } from "next/image";
import { useState, useCallback, CSSProperties, ReactNode } from "react";

// ─── Fallback variant ──────────────────────────────────────────────────────────

type FallbackVariant = "initials" | "icon" | "text" | "custom";
type ShapeVariant    = "square" | "rounded" | "circle";
type SizePreset      = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type ObjectFit       = "cover" | "contain" | "fill" | "none" | "scale-down";
type SkeletonStyle   = "pulse" | "shimmer" | "none";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AppImageProps
  extends Omit<NextImageProps, "src" | "alt" | "width" | "height" | "onError"> {
  // Core
  src:          string | null | undefined;
  alt:          string;

  // Dimensions — use preset OR explicit w/h OR fill
  size?:        SizePreset;          // xs=24 sm=32 md=40 lg=48 xl=64 2xl=96 (px)
  width?:       number;
  height?:      number;
  fill?:        boolean;
  aspectRatio?: string;              // e.g. "16/9", "4/3", "1/1" — used when fill=true or with explicit width only

  // Shape
  shape?:       ShapeVariant;        // default "square"
  borderRadius?: string;             // overrides shape (e.g. "12px")

  // Object fit
  objectFit?:   ObjectFit;           // default "cover"
  objectPosition?: string;           // default "center"

  // Loading state
  skeleton?:    SkeletonStyle;       // default "shimmer"

  // Fallback — shown when src is missing, null, or load error
  fallbackVariant?:  FallbackVariant;        // default "initials"
  fallbackText?:     string;                 // used for "initials" (auto-extracts) and "text"
  fallbackIcon?:     ReactNode;              // used for "icon" variant
  fallbackCustom?:   ReactNode;             // used for "custom" variant
  fallbackBg?:       string;                 // css color / gradient — auto-generated from text if omitted
  fallbackColor?:    string;                 // text / icon color (default white)
  fallbackFontSize?: string | number;        // override computed font size
  fallbackFontWeight?: string | number;      // default 600
  fallbackClassName?: string;

  // Overlay
  overlay?:     ReactNode;           // absolutely positioned on top of image (badge, play button, etc.)

  // Border
  border?:      string;              // e.g. "2px solid #fff"

  // Callbacks
  onLoad?:      () => void;
  onError?:     (e: React.SyntheticEvent<HTMLImageElement>) => void;

  // Container
  className?:   string;
  style?:       CSSProperties;
  containerClassName?: string;
  containerStyle?: CSSProperties;

  // Accessibility
  role?:        string;
  tabIndex?:    number;
  onClick?:     React.MouseEventHandler<HTMLDivElement>;
}

// ─── Size presets ─────────────────────────────────────────────────────────────

const SIZE_MAP: Record<SizePreset, number> = {
  xs:  24,
  sm:  32,
  md:  40,
  lg:  48,
  xl:  64,
  "2xl": 96,
};

// ─── Border-radius map ────────────────────────────────────────────────────────

const SHAPE_RADIUS: Record<ShapeVariant, string> = {
  square:  "0px",
  rounded: "8px",
  circle:  "50%",
};

// ─── Colour generation from string ───────────────────────────────────────────

const PALETTE = [
  ["#1a1a2e", "#e94560"],
  ["#0f3460", "#53d8fb"],
  ["#16213e", "#f5a623"],
  ["#2d3436", "#00cec9"],
  ["#6c3483", "#f1c40f"],
  ["#1e3a5f", "#e74c3c"],
  ["#2c3e50", "#27ae60"],
  ["#4a1942", "#e056fd"],
  ["#130f40", "#30336b"],
  ["#0a3d62", "#60a3bc"],
];

function stringToColours(str: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const pair = PALETTE[Math.abs(hash) % PALETTE.length]!;
  return { bg: pair[0]!, text: pair[1]! };
}

// ─── Initials extraction ──────────────────────────────────────────────────────

function extractInitials(text: string, max = 2): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) {
    return (words[0]!.slice(0, max)).toUpperCase();
  }
  return words
    .slice(0, max)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

const SHIMMER_KEYFRAMES = `
@keyframes _img_shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
@keyframes _img_pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: .4; }
}
`;

function injectKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById("__appimage_kf")) return;
  const s = document.createElement("style");
  s.id = "__appimage_kf";
  s.textContent = SHIMMER_KEYFRAMES;
  document.head.appendChild(s);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppImage({
  src,
  alt,
  size,
  width: widthProp,
  height: heightProp,
  fill = false,
  aspectRatio,
  shape = "square",
  borderRadius,
  objectFit = "cover",
  objectPosition = "center",
  skeleton = "shimmer",
  fallbackVariant = "initials",
  fallbackText,
  fallbackIcon,
  fallbackCustom,
  fallbackBg,
  fallbackColor,
  fallbackFontSize,
  fallbackFontWeight = 600,
  fallbackClassName = "",
  overlay,
  border,
  onLoad,
  onError,
  className = "",
  style,
  containerClassName = "",
  containerStyle,
  role,
  tabIndex,
  onClick,
  priority,
  quality,
  placeholder,
  blurDataURL,
  sizes,
  loader,
  unoptimized,
  ...rest
}: AppImageProps) {
  injectKeyframes();

  const [loaded,  setLoaded]  = useState(false);
  const [errored, setErrored] = useState(false);

  const hasSrc    = !!src && src.trim() !== "";
  const showImage = hasSrc && !errored;

  // ── Resolve dimensions ───────────────────────────────────────────────────
  const resolvedSize   = size ? SIZE_MAP[size] : undefined;
  const resolvedWidth  = fill ? undefined : (resolvedSize ?? widthProp);
  const resolvedHeight = fill ? undefined : (resolvedSize ?? heightProp ?? widthProp);

  // ── Border radius ────────────────────────────────────────────────────────
  const radius = borderRadius ?? SHAPE_RADIUS[shape];

  // ── Fallback colours ─────────────────────────────────────────────────────
  const seedText         = fallbackText ?? alt ?? "";
  const generated        = stringToColours(seedText);
  const resolvedFallBg   = fallbackBg    ?? generated.bg;
  const resolvedFallText = fallbackColor ?? generated.text;

  // ── Fallback font size: scales with resolved dimension ───────────────────
  const resolvedDim = resolvedWidth ?? resolvedHeight ?? 40;
  const computedFontSize =
    fallbackFontSize ??
    (typeof resolvedDim === "number"
      ? Math.max(10, Math.round(resolvedDim * 0.38))
      : "1rem");

  // ── Container sizing ─────────────────────────────────────────────────────
  const containerW = fill ? "100%" : resolvedWidth  ? `${resolvedWidth}px`  : "auto";
  const containerH = fill ? "100%" : resolvedHeight ? `${resolvedHeight}px` : "auto";

  const containerBaseStyle: CSSProperties = {
    position:     "relative",
    display:      "inline-flex",
    flexShrink:   0,
    width:        containerW,
    height:       fill && !aspectRatio ? containerH : undefined,
    aspectRatio:  aspectRatio ?? (fill && resolvedWidth && resolvedHeight ? `${resolvedWidth}/${resolvedHeight}` : undefined),
    borderRadius: radius,
    overflow:     "hidden",
    border,
    cursor:       onClick ? "pointer" : undefined,
    ...containerStyle,
  };

  // ── Skeleton style ────────────────────────────────────────────────────────
  const skeletonStyle: CSSProperties = {
    position:   "absolute",
    inset:      0,
    zIndex:     1,
    borderRadius: radius,
    display:    loaded || !showImage ? "none" : "block",
    ...(skeleton === "shimmer"
      ? {
          background: "linear-gradient(90deg, #e8e8e8 25%, #f5f5f5 50%, #e8e8e8 75%)",
          backgroundSize: "400px 100%",
          animation:  "_img_shimmer 1.4s ease infinite",
        }
      : skeleton === "pulse"
      ? { background: "#e0e0e0", animation: "_img_pulse 1.5s ease-in-out infinite" }
      : {}),
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleLoad = useCallback(() => {
    setLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setErrored(true);
      onError?.(e);
    },
    [onError],
  );

  // ── Fallback content ──────────────────────────────────────────────────────
  const renderFallback = () => {
    const fallStyle: CSSProperties = {
      position:        "absolute",
      inset:           0,
      display:         "flex",
      alignItems:      "center",
      justifyContent:  "center",
      background:      resolvedFallBg,
      color:           resolvedFallText,
      fontSize:        typeof computedFontSize === "number" ? `${computedFontSize}px` : computedFontSize,
      fontWeight:      fallbackFontWeight,
      letterSpacing:   "0.03em",
      userSelect:      "none",
      borderRadius:    radius,
      lineHeight:      1,
      fontFamily:      "'DM Sans', 'Trebuchet MS', sans-serif",
    };

    if (fallbackVariant === "custom" && fallbackCustom) {
      return <div style={fallStyle} className={fallbackClassName} aria-hidden>{fallbackCustom}</div>;
    }

    if (fallbackVariant === "icon" && fallbackIcon) {
      return <div style={fallStyle} className={fallbackClassName} aria-hidden>{fallbackIcon}</div>;
    }

    if (fallbackVariant === "text" && fallbackText) {
      return (
        <div style={{ ...fallStyle, fontSize: Math.max(10, Math.round(resolvedDim * 0.22)) + "px" }} className={fallbackClassName} aria-hidden>
          {fallbackText}
        </div>
      );
    }

    // Default: initials
    const initials = extractInitials(seedText);
    return (
      <div style={fallStyle} className={fallbackClassName} aria-label={alt} role="img">
        {initials}
      </div>
    );
  };

  return (
    <div
      style={containerBaseStyle}
      className={containerClassName}
      role={role}
      tabIndex={tabIndex}
      onClick={onClick}
    >
      {/* Skeleton */}
      {showImage && skeleton !== "none" && <div style={skeletonStyle} aria-hidden />}

      {/* Fallback — always mounted, hidden behind image when loaded */}
      {!showImage && renderFallback()}

      {/* Next.js Image */}
      {showImage && (
        <NextImage
          src={src!}
          alt={alt}
          {...(fill
            ? { fill: true }
            : {
                width:  resolvedWidth  as number,
                height: resolvedHeight as number,
              })}
          quality={quality}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          sizes={sizes}
          loader={loader}
          unoptimized={unoptimized}
          onLoad={handleLoad}
          onError={handleError}
          className={className}
          style={{
            objectFit,
            objectPosition,
            opacity:      loaded ? 1 : 0,
            transition:   "opacity 0.3s ease",
            borderRadius: radius,
            width:        fill ? "100%" : undefined,
            height:       fill ? "100%" : undefined,
            ...style,
          }}
          {...rest}
        />
      )}

      {/* Overlay slot */}
      {overlay && (
        <div
          style={{
            position: "absolute",
            inset:    0,
            zIndex:   2,
            borderRadius: radius,
            pointerEvents: "none",
          }}
          aria-hidden
        >
          {overlay}
        </div>
      )}
    </div>
  );
}

// ─── Compound variants (pre-wired for common use-cases) ───────────────────────

/** Circular avatar with automatic initials fallback */
export function Avatar(props: AppImageProps) {
  return <AppImage shape="circle" objectFit="cover" skeleton="shimmer" {...props} />;
}

/** Rounded card thumbnail, landscape aspect */
export function Thumbnail(props: AppImageProps & { ratio?: string }) {
  const { ratio = "16/9", ...rest } = props;
  return (
    <AppImage
      fill
      aspectRatio={ratio}
      shape="rounded"
      borderRadius="12px"
      objectFit="cover"
      skeleton="shimmer"
      fallbackVariant="icon"
      fallbackIcon={
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="m21 15-5-5L5 21"/>
        </svg>
      }
      {...rest}
    />
  );
}

/** Full-width hero / banner image */
export function HeroImage(props: AppImageProps) {
  return (
    <AppImage
      fill
      aspectRatio="21/9"
      shape="square"
      objectFit="cover"
      objectPosition="center"
      skeleton="shimmer"
      fallbackVariant="icon"
      fallbackIcon={
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="m21 15-5-5L5 21"/>
        </svg>
      }
      {...props}
    />
  );
}