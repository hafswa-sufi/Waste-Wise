import { useMemo } from 'react'
// @ts-expect-error Canvas manifest is a generated JS artifact without bundled typings.
import { manifest } from './canvas.manifest.js'

export function useScreenInit() {
  return useMemo(() => {
    if (typeof window === 'undefined') return {}
    const screenId = new URLSearchParams(window.location.search).get('mp_screen')
    if (!screenId) return {}
    return manifest?.screens?.[screenId]?.state ?? {}
  }, [])
}
