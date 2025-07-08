"use client";

import * as React from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { ListFilter, ScanSearch, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type FilterTag = {
  key: string;
  label: string;
  value: string;
};

type SearchFilterProps = {
  placeholder: string;
  children?: React.ReactNode;
  className?: string;
  filterTags?: FilterTag[];
  onRemoveFilter?: (key: string) => void;
  onClearAllFilters?: () => void;
  onSearch?: (value: string) => void;
};

export function SearchFilter({
  placeholder,
  children,
  className,
  filterTags = [],
  onRemoveFilter,
  onClearAllFilters,
  onSearch,
}: SearchFilterProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    replace(`${pathname}?${params.toString()}`);
    
    // Call the onSearch callback if provided
    onSearch?.(term);
  }, 300);

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Search Input */}
      <div className="relative w-full md:w-80">
        <ScanSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        <Input
          type="text"
          placeholder={placeholder}
          defaultValue={searchParams.get("query")?.toString() || ""}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-12 border-bexoni placeholder:text-bexoni w-full"
        />
        {children && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="absolute right-1 top-1/2 h-8 -translate-y-1/2 px-3 text-sm text-primary font-medium"
              >
                <ListFilter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              {children}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      {/* Filter Tags */}
      {filterTags.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex flex-wrap gap-1">
            {filterTags.map((tag) => (
              <div
                key={tag.key}
                className="inline-flex items-center border border-dashed border-bexoni gap-1 px-2 py-1 bg-primary/10 text-primary text-xs "
              >
                <span className=" max-w-auto">{tag.label}: {tag.value}</span>
                <button
                  onClick={() => onRemoveFilter?.(tag.key)}
                  className="hover:bg-primary/20 rounded-sm p-0.5 flex-shrink-0"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAllFilters}
            className="text-xs h-7 px-2 w-fit rounded-none border-bexoni"
          >
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}
