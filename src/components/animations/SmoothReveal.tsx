"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  type ElementType,
  type HTMLAttributes,
  type CSSProperties,
} from "react";
import {
  PHYSIOLOGICAL_RHYTHMS,
  CUBIC_BEZIERS,
  usePrefersReducedMotion,
} from "../../lib/animations/motionTokens";

export type RevealDirection = "up" | "down" | "left" | "right" | "none";

export interface SmoothRevealProps extends HTMLAttributes<HTMLElement> {
  /** Content to be smoothly revealed */
  children: React.ReactNode;
  /** Custom CSS class names applied to the container */
  className?: string;
  /**
   * HTML element or custom component to render as the container.
   * Defaults to 'div'. Can be 'section', 'article', 'aside', 'main', etc.
   */
  as?: ElementType;
  /**
   * Direction of translation prior to reveal.
   * Defaults to 'up' (subtle upward floating transition).
   */
  direction?: RevealDirection;
  /**
   * Spatial translation offset in pixels.
   * Defaults to 16px for subtle, neuro-calming motion.
   */
  distancePx?: number;
  /**
   * Animation duration in milliseconds.
   * Defaults to 220ms (Theta meditative relaxation transition cycle).
   */
  durationMs?: number;
  /**
   * Stagger or entrance delay in milliseconds.
   * Defaults to 0ms.
   */
  delayMs?: number;
  /**
   * Cubic-bezier easing curve for the transition.
   * Defaults to Theta Meditative Relaxation curve.
   */
  easing?: string;
  /**
   * IntersectionObserver visibility ratio threshold required to trigger reveal.
   * Defaults to 0.15.
   */
  threshold?: number;
  /**
   * IntersectionObserver rootMargin offset.
   * Defaults to '0px 0px -40px 0px' so sections reveal just before scrolling into view.
   */
  rootMargin?: string;
  /**
   * If true, keeps element revealed once triggered and tears down the observer.
   * Defaults to true.
   */
  triggerOnce?: boolean;
  /**
   * Explicitly disables animations and renders in a fully revealed state.
   */
  disabled?: boolean;
  /** Additional inline styles */
  style?: CSSProperties;
}

/**
 * Calculates initial translation offset string based on direction and distance.
 */
function getInitialTransform(
  direction: RevealDirection,
  distancePx: number
): string {
  switch (direction) {
    case "up":
      return `translate3d(0, ${distancePx}px, 0)`;
    case "down":
      return `translate3d(0, -${distancePx}px, 0)`;
    case "left":
      return `translate3d(${distancePx}px, 0, 0)`;
    case "right":
      return `translate3d(-${distancePx}px, 0, 0)`;
    case "none":
    default:
      return "translate3d(0, 0, 0)";
  }
}

/**
 * Accessible, hardware-accelerated wrapper component for smooth section entries.
 *
 * Features:
 * - Uses 3D transforms (`translate3d`) and opacity for 60fps GPU acceleration.
 * - Automatically detects and adapts to `prefers-reduced-motion` with instant opacity fades.
 * - Automatically releases `will-change` properties upon transition completion to prevent GPU memory bloat.
 * - Integrates with IntersectionObserver with zero unnecessary layout recalculations.
 */
export function SmoothReveal({
  children,
  className = "",
  as: Component = "div",
  direction = "up",
  distancePx = 16,
  durationMs = PHYSIOLOGICAL_RHYTHMS.THETA_WAVE.RELAXATION_TRANSITION_MS,
  delayMs = 0,
  easing = CUBIC_BEZIERS.thetaRelaxation,
  threshold = 0.15,
  rootMargin = "0px 0px -40px 0px",
  triggerOnce = true,
  disabled = false,
  style,
  onTransitionEnd,
  ...restProps
}: SmoothRevealProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isTransitionDone, setIsTransitionDone] = useState<boolean>(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  // IntersectionObserver for viewport entrance detection
  useEffect(() => {
    if (disabled) return;

    const node = containerRef.current;
    if (!node) return;

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      // Fallback for non-browser environments: reveal asynchronously without effect cascading
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 0);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
          setIsTransitionDone(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [disabled, threshold, rootMargin, triggerOnce]);

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLElement>) => {
      // Only mark transition done when our own container finishes
      if (e.target === containerRef.current) {
        setIsTransitionDone(true);
      }
      if (onTransitionEnd) {
        onTransitionEnd(e);
      }
    },
    [onTransitionEnd]
  );

  // Derive revealed status
  const effectiveRevealed = disabled || isVisible;
  const shouldAnimate = !disabled && !prefersReducedMotion;
  const initialTransform = getInitialTransform(direction, distancePx);

  let transitionStyle = "none";
  let opacityStyle = 1;
  let transformStyle = "translate3d(0, 0, 0)";
  let willChangeStyle = "auto";

  if (disabled) {
    opacityStyle = 1;
    transformStyle = "none";
    transitionStyle = "none";
    willChangeStyle = "auto";
  } else if (prefersReducedMotion) {
    // Instant or ultra-subtle opacity fade respecting WCAG accessibility
    transitionStyle = `opacity 50ms linear ${delayMs}ms`;
    opacityStyle = effectiveRevealed ? 1 : 0;
    transformStyle = "none";
    willChangeStyle = effectiveRevealed && !isTransitionDone ? "opacity" : "auto";
  } else if (!effectiveRevealed) {
    // Hidden pre-reveal state
    opacityStyle = 0;
    transformStyle = initialTransform;
    transitionStyle = "none";
    willChangeStyle = "transform, opacity";
  } else {
    // Revealed state
    opacityStyle = 1;
    transformStyle = "translate3d(0, 0, 0)";
    transitionStyle = `transform ${durationMs}ms ${easing} ${delayMs}ms, opacity ${durationMs}ms ${easing} ${delayMs}ms`;
    // Hardware acceleration during motion, released after completion to save GPU VRAM
    willChangeStyle = isTransitionDone ? "auto" : "transform, opacity";
  }

  const mergedStyle: CSSProperties = {
    opacity: opacityStyle,
    transform: transformStyle,
    transition: transitionStyle,
    willChange: willChangeStyle,
    backfaceVisibility: shouldAnimate ? "hidden" : "visible",
    ...style,
  };

  return (
    <Component
      ref={containerRef}
      className={className}
      style={mergedStyle}
      onTransitionEnd={handleTransitionEnd}
      {...restProps}
    >
      {children}
    </Component>
  );
}

export default SmoothReveal;
