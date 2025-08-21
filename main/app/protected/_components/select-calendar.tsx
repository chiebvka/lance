
"use client";

import * as React from "react";
import {
  format,
  subDays,
  subMonths,
  startOfMonth,
  startOfYear,
} from "date-fns";
import { type DateRange } from "react-day-picker";
import { ChevronDown } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectCalendarProps {
  dateFrom?: Date | null;
  dateTo?: Date | null;
  onDateRangeChange: (date: DateRange | undefined) => void;
  maxDateRange: { from: Date; to: Date };
  /** choose one of: "30d" | "4w" | "3m" | "6m" | "12m" | "mtd" | "ytd" | "all" */
  defaultTimeRange?: string;
}

type Preset = {
  value: string;
  label: string;
  get: () => { from: Date; to: Date };
};

export default function SelectCalendar({
  dateFrom,
  dateTo,
  onDateRangeChange,
  maxDateRange,
  defaultTimeRange = "30d",
}: SelectCalendarProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedPreset, setSelectedPreset] = React.useState<string>(defaultTimeRange);

  // --- Presets (now includes "30d") ---
  // const presets: Preset[] = [
  //   { value: "30d", label: "Last 30 days", get: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  //   { value: "4w",  label: "Last 4 weeks", get: () => ({ from: subDays(new Date(), 27), to: new Date() }) },
  //   { value: "3m",  label: "Last 3 months", get: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
  //   { value: "6m",  label: "Last 6 months", get: () => ({ from: subMonths(new Date(), 6), to: new Date() }) },
  //   { value: "12m", label: "Last 12 months", get: () => ({ from: subMonths(new Date(), 12), to: new Date() }) },
  //   { value: "mtd", label: "Month to date", get: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  //   { value: "ytd", label: "Year to date",  get: () => ({ from: startOfYear(new Date()), to: new Date() }) },
  //   { value: "all", label: "All time",      get: () => ({ from: maxDateRange.from, to: maxDateRange.to }) },
  // ];


  const presets: Preset[] = [
    { value: "30d", label: "Last 30 days", get: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
    { value: "4w",  label: "Last 4 weeks", get: () => ({ from: subDays(new Date(), 27), to: new Date() }) },
    { value: "3m",  label: "Last 3 months", get: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
    { value: "6m",  label: "Last 6 months", get: () => ({ from: subMonths(new Date(), 6), to: new Date() }) },
    { value: "12m", label: "Last 12 months", get: () => ({ from: subMonths(new Date(), 12), to: new Date() }) },
    { value: "mtd", label: "Month to date", get: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
    { value: "ytd", label: "Year to date",  get: () => ({ from: startOfYear(new Date()), to: new Date() }) },
    { value: "all", label: "All time",      get: () => ({ from: maxDateRange.from, to: maxDateRange.to }) },
  ];




  // derive which preset is active from props (no effects)
  const matchedPreset = React.useMemo(() => {
    if (!dateFrom || !dateTo) return null;
    return presets.find(p => {
      const r = p.get();
      return (
        format(r.from, "yyyy-MM-dd") === format(dateFrom, "yyyy-MM-dd") &&
        format(r.to,   "yyyy-MM-dd") === format(dateTo,   "yyyy-MM-dd")
      );
    }) ?? null;
  }, [dateFrom, dateTo]);



  const selectedPresetValue = matchedPreset?.value ?? ""; // "" = custom

  const displayText = matchedPreset
    ? matchedPreset.label
    : (dateFrom && dateTo)
        ? `${format(dateFrom, "MMM d, yyyy")} – ${format(dateTo, "MMM d, yyyy")}`
        : // if parent uses nuqs defaults, this state rarely happens; show default label:
          presets.find(p => p.value === defaultTimeRange)?.label ?? "Select period";

  const applyPreset = (value: string) => {
    const p = presets.find(pr => pr.value === value);
    if (!p) return;
    onDateRangeChange(p.get());
  };



  const handleCustom = (range: DateRange | undefined) => {
    if (range?.from && range?.to) onDateRangeChange({ from: range.from, to: range.to });
  };

  const clearCustom = () => onDateRangeChange(undefined);

  // If nothing is set, initialize from defaultTimeRange (or fall back to 30d)
  // React.useEffect(() => {
  //   if (!dateFrom && !dateTo) {
  //     const preset = presets.find(p => p.value === defaultTimeRange) ?? presets[0];
  //     setSelectedPreset(preset.value);
  //     onDateRangeChange(preset.get());
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  // // Keep the preset <Select> in sync with URL params (so it doesn’t appear blank).
  // React.useEffect(() => {
  //   if (dateFrom && dateTo) {
  //     const match = presets.find(p => {
  //       const r = p.get();
  //       return (
  //         format(r.from, "yyyy-MM-dd") === format(dateFrom, "yyyy-MM-dd") &&
  //         format(r.to,   "yyyy-MM-dd") === format(dateTo,   "yyyy-MM-dd")
  //       );
  //     });
  //     setSelectedPreset(match?.value ?? ""); // "" means custom range
  //   }
  // }, [dateFrom, dateTo]);



  // Trigger label mirrors ref behavior
  // const displayText = React.useMemo(() => {
  //   if (dateFrom && dateTo) {
  //     const match = presets.find(p => {
  //       const r = p.get();
  //       return (
  //         format(r.from, "yyyy-MM-dd") === format(dateFrom, "yyyy-MM-dd") &&
  //         format(r.to,   "yyyy-MM-dd") === format(dateTo,   "yyyy-MM-dd")
  //       );
  //     });
  //     if (match) return match.label;
  //     return `${format(dateFrom, "MMM d, yyyy")} – ${format(dateTo, "MMM d, yyyy")}`;
  //   }
  //   return "Select period";
  // }, [dateFrom, dateTo]); // eslint-disable-line

  // const applyPreset = (value: string) => {
  //   setSelectedPreset(value);
  //   const p = presets.find(pr => pr.value === value);
  //   if (!p) return;
  //   onDateRangeChange(p.get());
  // };

  // const handleCustom = (range: DateRange | undefined) => {
  //   if (range?.from && range?.to) {
  //     // 18-month guard
  //     const months = (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  //     const safeFrom = months > 18 ? subMonths(range.to, 18) : range.from;
  //     onDateRangeChange({ from: safeFrom, to: range.to });
  //     setSelectedPreset(""); // custom
  //   }
  // };

  // const clearCustom = () => {
  //   const fallback = presets.find(p => p.value === defaultTimeRange) ?? presets[0];
  //   onDateRangeChange(undefined);
  //   setSelectedPreset(fallback.value);
  // };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="min-w-[220px] justify-between gap-2">
          <span className="truncate">{displayText}</span>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>

      {/* Always STACKED: Select on top, Calendar underneath; right-aligned like the ref */}
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="p-0 w-[360px] sm:w-[520px] shadow-lg"
      >
        <div className="px-4 py-3 border-b text-sm font-medium">Select time period</div>

        <div className="flex flex-col">
          {/* Preset select */}
          <div className="p-3 border-b">
            <Select value={selectedPresetValue} onValueChange={applyPreset}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a range" />
              </SelectTrigger>
              <SelectContent>
              {presets.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <button
              onClick={clearCustom}
              className="mt-2 text-xs text-muted-foreground hover:underline"
            >
              Clear custom range
            </button>
          </div>

          {/* Calendar below */}
          <div className="p-2">
            {/* <Calendar
              initialFocus
              mode="range"
              numberOfMonths={2}
              captionLayout="dropdown"
              defaultMonth={dateFrom ?? new Date()}
              selected={dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined}
              onSelect={handleCustom}
              fromYear={maxDateRange.from.getFullYear()}
              toYear={maxDateRange.to.getFullYear()}
              disabled={(d) => d < maxDateRange.from || d > maxDateRange.to}
              className="mx-auto"
            /> */}

            <Calendar
              initialFocus
              mode="range"
              numberOfMonths={2}
              captionLayout="dropdown"
              defaultMonth={dateFrom ?? new Date()}
              selected={dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined}
              onSelect={handleCustom}
              fromYear={maxDateRange.from.getFullYear()}
              toYear={maxDateRange.to.getFullYear()}
              disabled={(d) => d < maxDateRange.from || d > maxDateRange.to}
              className="mx-auto"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}