import { createContext, type MutableRefObject } from 'react'
import type { Group } from 'three'

export type BoneRefs = Record<string, Group | null>

export const BoneRefsContext = createContext<MutableRefObject<BoneRefs> | null>(null)
