import * as THREE from 'three'

// The landing hero can be any rigged humanoid, and different rigs name their bones
// differently (VRoid `J_Bip_L_UpperArm`, Unreal `upperarm_l`, Mixamo `LeftArm`, …). So
// poses are authored against abstract humanoid ROLES, and each role is resolved to the
// actual bone at load time by matching the skeleton's names.
export type Role =
  | 'hips'
  | 'spine'
  | 'chest'
  | 'neck'
  | 'head'
  | 'leftUpperArm'
  | 'leftLowerArm'
  | 'rightUpperArm'
  | 'rightLowerArm'
  | 'leftUpperLeg'
  | 'leftLowerLeg'
  | 'rightUpperLeg'
  | 'rightLowerLeg'

// Helper/twist/corrective bones we never want to grab as the primary joint.
const HELPER = /twist|fix|fuzz|_end$|_end_|metacarpal|weapon|corrective|_ik|roll|bckl|latissimus|dummy|helper|adjust/i

// Candidate patterns per role, tried in order; first non-helper match (shortest name) wins.
const ROLE_PATTERNS: Record<Role, RegExp[]> = {
  hips: [/pelvis/i, /\bhips?\b/i, /^hip/i, /^root$/i],
  spine: [/spine_?0*2(\b|_)/i, /spine_?0*3(\b|_)/i, /^spine$/i, /spine1/i, /waist/i],
  chest: [/spine_?0*5(\b|_)/i, /spine_?0*4(\b|_)/i, /upper_?chest/i, /\bchest\b/i],
  neck: [/neck_?0*1(\b|_)/i, /neck/i],
  head: [/^head(\b|_)/i, /_head(\b|_)/i, /\bhead\b/i],
  leftUpperArm: [/upperarm_l(\b|_)/i, /l_upperarm/i, /left_?upperarm/i, /left_?arm(\b|_)/i, /arm_l(\b|_)/i],
  leftLowerArm: [/lowerarm_l(\b|_)/i, /l_lowerarm/i, /left_?lowerarm/i, /left_?forearm/i, /forearm_l/i],
  rightUpperArm: [/upperarm_r(\b|_)/i, /r_upperarm/i, /right_?upperarm/i, /right_?arm(\b|_)/i, /arm_r(\b|_)/i],
  rightLowerArm: [/lowerarm_r(\b|_)/i, /r_lowerarm/i, /right_?lowerarm/i, /right_?forearm/i, /forearm_r/i],
  leftUpperLeg: [/thigh_l(\b|_)/i, /l_upperleg/i, /left_?upperleg/i, /upperleg_l/i, /left_?leg(\b|_)/i],
  leftLowerLeg: [/calf_l(\b|_)/i, /l_lowerleg/i, /left_?lowerleg/i, /shin_l/i, /lowerleg_l/i],
  rightUpperLeg: [/thigh_r(\b|_)/i, /r_upperleg/i, /right_?upperleg/i, /upperleg_r/i, /right_?leg(\b|_)/i],
  rightLowerLeg: [/calf_r(\b|_)/i, /r_lowerleg/i, /right_?lowerleg/i, /shin_r/i, /lowerleg_r/i],
}

export function resolveHumanoidBones(names: string[]): Partial<Record<Role, string>> {
  const usable = names.filter((n) => !HELPER.test(n))
  const out: Partial<Record<Role, string>> = {}
  for (const role of Object.keys(ROLE_PATTERNS) as Role[]) {
    for (const re of ROLE_PATTERNS[role]) {
      const matches = usable.filter((n) => re.test(n)).sort((a, b) => a.length - b.length)
      if (matches.length) {
        out[role] = matches[0]
        break
      }
    }
  }
  return out
}

// A pose is a set of per-role local-rotation deltas (degrees) on top of the model's rest
// orientation. One pose per scroll section — the seasons.
export type Pose = Partial<Record<Role, [number, number, number]>>

// Axis notes for this rig (verified): shoulder raise/lower is on Z (right arm Z-positive
// raises, left arm Z-negative raises); the elbow bend is on X (positive folds the forearm
// down/in from wherever the upper arm is pointing) — using Z for the elbow instead produces
// a twisted, broken-looking wrist, since it rolls the forearm around its own long axis
// rather than hinging it.
export const POSES: Pose[] = [
  // 0 — SUMMER: sunny greeting, right arm up in a wave
  {
    leftUpperArm: [0, 0, -15],
    rightUpperArm: [0, 0, 138],
    rightLowerArm: [60, 0, 0],
    spine: [0, 0, 3],
    head: [0, -8, 5],
  },
  // 1 — AUTUMN: relaxed weight shift, watching the leaves fall
  {
    hips: [0, 0, 6],
    spine: [0, 10, 4],
    chest: [0, 6, 0],
    leftUpperArm: [0, 0, -10],
    rightUpperArm: [0, 0, 12],
    head: [0, 16, -5],
  },
  // 2 — WINTER: bracing against the cold, arms drawn in, head tucked
  {
    leftUpperArm: [0, 0, -20],
    rightUpperArm: [0, 0, 20],
    leftLowerArm: [100, 0, 0],
    rightLowerArm: [100, 0, 0],
    spine: [14, 0, 0],
    chest: [8, 0, 0],
    head: [16, 0, 0],
  },
  // 3 — SPRING: blossoming stretch, arms open to the sky in a wide Y
  {
    leftUpperArm: [0, 0, -150],
    rightUpperArm: [0, 0, 150],
    spine: [-8, 0, 0],
    chest: [-5, 0, 0],
    head: [-12, 0, 0],
  },
  // 4 — FINALE: playful pose beside the call to action, one arm raised
  {
    hips: [0, 0, -6],
    spine: [0, -8, -5],
    leftUpperArm: [0, 0, -14],
    rightUpperArm: [0, 0, 120],
    rightLowerArm: [25, 0, 0],
    head: [0, -10, 6],
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

// Blend between adjacent pose keyframes by scroll offset and write onto each role's bone.
export function applyScrollPose(roleBones: Map<Role, BoneRest>, offset: number) {
  const n = POSES.length - 1
  const t = THREE.MathUtils.clamp(offset, 0, 1) * n
  const i = Math.min(Math.floor(t), n - 1)
  const f = THREE.MathUtils.smoothstep(t - i, 0, 1)
  const a = POSES[i]
  const b = POSES[i + 1]

  for (const [role, { bone, rest }] of roleBones) {
    const ra = a[role] ?? ZERO
    const rb = b[role] ?? ZERO
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
