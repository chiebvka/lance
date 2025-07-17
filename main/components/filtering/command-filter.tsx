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
      <DialogContent className="max-w-2xl h-[80vh] max-h-[600px] p-0 gap-0 flex flex-col">
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
            {results.map((category) => {
              const IconComponent = iconMap[category.title];
              return (
                <div key={category.title} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                    {category.title}
                  </div>
                  <div className="space-y-1">
                    {isLoading ? (
                      <div className="p-4 flex justify-center items-center">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : category.items.length > 0 ? (
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
            })}
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
















// "use client"

// import React, { useState } from 'react';
// import { ListFilter, ScanSearch, X, Command, FileText, Users, Receipt, Folder, Shield, MessageSquare, Link, ArrowRight } from "lucide-react";

// import { Input } from "@/components/ui/input";
// import { cn } from "@/lib/utils";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { ScrollArea } from "@/components/ui/scroll-area";

// type SearchFilterProps = {
//     placeholder: string;
//     className?: string;
//     isOpen: boolean;
//     onOpenChange: (open: boolean) => void;
// }

// const searchCategories = [
//   {
//     title: "Projects",
//     icon: Folder,
//     items: [
//       { name: "Post functions (Copy)", type: "Customer", budget: "CA$2,499.98", status: "Draft" },
//       { name: "Personal project", type: "Customer", budget: "CN¥66,000.00", status: "Published" },
//       { name: "Payment test", type: "Customer", budget: "CA$4,000.22", status: "Draft" },
//     ]
//   },
//   {
//     title: "Customers",
//     icon: Users,
//     items: [
//       { name: "John Doe", type: "Active Client", email: "john@example.com", phone: "+1234567890" },
//       { name: "Sarah Wilson", type: "New Lead", email: "sarah@example.com", phone: "+1234567891" },
//       { name: "Tech Corp", type: "Enterprise", email: "contact@techcorp.com", phone: "+1234567892" },
//     ]
//   },
//   {
//     title: "Invoices",
//     icon: FileText,
//     items: [
//       { name: "INV-001", type: "Paid", amount: "$2,500.00", date: "2025-01-15" },
//       { name: "INV-002", type: "Pending", amount: "$1,800.00", date: "2025-01-14" },
//       { name: "INV-003", type: "Overdue", amount: "$3,200.00", date: "2025-01-10" },
//     ]
//   },
//   {
//     title: "Receipts",
//     icon: Receipt,
//     items: [
//       { name: "REC-001", type: "Confirmed", amount: "$2,500.00", date: "2025-01-16" },
//       { name: "REC-002", type: "Pending", amount: "$1,800.00", date: "2025-01-15" },
//       { name: "REC-003", type: "Confirmed", amount: "$3,200.00", date: "2025-01-12" },
//     ]
//   },
//   {
//     title: "Feedbacks",
//     icon: MessageSquare,
//     items: [
//       { name: "Client Review #1", type: "Positive", rating: "5 Stars", date: "2025-01-14" },
//       { name: "Project Feedback", type: "Pending", rating: "Not Rated", date: "2025-01-13" },
//       { name: "Service Rating", type: "Completed", rating: "4 Stars", date: "2025-01-12" },
//     ]
//   },
//   {
//     title: "Links",
//     icon: Link,
//     items: [
//       { name: "Project Repository", type: "GitHub", url: "github.com/project", created: "2025-01-10" },
//       { name: "Design Files", type: "Figma", url: "figma.com/design", created: "2025-01-08" },
//       { name: "Documentation", type: "Notion", url: "notion.so/docs", created: "2025-01-05" },
//     ]
//   },
//   {
//     title: "Settings",
//     icon: Shield,
//     items: []
//   }
// ];

// export default function CommandFilter({
//     placeholder,
//     className,
//     isOpen,
//     onOpenChange
// }: SearchFilterProps) {
//   const [searchQuery, setSearchQuery] = useState("");

//   return (
//     <Dialog open={isOpen} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-2xl h-[80vh] max-h-[600px] p-0 gap-0 flex flex-col">
//         <DialogTitle className="sr-only">Search Command</DialogTitle>
//         <DialogHeader className="p-4 pb-0 flex-shrink-0">
//           <div className="relative">
//             <ScanSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
//             <Input
//               type="text"
//               placeholder={placeholder}
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="pl-10 pr-12 border-border placeholder:text-muted-foreground text-lg h-12 bg-background"
//               autoFocus
//             />
//             <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
//               <Badge variant="outline" className="text-xs font-mono">
//                 ⌘K
//               </Badge>
//             </div>
//           </div>
//         </DialogHeader>
        
//         <Separator className="flex-shrink-0" />
        
//         <ScrollArea className="flex-1 px-4">
//           <div className="space-y-4 py-4">
//             {searchCategories.map((category) => (
//               <div key={category.title} className="space-y-2">
//                 <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
//                   <category.icon className="h-4 w-4" />
//                   {category.title}
//                 </div>
//                 <div className="space-y-1">
//                   {category.items.length > 0 ? (
//                     category.items.map((item, index) => (
//                       <div
//                         key={index}
//                         className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer group"
//                       >
//                         <div className="flex items-center gap-3">
//                           <div className="flex items-center gap-2">
//                             <span className="text-sm">{item.name}</span>
//                             <Badge variant="secondary" className="text-xs">
//                               {item.type}
//                             </Badge>
//                           </div>
//                         </div>
//                         <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
//                       </div>
//                     ))
//                   ) : (
//                     <div className="p-2 text-sm text-muted-foreground">
//                       No items found
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </ScrollArea>
        
//         <Separator className="flex-shrink-0" />
        
//         <div className="p-4 pt-2 flex-shrink-0">
//           <div className="flex items-center justify-between text-xs text-muted-foreground">
//             <div className="flex items-center gap-4">
//               <div className="flex items-center gap-1">
//                 <Badge variant="outline" className="font-mono">↵</Badge>
//                 <span>to select</span>
//               </div>
//               <div className="flex items-center gap-1">
//                 <Badge variant="outline" className="font-mono">↑↓</Badge>
//                 <span>to navigate</span>
//               </div>
//             </div>
//             <div className="flex items-center gap-1">
//               <Badge variant="outline" className="font-mono">esc</Badge>
//               <span>to close</span>
//             </div>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }