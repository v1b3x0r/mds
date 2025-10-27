/**
 * MDS v5.2 - Validator Entry Point (Separate Bundle)
 * For development and testing only - not included in main bundle
 */

export { validateMaterial } from './0-foundation/mdm-validator'
export type {
  ValidationError,
  ValidationResult,
  ValidationOptions
} from './0-foundation/mdm-validator'
