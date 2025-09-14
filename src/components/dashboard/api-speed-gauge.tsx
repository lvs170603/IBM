
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Zap } from "lucide-react"

interface ApiSpeedGaugeProps {
  speed: number;
}

const MAX_SPEED = 500; // ms

// Define the segments of the gauge
const segments = [
  { color: "hsl(var(--chart-1))", start: 0, end: 150 },    // Green
  { color: "hsl(var(--chart-4))", start: 150, end: 350 }, // Yellow
  { color: "hsl(var(--destructive))", start: 350, end: MAX_SPEED }, // Red
];

// Function to calculate rotation for the needle
const getRotation = (value: number, max: number) => {
  const percentage = Math.min(Math.max(value, 0), max) / max;
  // Map percentage (0-1) to angle (-90 to 90 degrees)
  return percentage * 180 - 90;
};

// Function to describe an arc
const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  const start = {
    x: x + radius * Math.cos(startAngle),
    y: y + radius * Math.sin(startAngle)
  };
  const end = {
    x: x + radius * Math.cos(endAngle),
    y: y + radius * Math.sin(endAngle)
  };

  const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";

  const d = [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y
  ].join(" ");

  return d;
}

export function ApiSpeedGauge({ speed }: ApiSpeedGaugeProps) {
  const rotation = getRotation(speed, MAX_SPEED);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            API Speed
        </CardTitle>
        <CardDescription>Response time of the backend API.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center pt-2">
        <div className="relative h-32 w-64">
           {/* Gauge Background Arc */}
           <svg viewBox="0 0 100 50" className="w-full h-full">
            {/* Base gray arc */}
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
            
            {/* Colored segments */}
            {segments.map((segment) => {
              const startAngle = -Math.PI * (1 - (segment.start / MAX_SPEED));
              const endAngle = -Math.PI * (1 - (segment.end / MAX_SPEED));
              return (
                 <path
                  key={segment.color}
                  d={describeArc(50, 50, 40, startAngle, endAngle)}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="10"
                />
              )
            })}
          </svg>

          {/* Needle */}
          <div 
            className="absolute bottom-2 left-1/2 w-px h-[calc(50%-0.5rem)] bg-foreground origin-bottom transition-transform duration-500"
            style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
          >
             <div className="absolute -top-1.5 -left-1.5 h-3 w-3 rounded-full bg-foreground border-2 border-background"></div>
          </div>
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-foreground border-2 border-background"></div>

        </div>
        <div className="flex flex-col items-center mt-2">
            <span className="text-4xl font-bold tracking-tighter">{speed}ms</span>
            <span className="text-sm text-muted-foreground">Current Response</span>
        </div>
      </CardContent>
    </Card>
  )
}
