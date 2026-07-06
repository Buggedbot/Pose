import { boneMap, clamp, type Axis, type RotationLimit } from './jointDefs'
import type { DynamicBoneDef } from './customModel'

export type Mode = 'procedural' | 'custom'

const OPEN_LIMIT: RotationLimit = { min: -180, max: 180 }
const OPEN_LIMITS: Partial<Record<Axis, RotationLimit>> = { x: OPEN_LIMIT, y: OPEN_LIMIT, z: OPEN_LIMIT }

// Imported rigs have no known anatomical constraints, so every axis gets a full
// -180..180 range instead of the curated limits used for the procedural mannequin.
export function boneLabel(mode: Mode, boneId: string, customTree: DynamicBoneDef[]): string {
  if (mode === 'procedural') return boneMap[boneId]?.label ?? boneId
  return customTree.find((b) => b.id === boneId)?.label ?? boneId
}

export function boneLimits(mode: Mode, boneId: string): Partial<Record<Axis, RotationLimit>> {
  if (mode === 'procedural') return boneMap[boneId]?.limits ?? {}
  return OPEN_LIMITS
}

export function clampToBoneLimit(mode: Mode, boneId: string, axis: Axis, degrees: number): number {
  const limit = boneLimits(mode, boneId)[axis]
  if (!limit) return 0
  return clamp(degrees, limit.min, limit.max)
}
