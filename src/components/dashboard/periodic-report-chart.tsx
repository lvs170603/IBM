
"use client"

import { useState } from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartTooltipContent, ChartContainer, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { PeriodicReportData } from "@/lib/types"

interface PeriodicReportChartProps {
  data: PeriodicReportData
}

const chartConfig = {
  COMPLETED: { label: "Completed", color: "hsl(var(--chart-1))" },
  RUNNING: { label: "Running", color: "hsl(var(--chart-2))" },
  QUEUED: { label: "Queued", color: "hsl(var(--chart-4))" },
  ERROR: { label: "Error", color: "hsl(var(--destructive))" },
}

export function PeriodicReportChart({ data }: PeriodicReportChartProps) {
  const [activeTab, setActiveTab] = useState<"weekly" | "monthly">("weekly");
  const chartData = data ? data[activeTab] : [];
  const xAxisLabel = activeTab === 'weekly' ? 'Week' : 'Month';
  const description = activeTab === 'weekly' 
    ? 'Job status trends over the last 4 weeks.' 
    : 'Job status trends over the last 6 months.';

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Periodic Reporting</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-auto">
          <TabsList>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
                label={{ value: xAxisLabel, position: 'insideBottom', dy: 20, fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'Number of Jobs', angle: -90, position: 'insideLeft', dx: -10, fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ChartTooltipContent indicator="dot" />} />
              <ChartLegend content={<ChartLegendContent />} />
              {Object.entries(chartConfig).map(([key, config]) => (
                <Line key={key} type="monotone" dataKey={key} stroke={config.color} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
