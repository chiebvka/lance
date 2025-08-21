
"use client"

import * as React from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { format, endOfMonth, subDays, subMonths, startOfMonth, startOfYear } from "date-fns"
import { type DateRange } from "react-day-picker"
import { parseAsIsoDateTime, useQueryStates } from 'nuqs'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"



import dummyData from "./dummy.json"
import SelectCalendar from "./select-calendar"

export const description = "Dashboard charts preview with dummy data"

type MetricType = "invoices" | "receipts" | "feedbacks" | "projects"

// Chart configurations for each metric type
const chartConfigs: Record<MetricType, ChartConfig> = {
  invoices: {
    visitors: { label: "Invoices" },
    pending: { label: "Pending", color: "hsl(250, 95%, 70%)" },
    overdue: { label: "Overdue", color: "hsl(0, 85%, 75%)" },
    settled: { label: "Settled", color: "hsl(250, 95%, 25%)" },
  },
  receipts: {
    views: { label: "Receipts" },
    invoice: { label: "From Invoice", color: "hsl(250, 95%, 70%)" },
    manual: { label: "Manual", color: "hsl(250, 95%, 40%)" },
  },
  feedbacks: {
    views: { label: "Feedbacks" },
    answered: { label: "Answered", color: "hsl(250, 95%, 70%)" },
    overdue: { label: "Overdue", color: "hsl(0, 85%, 75%)" },
    unanswered: { label: "Unanswered", color: "hsl(250, 95%, 40%)" },
  },
  projects: {
    visitors: { label: "Projects" },
    pending: { label: "Pending", color: "hsl(250, 95%, 70%)" },
    overdue: { label: "Overdue", color: "hsl(0, 85%, 75%)" },
    completed: { label: "Completed", color: "hsl(250, 95%, 25%)" },
  },
}


// choose your default preset here:
const DEFAULT_PRESET = "ytd" as const;

function getPresetRange(preset: string) {
  const now = new Date();
  switch (preset) {
    case "30d": return { from: subDays(now, 29), to: now };
    case "4w":  return { from: subDays(now, 27), to: now };
    case "3m":  return { from: subMonths(now, 3), to: now };
    case "6m":  return { from: subMonths(now, 6), to: now };
    case "12m": return { from: subMonths(now, 12), to: now };
    case "mtd": return { from: startOfMonth(now), to: now };
    case "ytd": return { from: startOfYear(now), to: now };
    default:    return { from: subDays(now, 29), to: now }; // 30d
  }
}


