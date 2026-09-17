import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Lead, LeadFinderBusiness } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";
import { verifyEmail } from "@/lib/verification/email-verifier";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const email = (body.email || "").trim();
    const leadId = body.leadId?.trim();
    const finderId = body.finderId?.trim();

    if (!email) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    // Run free verification
    const result = await verifyEmail(email);

    // Save to Lead if leadId provided
    if (leadId) {
      const lead = await Lead.findOne({ _id: leadId, userId: authUser.userId });
      if (lead) {
        lead.emailVerification = {
          status: result.status,
          syntaxValid: result.syntaxValid,
          domainExists: result.domainExists,
          mxRecord: result.mxRecord,
          mailServer: result.mailServer,
          spf: result.spf,
          dmarc: result.dmarc,
          disposable: result.disposable,
          freeProvider: result.freeProvider,
          roleBased: result.roleBased,
          smtpStatus: result.smtpStatus,
          catchAll: result.catchAll,
          emailType: result.emailType,
          mxRecords: result.mxRecords,
          checkedAt: new Date(result.checkedAt),
          verificationMethod: result.verificationMethod,
          details: result.details,
        };
        await lead.save();

        // Also sync linked finder business if present
        if (lead.finderBusinessId) {
          await LeadFinderBusiness.updateOne(
            { _id: lead.finderBusinessId, userId: authUser.userId },
            { $set: { emailVerification: lead.emailVerification } }
          ).catch(() => {});
        }
      }
    }

    // Save to LeadFinderBusiness if finderId provided
    if (finderId) {
      const finder = await LeadFinderBusiness.findOne({ _id: finderId, userId: authUser.userId });
      if (finder) {
        finder.emailVerification = {
          status: result.status,
          syntaxValid: result.syntaxValid,
          domainExists: result.domainExists,
          mxRecord: result.mxRecord,
          mailServer: result.mailServer,
          spf: result.spf,
          dmarc: result.dmarc,
          disposable: result.disposable,
          freeProvider: result.freeProvider,
          roleBased: result.roleBased,
          smtpStatus: result.smtpStatus,
          catchAll: result.catchAll,
          emailType: result.emailType,
          mxRecords: result.mxRecords,
          checkedAt: new Date(result.checkedAt),
          verificationMethod: result.verificationMethod,
          details: result.details,
        };
        await finder.save();

        // Also sync linked lead if present
        if (finder.leadId) {
          await Lead.updateOne(
            { _id: finder.leadId, userId: authUser.userId },
            { $set: { emailVerification: finder.emailVerification } }
          ).catch(() => {});
        }
      }
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: any) {
    console.error("POST /api/verify/email error:", err);
    return NextResponse.json(
      { error: "Email verification failed", details: err.message },
      { status: 500 }
    );
  }
}
