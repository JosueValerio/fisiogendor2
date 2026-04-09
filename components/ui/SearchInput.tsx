'use client'

import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface SearchInputProps {
  placeholder?: string
  onSearch: (value: string) => void
  debounceMs?: number
}

export function SearchInput({ placeholder = 'Buscar...', onSearch, debounceMs = 300 }: SearchInputProps) {
  const [value, setValue] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onSearch(value), debounceMs)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [value, debounceMs, onSearch])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-white/30 outline-none focus:border-[#2F64E0]/50 focus:ring-1 focus:ring-[#2F64E0]/30"
      />
    </div>
  )
}
