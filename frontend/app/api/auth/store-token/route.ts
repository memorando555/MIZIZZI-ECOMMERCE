import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { token, refreshToken } = await request.json()

    const cookieStore = await cookies()

    if (token) {
      cookieStore.set("admin_token", token, {
        httpOnly: false, // Need this to be false so client JS can set it
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      })
      console.log("[v0] Set admin_token cookie")
    }

    if (refreshToken) {
      cookieStore.set("admin_refresh_token", refreshToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      })
      console.log("[v0] Set admin_refresh_token cookie")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error storing token:", error)
    return NextResponse.json({ success: false, error: "Failed to store token" }, { status: 500 })
  }
}
