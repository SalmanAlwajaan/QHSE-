import { useEffect, useState, useCallback } from 'react'

const bridge = typeof window !== 'undefined' ? window.api : null

export async function call(action, params = {}) {
  if (!bridge) throw new Error('Desktop bridge unavailable — run inside the app (npm run dev).')
  const res = await bridge.call(action, params)
  if (!res || !res.ok) throw new Error((res && res.error) || 'Unknown error')
  return res.data
}

export const importExcel = (table, role) => bridge.importExcel(table, role)
export const exportExcel = (table, title) => bridge.exportExcel(table, title)
export const revealData = () => bridge.revealData()
export const setNativeTheme = (mode) => bridge?.setNativeTheme(mode)
export const hasBridge = !!bridge

// Simple data hook with manual refresh.
export function useQuery(action, params, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const load = useCallback(() => {
    setLoading(true)
    call(action, params)
      .then((d) => { setData(d); setError(null) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(() => { load() }, [load])
  return { data, loading, error, refresh: load, setData }
}
