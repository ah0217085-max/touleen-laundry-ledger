import { createFileRoute } from "@tanstack/react-router";
import { ServiceSection } from "@/components/laundry/ServiceSection";

export const Route = createFileRoute("/washing")({
  head: () => ({
    meta: [
      { title: "الغسيل — مصبغة تولين" },
      { name: "description", content: "طلبات الغسيل في مصبغة تولين مع الفواتير وحالة التسليم." },
      { property: "og:title", content: "الغسيل — مصبغة تولين" },
      { property: "og:description", content: "متابعة طلبات الغسيل وتسليمها." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WashingPage,
});

function WashingPage() {
  return <ServiceSection sectionKey="washing" subtitle="طلبات الغسيل وحالة تسليمها" />;
}
