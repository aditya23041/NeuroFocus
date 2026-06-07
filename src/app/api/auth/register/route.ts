import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await connectDB();
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "User already exists with this email" },
        { status: 409 }
      );
    }

    const hashedPwd = await hashPassword(password);
    const user = await User.create({
      name: name || email.split("@")[0],
      email: email.toLowerCase(),
      password: hashedPwd,
      avatar: "",
      subscription: "free",
    });

    const token = signToken(user._id.toString());

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          subscription: user.subscription,
        },
      },
    });
  } catch (err) {
    console.error("[API] Register error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
