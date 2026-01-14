"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

type AuthContextType = {
  isLoggedIn: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    setIsLoggedIn(!!token)
  }, [])

  const login = (token: string) => {
    localStorage.setItem("token", token)
    document.cookie = `token=${token}; path=/; max-age=86400`
    setIsLoggedIn(true)
  }

  const logout = () => {
    localStorage.removeItem("token")
    document.cookie = "token=; path=/; max-age=0"
    setIsLoggedIn(false)
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
