"use client";

import { useUser } from "@clerk/nextjs";
import StatsCards from "@/components/dashboard/StatsCards";
import ReportsTable from "@/components/dashboard/ReportsTable";
import RiskChart from "@/components/dashboard/RiskChart";

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Welcome, {user?.firstName}!</h1>
      <div className="grid gap-6">
        <StatsCards />
        <div className="grid md:grid-cols-2 gap-6">
          <RiskChart />
          <ReportsTable />
        </div>
      </div>
    </div>
  );
}
