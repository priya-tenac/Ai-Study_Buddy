import "./globals.css"
import type { Metadata, Viewport } from "next"
import MouseGlow from "./MouseGlow"
import PhysicsButtons from "./PhysicsButtons"
import ScrollReveal from "./ScrollReveal"
import TextScramble from "./TextScramble"
import AnimatedSvgLines from "./AnimatedSvgLines"
import ChatWidget from "./ChatWidget"
import Navbar from "./Navbar"
import Footer from "./Footer"
import { AuthProvider } from "./AuthContext"

export const metadata: Metadata = {
  title: "AI STUDY BUDDY",
  description: "AI powered study summarizer",
  icons: {
    icon: "/globe.svg",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <MouseGlow />
          <PhysicsButtons />
          <ScrollReveal />
          <TextScramble />
          <AnimatedSvgLines />
          <ChatWidget />
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
