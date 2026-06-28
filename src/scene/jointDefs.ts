export type Axis = 'x' | 'y' | 'z'

export interface RotationLimit {
  min: number // degrees
  max: number // degrees
}

export interface BoneDef {
  id: string
  parent: string | null
  label: string
  /** Position of this bone's pivot relative to its parent's pivot, in the parent's local space (meters). */
  position: [number, number, number]
  /** Length of the bone segment along its local Y axis (meters). */
  length: number
  /** Radius of the capsule used to render the segment (meters). */
  radius: number
  /** Local-axis rotation limits in degrees. Omitted axis defaults to locked (0). */
  limits: Partial<Record<Axis, RotationLimit>>
  /** Capsule's long axis; defaults to 'y'. Feet use 'z' so they point forward. */
  axis?: Axis
  /** Which way along the axis this segment's capsule is drawn from its pivot. Limbs that hang down at rest use -1. */
  direction?: 1 | -1
  /** Default resting rotation in degrees (used for a relaxed A-pose instead of a stiff T-pose). */
  defaultRotation?: Partial<Record<Axis, number>>
}

// A female figure-drawing mannequin, roughly 7.5 heads tall (~1.66m), built as an FK chain.
// Each bone's `position` is the offset from its parent's pivot to this bone's pivot, and each
// bone is drawn as a capsule running from its own pivot to `length` along its local Y axis, so
// rotating a bone's group naturally swings everything attached below it.
export const boneDefs: BoneDef[] = [
  // Core
  { id: 'hips', parent: null, label: 'Hips', position: [0, 0.92, 0], length: 0.11, radius: 0.15, limits: { x: { min: -20, max: 20 }, y: { min: -45, max: 45 }, z: { min: -15, max: 15 } } },
  { id: 'spine', parent: 'hips', label: 'Waist', position: [0, 0.11, 0], length: 0.16, radius: 0.105, limits: { x: { min: -35, max: 45 }, y: { min: -35, max: 35 }, z: { min: -25, max: 25 } } },
  { id: 'chest', parent: 'spine', label: 'Chest', position: [0, 0.16, 0], length: 0.22, radius: 0.135, limits: { x: { min: -25, max: 35 }, y: { min: -30, max: 30 }, z: { min: -20, max: 20 } } },
  { id: 'neck', parent: 'chest', label: 'Neck', position: [0, 0.22, 0], length: 0.06, radius: 0.045, limits: { x: { min: -35, max: 35 }, y: { min: -50, max: 50 }, z: { min: -25, max: 25 } } },
  { id: 'head', parent: 'neck', label: 'Head', position: [0, 0.06, 0], length: 0.22, radius: 0.105, limits: { x: { min: -30, max: 30 }, y: { min: -70, max: 70 }, z: { min: -30, max: 30 } } },

  // Left arm (mannequin's left = -X)
  { id: 'leftShoulder', parent: 'chest', label: 'L Shoulder', position: [-0.135, 0.19, 0], length: 0.06, radius: 0.05, limits: { x: { min: -20, max: 40 }, y: { min: -15, max: 15 }, z: { min: -10, max: 35 } }, defaultRotation: { z: -8 } },
  { id: 'leftUpperArm', parent: 'leftShoulder', label: 'L Upper Arm', position: [-0.06, 0, 0], length: 0.27, radius: 0.045, direction: -1, limits: { x: { min: -100, max: 170 }, y: { min: -90, max: 90 }, z: { min: -175, max: 60 } }, defaultRotation: { z: -12 } },
  { id: 'leftForearm', parent: 'leftUpperArm', label: 'L Forearm', position: [0, -0.27, 0], length: 0.25, radius: 0.038, direction: -1, limits: { x: { min: -10, max: 150 }, y: { min: -80, max: 80 }, z: { min: -10, max: 10 } } },
  { id: 'leftHand', parent: 'leftForearm', label: 'L Hand', position: [0, -0.25, 0], length: 0.17, radius: 0.032, direction: -1, limits: { x: { min: -60, max: 60 }, y: { min: -25, max: 25 }, z: { min: -20, max: 20 } } },

  // Right arm
  { id: 'rightShoulder', parent: 'chest', label: 'R Shoulder', position: [0.135, 0.19, 0], length: 0.06, radius: 0.05, limits: { x: { min: -20, max: 40 }, y: { min: -15, max: 15 }, z: { min: -35, max: 10 } }, defaultRotation: { z: 8 } },
  { id: 'rightUpperArm', parent: 'rightShoulder', label: 'R Upper Arm', position: [0.06, 0, 0], length: 0.27, radius: 0.045, direction: -1, limits: { x: { min: -100, max: 170 }, y: { min: -90, max: 90 }, z: { min: -60, max: 175 } }, defaultRotation: { z: 12 } },
  { id: 'rightForearm', parent: 'rightUpperArm', label: 'R Forearm', position: [0, -0.27, 0], length: 0.25, radius: 0.038, direction: -1, limits: { x: { min: -10, max: 150 }, y: { min: -80, max: 80 }, z: { min: -10, max: 10 } } },
  { id: 'rightHand', parent: 'rightForearm', label: 'R Hand', position: [0, -0.25, 0], length: 0.17, radius: 0.032, direction: -1, limits: { x: { min: -60, max: 60 }, y: { min: -25, max: 25 }, z: { min: -20, max: 20 } } },

  // Left leg
  { id: 'leftUpperLeg', parent: 'hips', label: 'L Thigh', position: [-0.095, -0.03, 0], length: 0.43, radius: 0.075, direction: -1, limits: { x: { min: -70, max: 120 }, y: { min: -40, max: 40 }, z: { min: -90, max: 40 } } },
  { id: 'leftLowerLeg', parent: 'leftUpperLeg', label: 'L Shin', position: [0, -0.43, 0], length: 0.4, radius: 0.058, direction: -1, limits: { x: { min: -150, max: 5 }, y: { min: -10, max: 10 }, z: { min: -5, max: 5 } } },
  { id: 'leftFoot', parent: 'leftLowerLeg', label: 'L Foot', position: [0, -0.4, 0], length: 0.23, radius: 0.045, axis: 'z', limits: { x: { min: -25, max: 50 }, y: { min: -20, max: 20 }, z: { min: -20, max: 20 } } },

  // Right leg
  { id: 'rightUpperLeg', parent: 'hips', label: 'R Thigh', position: [0.095, -0.03, 0], length: 0.43, radius: 0.075, direction: -1, limits: { x: { min: -70, max: 120 }, y: { min: -40, max: 40 }, z: { min: -40, max: 90 } } },
  { id: 'rightLowerLeg', parent: 'rightUpperLeg', label: 'R Shin', position: [0, -0.43, 0], length: 0.4, radius: 0.058, direction: -1, limits: { x: { min: -150, max: 5 }, y: { min: -10, max: 10 }, z: { min: -5, max: 5 } } },
  { id: 'rightFoot', parent: 'rightLowerLeg', label: 'R Foot', position: [0, -0.4, 0], length: 0.23, radius: 0.045, axis: 'z', limits: { x: { min: -25, max: 50 }, y: { min: -20, max: 20 }, z: { min: -20, max: 20 } } },
]

export const boneMap: Record<string, BoneDef> = boneDefs.reduce((acc, b) => {
  acc[b.id] = b
  return acc
}, {} as Record<string, BoneDef>)

export function getChildren(id: string | null): BoneDef[] {
  return boneDefs.filter((b) => b.parent === id)
}

export const rootBones = getChildren(null)

export const AXES: Axis[] = ['x', 'y', 'z']

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function clampToLimit(bone: BoneDef, axis: Axis, degrees: number): number {
  const limit = bone.limits[axis]
  if (!limit) return 0
  return clamp(degrees, limit.min, limit.max)
}
