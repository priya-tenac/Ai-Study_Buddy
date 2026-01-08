import "./globals.css"
import type { Metadata } from "next"
import ThemeToggle from "./ThemeToggle"
import MouseGlow from "./MouseGlow"
import PhysicsButtons from "./PhysicsButtons"
import ScrollReveal from "./ScrollReveal"
import TextScramble from "./TextScramble"
import AnimatedSvgLines from "./AnimatedSvgLines"
import ChatWidget from "./ChatWidget"

export const metadata: Metadata = {
  title: "AI STUDY BUDDY",
  description: "AI powered study summarizer",
  icons: {
    icon: "/globe.svg",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <MouseGlow />
        <PhysicsButtons />
        <ScrollReveal />
        <TextScramble />
        <AnimatedSvgLines />
        <div className="fixed right-4 top-4 z-50">
          <ThemeToggle />
        </div>
        <ChatWidget />
        {children}
      </body>
    </html>
  )
}
