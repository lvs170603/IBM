
"use client"

import * as React from "react"
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartTooltipContent, ChartContainer } from "@/components/ui/chart"
import type { Job, JobStatus } from "@/lib/types"
import { format, parseISO } from "date-fns"

interface JobBubbleChartProps {
  jobs: Job[]
}

const statusColors: Record<JobStatus, string> = {
  COMPLETED: "hsl(var(--chart-1))",
  RUNNING: "hsl(var(--chart-2))",
  QUEUED: "hsl(var(--chart-4))",
  ERROR: "hsl(var(--destructive))",
  CANCELLED: "hsl(var(--muted))",
  UNKNOWN: "hsl(var(--muted))",
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Job ID
            </span>
            <span className="font-bold text-muted-foreground truncate max-w-[120px]">
              {data.id}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Status
            </span>
            <span className="font-bold" style={{color: statusColors[data.status]}}>{data.status}</span>
          </div>
           <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Job Duration
            </span>
            <span className="font-bold text-foreground">
              {data.duration.toFixed(2)}s
            </span>
          </div>
           <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              QPU Seconds
            </span>
            <span className="font-bold text-foreground">
              {data.qpu.toFixed(2)}s
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};


export function JobBubbleChart({ jobs }: JobBubbleChartProps) {
  const chartData = React.useMemo(() => {
    return jobs.map(job => ({
      id: job.id,
      time: parseISO(job.submitted).getTime(),
      duration: job.elapsed_time,
      qpu: job.qpu_seconds,
      status: job.status,
    })).sort((a, b) => a.time - b.time);
  }, [jobs]);

  const chartConfig = {
    duration: { label: "Job Duration (s)" },
    qpu: { label: "QPU Seconds (s)" },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Performance Bubble Chart</CardTitle>
        <CardDescription>
          Visualize job duration, resource consumption, and status over time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 20, right: 40, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="time" 
                name="Time" 
                domain={['dataMin', 'dataMax']}
                tickFormatter={(unixTime) => format(new Date(unixTime), "HH:mm")}
                label={{ value: "Submission Time", position: "insideBottom", dy: 20 }}
              />
              <YAxis 
                type="number" 
                dataKey="duration" 
                name="Job Duration" 
                unit="s"
                label={{ value: "Job Duration (s)", angle: -90, position: "insideLeft", dx: -10 }}
              />
              <ZAxis type="number" dataKey="qpu" range={[100, 1000]} name="QPU Seconds" unit="s" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
              <Scatter name="Jobs" data={chartData} fillOpacity={0.7}>
                 {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={statusColors[entry.status as JobStatus]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
