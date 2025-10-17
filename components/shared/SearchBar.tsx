"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";

interface SearchBarProps {
  url: string; // e.g. "/members", "/trainers"
  debounce?: number;
  label?: string;
  placeholder?: string;
}

export default function SearchBar({
  url,
  debounce = 500,
  label,
  placeholder = "Search...",
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setKeyword] = useState(searchParams.get("search") || "");
  const timer = useRef<NodeJS.Timeout | null>(null);

  const pushSearch = () => {
    const params = new URLSearchParams(searchParams.toString());

    // ✅ Update search term
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }

    // ✅ Reset page to 1
    params.delete("page");

    router.replace(`${url}?${params.toString()}`);
  };

  const clearSearch = () => {
    setKeyword("");

    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");

    // ✅ Reset page
    params.delete("page");

    router.replace(`${url}?${params.toString()}`);
  };

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);

    if (!search.trim()) {
      pushSearch(); // immediately push when search is cleared
    } else {
      timer.current = setTimeout(pushSearch, debounce);
    }

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [search]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") pushSearch();
  };

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
          {label}
        </span>
      )}
      <div className="relative w-full sm:w-52">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={onKeyDown}
          className="pr-4 pl-10 py-2 border border-gray-300 bg-white text-gray-800 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
        {search && (
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
