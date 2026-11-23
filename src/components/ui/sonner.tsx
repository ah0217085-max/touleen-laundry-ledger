import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      dir="rtl"
      richColors
      position="top-center"
      style={
        {
          "--normal-bg": "var(--glass-strong)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--glass-border)",
          "--success-bg": "var(--success-soft)",
          "--success-text": "var(--success-foreground)",
          "--success-border": "var(--success)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast font-sans rounded-2xl shadow-glass backdrop-blur-xl",
          title: "font-bold",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
