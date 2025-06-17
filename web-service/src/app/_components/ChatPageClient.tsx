"use client";
import ChatInterface from "./ChatInterface";
import LoadingBar from "react-top-loading-bar";
import { useRef } from "react";

export default function ChatPageClient({
  analyticsDashboard,
}: {
  analyticsDashboard: React.ReactNode;
}) {
  const loadingBarRef = useRef(null);

  return (
    <>
      <LoadingBar color="#2563eb" height={3} ref={loadingBarRef} />
      <ChatInterface analyticsDashboard={analyticsDashboard} />
    </>
  );
}
