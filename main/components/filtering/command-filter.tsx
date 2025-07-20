"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Folder,
  Users,
  FileText,
  Receipt,
  Shield,
  MessageSquare,
  ArrowRight,
  Loader2,
  FolderSearch2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

type SearchItem = {
  id: string;
  name: string;
  type?: string;
  url: string;
  relatedCategory?: string;
  customerId?: string;
  projectId?: string;
  [key: string]: any;
};

type SearchCategory = {
  title: string;
  items: SearchItem[];
};

type SearchFilterProps = {
  placeholder: string;
  className?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const fetchSearchResults = async (query: string): Promise<SearchCategory[]> => {
  const response = await fetch(`/api/search?searchQuery=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error("Failed to fetch search results");
  return response.json();
};

function formatResults(data: any[] | null): SearchCategory[] {
    if (!data) return [];
  
    const grouped = data.reduce((acc, row) => {
      const categoryTitle = row.category.charAt(0).toUpperCase() + row.category.slice(1);
      if (!acc[categoryTitle]) {
        acc[categoryTitle] = {
          title: categoryTitle,
          items: [],
        };
      }
      
      // Build clean URLs without extra parameters
      let url = '/protected/';
      let idParam = '';
      
      switch (categoryTitle) {
        case 'Projects':
          url += 'projects';
          idParam = `projectId=${row.id}`;
          break;
        case 'Customers':
          url += 'customers';
          idParam = `customerId=${row.id}`;
          break;
        case 'Invoices':
          url += 'invoices';
          idParam = `invoiceId=${row.id}`;
          break;
        case 'Feedbacks':
          url += 'feedback';
          idParam = `feedbackId=${row.id}`;
          break;
        case 'Receipts':
          url += 'receipts';
          idParam = `receiptId=${row.id}`;
          break;
        default:
          url += categoryTitle.toLowerCase();
          idParam = `${categoryTitle.toLowerCase()}Id=${row.id}`;
      }
      
      url += `?${idParam}`;
  
      acc[categoryTitle].items.push({
        id: row.id,
        name: row.name || 'Unnamed',
        type: row.type,
        url,
        relatedCategory: row.related_category,
        customerId: row.customerId,
        projectId: row.projectId,
      });
      return acc;
    }, {} as { [key: string]: SearchCategory });
  
    return Object.values(grouped);
  }

const iconMap: { [key: string]: React.ElementType } = {
  Projects: Folder,
  Customers: Users,
  Invoices: FileText,
  Receipts: Receipt,
  Feedbacks: MessageSquare,
};

export default function CommandFilter({
  placeholder,
  className,
  isOpen,
  onOpenChange,
}: SearchFilterProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 250);
  const { data: results = [], isLoading } = useQuery({
    queryKey: ["universalSearch", debouncedQuery],
    queryFn: () => fetchSearchResults(debouncedQuery),
    enabled: isOpen,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Check if there are any results
  const hasResults = results.some(category => category.items.length > 0);
  const showEmptyState = !isLoading && debouncedQuery.trim() !== "" && !hasResults;

  const handleSelect = (url: string) => {
    router.push(url);
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const flattenedItems = results.flatMap((cat) => cat.items) || [];
    if (!flattenedItems.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flattenedItems.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && flattenedItems[selectedIndex]) {
          handleSelect(flattenedItems[selectedIndex].url);
        }
        break;
      case "Escape":
        e.preventDefault();
        onOpenChange(false);
        break;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedIndex(-1);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-2xl max-w-[80%] mx-auto h-[80vh] max-h-[600px] p-0 gap-0 flex flex-col">
        <DialogTitle className="sr-only">Search Command</DialogTitle>
        <DialogHeader className="p-4 pb-0 flex-shrink-0">
          <div className="relative">
            <Folder className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-12 border-border placeholder:text-muted-foreground text-lg h-12 bg-background"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Badge variant="outline" className="text-xs font-mono">⌘K</Badge>
            </div>
          </div>
        </DialogHeader>

        <Separator className="flex-shrink-0" />

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {isLoading ? (
              <div className="p-8 flex justify-center items-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : showEmptyState ? (
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="rounded-full bg-primary/10 p-4">
                  <FolderSearch2 className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No results found</h3>
                  <p className="text-sm text-muted-foreground">
                    No results for{" "}
                    <span className="font-medium text-primary">"{debouncedQuery}"</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Try searching for projects, customers, invoices, or receipts
                  </p>
                </div>
              </div>
            ) : (
              results.map((category) => {
                const IconComponent = iconMap[category.title];
                return (
                  <div key={category.title} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      {IconComponent && <IconComponent className="h-4 w-4" />}
                      {category.title}
                    </div>
                    <div className="space-y-1">
                      {category.items.length > 0 ? (
                        category.items.map((item, index) => (
                          <div
                            key={index}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer group",
                              selectedIndex === results
                                .flatMap((c) => c.items)
                                .indexOf(item) && "bg-accent"
                            )}
                            onClick={() => handleSelect(item.url)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{item.name}</span>
                                {item.type && (
                                  <Badge variant="secondary" className="text-xs">
                                    {item.type}
                                  </Badge>
                                )}
                                {item.relatedCategory && (
                                  <Badge variant="outline" className="text-xs text-muted-foreground">
                                    via {item.relatedCategory}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">
                          No items found
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <Separator className="flex-shrink-0" />

        <div className="p-4 pt-2 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="font-mono">↵</Badge>
                <span>to select</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="font-mono">↑↓</Badge>
                <span>to navigate</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="font-mono">esc</Badge>
              <span>to close</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}