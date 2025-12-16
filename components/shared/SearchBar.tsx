"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";

interface SearchBarProps {
  url: string;
  debounce?: number;
  label?: string;
  placeholder?: string;
  fetchMode?: boolean;
}

export default function SearchBar({
  url,
  debounce = 500,
  label,
  placeholder = "Search...",
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [localSearch, setLocalSearch] = useState(
    searchParams.get("search") || ""
  );
  const [debouncedSearch, setDebouncedSearch] = useState(
    searchParams.get("search") || ""
  );
  const timer = useRef<NodeJS.Timeout | null>(null);

  // Update URL only when debounced search changes
  // SearchBar component - FIXED VERSION
  useEffect(() => {
    // Only update URL if search actually changed
    const currentSearch = searchParams.get("search") || "";

    if (debouncedSearch.trim() === currentSearch.trim()) {
      return; // Don't update if search hasn't changed
    }

    const params = new URLSearchParams(searchParams.toString());

    if (debouncedSearch.trim()) {
      params.set("search", debouncedSearch.trim());
    } else {
      params.delete("search");
    }

    // Only reset page if search actually changed
    params.set("page", "1");

    router.push(`${url}?${params.toString()}`);
  }, [debouncedSearch, searchParams, url, router]);

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
        <span className="text-xs xl:text-sm font-medium text-gray-700 whitespace-nowrap">
          {label}
        </span>
      )}
      <div className="relative w-full min-w-0">
        <Search className="absolute left-1 xl:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 xl:w-4 xl:h-4" />
        <input
          type="text"
          placeholder={placeholder}
          value={localSearch}
          onChange={onChange}
          onKeyDown={onKeyDown}
          className="w-full pr-4 pl-5 py-0.5 xl:pl-10 xl:py-1 border border-gray-300 bg-white text-gray-800 text-xs xl:text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
