"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
     LineChart,
     Line,
     XAxis,
     YAxis,
     CartesianGrid,
     Tooltip,
     ResponsiveContainer,
} from "recharts";

interface ThroughputChartProps {
     data: Array<{ date: string; value: number }>;
     title: string;
}

export function ThroughputChart({ data, title }: ThroughputChartProps) {
     return (
          <Card>
               <CardHeader>
                    <CardTitle>{title}</CardTitle>
               </CardHeader>
               <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                         <LineChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Line
                                   type="monotone"
                                   dataKey="value"
                                   stroke="#8884d8"
                                   strokeWidth={2}
                              />
                         </LineChart>
                    </ResponsiveContainer>
               </CardContent>
          </Card>
     );
}
