"use client";

import { motion } from 'framer-motion';
import { listItemAnimations } from '@dykstra/ui';
import { ReactNode } from 'react';

export interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
}

/**
 * AnimatedList - Applies stagger animation to list items
 * 
 * Usage:
 * ```tsx
 * <AnimatedList>
 *   {items.map((item) => (
 *     <div key={item.id}>{item.name}</div>
 *   ))}
 * </AnimatedList>
 * ```
 */
export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <motion.div
          key={index}
          custom={index}
          initial="hidden"
          animate="visible"
          variants={listItemAnimations}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}
