import { createFileRoute } from "@tanstack/react-router";
import { InventorySection } from "@/components/laundry/InventorySection";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "السجاد والحرامات — مصبغة تولين" },
      { name: "description", content: "إدارة سجلات السجاد والحرامات في مصبغة تولين: الاستلام، الفواتير، وحالة التسليم بضغطة زر." },
      { property: "og:title", content: "السجاد والحرامات — مصبغة تولين" },
      { property: "og:description", content: "إدارة سجلات السجاد والحرامات وحالة تسليمها في مصبغة تولين." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InventorySection,
});
