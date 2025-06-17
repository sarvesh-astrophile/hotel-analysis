"use client";

import React, { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { getAnalyticsData } from "@/app/actions";
import AnalyticsComponent from "./AnalyticsComponent";
import { Loader2 } from "lucide-react";

interface AnalyticsData {
  heading: string;
  image: string;
  explanation: string;
}

const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState<Record<
    string,
    AnalyticsData
  > | null>(null);
  const [hasFailed, setHasFailed] = useState(false);
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current === false) {
      toast.promise(getAnalyticsData(), {
        loading: "Loading analytics...",
        success: (data) => {
          setAnalyticsData(data);
          return "Analytics data loaded successfully.";
        },
        error: (err) => {
          setHasFailed(true);
          return err.message || "Failed to retrieve analytics data.";
        },
      });
    }

    return () => {
      effectRan.current = true;
    };
  }, []);

  if (hasFailed) {
    return <p className="text-red-500 p-4">Failed to load analytics data.</p>;
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <p className="ml-2">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {Object.entries(analyticsData).map(([key, value]) => (
        <AnalyticsComponent
          key={key}
          heading={value.heading}
          image={value.image}
          explanation={value.explanation}
        />
      ))}
    </div>
  );
};

export default AnalyticsDashboard;
