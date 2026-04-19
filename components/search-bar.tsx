"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  onSearch: (query: string) => void
  isSearching: boolean
  onClearSearch: () => void
}

export function SearchBar({ onSearch, isSearching, onClearSearch }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)

  const debouncedSearch = useCallback((value: string) => {
    const timer = setTimeout(() => {
      onSearch(value)
    }, 300)
    return () => clearTimeout(timer)
  }, [onSearch])

  useEffect(() => {
    const cleanup = debouncedSearch(query)
    return cleanup
  }, [query, debouncedSearch])

  const handleClear = () => {
    setQuery("")
    onClearSearch()
  }

  return (
    <div className="relative w-full max-w-md">
      <div 
        className={cn(
          "relative transition-all duration-300 ease-out",
          isFocused && "scale-[1.01]"
        )}
      >
        <Search 
          className={cn(
            "absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4",
            "transition-colors duration-200",
            isFocused ? "text-primary" : "text-muted-foreground"
          )} 
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="ابحث في الملاحظات..."
          className={cn(
            "pr-11 pl-10 h-11 rounded-xl border-0",
            "bg-muted/50 placeholder:text-muted-foreground/60",
            "focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:bg-background",
            "transition-all duration-200",
            isSearching && "bg-primary/5 ring-1 ring-primary/30"
          )}
        />
        {(query || isSearching) && (
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7",
              "hover:bg-muted transition-all duration-200",
              "animate-scale-in"
            )}
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
