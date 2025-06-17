"use server";

export async function getAnalyticsData() {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/analytics`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch analytics data:", error);
    throw new Error("Failed to fetch analytics data");
  }
} 