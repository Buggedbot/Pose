import * as THREE from 'three'

// A pose is a set of per-bone local-rotation deltas (in degrees) applied on top of the
// model's rest (T-pose) orientation. Bones not listed stay at rest. Keyed by the VRoid
// standard bone names in the bundled model.
export type Pose = Record<string, [number, number, number]>

// Direction guide for this rig (verified): lowering an arm to the side is Z-negative for the
// left arm and Z-positive for the right; raising overhead is the opposite sign.
export const POSES: Pose[] = [
  // 0 — Hero: relaxed A-pose
  {
    J_Bip_L_UpperArm: [0, 0, -68],
    J_Bip_R_UpperArm: [0, 0, 68],
    J_Bip_C_Head: [5, 0, 0],
  },
  // 1 — Greeting: right arm raised in a wave
  {
    J_Bip_L_UpperArm: [0, 0, -66],
    J_Bip_R_UpperArm: [0, 0, -118],
    J_Bip_C_Spine: [0, 6, 0],
    J_Bip_C_Head: [3, 0, 10],
  },
  // 2 — Contrapposto twist
  {
    J_Bip_C_Hips: [0, -12, 0],
    J_Bip_C_Spine: [0, 16, 0],
    J_Bip_C_UpperChest: [0, 8, 0],
    J_Bip_L_UpperArm: [0, 0, -54],
    J_Bip_R_UpperArm: [0, 0, 64],
    J_Bip_R_UpperLeg: [10, 0, 0],
    J_Bip_C_Head: [0, -12, 0],
  },
  // 3 — Both arms raised in a stretch
  {
    J_Bip_L_UpperArm: [0, 0, 120],
    J_Bip_R_UpperArm: [0, 0, -120],
    J_Bip_C_Spine: [-6, 0, 0],
    J_Bip_C_Head: [-8, 0, 0],
  },
  // 4 — Dynamic fashion pose: left arm up, big hip sway
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
  const f = t - i
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
