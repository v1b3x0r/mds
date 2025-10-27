/**
 * MDS v5.2 - Communication Type Definitions
 * Shared interfaces to break Entity ↔ Communication circular dependency
 *
 * These minimal interfaces allow communication modules to work with entities
 * without importing the full Entity class, breaking circular dependencies.
 *
 * IMPORTANT: This file must NOT import from other communication modules
 * to avoid circular dependencies. Use forward references (unknown) instead.
 */
export {};
