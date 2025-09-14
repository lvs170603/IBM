
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, LabelList, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart, XAxis, YAxis } from "recharts"
import type { Backend } from "@/lib/types"
import { Cpu } from "lucide-react"

interface BackendChartsProps {
  backends: Backend[]
}

const chartConfigQueue = {
  queue: {
    label: "Queue",
  },
}

const chartConfigError = {
  error_rate: {
    label: "Error Rate",
    color: "hsl(var(--chart-2))",
  },
}

export function BackendCharts({ backends }: BackendChartsProps) {
  const MAX_QUEUE = 20; // Assume a max queue depth for visualization
  
  const errorRateData = backends.map(b => ({
    name: b.name,
    error_rate: parseFloat((b.error_rate * 100).toFixed(3))
  }));


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Backend Health
        </CardTitle>
        <CardDescription>Queue depth and error rates for available backends.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
            <h3 className="text-sm font-medium mb-2 text-center">Live Queue Depth</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {backends.slice(0, 6).map((backend) => (
                    <div key={backend.name} className="flex flex-col items-center">
                        <ChartContainer
                            config={chartConfigQueue}
                            className="mx-auto aspect-square h-20"
                        >
                            <RadialBarChart
                                data={[{ name: 'queue', value: backend.queue_depth, fill: 'hsl(var(--chart-1))' }]}
                                startAngle={90}
                                endAngle={-270}
                                innerRadius="70%"
                                outerRadius="100%"
                                barSize={8}
                                
                            >
                                <PolarGrid
                                    gridType="circle"
                                    radialLines={false}
                                    stroke="none"
                                    className="first:fill-muted last:fill-background"
                                />
                                <RadialBar dataKey="value" background cornerRadius={5} />
                                 <PolarRadiusAxis tick={false} tickLine={false} axisLine={false} domain={[0, MAX_QUEUE]} />
                                  <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                            </RadialBarChart>
                        </ChartContainer>
                        <span className="text-xs text-center text-foreground mt-1">{backend.name}</span>
                        <span className="text-sm font-bold">{backend.queue_depth}</span>
                    </div>
                ))}
            </div>
        </div>
        <div>
            <h3 className="text-sm font-medium mb-2 text-center">Error Rate (%)</h3>
            <ChartContainer config={chartConfigError} className="h-40 w-full">
                <BarChart
                    data={errorRateData}
                    margin={{ top: 5, right: 30, left: 10, bottom: 0 }}
                    layout="vertical"
                >
                    <CartesianGrid horizontal={false} />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }} width={110} interval={0} />
                    <XAxis type="number" dataKey="error_rate" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                     <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                    <Bar dataKey="error_rate" fill="hsl(var(--chart-2))" radius={5}>
                         <LabelList
                            dataKey="error_rate"
                            position="right"
                            offset={8}
                            className="fill-foreground"
                            fontSize={10}
                        />
                    </Bar>
                </BarChart>
            </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
