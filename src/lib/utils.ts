// src/lib/utils.ts

/**
 * Tiny classnames helper: joins truthy class strings.
 * Usage: cn("base", isActive && "active", isError && "text-red-500")
 */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Simple sleep helper for demos.
 */
export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * Random utility (stable with optional seed)
 */
export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
