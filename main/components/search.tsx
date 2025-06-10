"use client"

import React from 'react';
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "@/components/ui/input";

type Props = {
    placeholder: string;
}

export default function Search({placeholder}: Props) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
          params.set("query", term);
        } else {
          params.delete("query");
        }
        replace(`${pathname}?${params.toString()}`);
      }, 300);


  return (
      <Input
        type="text"
        placeholder={placeholder}
        defaultValue={searchParams.get("query")?.toString() || ""}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-64"
      />
  )
}