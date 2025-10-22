/**
 * MDS v5.2 - Validator Entry Point (Separate Bundle)
 * For development and testing only - not included in main bundle
 */

export { validateMaterial } from './core/mdm-validator'
export type {
  ValidationError,
  ValidationResult,
  ValidationOptions
} from './core/mdm-validator'
