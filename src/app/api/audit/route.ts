import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Lead, WebsiteAudit } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";
import { performWebsiteAudit } from "@/lib/audit-engine";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("leadId");

    if (!leadId) {
      return NextResponse.json(
        { error: "leadId parameter is required" },
        { status: 400 }
      );
    }

    const auditDoc = await WebsiteAudit.findOne({
      leadId,
      userId: authUser.userId,
    }).lean();

    if (!auditDoc) {
      return NextResponse.json({
        success: true,
        status: "NOT_AUDITED",
        audit: null,
      });
    }

    return NextResponse.json({
      success: true,
      status: auditDoc.status,
      audit: {
        id: (auditDoc as any)._id.toString(),
        leadId: auditDoc.leadId.toString(),
        url: auditDoc.url,
        status: auditDoc.status,
        overallScore: auditDoc.overallScore,
        scores: auditDoc.scores,
        checks: auditDoc.checks,
        problems: auditDoc.problems,
        recommendedImprovements: auditDoc.recommendedImprovements,
        recommendedFeatures: auditDoc.recommendedFeatures,
        businessRecommendations: auditDoc.businessRecommendations,
        clientSummary: auditDoc.clientSummary,
        errorMessage: auditDoc.errorMessage,
        createdAt: auditDoc.createdAt ? new Date(auditDoc.createdAt).toISOString() : undefined,
        updatedAt: auditDoc.updatedAt ? new Date(auditDoc.updatedAt).toISOString() : undefined,
      },
    });
  } catch (err: any) {
    console.error("GET /api/audit error:", err);
    return NextResponse.json(
      { error: "Failed to fetch website audit", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { leadId, refresh = false } = body;

    if (!leadId) {
      return NextResponse.json(
        { error: "leadId is required to audit website." },
        { status: 400 }
      );
    }

    // 1. Fetch Lead
    const lead = await Lead.findOne({
      _id: leadId,
      userId: authUser.userId,
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (!lead.website || !lead.website.trim()) {
      return NextResponse.json(
        { error: "This lead does not have a website to audit." },
        { status: 400 }
      );
    }

    // 2. Prevent duplicate / parallel audits for the same lead
    const existingAudit = await WebsiteAudit.findOne({
      leadId: lead._id,
      userId: authUser.userId,
    });

    if (existingAudit && existingAudit.status === "AUDITING" && !refresh) {
      // If audit was started less than 90 seconds ago, return auditing state
      const elapsed = Date.now() - new Date(existingAudit.updatedAt || existingAudit.createdAt).getTime();
      if (elapsed < 90000) {
        return NextResponse.json({
          success: true,
          status: "AUDITING",
          message: "Website audit is currently running.",
          audit: existingAudit,
        });
      }
    }

    // If an audit already completed and refresh is not requested, return saved audit directly
    if (existingAudit && existingAudit.status === "COMPLETED" && !refresh) {
      return NextResponse.json({
        success: true,
        status: "COMPLETED",
        message: "Loaded saved website audit result.",
        audit: {
          id: existingAudit._id.toString(),
          leadId: existingAudit.leadId.toString(),
          url: existingAudit.url,
          status: existingAudit.status,
          overallScore: existingAudit.overallScore,
          scores: existingAudit.scores,
          checks: existingAudit.checks,
          problems: existingAudit.problems,
          recommendedImprovements: existingAudit.recommendedImprovements,
          recommendedFeatures: existingAudit.recommendedFeatures,
          businessRecommendations: existingAudit.businessRecommendations,
          clientSummary: existingAudit.clientSummary,
          errorMessage: existingAudit.errorMessage,
          createdAt: new Date(existingAudit.createdAt).toISOString(),
          updatedAt: new Date(existingAudit.updatedAt).toISOString(),
        },
      });
    }

    // Mark lead and audit as AUDITING
    lead.auditStatus = "AUDITING";
    await lead.save();

    await WebsiteAudit.findOneAndUpdate(
      { leadId: lead._id, userId: authUser.userId },
      {
        $set: {
          url: lead.website,
          status: "AUDITING",
        },
      },
      { upsert: true, new: true }
    );

    // 3. Execute the deterministic audit engine
    try {
      const result = await performWebsiteAudit(lead.website, {
        businessName: lead.businessName,
        category: lead.industry,
        location: lead.location,
      });

      // 4. Save Completed Audit
      const savedAudit = await WebsiteAudit.findOneAndUpdate(
        { leadId: lead._id, userId: authUser.userId },
        {
          $set: {
            url: lead.website,
            status: "COMPLETED",
            overallScore: result.overallScore,
            scores: result.scores,
            checks: result.checks,
            problems: result.problems,
            recommendedImprovements: result.recommendedImprovements,
            recommendedFeatures: result.recommendedFeatures,
            businessRecommendations: result.businessRecommendations,
            clientSummary: result.clientSummary,
            errorMessage: undefined,
          },
        },
        { upsert: true, new: true }
      );

      // 5. Update Lead summary fields
      lead.auditStatus = "COMPLETED";
      lead.auditScore = result.overallScore;
      lead.lastAuditedAt = new Date();
      await lead.save();

      return NextResponse.json({
        success: true,
        status: "COMPLETED",
        message: "Website audit completed successfully.",
        audit: {
          id: savedAudit!._id.toString(),
          leadId: savedAudit!.leadId.toString(),
          url: savedAudit!.url,
          status: savedAudit!.status,
          overallScore: savedAudit!.overallScore,
          scores: savedAudit!.scores,
          checks: savedAudit!.checks,
          problems: savedAudit!.problems,
          recommendedImprovements: savedAudit!.recommendedImprovements,
          recommendedFeatures: savedAudit!.recommendedFeatures,
          businessRecommendations: savedAudit!.businessRecommendations,
          clientSummary: savedAudit!.clientSummary,
          createdAt: new Date(savedAudit!.createdAt).toISOString(),
          updatedAt: new Date(savedAudit!.updatedAt).toISOString(),
        },
      });
    } catch (auditErr: any) {
      console.error("Audit execution failed:", auditErr);

      await WebsiteAudit.findOneAndUpdate(
        { leadId: lead._id, userId: authUser.userId },
        {
          $set: {
            status: "FAILED",
            errorMessage: auditErr.message || "Audit failed to execute.",
          },
        },
        { upsert: true }
      );

      lead.auditStatus = "FAILED";
      await lead.save();

      return NextResponse.json(
        {
          error: "Website audit failed",
          details: auditErr.message,
          status: "FAILED",
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("POST /api/audit error:", err);
    return NextResponse.json(
      { error: "Failed to process website audit", details: err.message },
      { status: 500 }
    );
  }
}
