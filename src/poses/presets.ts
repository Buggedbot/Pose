export interface BoneRotation {
  x: number
  y: number
  z: number
}

export type PoseRotations = Record<string, BoneRotation>

function r(x = 0, y = 0, z = 0): BoneRotation {
  return { x, y, z }
}

// Each preset only needs to list bones that differ from the relaxed default pose;
// the store fills in everything else from each bone's defaultRotation.
export const presets: Record<string, PoseRotations> = {
  'Relaxed Stand': {},

  'Hands on Hips': {
    leftShoulder: r(0, 0, -18),
    leftUpperArm: r(-15, 10, -70),
    leftForearm: r(95, 30, 0),
    rightShoulder: r(0, 0, 18),
    rightUpperArm: r(-15, -10, 70),
    rightForearm: r(95, -30, 0),
    spine: r(0, 0, -6),
    leftUpperLeg: r(0, 0, -8),
    rightUpperLeg: r(0, 5, 4),
  },

  Walking: {
    spine: r(2, 8, 0),
    chest: r(-2, -6, 0),
    leftShoulder: r(0, 0, -10),
    leftUpperArm: r(35, 0, -8),
    leftForearm: r(25, 0, 0),
    rightShoulder: r(0, 0, 10),
    rightUpperArm: r(-30, 0, 8),
    rightForearm: r(35, 0, 0),
    leftUpperLeg: r(-28, 4, -4),
    leftLowerLeg: r(-12, 0, 0),
    leftFoot: r(10, 0, 0),
    rightUpperLeg: r(35, -4, 4),
    rightLowerLeg: r(-45, 0, 0),
    rightFoot: r(-15, 0, 0),
  },

  'Action Lunge': {
    hips: r(5, -20, -5),
    spine: r(-10, -10, -10),
    chest: r(-15, 5, 12),
    neck: r(5, 15, 0),
    head: r(0, 10, 0),
    leftShoulder: r(10, 0, -25),
    leftUpperArm: r(-60, 20, -40),
    leftForearm: r(40, 0, 0),
    leftHand: r(0, 0, 0),
    rightShoulder: r(0, 0, 22),
    rightUpperArm: r(100, -30, 60),
    rightForearm: r(15, 0, 0),
    leftUpperLeg: r(-55, 10, -20),
    leftLowerLeg: r(-20, 0, 0),
    leftFoot: r(15, 0, 0),
    rightUpperLeg: r(70, -15, 15),
    rightLowerLeg: r(-90, 0, 0),
    rightFoot: r(-10, 0, 0),
  },

  Sitting: {
    hips: r(0, 0, 0),
    spine: r(5, 0, 0),
    chest: r(-3, 0, 0),
    leftShoulder: r(0, 0, -10),
    leftUpperArm: r(5, 5, -10),
    leftForearm: r(20, 0, 0),
    rightShoulder: r(0, 0, 10),
    rightUpperArm: r(5, -5, 10),
    rightForearm: r(20, 0, 0),
    leftUpperLeg: r(85, 10, -10),
    leftLowerLeg: r(-90, 0, 0),
    leftFoot: r(5, 0, 0),
    rightUpperLeg: r(85, -10, 10),
    rightLowerLeg: r(-90, 0, 0),
    rightFoot: r(5, 0, 0),
  },

  'Arms Raised': {
    spine: r(-5, 0, 0),
    leftShoulder: r(10, 0, -30),
    leftUpperArm: r(10, 20, -160),
    leftForearm: r(10, 0, 0),
    rightShoulder: r(10, 0, 30),
    rightUpperArm: r(10, -20, 160),
    rightForearm: r(10, 0, 0),
    head: r(-10, 0, 0),
  },
}

export const presetNames = Object.keys(presets)
