import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { boneDefs, type Axis } from '../scene/jointDefs'
import { presets, type PoseRotations } from '../poses/presets'
import { clampToBoneLimit, type Mode } from '../scene/boneInfo'
import type { DynamicBoneDef } from '../scene/customModel'

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

export type Backdrop = 'studio' | 'beach' | 'outdoor' | 'seamless'

interface PoseStore {
  mode: Mode
  rotations: PoseRotations
  selectedBone: string | null
  isDragging: boolean
  lighting: LightingState
  backdrop: Backdrop
  backdropColor: string
  savedPoses: Record<string, PoseRotations>

  /** True while the scene is hiding the backdrop/gizmo for a clean sketch capture. */
  isSketching: boolean
  /** Set by the UI to ask the 3D layer to capture the current view; cleared once it's done. */
  sketchRequested: boolean
  sketchGenerating: boolean
  sketchImage: string | null
  sketchError: string | null

  customModelUrl: string | null
  customModelName: string | null
  customBoneTree: DynamicBoneDef[]
  customBoneOriginal: PoseRotations
  modelError: string | null
  /** True when the active model is the app's built-in default (a bundled asset) rather than a user upload. */
  isDefaultModel: boolean

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
  setBackdrop: (backdrop: Backdrop) => void
  setBackdropColor: (color: string) => void

  setSketching: (sketching: boolean) => void
  requestSketch: () => void
  consumeSketchRequest: () => void
  setSketchImage: (image: string | null) => void
  setSketchGenerating: (generating: boolean) => void
  setSketchError: (message: string | null) => void
  closeSketch: () => void

  loadCustomModel: (url: string, name: string, isDefault?: boolean) => void
  unloadCustomModel: () => void
  registerCustomBones: (defs: DynamicBoneDef[], initial: PoseRotations) => void
  handleModelError: (message: string) => void
  clearModelError: () => void
}

// Only object URLs created via URL.createObjectURL need revoking; a bundled asset path (e.g.
// "/models/figure.glb") must not be passed to revokeObjectURL.
function revokeIfBlob(url: string | null) {
  if (url && url.startsWith('blob:')) URL.revokeObjectURL(url)
}

function baseRotationsFor(state: Pick<PoseStore, 'mode' | 'customBoneOriginal'>): PoseRotations {
  if (state.mode === 'procedural') return defaultRotations()
  return { ...state.customBoneOriginal }
}

export const useStore = create<PoseStore>()(
  persist(
    (set, get) => ({
      mode: 'procedural',
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
      backdrop: 'studio',
      backdropColor: '#e5e2dc',
      savedPoses: {},

      isSketching: false,
      sketchRequested: false,
      sketchGenerating: false,
      sketchImage: null,
      sketchError: null,

      customModelUrl: null,
      customModelName: null,
      customBoneTree: [],
      customBoneOriginal: {},
      modelError: null,
      isDefaultModel: false,

      selectBone: (id) => set({ selectedBone: id }),
      setDragging: (dragging) => set({ isDragging: dragging }),

      setAxis: (boneId, axis, degrees) => {
        const mode = get().mode
        const clamped = clampToBoneLimit(mode, boneId, axis, degrees)
        set((state) => ({
          rotations: {
            ...state.rotations,
            [boneId]: { ...state.rotations[boneId], [axis]: clamped },
          },
        }))
      },

      setBoneRotation: (boneId, rot) => {
        const mode = get().mode
        set((state) => ({
          rotations: {
            ...state.rotations,
            [boneId]: {
              x: clampToBoneLimit(mode, boneId, 'x', rot.x),
              y: clampToBoneLimit(mode, boneId, 'y', rot.y),
              z: clampToBoneLimit(mode, boneId, 'z', rot.z),
            },
          },
        }))
      },

      resetBone: (boneId) => {
        const state = get()
        const base = baseRotationsFor(state)[boneId]
        if (!base) return
        set({ rotations: { ...state.rotations, [boneId]: base } })
      },

      resetAll: () => set((state) => ({ rotations: baseRotationsFor(state) })),

      applyPreset: (presetName) => {
        const state = get()
        if (state.mode !== 'procedural') return
        const preset = presets[presetName]
        if (!preset) return
        set({ rotations: { ...defaultRotations(), ...preset } })
      },

      savePose: (name) => {
        const { rotations, savedPoses } = get()
        set({ savedPoses: { ...savedPoses, [name]: rotations } })
      },

      loadPose: (name) => {
        const state = get()
        const pose = state.savedPoses[name]
        if (!pose) return
        set({ rotations: { ...baseRotationsFor(state), ...pose } })
      },

      deletePose: (name) => {
        const { savedPoses } = get()
        const next = { ...savedPoses }
        delete next[name]
        set({ savedPoses: next })
      },

      setLighting: (patch) => set((state) => ({ lighting: { ...state.lighting, ...patch } })),
      setBackdrop: (backdrop) => set({ backdrop }),
      setBackdropColor: (color) => set({ backdropColor: color }),

      setSketching: (sketching) => set({ isSketching: sketching }),
      requestSketch: () =>
        set({ sketchRequested: true, sketchGenerating: true, sketchImage: null, sketchError: null }),
      consumeSketchRequest: () => set({ sketchRequested: false }),
      setSketchImage: (image) => set({ sketchImage: image, sketchGenerating: false }),
      setSketchGenerating: (generating) => set({ sketchGenerating: generating }),
      setSketchError: (message) => set({ sketchError: message, sketchGenerating: false }),
      closeSketch: () => set({ sketchImage: null, sketchError: null, sketchGenerating: false }),

      loadCustomModel: (url, name, isDefault = false) => {
        revokeIfBlob(get().customModelUrl)
        set({
          mode: 'custom',
          customModelUrl: url,
          customModelName: name,
          isDefaultModel: isDefault,
          customBoneTree: [],
          customBoneOriginal: {},
          rotations: {},
          selectedBone: null,
          modelError: null,
        })
      },

      unloadCustomModel: () => {
        revokeIfBlob(get().customModelUrl)
        set({
          mode: 'procedural',
          customModelUrl: null,
          customModelName: null,
          isDefaultModel: false,
          customBoneTree: [],
          customBoneOriginal: {},
          rotations: defaultRotations(),
          selectedBone: null,
        })
      },

      registerCustomBones: (defs, initial) =>
        set((state) => ({
          customBoneTree: defs,
          customBoneOriginal: { ...state.customBoneOriginal, ...initial },
          rotations: { ...initial, ...state.rotations },
        })),

      handleModelError: (message) => {
        revokeIfBlob(get().customModelUrl)
        set({
          mode: 'procedural',
          customModelUrl: null,
          customModelName: null,
          isDefaultModel: false,
          customBoneTree: [],
          customBoneOriginal: {},
          rotations: defaultRotations(),
          selectedBone: null,
          modelError: message,
        })
      },

      clearModelError: () => set({ modelError: null }),
    }),
    {
      name: 'manga-pose-reference-store',
      partialize: (state) => ({
        savedPoses: state.savedPoses,
        lighting: state.lighting,
        backdrop: state.backdrop,
        backdropColor: state.backdropColor,
      }),
    },
  ),
)
