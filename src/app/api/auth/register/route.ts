import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { User, UserSettings, MessageTemplate } from "@/lib/models";
import { hashPassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { registerSchema } from "@/lib/validations/schemas";
import { DEFAULT_TEMPLATES } from "@/lib/mock-data/templates";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const parseResult = registerSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, agencyName, role } = parseResult.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      agencyName: agencyName?.trim() || "Apex Growth Studio",
      role: role?.trim() || "Agency Founder & Lead Hunter",
      avatarUrl:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    });

    // Create default user settings
    await UserSettings.create({
      userId: newUser._id,
      smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
      smtpPort: Number(process.env.SMTP_PORT) || 587,
      smtpUsername: process.env.SMTP_USERNAME || "",
      fromName: `${newUser.name} | ${newUser.agencyName}`,
      fromEmail: newUser.email,
      secure: true,
      isVerified: false,
    });

    // Seed default message templates for this new user
    const templateDocs = DEFAULT_TEMPLATES.map((tpl) => ({
      userId: newUser._id,
      name: tpl.name,
      category: tpl.category.toUpperCase().replace(/\s+/g, "_"),
      subject: tpl.subject,
      message: tpl.body,
      channels: tpl.channels,
    }));
    await MessageTemplate.insertMany(templateDocs);

    // Generate JWT token
    const token = await signToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
      agencyName: newUser.agencyName,
    });

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully.",
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        agencyName: newUser.agencyName,
        role: newUser.role,
        avatarUrl: newUser.avatarUrl,
        timezone: newUser.timezone,
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Failed to register user", details: err.message },
      { status: 500 }
    );
  }
}
