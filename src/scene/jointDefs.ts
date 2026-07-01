export type Axis = 'x' | 'y' | 'z'

export interface RotationLimit {
  min: number // degrees
  max: number // degrees
}

export type BoneShape = 'segment' | 'head' | 'hand' | 'foot'

export interface BoneDef {
  id: string
  parent: string | null
  label: string
  /** Position of this bone's pivot relative to its parent's pivot, in the parent's local space (meters). */
  position: [number, number, number]
  /** Length of the bone segment along its local axis (meters). */
  length: number
  /** Radius of the limb at the pivot (near) end — used for the blending joint and the cylinder's near cap. */
  radiusNear: number
  /** Radius of the limb at the far (tip) end — lets limbs taper the way real ones do. */
  radiusFar: number
  /** Local-axis rotation limits in degrees. Omitted axis defaults to locked (0). */
  limits: Partial<Record<Axis, RotationLimit>>
  /** Capsule's long axis; defaults to 'y'. Feet use 'z' so they point forward. */
  axis?: Axis
  /** Which way along the axis this segment is drawn from its pivot. Limbs that hang down at rest use -1. */
  direction?: 1 | -1
  /** How this bone is rendered. Defaults to a tapered fleshy segment. */
  shape?: BoneShape
  /** Adds a subtle bust to give the chest a clearly feminine read. */
  bust?: boolean
  /** Default resting rotation in degrees (a relaxed A-pose rather than a stiff T-pose). */
  defaultRotation?: Partial<Record<Axis, number>>
}

