import { createFileRoute } from "@tanstack/react-router";
import { ServiceSection } from "@/components/laundry/ServiceSection";

export const Route = createFileRoute("/tailoring")({
  head: () => ({
    meta: [
      { title: "التصليح والخياطة — مصبغة تولين" },
      { name: "description", content: "طلبات التصليح والخياطة في مصبغة تولين مع الفواتير وحالة التسليم." },
      { property: "og:title", content: "التصليح والخياطة — مصبغة تولين" },
      { property: "og:description", content: "متابعة طلبات التصليح والخياطة وتسليمها." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TailoringPage,
});

function TailoringPage() {
  return <ServiceSection sectionKey="tailoring" subtitle="طلبات التصليح والخياطة وحالة تسليمها" />;
}
