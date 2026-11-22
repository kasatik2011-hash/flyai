import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlyAI — интеллект об авиации",
  description:
    "Самолёты, авиакомпании и технологии полёта. Задайте вопрос авиационному ИИ FlyAI и получите ответ с актуальными источниками.",
  icons: {
    icon: "/flyai-mark.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