// A stylized female human figure, roughly 7.5 heads tall (~1.66m), built as an FK chain.
// Each bone's `position` is the offset from its parent's pivot to this bone's pivot; each bone
// is drawn as a tapered form running `length` along its local axis, and skin-colored joint balls
// bridge the segments so the body reads as one continuous, smooth human rather than loose parts.
export const boneDefs: BoneDef[] = [
  // Core
  { id: 'hips', parent: null, label: 'Hips', position: [0, 0.92, 0], length: 0.12, radiusNear: 0.145, radiusFar: 0.10, limits: { x: { min: -20, max: 20 }, y: { min: -45, max: 45 }, z: { min: -15, max: 15 } } },
  { id: 'spine', parent: 'hips', label: 'Waist', position: [0, 0.12, 0], length: 0.16, radiusNear: 0.10, radiusFar: 0.115, limits: { x: { min: -35, max: 45 }, y: { min: -35, max: 35 }, z: { min: -25, max: 25 } } },
  { id: 'chest', parent: 'spine', label: 'Chest', position: [0, 0.16, 0], length: 0.22, radiusNear: 0.115, radiusFar: 0.135, bust: true, limits: { x: { min: -25, max: 35 }, y: { min: -30, max: 30 }, z: { min: -20, max: 20 } } },
  { id: 'neck', parent: 'chest', label: 'Neck', position: [0, 0.2, 0], length: 0.08, radiusNear: 0.05, radiusFar: 0.045, limits: { x: { min: -35, max: 35 }, y: { min: -50, max: 50 }, z: { min: -25, max: 25 } } },
  { id: 'head', parent: 'neck', label: 'Head', position: [0, 0.08, 0], length: 0.24, radiusNear: 0.115, radiusFar: 0.115, shape: 'head', limits: { x: { min: -30, max: 30 }, y: { min: -70, max: 70 }, z: { min: -30, max: 30 } } },

  // Left arm (figure's left = -X)
  { id: 'leftShoulder', parent: 'chest', label: 'L Shoulder', position: [-0.135, 0.17, 0], length: 0.06, radiusNear: 0.055, radiusFar: 0.05, limits: { x: { min: -20, max: 40 }, y: { min: -15, max: 15 }, z: { min: -10, max: 35 } }, defaultRotation: { z: -8 } },
  { id: 'leftUpperArm', parent: 'leftShoulder', label: 'L Upper Arm', position: [-0.06, 0, 0], length: 0.27, radiusNear: 0.05, radiusFar: 0.037, direction: -1, limits: { x: { min: -100, max: 170 }, y: { min: -90, max: 90 }, z: { min: -175, max: 60 } }, defaultRotation: { z: -12 } },
  { id: 'leftForearm', parent: 'leftUpperArm', label: 'L Forearm', position: [0, -0.27, 0], length: 0.25, radiusNear: 0.037, radiusFar: 0.027, direction: -1, limits: { x: { min: -10, max: 150 }, y: { min: -80, max: 80 }, z: { min: -10, max: 10 } } },
  { id: 'leftHand', parent: 'leftForearm', label: 'L Hand', position: [0, -0.25, 0], length: 0.18, radiusNear: 0.03, radiusFar: 0.03, direction: -1, shape: 'hand', limits: { x: { min: -60, max: 60 }, y: { min: -25, max: 25 }, z: { min: -20, max: 20 } } },

  // Right arm
  { id: 'rightShoulder', parent: 'chest', label: 'R Shoulder', position: [0.135, 0.17, 0], length: 0.06, radiusNear: 0.055, radiusFar: 0.05, limits: { x: { min: -20, max: 40 }, y: { min: -15, max: 15 }, z: { min: -35, max: 10 } }, defaultRotation: { z: 8 } },
  { id: 'rightUpperArm', parent: 'rightShoulder', label: 'R Upper Arm', position: [0.06, 0, 0], length: 0.27, radiusNear: 0.05, radiusFar: 0.037, direction: -1, limits: { x: { min: -100, max: 170 }, y: { min: -90, max: 90 }, z: { min: -60, max: 175 } }, defaultRotation: { z: 12 } },
  { id: 'rightForearm', parent: 'rightUpperArm', label: 'R Forearm', position: [0, -0.27, 0], length: 0.25, radiusNear: 0.037, radiusFar: 0.027, direction: -1, limits: { x: { min: -10, max: 150 }, y: { min: -80, max: 80 }, z: { min: -10, max: 10 } } },
  { id: 'rightHand', parent: 'rightForearm', label: 'R Hand', position: [0, -0.25, 0], length: 0.18, radiusNear: 0.03, radiusFar: 0.03, direction: -1, shape: 'hand', limits: { x: { min: -60, max: 60 }, y: { min: -25, max: 25 }, z: { min: -20, max: 20 } } },

  // Left leg
  { id: 'leftUpperLeg', parent: 'hips', label: 'L Thigh', position: [-0.095, -0.03, 0], length: 0.43, radiusNear: 0.088, radiusFar: 0.055, direction: -1, limits: { x: { min: -70, max: 120 }, y: { min: -40, max: 40 }, z: { min: -90, max: 40 } } },
  { id: 'leftLowerLeg', parent: 'leftUpperLeg', label: 'L Shin', position: [0, -0.43, 0], length: 0.4, radiusNear: 0.052, radiusFar: 0.032, direction: -1, limits: { x: { min: -150, max: 5 }, y: { min: -10, max: 10 }, z: { min: -5, max: 5 } } },
  { id: 'leftFoot', parent: 'leftLowerLeg', label: 'L Foot', position: [0, -0.4, 0], length: 0.24, radiusNear: 0.045, radiusFar: 0.045, axis: 'z', shape: 'foot', limits: { x: { min: -25, max: 50 }, y: { min: -20, max: 20 }, z: { min: -20, max: 20 } } },

  // Right leg
  { id: 'rightUpperLeg', parent: 'hips', label: 'R Thigh', position: [0.095, -0.03, 0], length: 0.43, radiusNear: 0.088, radiusFar: 0.055, direction: -1, limits: { x: { min: -70, max: 120 }, y: { min: -40, max: 40 }, z: { min: -40, max: 90 } } },
  { id: 'rightLowerLeg', parent: 'rightUpperLeg', label: 'R Shin', position: [0, -0.43, 0], length: 0.4, radiusNear: 0.052, radiusFar: 0.032, direction: -1, limits: { x: { min: -150, max: 5 }, y: { min: -10, max: 10 }, z: { min: -5, max: 5 } } },
  { id: 'rightFoot', parent: 'rightLowerLeg', label: 'R Foot', position: [0, -0.4, 0], length: 0.24, radiusNear: 0.045, radiusFar: 0.045, axis: 'z', shape: 'foot', limits: { x: { min: -25, max: 50 }, y: { min: -20, max: 20 }, z: { min: -20, max: 20 } } },
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
