import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectToDatabase from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { hashPassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validations/schemas";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const parseResult = resetPasswordSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { token, newPassword } = parseResult.data;

    // Hash incoming token to compare against database
    const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+password +resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return NextResponse.json(
        { error: "Password reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Auto-sign token to log user in smoothly
    const authToken = await signToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      agencyName: user.agencyName,
    });

    const response = NextResponse.json({
      success: true,
      message: "Your password has been successfully reset.",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        agencyName: user.agencyName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        timezone: user.timezone,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: authToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { error: "Failed to reset password", details: err.message },
      { status: 500 }
    );
  }
}
