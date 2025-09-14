
import { NextResponse } from 'next/server';
import type { Job, Backend, Metrics, ChartData, DailyJobSummary, ConnectivityData, PeriodicReportData, JobStatus } from "@/lib/types";
import { subMinutes, subHours, subDays, format, formatISO, parseISO, isSameDay, startOfDay, eachDayOfInterval, endOfWeek, startOfWeek, endOfMonth, startOfMonth, eachWeekOfInterval, addMinutes } from "date-fns";

const API_BASE_URL = process.env.BACKEND_API_URL || "http://localhost:8000";

// ✅ Simple in-memory cache for mock data (optional)
let mockCache: { data: any; timestamp: number } | null = null;

function calculateDailySummary(jobs: Job[]): DailyJobSummary {
  const today = new Date();
  const todaysCompletedJobs = jobs.filter(job => {
    if (job.status !== 'COMPLETED') return false;
    try {
      // Ensure date is parsed before comparison
      const submittedDate = parseISO(job.submitted);
      return isSameDay(submittedDate, today);
    } catch {
      return false;
    }
  });

  const completedByBackend = todaysCompletedJobs.reduce((acc, job) => {
    acc[job.backend] = (acc[job.backend] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(completedByBackend).map(([name, value]) => ({
    name,
    value,
    fill: `hsl(var(--chart-${(Object.keys(completedByBackend).indexOf(name) % 5) + 1}))`,
  }));

  return {
    date: formatISO(startOfDay(today)),
    totalCompleted: todaysCompletedJobs.length,
    completedByBackend: chartData,
  };
}

function calculatePeriodicReports(jobs: Job[]): PeriodicReportData {
  const now = new Date();
  
  // Weekly data (last 4 weeks)
  const last4Weeks = eachWeekOfInterval({
    start: subDays(now, 28),
    end: now
  }, { weekStartsOn: 1 });

  const weeklyData = last4Weeks.map(weekStart => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weekJobs = jobs.filter(j => {
      const submitted = parseISO(j.submitted);
      return submitted >= weekStart && submitted <= weekEnd;
    });
    return {
      date: format(weekStart, 'MMM d'),
      COMPLETED: weekJobs.filter(j => j.status === 'COMPLETED').length,
      RUNNING: weekJobs.filter(j => j.status === 'RUNNING').length,
      QUEUED: weekJobs.filter(j => j.status === 'QUEUED').length,
      ERROR: weekJobs.filter(j => j.status === 'ERROR').length,
    };
  });

  // Monthly data (last 6 months)
  const monthlyData = Array.from({ length: 6 }).map((_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const monthJobs = jobs.filter(j => {
      const submitted = parseISO(j.submitted);
      return submitted >= monthStart && submitted <= monthEnd;
    });
    return {
      date: format(monthStart, 'MMM'),
      COMPLETED: monthJobs.filter(j => j.status === 'COMPLETED').length,
      RUNNING: monthJobs.filter(j => j.status === 'RUNNING').length,
      QUEUED: monthJobs.filter(j => j.status === 'QUEUED').length,
      ERROR: monthJobs.filter(j => j.status === 'ERROR').length,
    };
  });
  
  return { weekly: weeklyData, monthly: monthlyData };
}

function generateMockConnectivity(backendName: string): ConnectivityData {
  // Simple mock connectivity based on backend name hash
  const seed = backendName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const qubitCountMap: Record<string, number> = {
    "ibm_brisbane": 127,
    "ibm_kyoto": 127,
    "ibm_osaka": 127,
    "ibmq_kolkata": 27,
    "ibmq_mumbai": 27,
    "ibmq_auckland": 27,
  };
  const numQubits = qubitCountMap[backendName] || 27;
  
  const nodes = Array.from({ length: numQubits }, (_, id) => ({
    id,
    group: Math.random() > 0.8 ? 'ancillary' : 'core',
  }));

  const links: { source: number; target: number; value: number }[] = [];
  const linkSet = new Set<string>();

  for (let i = 0; i < numQubits * 1.5; i++) {
    const source = Math.floor(Math.random() * numQubits);
    const target = Math.floor(Math.random() * numQubits);
    if (source === target) continue;
    
    const linkKey = source < target ? `${source}-${target}` : `${target}-${source}`;
    if (!linkSet.has(linkKey)) {
      linkSet.add(linkKey);
      links.push({
        source,
        target,
        value: Math.random() * 0.2 + 0.8, // entanglement strength
      });
    }
  }

  return { nodes, links };
}

const calculateAvgWaitTime = (jobs: Job[], now: Date): number => {
    const waitingJobs = jobs.filter(j => j.status_history.some(s => s.status === 'QUEUED'));
    if (waitingJobs.length === 0) return 0;

    const totalWaitTime = waitingJobs.reduce((acc, job) => {
        const queuedEntry = job.status_history.find(s => s.status === 'QUEUED');
        const runningEntry = job.status_history.find(s => s.status === 'RUNNING');

        if (!queuedEntry) return acc;

        const queuedTime = parseISO(queuedEntry.timestamp);
        
        // If the job is still queued or running, calculate wait time from submission to start time or now.
        // Otherwise, calculate from submission to start time.
        const endTime = runningEntry ? parseISO(runningEntry.timestamp) : now;
        
        const waitDuration = endTime.getTime() - queuedTime.getTime();
        
        // Ensure wait time is not negative
        return acc + Math.max(0, waitDuration);
    }, 0);

    const avgInMs = totalWaitTime / waitingJobs.length;
    return avgInMs / 1000; // convert to seconds
};


// ✅ Generate mock data (cached for 1 minute to improve performance)
async function generateMockData() {
  if (mockCache && Date.now() - mockCache.timestamp < 60 * 1000) {
    return { ...mockCache.data, source: "mock (cached)" };
  }

  const now = new Date();
  const mockBackends: Backend[] = [
    { name: "ibm_brisbane", status: "active", qubit_count: 127, queue_depth: Math.floor(Math.random() * 10), error_rate: 0.012 },
    { name: "ibm_kyoto", status: "active", qubit_count: 127, queue_depth: Math.floor(Math.random() * 10), error_rate: 0.015 },
    { name: "ibm_osaka", status: "active", qubit_count: 127, queue_depth: Math.floor(Math.random() * 10), error_rate: 0.011 },
    { name: "ibmq_kolkata", status: Math.random() > 0.8 ? "maintenance" : "active", qubit_count: 27, queue_depth: 0, error_rate: 0.025 },
    { name: "ibmq_mumbai", status: "active", qubit_count: 27, queue_depth: Math.floor(Math.random() * 5), error_rate: 0.021 },
    { name: "ibmq_auckland", status: Math.random() > 0.9 ? "inactive" : "active", qubit_count: 27, queue_depth: 0, error_rate: 0.033 },
  ];

  const jobStatuses: JobStatus[] = ["COMPLETED", "RUNNING", "QUEUED", "ERROR", "CANCELLED"];
  const users = ["Alice", "Bob", "Charlie", "David", "Eve"];

  
  // Generate jobs over a longer period for periodic reports
  const mockJobs: Job[] = Array.from({ length: 5000 }, (_, i) => {
    const status = jobStatuses[Math.floor(Math.random() * jobStatuses.length)];
    const backend = mockBackends[Math.floor(Math.random() * mockBackends.length)].name;
    const submittedTime = subDays(now, Math.floor(Math.random() * 180)); // Jobs from last 6 months
    
    // Use addMinutes for correct time progression
    const queueDurationMinutes = Math.floor(Math.random() * 30); // 0 to 30 minutes
    const runDurationMinutes = Math.floor(Math.random() * 10); // 0 to 10 minutes

    const startTime = addMinutes(submittedTime, queueDurationMinutes);
    const finishedTime = addMinutes(startTime, runDurationMinutes);

    const status_history = [{ status: 'QUEUED' as JobStatus, timestamp: formatISO(submittedTime) }];
    if (now > startTime) {
      status_history.push({ status: 'RUNNING' as JobStatus, timestamp: formatISO(startTime) });
    }
    if (["COMPLETED", "ERROR", "CANCELLED"].includes(status)) {
      if (now > finishedTime) {
        status_history.push({ status, timestamp: formatISO(finishedTime) });
      }
    }
    const elapsed_time = (finishedTime.getTime() - startTime.getTime()) / 1000;

    return {
      id: `c${Math.random().toString(36).substr(2, 9)}q${i}`,
      status,
      backend,
      submitted: formatISO(submittedTime),
      elapsed_time: elapsed_time > 0 ? elapsed_time : 0,
      user: users[i % users.length],
      qpu_seconds: status === 'COMPLETED' ? Math.random() * 10 : 0,
      logs: status === 'ERROR' ? `Error: Qubit calibration failed.` : `Job executed successfully.`,
      results: status === 'COMPLETED' ? { "001": 102, "110": 34, "101": 410 } : {},
      status_history,
      circuit_image_url: `https://picsum.photos/seed/${i}/800/200`,
      cpu_usage: Math.random() * 100, // Mock CPU usage
    };
  });
  
  const recentJobs = mockJobs.filter(job => parseISO(job.submitted) > subHours(now, 12));

  const liveJobs = recentJobs.filter(j => j.status === 'RUNNING' || j.status === 'QUEUED').length;
  const successfulJobs = recentJobs.filter(j => j.status === 'COMPLETED').length;
  const totalCompletedOrError = successfulJobs + recentJobs.filter(j => j.status === 'ERROR').length;
  const avgWaitTime = calculateAvgWaitTime(recentJobs, now);


  const mockMetrics: Metrics = {
    total_jobs: recentJobs.length,
    live_jobs: liveJobs,
    avg_wait_time: avgWaitTime,
    success_rate: totalCompletedOrError > 0 ? (successfulJobs / totalCompletedOrError) * 100 : 0,
    open_sessions: Math.floor(Math.random() * 5) + 1,
    api_speed: Math.floor(Math.random() * (250 - 50 + 1)) + 50, // Random speed between 50ms and 250ms
  };

  const mockChartData: ChartData[] = Array.from({ length: 12 }, (_, i) => {
    const time = subHours(now, 11 - i);
    return {
      time: formatISO(time).substring(11, 16),
      COMPLETED: Math.floor(Math.random() * 20 + 10),
      RUNNING: Math.floor(Math.random() * 10 + 5),
      QUEUED: Math.floor(Math.random() * 15 + 5),
      ERROR: Math.floor(Math.random() * 3),
    };
  });

  const dailySummary = calculateDailySummary(mockJobs);
  const periodicReportData = calculatePeriodicReports(mockJobs);

  const data = { jobs: recentJobs.slice(0, 50), backends: mockBackends, metrics: mockMetrics, chartData: mockChartData, dailySummary, periodicReportData };
  mockCache = { data, timestamp: Date.now() };

  return { ...data, source: "mock" };
}

async function getRealData() {
  const startTime = Date.now();
  const [backendsResponse, jobsResponse] = await Promise.all([
    fetch(`${API_BASE_URL}/api/backends`),
    fetch(`${API_BASE_URL}/api/jobs?limit=5000`) // Fetch more jobs for reporting
  ]);
  const endTime = Date.now();
  const apiSpeed = endTime - startTime;


  if (!backendsResponse.ok) {
    throw new Error(`Backend API Error: ${backendsResponse.status} ${backendsResponse.statusText}`);
  }
   if (!jobsResponse.ok) {
    throw new Error(`Jobs API Error: ${jobsResponse.status} ${jobsResponse.statusText}`);
  }

  const apiBackends = await backendsResponse.json();
  const apiJobs = await jobsResponse.json();
  
  const backends: Backend[] = apiBackends.map((b: any) => ({
    name: b.name,
    status: b.status.toLowerCase() as "active" | "inactive" | "maintenance",
    qubit_count: b.qubit_count,
    queue_depth: b.queue_depth,
    error_rate: b.error_rate || 0.0,
  }));

  const jobs: Job[] = apiJobs.map((j: any) => ({
    id: j.id,
    status: j.status.toUpperCase() as JobStatus,
    backend: j.backend,
    submitted: j.submitted,
    elapsed_time: j.elapsed_time,
    user: j.user,
    qpu_seconds: j.qpu_seconds || 0,
    logs: j.logs,
    results: j.results || {},
    status_history: j.status_history,
    circuit_image_url: "https://picsum.photos/seed/circuit/800/200", // placeholder
    cpu_usage: Math.random() * 100, // Mock CPU usage for real data as well
  }));
  
  const now = new Date();
  const recentJobs = jobs.filter(job => parseISO(job.submitted) > subHours(now, 12));

  const liveJobs = recentJobs.filter(j => j.status === 'RUNNING' || j.status === 'QUEUED').length;
  const successfulJobs = recentJobs.filter(j => j.status === 'COMPLETED').length;
  const totalCompletedOrError = successfulJobs + recentJobs.filter(j => j.status === 'ERROR').length;
  const avgWaitTime = calculateAvgWaitTime(recentJobs, now);

  const metrics: Metrics = {
    total_jobs: recentJobs.length,
    live_jobs: liveJobs,
    avg_wait_time: avgWaitTime,
    success_rate: totalCompletedOrError > 0 ? (successfulJobs / totalCompletedOrError) * 100 : 100,
    open_sessions: 1, // This is a mock value as session count is not available from the API
    api_speed: apiSpeed,
  };
  
  const chartData: ChartData[] = Array.from({ length: 12 }, (_, i) => {
    const time = subHours(now, 11 - i);
    const timePlusHour = subHours(now, 10 - i);
    const jobsInWindow = recentJobs.filter(j => {
      const submittedDate = parseISO(j.submitted);
      return submittedDate >= time && submittedDate < timePlusHour;
    });

    return {
      time: formatISO(time).substring(11, 16),
      COMPLETED: jobsInWindow.filter(j => j.status === 'COMPLETED').length,
      RUNNING: jobsInWindow.filter(j => j.status === 'RUNNING').length,
      QUEUED: jobsInWindow.filter(j => j.status === 'QUEUED').length,
      ERROR: jobsInWindow.filter(j => j.status === 'ERROR').length,
    };
  });

  const dailySummary = calculateDailySummary(jobs);
  const periodicReportData = calculatePeriodicReports(jobs);

  return { jobs: recentJobs.slice(0, 50), backends, metrics, chartData, dailySummary, periodicReportData, source: "real" };
}

export async function GET(request: Request) {
  const { searchParams, pathname } = new URL(request.url);
  const isDemo = searchParams.get('demo') === 'true';

  // Handle connectivity request for mock API
  const connectivityMatch = pathname.match(/\/api\/backends\/(.+)\/connectivity/);
  if (isDemo && connectivityMatch && connectivityMatch[1]) {
    const backendName = connectivityMatch[1];
    console.log(`⚡️ Fetching mock connectivity data for ${backendName}...`);
    const connectivityData = generateMockConnectivity(backendName);
    return NextResponse.json(connectivityData);
  }


  if (!isDemo) {
    try {
      console.log("✅ Fetching real data from Python backend...");
      const realData = await getRealData();
      return NextResponse.json(realData);
    } catch (error) {
      console.error("❌ Error fetching real data:", error);
      const mockData = await generateMockData();
      return NextResponse.json({ ...mockData, note: "Real API failed, fallback to mock data." });
    }
  }

  console.warn("⚠ Using mock data (demo mode).");
  const mockData = await generateMockData();
  return NextResponse.json(mockData);
}
