import { createClient } from "@/utils/supabase/server";
import { getAuthenticatedUser } from "@/utils/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    
    // Get organizationId from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organizationId')
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile?.organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const organizationId = profile.organizationId;

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const metric = searchParams.get("metric");

    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    switch (endpoint) {
      case "metrics":
        return await getMetrics(supabase, organizationId, from, to, metric);
      case "recent":
        return await getRecentItems(supabase, organizationId);
      case "calendar":
        return await getCalendarItems(supabase, organizationId, from, to);
      default:
        return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
    }
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function getMetrics(supabase: any, organizationId: string, from?: string | null, to?: string | null, metric?: string | null) {
  const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  let toDate;
  if (to) {
    const d = new Date(to);
    d.setHours(23, 59, 59, 999); // Set to end of day to include all records from that day
    toDate = d.toISOString();
  } else {
    toDate = new Date().toISOString();
  }

  if (!metric) {
    return NextResponse.json({ error: "Metric type is required" }, { status: 400 });
  }

  // Determine granularity based on date range
  const fromDateObj = new Date(fromDate);
  const toDateObj = new Date(toDate);
  const diffTime = Math.abs(toDateObj.getTime() - fromDateObj.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const granularity = diffDays > 90 ? 'month' : 'day';

  // Execute the time series query using Supabase client
  let series: any[] = [];
  let totals: any = {};

  try {
    switch (metric) {
      case "invoices":
        // Get time series data
        const { data: invoiceSeries, error: invoiceSeriesError } = await supabase
          .from('invoices')
          .select('issueDate, created_at, state, totalAmount')
          .eq('organizationId', organizationId)
          .gte('issueDate', fromDate)
          .lte('issueDate', toDate);

        if (invoiceSeriesError) throw invoiceSeriesError;

        // Process and aggregate by day (only sent, overdue, settled)
        series = aggregateData(invoiceSeries || [], 'issueDate', 'created_at', ['sent', 'overdue', 'settled'], 'state', granularity, fromDate, toDate);
        
        // Get totals (only sent, overdue, settled)
        const invoiceCounts = (invoiceSeries || []).reduce((acc: any, item: any) => {
          if (['sent', 'overdue', 'settled'].includes(item.state)) {
            acc[item.state] = (acc[item.state] || 0) + 1;
          }
          return acc;
        }, {});
        totals = { sent: 0, overdue: 0, settled: 0, ...invoiceCounts };
        break;

      case "projects":
        const { data: projectSeries, error: projectSeriesError } = await supabase
          .from('projects')
          .select('created_at, status')
          .eq('organizationId', organizationId)
          .gte('created_at', fromDate)
          .lte('created_at', toDate);

        if (projectSeriesError) throw projectSeriesError;

        series = aggregateData(projectSeries || [], 'created_at', null, ['pending', 'inProgress', 'signed', 'overdue', 'completed'], 'status', granularity, fromDate, toDate);
        
        const projectCounts = (projectSeries || []).reduce((acc: any, item: any) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {});
        totals = { pending: 0, inProgress: 0, signed: 0, overdue: 0, completed: 0, ...projectCounts };
        break;

      case "feedbacks":
        const { data: feedbackSeries, error: feedbackSeriesError } = await supabase
          .from('feedbacks')
          .select('created_at, state')
          .eq('organizationId', organizationId)
          .gte('created_at', fromDate)
          .lte('created_at', toDate);

        if (feedbackSeriesError) throw feedbackSeriesError;

        series = aggregateData(feedbackSeries || [], 'created_at', null, ['sent', 'completed', 'overdue'], 'state', granularity, fromDate, toDate);
        
        const feedbackCounts = (feedbackSeries || []).reduce((acc: any, item: any) => {
          if (['sent', 'completed', 'overdue'].includes(item.state)) {
            acc[item.state] = (acc[item.state] || 0) + 1;
          }
          return acc;
        }, {});
        totals = { sent: 0, completed: 0, overdue: 0, ...feedbackCounts };
        break;

      case "receipts":
        const { data: receiptSeries, error: receiptSeriesError } = await supabase
          .from('receipts')
          .select('issueDate, created_at, creationMethod, totalAmount')
          .eq('organizationId', organizationId)
          .gte('issueDate', fromDate)
          .lte('issueDate', toDate);

        if (receiptSeriesError) throw receiptSeriesError;

        series = aggregateData(receiptSeries || [], 'issueDate', 'created_at', ['manual', 'auto', 'invoice'], 'creationMethod', granularity, fromDate, toDate);
        
        const receiptCounts = (receiptSeries || []).reduce((acc: any, item: any) => {
          acc[item.creationMethod] = (acc[item.creationMethod] || 0) + 1;
          return acc;
        }, {});
        totals = { manual: 0, auto: 0, invoice: 0, ...receiptCounts };
        break;
    }
  } catch (error) {
    console.error("Database query error:", error);
    return NextResponse.json({ error: "Failed to fetch metrics data" }, { status: 500 });
  }

  return NextResponse.json({
    from: fromDate,
    to: toDate,
    metric,
    series: series || [],
    totals: totals?.[0] || {},
    meta: getMetricMeta(metric)
  });
}

async function getRecentItems(supabase: any, organizationId: string) {
  const queries = [
    {
      table: 'invoices',
      fields: 'id, invoiceNumber, state, totalAmount, created_at, issueDate',
      orderBy: 'created_at'
    },
    {
      table: 'projects', 
      fields: 'id, name, status, created_at, endDate',
      orderBy: 'created_at'
    },
    {
      table: 'feedbacks',
      fields: 'id, name, state, created_at, dueDate, filledOn',
      orderBy: 'created_at'
    },
    {
      table: 'receipts',
      fields: 'id, receiptNumber, state, creationMethod, totalAmount, created_at, issueDate',
      orderBy: 'created_at'
    }
  ];

  const results = await Promise.all(
    queries.map(async (q) => {
      const { data, error } = await supabase
        .from(q.table)
        .select(q.fields)
        .eq('organizationId', organizationId)
        .order(q.orderBy, { ascending: false })
        .limit(10);

      if (error) {
        console.error(`Error fetching ${q.table}:`, error);
        return { [q.table]: [] };
      }

      return { [q.table]: data || [] };
    })
  );

  const combined = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
  return NextResponse.json(combined);
}

async function getCalendarItems(supabase: any, organizationId: string, from?: string | null, to?: string | null) {
  const fromDate = from || new Date().toISOString();
  const toDate = to || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // Next 90 days

  // Fetch calendar items using Supabase client
  const results = await Promise.all([
    // Invoices with due dates
    supabase
      .from('invoices')
      .select('id, invoiceNumber, dueDate, state')
      .eq('organizationId', organizationId)
      .gte('dueDate', fromDate)
      .lte('dueDate', toDate)
      .in('state', ['sent', 'overdue'])
      .then(({ data, error }: { data: any, error: any }) => {
        if (error) {
          console.error("Error fetching invoice calendar:", error);
          return [];
        }
        return (data || []).map((item: any) => ({
          id: item.id,
          type: 'invoice',
          title: item.invoiceNumber || 'Invoice',
          due_date: item.dueDate,
          status: item.state,
          priority: item.state === 'overdue' ? 'high' : item.state === 'sent' ? 'medium' : 'low'
        }));
      }),
    
    // Projects with end dates
    supabase
      .from('projects')
      .select('id, name, endDate, status')
      .eq('organizationId', organizationId)
      .gte('endDate', fromDate)
      .lte('endDate', toDate)
      .in('status', ['pending', 'inProgress', 'overdue'])
      .then(({ data, error }: { data: any, error: any }) => {
        if (error) {
          console.error("Error fetching project calendar:", error);
          return [];
        }
        return (data || []).map((item: any) => ({
          id: item.id,
          type: 'project',
          title: item.name || 'Project',
          due_date: item.endDate,
          status: item.status,
          priority: item.status === 'overdue' ? 'high' : item.status === 'inProgress' ? 'medium' : 'low'
        }));
      }),
    
    // Feedbacks with due dates
    supabase
      .from('feedbacks')
      .select('id, name, dueDate, state')
      .eq('organizationId', organizationId)
      .gte('dueDate', fromDate)
      .lte('dueDate', toDate)
      .in('state', ['sent', 'overdue'])
      .then(({ data, error }: { data: any, error: any }) => {
        if (error) {
          console.error("Error fetching feedback calendar:", error);
          return [];
        }
        return (data || []).map((item: any) => ({
          id: item.id,
          type: 'feedback',
          title: item.name || 'Feedback',
          due_date: item.dueDate,
          status: item.state,
          priority: item.state === 'overdue' ? 'high' : item.state === 'sent' ? 'medium' : 'low'
        }));
      })
  ]);

  const combined = results.flat().sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  return NextResponse.json(combined);
}

function getMetricMeta(metric?: string | null) {
  const configs: Record<string, any> = {
    invoices: {
      seriesKeys: ['sent', 'overdue', 'settled'],
      config: {
        sent: { color: 'hsl(250, 95%, 70%)' },
        overdue: { color: 'hsl(0, 85%, 75%)' },
        settled: { color: 'hsl(250, 95%, 25%)' }
      }
    },
    projects: {
      seriesKeys: ['pending', 'inProgress', 'signed', 'overdue', 'completed'],
      config: {
        pending: { color: 'hsl(250, 95%, 70%)' },
        inProgress: { color: 'hsl(45, 85%, 65%)' },
        signed: { color: 'hsl(120, 85%, 65%)' },
        overdue: { color: 'hsl(0, 85%, 75%)' },
        completed: { color: 'hsl(250, 95%, 25%)' }
      }
    },
    feedbacks: {
      seriesKeys: ['sent', 'completed', 'overdue'],
      config: {
        sent: { color: 'hsl(250, 95%, 70%)' },
        completed: { color: 'hsl(250, 95%, 25%)' },
        overdue: { color: 'hsl(0, 85%, 75%)' }
      }
    },
    receipts: {
      seriesKeys: ['manual', 'auto', 'invoice'],
      config: {
        manual: { color: 'hsl(250, 95%, 70%)' },
        auto: { color: 'hsl(250, 95%, 40%)' },
        invoice: { color: 'hsl(250, 95%, 25%)' }
      }
    }
  };

  return configs[metric || 'invoices'] || configs.invoices;
}

// Helper function to aggregate data by day or month, filling in gaps
function aggregateData(
  data: any[],
  primaryDateField: string,
  fallbackDateField: string | null,
  keys: string[],
  groupField: string,
  granularity: 'day' | 'month',
  rangeStart: string,
  rangeEnd: string
) {
  // 1. Aggregate existing data into a map for quick lookups
  const aggregatedDataMap = new Map<string, any>();
  data.forEach(item => {
    const dateValue = item[primaryDateField] || (fallbackDateField ? item[fallbackDateField] : null);
    if (!dateValue) return;

    const date = new Date(dateValue);
    let key: string;

    if (granularity === 'month') {
      key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`;
    } else {
      key = date.toISOString().split('T')[0];
    }
    
    if (!aggregatedDataMap.has(key)) {
      const dateData: any = { date: key };
      keys.forEach(k => dateData[k] = 0);
      aggregatedDataMap.set(key, dateData);
    }

    const dateData = aggregatedDataMap.get(key)!;
    const groupValue = item[groupField];
    if (keys.includes(groupValue)) {
      dateData[groupValue]++;
    }
  });

  // 2. Create a dense data series for the entire date range, filling gaps with zeros
  const denseSeries = [];
  let currentDate = new Date(rangeStart);
  const endDate = new Date(rangeEnd);

  if (granularity === 'month') {
    // Start from the first day of the starting month
    currentDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 1));
  }

  while (currentDate <= endDate) {
    let key: string;
    if (granularity === 'month') {
        key = `${currentDate.getUTCFullYear()}-${String(currentDate.getUTCMonth() + 1).padStart(2, '0')}-01`;
    } else {
        key = currentDate.toISOString().split('T')[0];
    }
    
    if (aggregatedDataMap.has(key)) {
      denseSeries.push(aggregatedDataMap.get(key));
    } else {
      const zeroData: any = { date: key };
      keys.forEach(k => zeroData[k] = 0);
      denseSeries.push(zeroData);
    }

    // Move to the next day or month
    if (granularity === 'month') {
      currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
    } else {
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
  }

  return denseSeries;
}
