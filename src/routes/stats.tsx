import { createFileRoute } from "@tanstack/react-router";
import { StatsDashboard } from "@/components/laundry/StatsDashboard";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "الإحصائيات — مصبغة تولين" },
      { name: "description", content: "ملخص لحظي للبضاعة الموجودة والمسلّمة والمبالغ المحصّلة والمستحقة في مصبغة تولين." },
      { property: "og:title", content: "الإحصائيات — مصبغة تولين" },
      { property: "og:description", content: "ملخص لحظي للبضاعة والمبالغ في مصبغة تولين." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StatsDashboard,
});