export function PreviewChartArea() {
  const defaultRange = React.useMemo(() => getPresetRange(DEFAULT_PRESET), []);
  const [metric, setMetric] = React.useState<MetricType>("invoices")

  // nuqs supplies defaults when URL is empty, and removes them from the URL when equal (clearOnDefault)
  const [params, setParams] = useQueryStates(
    {
      dateFrom: parseAsIsoDateTime
        .withDefault(defaultRange.from)
        .withOptions({ clearOnDefault: true }),
      dateTo: parseAsIsoDateTime
        .withDefault(defaultRange.to)
        .withOptions({ clearOnDefault: true }),
    },
    { history: "push" }
  );

  // Calculate date range based on params or default to past 30 days
  const dateRange = React.useMemo(() => {
    if (params.dateFrom && params.dateTo) {
      return { from: params.dateFrom, to: params.dateTo };
    }
    
    // Default to past 30 days
    const endDate = new Date();
    const startDate = subMonths(endDate, 1); // 1 month = ~30 days
    return { from: startDate, to: endDate };
  }, [params.dateFrom, params.dateTo]);

  // Calculate 18-month limit from current date
  const maxDateRange = React.useMemo(() => {
    const endDate = new Date();
    const startDate = subMonths(endDate, 18);
    return { from: startDate, to: endDate };
  }, []);

  const currentData = dummyData[metric]
  const chartConfig = chartConfigs[metric]

  const filteredData = React.useMemo(() => {
    if (!currentData) return []
    
    const data = currentData.series
    const startDate = dateRange.from
    const endDate = dateRange.to
    
    return data.filter(item => {
      const itemDate = new Date(item.date)
      return itemDate >= startDate && itemDate <= endDate
    })
  }, [currentData, dateRange])

  const total = React.useMemo(() => {
    if (!currentData) return {}
    return currentData.totals
  }, [currentData])

  // const handleDateRangeChange = (date: DateRange | undefined) => {
  //   if (date?.from && date?.to) {
  //     // Ensure the date range doesn't exceed 18 months
  //     const rangeInMonths = (date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  //     if (rangeInMonths > 18) {
  //       // If range is too large, adjust to 18 months from the end date
  //       const adjustedFrom = subMonths(date.to, 18);
  //       setParams({
  //         dateFrom: adjustedFrom,
  //         dateTo: date.to,
  //       });
  //     } else {
  //       setParams({
  //         dateFrom: date.from,
  //         dateTo: date.to,
  //       });
  //     }
  //   } else {
  //     setParams({
  //       dateFrom: null,
  //       dateTo: null,
  //     });
  //   }
  // };

  const handleDateRangeChange = (date: DateRange | undefined) => {
    if (date?.from && date?.to) {
      // enforce 18 months if you want, then:
      setParams({ dateFrom: date.from, dateTo: date.to });
    } else {
      // clearing -> remove from URL; nuqs will feed you the defaults again
      setParams({ dateFrom: null, dateTo: null });
    }
  };

  const getSeriesColor = (seriesKey: string): string => {
    if (!currentData?.meta?.config) return "hsl(250, 95%, 60%)"
    const config = currentData.meta.config as Record<string, { color: string }>
    return config[seriesKey]?.color || "hsl(250, 95%, 60%)"
  }

  // Determine if we should use area chart or bar chart
  const useAreaChart = metric === "invoices" || metric === "projects" || metric === "feedbacks"

  return (
    <div className="space-y-6">
      {/* Metric Selector */}
      <div className="flex items-center justify-between gap-4">
        <Select value={metric} onValueChange={(value) => setMetric(value as MetricType)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select metric" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="invoices">Invoices</SelectItem>
            <SelectItem value="receipts">Receipts</SelectItem>
            <SelectItem value="feedbacks">Feedbacks</SelectItem>
            <SelectItem value="projects">Projects</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Range Filter */}
        <SelectCalendar
         dateFrom={params.dateFrom}
         dateTo={params.dateTo}
         onDateRangeChange={handleDateRangeChange}
         maxDateRange={maxDateRange}
         defaultTimeRange={DEFAULT_PRESET}
        />
      </div>

      {/* Main Chart */}
      <Card className="pt-0">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>
              {useAreaChart ? "Area Chart" : "Bar Chart"} - Interactive
            </CardTitle>
            <CardDescription>
              {params.dateFrom && params.dateTo 
                ? `Showing ${metric} from ${format(params.dateFrom, 'MMM d')} to ${format(params.dateTo, 'MMM d, yyyy')}`
                : `Showing ${metric} for the past 30 days`
              }
            </CardDescription>
          </div>
          
          {/* Totals Display */}
          <div className="flex gap-4">
            {Object.entries(total).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-2xl font-bold">{String(value)}</div>
                <div className="text-sm text-muted-foreground capitalize">{key}</div>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            {useAreaChart ? (
              <AreaChart data={filteredData}>
                <defs>
                  {currentData?.meta?.seriesKeys.map((seriesKey) => (
                    <linearGradient
                      key={seriesKey}
                      id={`fill${seriesKey.charAt(0).toUpperCase() + seriesKey.slice(1)}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={getSeriesColor(seriesKey)}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor={getSeriesColor(seriesKey)}
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={true} horizontal={true} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }}
                      indicator="dot"
                    />
                  }
                />
                {currentData?.meta?.seriesKeys.map((seriesKey) => (
                  <Area
                    key={seriesKey}
                    dataKey={seriesKey}
                    type="natural"
                    fill={`url(#fill${seriesKey.charAt(0).toUpperCase() + seriesKey.slice(1)})`}
                    stroke={getSeriesColor(seriesKey)}
                    stackId="a"
                  />
                ))}
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            ) : (
              <BarChart data={filteredData}>
                <CartesianGrid vertical={true} horizontal={true} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                />
                <YAxis />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }}
                      indicator="dot"
                    />
                  }
                />
                {currentData?.meta?.seriesKeys.map((seriesKey) => (
                  <Bar
                    key={seriesKey}
                    dataKey={seriesKey}
                    fill={getSeriesColor(seriesKey)}
                  />
                ))}
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            )}
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
