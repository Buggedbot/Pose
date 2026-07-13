import * as THREE from 'three'

// A pose is a set of per-bone local-rotation deltas (in degrees) applied on top of the
// model's rest (T-pose) orientation. Bones not listed stay at rest. Keyed by the VRoid
// standard bone names in the bundled model.
//
// Verified sign conventions for this rig:
//   - Upper arm Z: negative lowers the LEFT arm to her side / raises it overhead when large
//     positive; mirrored for the right arm.
//   - Lower arm Y: curls the forearm inward across the body (negative for left, positive
//     for right); X bends it backward/forward.
export type Pose = Record<string, [number, number, number]>

// One pose per scroll section — the seasons: Summer → Autumn → Winter → Spring → finale.
export const POSES: Pose[] = [
  // 0 — SUMMER: sunny greeting, right arm up in a wave
  {
    J_Bip_L_UpperArm: [0, 0, -66],
    J_Bip_R_UpperArm: [0, 0, -128],
    J_Bip_R_LowerArm: [0, 22, 0],
    J_Bip_C_Spine: [0, 5, 0],
    J_Bip_C_Head: [-4, 0, 8],
  },
  // 1 — AUTUMN: wind-blown contrapposto, glancing at falling leaves
  {
    J_Bip_C_Hips: [0, -14, 0],
    J_Bip_C_Spine: [0, 18, 3],
    J_Bip_C_UpperChest: [0, 8, 0],
    J_Bip_L_UpperArm: [0, 0, -50],
    J_Bip_R_UpperArm: [0, 0, 62],
    J_Bip_R_LowerArm: [0, 35, 0],
    J_Bip_R_UpperLeg: [10, 0, 0],
    J_Bip_C_Head: [-6, -16, 0],
  },
  // 2 — WINTER: bracing against the cold, arms hugged in, head tucked
  {
    J_Bip_L_UpperArm: [0, 0, -58],
    J_Bip_R_UpperArm: [0, 0, 58],
    J_Bip_L_LowerArm: [0, -125, 0],
    J_Bip_R_LowerArm: [0, 125, 0],
    J_Bip_C_Spine: [9, 0, 0],
    J_Bip_C_Head: [14, 0, 4],
  },
  // 3 — SPRING: blossoming stretch, arms open to the sky in a wide Y
  {
    J_Bip_L_UpperArm: [0, 0, 100],
    J_Bip_R_UpperArm: [0, 0, -100],
    J_Bip_C_Spine: [-7, 0, 0],
    J_Bip_C_Head: [-10, 0, 0],
  },
  // 4 — FINALE: playful fashion pose beside the call to action
  {
    J_Bip_C_Hips: [0, 14, 0],
    J_Bip_C_Spine: [0, -16, 0],
    J_Bip_L_UpperArm: [0, 0, 100],
    J_Bip_R_UpperArm: [0, 0, 58],
    J_Bip_L_UpperLeg: [8, 0, 0],
    J_Bip_C_Head: [4, 12, 0],
  },
]

export interface BoneRest {
  bone: THREE.Bone
  rest: THREE.Quaternion
}

const ZERO: [number, number, number] = [0, 0, 0]
const _euler = new THREE.Euler()
const _delta = new THREE.Quaternion()
const _result = new THREE.Quaternion()

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

// Given the scroll offset (0..1), blend between adjacent pose keyframes and write the
// resulting local rotation onto every tracked bone (unlisted bones fall back to rest).
export function applyScrollPose(bones: Map<string, BoneRest>, offset: number) {
  const n = POSES.length - 1
  const t = THREE.MathUtils.clamp(offset, 0, 1) * n
  const i = Math.min(Math.floor(t), n - 1)
  const f = THREE.MathUtils.smoothstep(t - i, 0, 1)
  const a = POSES[i]
  const b = POSES[i + 1]

  for (const [name, { bone, rest }] of bones) {
    const ra = a[name] ?? ZERO
    const rb = b[name] ?? ZERO
    _euler.set(
      THREE.MathUtils.degToRad(lerp(ra[0], rb[0], f)),
      THREE.MathUtils.degToRad(lerp(ra[1], rb[1], f)),
      THREE.MathUtils.degToRad(lerp(ra[2], rb[2], f)),
    )
    _delta.setFromEuler(_euler)
    _result.multiplyQuaternions(rest, _delta)
    bone.quaternion.copy(_result)
  }
}
