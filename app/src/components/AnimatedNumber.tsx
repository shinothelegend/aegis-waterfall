import { useEffect, useRef } from 'react';
import { useMotionValue, useSpring, useTransform, animate } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 2 }: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 60, damping: 15 });
  const displayValue = useTransform(springValue, (latest) => 
    `${prefix}${latest.toFixed(decimals)}${suffix}`
  );

  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Respect user prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      if (elementRef.current) {
        elementRef.current.textContent = `${prefix}${value.toFixed(decimals)}${suffix}`;
      }
      return;
    }

    const controls = animate(motionValue, value, { duration: 1.0, ease: 'easeOut' });
    return () => controls.stop();
  }, [value, motionValue, prefix, suffix, decimals]);

  useEffect(() => {
    // Directly update text content to prevent react re-render thrashing during ticks
    return displayValue.onChange((latest) => {
      if (elementRef.current) {
        elementRef.current.textContent = latest;
      }
    });
  }, [displayValue]);

  return (
    <span ref={elementRef} className="tabular-nums font-display">
      {prefix}0.00{suffix}
    </span>
  );
}
