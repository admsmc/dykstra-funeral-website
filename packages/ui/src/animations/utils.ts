/**
 * Animation Utilities
 * 
 * Common transition presets and easing curves for consistent animations.
 */

import { type Transition } from 'framer-motion';

// ============================================================================
// TRANSITION PRESETS
// ============================================================================

export const transitions = {
  // Spring physics (bouncy, natural feel)
  spring: {
    type: "spring",
    damping: 25,
    stiffness: 300,
  } as Transition,
  
  springBouncy: {
    type: "spring",
    damping: 15,
    stiffness: 400,
  } as Transition,
  
  springGentle: {
    type: "spring",
    damping: 30,
    stiffness: 200,
  } as Transition,
  
  // Eased timing functions
  ease: {
    duration: 0.3,
    ease: "easeOut",
  } as Transition,
  
  easeInOut: {
    duration: 0.3,
    ease: "easeInOut",
  } as Transition,
  
  easeIn: {
    duration: 0.3,
    ease: "easeIn",
  } as Transition,
  
  // Speed variations
  fast: {
    duration: 0.15,
    ease: "easeOut",
  } as Transition,
  
  normal: {
    duration: 0.3,
    ease: "easeOut",
  } as Transition,
  
  slow: {
    duration: 0.5,
    ease: "easeOut",
  } as Transition,
  
  // Special effects
  anticipate: {
    duration: 0.4,
    ease: [0.68, -0.55, 0.265, 1.55],  // Overshoot effect
  } as Transition,
} as const;

// ============================================================================
// EASING CURVES (Cubic Bezier)
// ============================================================================

export const easings = {
  // Standard Material Design easings
  easeOut: [0.16, 1, 0.3, 1],        // Deceleration
  easeIn: [0.7, 0, 0.84, 0],          // Acceleration
  easeInOut: [0.87, 0, 0.13, 1],      // Acceleration + Deceleration
  
  // Custom easings
  anticipate: [0.68, -0.55, 0.265, 1.55],  // Bouncy overshoot
  smooth: [0.4, 0, 0.2, 1],                // Smooth motion
  snappy: [0.25, 0.1, 0.25, 1],            // Quick and snappy
  
  // Apple-inspired easings
  appleEase: [0.4, 0, 0.6, 1],             // Apple's standard easing
  appleSpring: [0.32, 0.72, 0, 1],         // Apple's spring-like
} as const;

// ============================================================================
// DURATION PRESETS (in seconds)
// ============================================================================

export const durations = {
  instant: 0,
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  slower: 0.7,
  slowest: 1.0,
} as const;

// ============================================================================
// SPRING PRESETS
// ============================================================================

export const springs = {
  // Gentle, natural motion
  gentle: {
    type: "spring",
    damping: 30,
    stiffness: 200,
  } as Transition,
  
  // Default spring (good all-purpose)
  default: {
    type: "spring",
    damping: 25,
    stiffness: 300,
  } as Transition,
  
  // Snappy, responsive
  snappy: {
    type: "spring",
    damping: 20,
    stiffness: 400,
  } as Transition,
  
  // Bouncy, playful
  bouncy: {
    type: "spring",
    damping: 15,
    stiffness: 400,
  } as Transition,
  
  // Wobbly, attention-grabbing
  wobbly: {
    type: "spring",
    damping: 10,
    stiffness: 300,
  } as Transition,
} as const;

// ============================================================================
// STAGGER PRESETS (for list animations)
// ============================================================================

export const stagger = {
  fast: 0.03,
  normal: 0.05,
  slow: 0.1,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a stagger transition for list items
 */
export function createStagger(delayChildren = stagger.normal, staggerChildren = stagger.normal) {
  return {
    delayChildren,
    staggerChildren,
  };
}

/**
 * Creates a sequence transition where animations happen one after another
 */
export function createSequence(duration = durations.normal, stagger = 0.1) {
  return {
    duration,
    stagger,
  };
}

/**
 * Creates a spring transition with custom parameters
 */
export function createSpring(
  damping = 25,
  stiffness = 300,
  mass = 1
): Transition {
  return {
    type: "spring",
    damping,
    stiffness,
    mass,
  };
}

/**
 * Creates an eased transition with custom duration and easing
 */
export function createEase(
  duration = durations.normal,
  easing = easings.easeOut
): Transition {
  return {
    duration,
    ease: easing,
  };
}
