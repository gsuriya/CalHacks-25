"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Sparkles, ShoppingBag, Users, BarChart3 } from "lucide-react"

export default function BottomTabBar() {
  const pathname = usePathname()

  const tabs = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/swipe", icon: Sparkles, label: "Swipe" },
    { href: "/closet", icon: ShoppingBag, label: "Closet" },
    { href: "/community", icon: Users, label: "Community" },
    { href: "/wrapped", icon: BarChart3, label: "Wrapped" },
  ]

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[480px] z-50">
      <div className="glass-card rounded-t-3xl px-4 py-2 border-t border-white/20">
        <div className="flex justify-around items-center">
          {tabs.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-300 ${
                  isActive ? "text-purple-400 animate-pulse-glow" : "text-gray-400 hover:text-white"
                }`}
                aria-label={label}
              >
                <Icon size={24} />
                <span className="text-xs mt-1">{label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
