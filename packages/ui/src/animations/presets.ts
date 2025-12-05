/**
 * Animation Presets - 2025 Micro-Interactions
 * 
 * Comprehensive Framer Motion variants for all interactive components.
 * These animations make the UI feel alive and responsive.
 */

import { Variants } from 'framer-motion';

// ============================================================================
// BUTTON ANIMATIONS
// ============================================================================

export const buttonVariants: Variants = {
  idle: { 
    scale: 1, 
    boxShadow: "0 2px 4px rgba(30, 58, 95, 0.1)" 
  },
  hover: { 
    scale: 1.02, 
    boxShadow: "0 4px 12px rgba(30, 58, 95, 0.15)",
    transition: { duration: 0.2, ease: "easeOut" }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  },
  loading: {
    opacity: [1, 0.7, 1],
    transition: { 
      repeat: Infinity, 
      duration: 1.5,
      ease: "easeInOut"
    }
  },
  success: {
    scale: [1, 1.05, 1],
    boxShadow: [
      "0 2px 4px rgba(30, 58, 95, 0.1)",
      "0 10px 25px rgba(16, 185, 129, 0.3)",
      "0 2px 4px rgba(30, 58, 95, 0.1)"
    ],
    transition: { duration: 0.6 }
  },
  error: {
    x: [-2, 2, -2, 2, 0],  // Shake animation
    transition: { duration: 0.4 }
  },
};

// ============================================================================
// INPUT FIELD ANIMATIONS
// ============================================================================

export const inputVariants: Variants = {
  blur: { 
    borderColor: "var(--border)",
    boxShadow: "none" 
  },
  focus: { 
    borderColor: "var(--primary)",
    boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.1)",
    transition: { duration: 0.2 }
  },
  error: {
    borderColor: "var(--error)",
    x: [-2, 2, -2, 2, 0],
    transition: { duration: 0.4 }
  },
  success: {
    borderColor: "var(--success)",
    transition: { duration: 0.2 }
  },
};

// ============================================================================
// MODAL/DIALOG ANIMATIONS
// ============================================================================

export const modalVariants: Variants = {
  hidden: { 
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  visible: { 
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { 
      type: "spring", 
      damping: 25, 
      stiffness: 300 
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 }
  }
};

export const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

// ============================================================================
// TOAST NOTIFICATION ANIMATIONS
// ============================================================================

export const toastVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.3,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
};

// ============================================================================
// CARD ANIMATIONS
// ============================================================================

export const cardVariants: Variants = {
  idle: {
    scale: 1,
    boxShadow: "0 4px 6px -1px rgba(30, 58, 95, 0.1)",
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: "0 20px 25px -5px rgba(30, 58, 95, 0.15)",
    transition: { duration: 0.3 }
  },
};

// ============================================================================
// LIST ANIMATIONS (Stagger effect)
// ============================================================================

export const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const listItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3 }
  },
};

// ============================================================================
// SKELETON LOADING ANIMATIONS
// ============================================================================

export const skeletonVariants: Variants = {
  pulse: {
    opacity: [0.5, 1, 0.5],
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: "easeInOut",
    },
  },
};

// ============================================================================
// SUCCESS CELEBRATION ANIMATIONS
// ============================================================================

export const celebrationVariants: Variants = {
  initial: { scale: 1, rotate: 0 },
  celebrate: {
    scale: [1, 1.2, 1],
    rotate: [0, 10, -10, 0],
    transition: { duration: 0.6 }
  },
};

// ============================================================================
// DROPDOWN/MENU ANIMATIONS
// ============================================================================

export const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: { duration: 0.15 },
  },
};

// ============================================================================
// PAGE TRANSITION ANIMATIONS
// ============================================================================

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

// ============================================================================
// ACCORDION ANIMATIONS
// ============================================================================

export const accordionVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.3 },
      opacity: { duration: 0.2 },
    },
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: {
      height: { duration: 0.3 },
      opacity: { duration: 0.2, delay: 0.1 },
    },
  },
};

// ============================================================================
// TOOLTIP/POPOVER ANIMATIONS
// ============================================================================

export const tooltipVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 400,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.15 },
  },
};

// ============================================================================
// FADE ANIMATIONS (Simple in/out)
// ============================================================================

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  },
};

// ============================================================================
// SLIDE ANIMATIONS (From sides)
// ============================================================================

export const slideFromRightVariants: Variants = {
  hidden: { x: "100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", damping: 25, stiffness: 300 },
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

export const slideFromLeftVariants: Variants = {
  hidden: { x: "-100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", damping: 25, stiffness: 300 },
  },
  exit: {
    x: "-100%",
    opacity: 0,
    transition: { duration: 0.2 },
  },
};
