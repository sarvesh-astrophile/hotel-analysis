import AnalyticsDashboard from "./_components/AnalyticsDashboard";
import ChatPageClient from "./_components/ChatPageClient";

export default function ChatPage() {
  return <ChatPageClient analyticsDashboard={<AnalyticsDashboard />} />;
}
