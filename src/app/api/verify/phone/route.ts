import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Lead, LeadFinderBusiness } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";
import { verifyPhone } from "@/lib/verification/phone-verifier";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const phone = (body.phone || "").trim();
    const leadId = body.leadId?.trim();
    const finderId = body.finderId?.trim();
    const defaultRegion = body.defaultRegion?.trim() || "US";

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    // Run free phone verification
    const result = verifyPhone(phone, defaultRegion);

    // Save to Lead if leadId provided
    if (leadId) {
      const lead = await Lead.findOne({ _id: leadId, userId: authUser.userId });
      if (lead) {
        lead.phoneVerification = {
          status: result.status,
          valid: result.valid,
          possible: result.possible,
          country: result.country,
          countryCode: result.countryCode,
          regionCode: result.regionCode,
          numberType: result.numberType,
          internationalFormat: result.internationalFormat,
          nationalFormat: result.nationalFormat,
          e164Format: result.e164Format,
          whatsappStatus: result.whatsappStatus,
          checkedAt: new Date(result.checkedAt),
          verificationMethod: result.verificationMethod,
          details: result.details,
        };
        await lead.save();

        // Also sync linked finder business if present
        if (lead.finderBusinessId) {
          await LeadFinderBusiness.updateOne(
            { _id: lead.finderBusinessId, userId: authUser.userId },
            { $set: { phoneVerification: lead.phoneVerification } }
          ).catch(() => {});
        }
      }
    }

    // Save to LeadFinderBusiness if finderId provided
    if (finderId) {
      const finder = await LeadFinderBusiness.findOne({ _id: finderId, userId: authUser.userId });
      if (finder) {
        finder.phoneVerification = {
          status: result.status,
          valid: result.valid,
          possible: result.possible,
          country: result.country,
          countryCode: result.countryCode,
          regionCode: result.regionCode,
          numberType: result.numberType,
          internationalFormat: result.internationalFormat,
          nationalFormat: result.nationalFormat,
          e164Format: result.e164Format,
          whatsappStatus: result.whatsappStatus,
          checkedAt: new Date(result.checkedAt),
          verificationMethod: result.verificationMethod,
          details: result.details,
        };
        await finder.save();

        // Also sync linked lead if present
        if (finder.leadId) {
          await Lead.updateOne(
            { _id: finder.leadId, userId: authUser.userId },
            { $set: { phoneVerification: finder.phoneVerification } }
          ).catch(() => {});
        }
      }
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: any) {
    console.error("POST /api/verify/phone error:", err);
    return NextResponse.json(
      { error: "Phone verification failed", details: err.message },
      { status: 500 }
    );
  }
}
