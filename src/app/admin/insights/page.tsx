import type { Metadata } from "next";
import { InsightsDashboard } from "./insights-dashboard";

export const metadata: Metadata = {
  title: "Twin insights",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-[960px] px-4 py-10">
      <InsightsDashboard />
    </div>
  );
}
