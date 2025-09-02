"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Risk Level</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">Low</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Tests Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">12</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Last Screening</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">2 days ago</p>
        </CardContent>
      </Card>
    </div>
  );
}
