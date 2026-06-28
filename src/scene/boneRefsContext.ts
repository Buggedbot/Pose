import { createContext, type MutableRefObject } from 'react'
import type { Object3D } from 'three'

export type BoneRefs = Record<string, Object3D | null>

export const BoneRefsContext = createContext<MutableRefObject<BoneRefs> | null>(null)
