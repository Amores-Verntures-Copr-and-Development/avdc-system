"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";

interface SearchBarProps {
  url?: string;
  debounce?: number;
  label?: string;
  placeholder?: string;
  useUrl?: boolean;
  onSearch?: (value: string) => void;
  height?: string; // NEW
  captureScanner?: boolean;
}

export default function SearchBar({
  url = "",
  debounce = 500,
  label,
  placeholder = "Search...",
  useUrl = true,
  onSearch,
  height = "h-8", // DEFAULT
  captureScanner = true,
}: SearchBarProps) {
  const router = useRouter();
  const onSearchRef = useRef(onSearch);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const searchParams = useSearchParams();
  const [localSearch, setLocalSearch] = useState(
    searchParams.get("search") || "",
  );
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);
  const [debouncedSearch, setDebouncedSearch] = useState(
    searchParams.get("search") || "",
  );
  const timer = useRef<NodeJS.Timeout | null>(null);

  // Update URL only when debounced search changes
  // SearchBar component - FIXED VERSION
  useEffect(() => {
    if (!useUrl) return; // 🚫 don't touch URL

    const currentSearch = searchParams.get("search") || "";

    if (debouncedSearch.trim() === currentSearch.trim()) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (debouncedSearch.trim()) {
      params.set("search", debouncedSearch.trim());
    } else {
      params.delete("search");
    }

    params.set("page", "1");

    router.push(`${url}?${params.toString()}`);
  }, [debouncedSearch, searchParams, url, router, useUrl]);
  useEffect(() => {
    if (!useUrl) {
      onSearchRef.current?.(debouncedSearch);
    }
  }, [debouncedSearch, useUrl]);
  // Debounce the local search
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(() => {
      setDebouncedSearch(localSearch);
    }, debounce);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [localSearch, debounce]);

  // Detect a hardware barcode scanner (keyboard-wedge) firing anywhere on the
  // page and route the scanned code straight into the search box, even if
  // the user hasn't clicked into it yet.
  useEffect(() => {
    if (!captureScanner) return;

    const FAST_KEY_THRESHOLD_MS = 40;
    const MIN_BURST_LENGTH_TO_ACTIVATE = 3;
    const MIN_BARCODE_LENGTH = 6;

    let buffer = "";
    let lastKeyTime = 0;
    let burstActive = false;

    const resetBuffer = () => {
      buffer = "";
      burstActive = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;

      // Already focused on our own input — its native typing + onKeyDown
      // Enter-flush handles this case, no need to intercept.
      if (target === inputRef.current) return;

      const isOtherEditable =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (isOtherEditable) {
        resetBuffer();
        return;
      }

      const now = Date.now();
      const gap = now - lastKeyTime;
      lastKeyTime = now;

      if (gap > FAST_KEY_THRESHOLD_MS) {
        resetBuffer();
      }

      if (e.key === "Enter") {
        if (burstActive && buffer.length >= MIN_BARCODE_LENGTH) {
          e.preventDefault();
          if (timer.current) clearTimeout(timer.current);
          setLocalSearch(buffer);
          setDebouncedSearch(buffer);
          inputRef.current?.focus();
        }
        resetBuffer();
        return;
      }

      if (e.key.length !== 1) return;

      buffer += e.key;

      if (buffer.length >= MIN_BURST_LENGTH_TO_ACTIVATE) {
        burstActive = true;
      }

      if (burstActive) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [captureScanner]);

  const clearSearch = () => {
    setLocalSearch("");
    setDebouncedSearch("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (timer.current) clearTimeout(timer.current);
      setDebouncedSearch(localSearch);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
  };

  return (
    <div className="flex w-full h-full items-center gap-2">
      {label && (
        <span className="text-[10px] lg:text-xs xl:text-sm font-medium text-gray-700 whitespace-nowrap">
          {label}
        </span>
      )}
      <div className="relative w-full min-w-0">
        <Search className="absolute left-1 xl:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 xl:w-4 xl:h-4" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={localSearch}
          onChange={onChange}
          onKeyDown={onKeyDown}
          className={`
    w-full
    ${height}
    pr-4 pl-5
    xl:pl-10
    border border-gray-300
    bg-white text-gray-800
    text-xs xl:text-sm
    rounded-md
    focus:outline-none
    focus:ring-2
    focus:ring-blue-500
    focus:border-blue-500
    transition
  `}
        />
        {localSearch && (
          <button
            onClick={clearSearch}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500 text-xl font-bold"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
