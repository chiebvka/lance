
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



import SelectCalendar from "./select-calendar"
import { useDashboardMetrics, MetricType } from "@/hooks/dashboard/use-dashboard"

export const description = "Dashboard charts with real-time data"

// Chart configurations for each metric type
const chartConfigs: Record<MetricType, ChartConfig> = {
  invoices: {
    visitors: { label: "Invoices" },
    sent: { label: "Sent", color: "hsl(250, 95%, 70%)" },
    overdue: { label: "Overdue", color: "hsl(0, 85%, 75%)" },
    settled: { label: "Settled", color: "hsl(250, 95%, 25%)" },
  },
  receipts: {
    views: { label: "Receipts" },
    manual: { label: "Manual", color: "hsl(250, 95%, 70%)" },
    auto: { label: "Auto", color: "hsl(250, 95%, 40%)" },
    invoice: { label: "From Invoice", color: "hsl(250, 95%, 25%)" },
  },
  feedbacks: {
    views: { label: "Feedbacks" },
    sent: { label: "Sent", color: "hsl(250, 95%, 70%)" },
    completed: { label: "Completed", color: "hsl(250, 95%, 25%)" },
    overdue: { label: "Overdue", color: "hsl(0, 85%, 75%)" },
  },
  projects: {
    visitors: { label: "Projects" },
    pending: { label: "Pending", color: "hsl(250, 95%, 70%)" },
    inProgress: { label: "In Progress", color: "hsl(45, 85%, 65%)" },
    signed: { label: "Signed", color: "hsl(120, 85%, 65%)" },
    overdue: { label: "Overdue", color: "hsl(0, 85%, 75%)" },
    completed: { label: "Completed", color: "hsl(250, 95%, 25%)" },
  },
}

// choose your default preset here:
const DEFAULT_PRESET = "12m" as const;
const HARD_START_DATE = new Date("2025-01-01T00:00:00.000Z");

function getPresetRange(preset: string) {
  const now = new Date();
  switch (preset) {
    case "30d": return { from: subDays(now, 29), to: now };
    case "3m":  return { from: subMonths(now, 3), to: now };
    case "6m":  return { from: subMonths(now, 6), to: now };
    case "12m": {
      const oneYearAgo = subMonths(now, 12);
      return { from: oneYearAgo < HARD_START_DATE ? HARD_START_DATE : oneYearAgo, to: now };
    }
    case "ytd": return { from: startOfYear(now), to: now };
    case "all": return { from: HARD_START_DATE, to: now };
    default:    return { from: subMonths(now, 12), to: now }; // 12m default
  }
}


export function PreviewChartArea({ 
  initialFrom, 
  initialTo 
}: { 
  initialFrom?: string, 
  initialTo?: string 
}) {
  const defaultRange = React.useMemo(() => {
    if (initialFrom && initialTo) {
      return { from: new Date(initialFrom), to: new Date(initialTo) }
    }
    return getPresetRange(DEFAULT_PRESET)
  }, [initialFrom, initialTo]);

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

  // Calculate date range based on params or default to past 12 months
  const dateRange = React.useMemo(() => {
    if (params.dateFrom && params.dateTo) {
      return { from: params.dateFrom, to: params.dateTo };
    }
    
    // Default to past 12 months
    const endDate = new Date();
    const startDate = subMonths(endDate, 12);
    return { from: startDate, to: endDate };
  }, [params.dateFrom, params.dateTo]);

  // Calculate 18-month limit from current date
  const maxDateRange = React.useMemo(() => {
    const endDate = new Date();
    const startDate = subMonths(endDate, 18);
    return { from: startDate, to: endDate };
  }, []);

  // Fetch real data using React Query
  const { data: currentData, isLoading, error } = useDashboardMetrics(
    dateRange.from.toISOString(),
    dateRange.to.toISOString(),
    metric
  );

  const chartConfig = chartConfigs[metric]

  const filteredData = React.useMemo(() => {
    if (!currentData?.series) return []
    return currentData.series
  }, [currentData])

  const total = React.useMemo(() => {
    if (!currentData?.totals) return {}
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

  const getXAxisTicks = () => {
    const ticks = [];
    let currentDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);
    
    const timeDifference = endDate.getTime() - currentDate.getTime();
    const daysDifference = timeDifference / (1000 * 3600 * 24);

    if (daysDifference > 90) { // Aggregate by month
      currentDate.setDate(1); // Start from the first day of the month
      while (currentDate <= endDate) {
        ticks.push(currentDate.toISOString().split('T')[0]);
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    } else { // Aggregate by day (show ticks for every N days)
      const tickInterval = Math.ceil(daysDifference / 10) || 1; // Aim for ~10 ticks
      while (currentDate <= endDate) {
        ticks.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + tickInterval);
      }
    }
    return ticks;
  };

  const xAxisTickFormatter = (value: string) => {
    const date = new Date(value);
    const timeDifference = dateRange.to.getTime() - dateRange.from.getTime();
    const daysDifference = timeDifference / (1000 * 3600 * 24);

    if (daysDifference > 90) {
      return date.toLocaleDateString("en-US", { month: "short", timeZone: 'UTC' });
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: 'UTC' });
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
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
          <SelectCalendar
            dateFrom={params.dateFrom}
            dateTo={params.dateTo}
            onDateRangeChange={handleDateRangeChange}
            maxDateRange={maxDateRange}
            defaultTimeRange={DEFAULT_PRESET}
          />
        </div>
        <Card className="pt-0">
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>Loading...</CardTitle>
              <CardDescription>Fetching {metric} data...</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <div className="aspect-auto h-[350px] w-full flex items-center justify-center">
              <div className="text-muted-foreground">Loading chart data...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
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
          <SelectCalendar
            dateFrom={params.dateFrom}
            dateTo={params.dateTo}
            onDateRangeChange={handleDateRangeChange}
            maxDateRange={maxDateRange}
            defaultTimeRange={DEFAULT_PRESET}
          />
        </div>
        <Card className="pt-0">
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>Error Loading Data</CardTitle>
              <CardDescription>Failed to load {metric} data</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <div className="aspect-auto h-[350px] w-full flex items-center justify-center">
              <div className="text-red-500">Error: {error.message}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
                : `Showing ${metric} for the past 12 months`
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
            className="aspect-auto h-[350px] w-full"
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
                  type="category"
                  ticks={getXAxisTicks()}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={xAxisTickFormatter}
                />
                <YAxis 
                  hide={false} 
                  tickCount={5}
                  domain={[0, (dataMax: number) => dataMax < 10 ? 10 : Math.ceil(dataMax * 1.2)]} 
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
                  type="category"
                  ticks={getXAxisTicks()}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={xAxisTickFormatter}
                />
                <YAxis tickCount={5} domain={[0, (dataMax: number) => dataMax < 10 ? 10 : Math.ceil(dataMax * 1.2)]} />
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
