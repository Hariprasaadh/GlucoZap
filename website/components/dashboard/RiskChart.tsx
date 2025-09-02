"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RiskChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] flex items-center justify-center">
          {/* Add chart library implementation here */}
          <p className="text-muted-foreground">Risk trend visualization coming soon</p>
        </div>
      </CardContent>
    </Card>
  );
}
