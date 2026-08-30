import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectToDatabase from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { forgotPasswordSchema } from "@/lib/validations/schemas";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const parseResult = forgotPasswordSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { email } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    // For privacy/security, if user does not exist, return a generic success message
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account with that email exists, we've generated a password reset link.",
      });
    }

    // Generate random 64-character hex token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Set token expiration to 1 hour from now
    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password reset link generated successfully.",
      resetToken: rawToken,
    });
  } catch (err: any) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { error: "Failed to process forgot password request", details: err.message },
      { status: 500 }
    );
  }
}
