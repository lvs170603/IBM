
"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Job, Backend, Metrics, ChartData, DailyJobSummary, PeriodicReportData } from "@/lib/types";

interface DashboardContextType {
  isDemo: boolean;
  setIsDemo: (isDemo: boolean) => void;
  autoRefresh: boolean;
  setAutoRefresh: (autoRefresh: boolean) => void;
  isFetching: boolean;
  lastUpdated: Date | null;
  fetchData: (force?: boolean) => void;
  jobs: Job[] | null;
  backends: Backend[] | null;
  metrics: Metrics | null;
  chartData: ChartData[] | null;
  dailySummary: DailyJobSummary | null;
  periodicReportData: PeriodicReportData | null;
  source: string;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [isDemo, setIsDemo] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isFetching, setIsFetching] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [jobs, setJobs] = useState<Job[] | null>([]);
  const [backends, setBackends] = useState<Backend[] | null>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [chartData, setChartData] = useState<ChartData[] | null>([]);
  const [dailySummary, setDailySummary] = useState<DailyJobSummary | null>(null);
  const [periodicReportData, setPeriodicReportData] = useState<PeriodicReportData | null>(null);
  const [source, setSource] = useState<string>("mock");
  
  const { toast } = useToast();

  const fetchData = useCallback(async (force = false) => {
    if (isFetching && !force) return;
    setIsFetching(true);
    const url = `/api/mock?demo=${isDemo}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setJobs(data.jobs);
      setBackends(data.backends);
      setMetrics(data.metrics);
      setChartData(data.chartData);
      setDailySummary(data.dailySummary);
      setPeriodicReportData(data.periodicReportData);
      setSource(data.source);
      setLastUpdated(new Date());
      if (data.note) {
        toast({ variant: "destructive", title: "API Connection Failed", description: data.note });
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch data from the server." });
    } finally {
      setIsFetching(false);
    }
  }, [isDemo, toast, isFetching]);

  useEffect(() => {
    fetchData(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => fetchData(), 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const value = {
    isDemo,
    setIsDemo,
    autoRefresh,
    setAutoRefresh,
    isFetching,
    lastUpdated,
    fetchData,
    jobs,
    backends,
    metrics,
    chartData,
    dailySummary,
    periodicReportData,
    source,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
