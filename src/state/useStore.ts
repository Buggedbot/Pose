import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { boneDefs, boneMap, clampToLimit, type Axis } from '../scene/jointDefs'
import { presets, type PoseRotations } from '../poses/presets'

function defaultRotations(): PoseRotations {
  const rot: PoseRotations = {}
  for (const bone of boneDefs) {
    rot[bone.id] = {
      x: bone.defaultRotation?.x ?? 0,
      y: bone.defaultRotation?.y ?? 0,
      z: bone.defaultRotation?.z ?? 0,
    }
  }
  return rot
}

export interface LightingState {
  keyIntensity: number
  keyAzimuth: number // degrees around Y
  keyElevation: number // degrees above horizon
  fillIntensity: number
  rimEnabled: boolean
  showFloorGrid: boolean
}

interface PoseStore {
  rotations: PoseRotations
  selectedBone: string | null
  isDragging: boolean
  lighting: LightingState
  savedPoses: Record<string, PoseRotations>

  selectBone: (id: string | null) => void
  setDragging: (dragging: boolean) => void
  setAxis: (boneId: string, axis: Axis, degrees: number) => void
  setBoneRotation: (boneId: string, rot: { x: number; y: number; z: number }) => void
  resetBone: (boneId: string) => void
  resetAll: () => void
  applyPreset: (presetName: string) => void
  savePose: (name: string) => void
  loadPose: (name: string) => void
  deletePose: (name: string) => void
  setLighting: (patch: Partial<LightingState>) => void
}

export const useStore = create<PoseStore>()(
  persist(
    (set, get) => ({
      rotations: defaultRotations(),
      selectedBone: null,
      isDragging: false,
      lighting: {
        keyIntensity: 1.1,
        keyAzimuth: 35,
        keyElevation: 55,
        fillIntensity: 0.35,
        rimEnabled: true,
        showFloorGrid: true,
      },
      savedPoses: {},

      selectBone: (id) => set({ selectedBone: id }),
      setDragging: (dragging) => set({ isDragging: dragging }),

      setAxis: (boneId, axis, degrees) => {
        const bone = boneMap[boneId]
        if (!bone) return
        const clamped = clampToLimit(bone, axis, degrees)
        set((state) => ({
          rotations: {
            ...state.rotations,
            [boneId]: { ...state.rotations[boneId], [axis]: clamped },
          },
        }))
      },

      setBoneRotation: (boneId, rot) => {
        const bone = boneMap[boneId]
        if (!bone) return
        set((state) => ({
          rotations: {
            ...state.rotations,
            [boneId]: {
              x: clampToLimit(bone, 'x', rot.x),
              y: clampToLimit(bone, 'y', rot.y),
              z: clampToLimit(bone, 'z', rot.z),
            },
          },
        }))
      },

      resetBone: (boneId) => {
        const bone = boneMap[boneId]
        if (!bone) return
        set((state) => ({
          rotations: {
            ...state.rotations,
            [boneId]: {
              x: bone.defaultRotation?.x ?? 0,
              y: bone.defaultRotation?.y ?? 0,
              z: bone.defaultRotation?.z ?? 0,
            },
          },
        }))
      },

      resetAll: () => set({ rotations: defaultRotations() }),

      applyPreset: (presetName) => {
        const preset = presets[presetName]
        if (!preset) return
        set({ rotations: { ...defaultRotations(), ...preset } })
      },

      savePose: (name) => {
        const { rotations, savedPoses } = get()
        set({ savedPoses: { ...savedPoses, [name]: rotations } })
      },

      loadPose: (name) => {
        const pose = get().savedPoses[name]
        if (!pose) return
        set({ rotations: { ...defaultRotations(), ...pose } })
      },

      deletePose: (name) => {
        const { savedPoses } = get()
        const next = { ...savedPoses }
        delete next[name]
        set({ savedPoses: next })
      },

      setLighting: (patch) => set((state) => ({ lighting: { ...state.lighting, ...patch } })),
    }),
    {
      name: 'manga-pose-reference-store',
      partialize: (state) => ({ savedPoses: state.savedPoses, lighting: state.lighting }),
    },
  ),
)
