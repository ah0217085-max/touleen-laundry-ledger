import { createFileRoute } from "@tanstack/react-router";
import { ServiceSection } from "@/components/laundry/ServiceSection";
import { FourthLabelEditor } from "@/components/laundry/FourthLabelEditor";

export const Route = createFileRoute("/fourth")({
  head: () => ({
    meta: [
      { title: "الواجهة الرابعة — مصبغة تولين" },
      { name: "description", content: "طلبات الخدمات الإضافية في مصبغة تولين مع الفواتير وحالة التسليم." },
      { property: "og:title", content: "الواجهة الرابعة — مصبغة تولين" },
      { property: "og:description", content: "متابعة طلبات الخدمات الإضافية وتسليمها." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FourthPage,
});

function FourthPage() {
  return (
    <ServiceSection
      sectionKey="fourth"
      subtitle="طلبات الخدمات الإضافية وحالة تسليمها"
      extra={<FourthLabelEditor />}
    />
  );
}
