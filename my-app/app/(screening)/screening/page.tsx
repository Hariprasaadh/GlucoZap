"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const screeningTypes = [
  {
    title: "Questionnaire",
    description: "Answer health-related questions",
    href: "/screening/questionnaire",
  },
  {
    title: "Skin Scan",
    description: "Analyze skin conditions",
    href: "/screening/skin-scan",
  },
  {
    title: "Face Scan",
    description: "Analyze facial features",
    href: "/screening/face-scan",
  },
  {
    title: "Foot Scan",
    description: "Check for foot-related issues",
    href: "/screening/foot-scan",
  },
  {
    title: "Pose Analysis",
    description: "Analyze body posture",
    href: "/screening/pose-scan",
  },
  {
    title: "Breathing Test",
    description: "Measure breathing patterns",
    href: "/screening/breathing-test",
  },
];

export default function ScreeningPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Diabetes Screening Tests</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {screeningTypes.map((type) => (
          <Link key={type.title} href={type.href}>
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle>{type.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{type.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
