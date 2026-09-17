import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Lead, LeadFinderBusiness } from "@/lib/models";
import { getAuthUser } from "@/lib/auth";
import { verifyEmail, EmailVerificationResult } from "@/lib/verification/email-verifier";

// Simple concurrency runner
async function asyncPool<T, R>(
  poolLimit: number,
  array: T[],
  iteratorFn: (item: T) => Promise<R>
): Promise<R[]> {
  const ret: Promise<R>[] = [];
  const executing: Set<Promise<any>> = new Set();

  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean, clean);
    if (executing.size >= poolLimit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(ret);
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const leadIds: string[] = Array.isArray(body.leadIds) ? body.leadIds : [];

    if (leadIds.length === 0) {
      return NextResponse.json({ error: "No lead IDs provided for verification." }, { status: 400 });
    }

    // Fetch leads strictly scoped to user
    const leads = await Lead.find({
      _id: { $in: leadIds },
      userId: authUser.userId,
    });

    const counts = {
      valid: 0,
      invalid: 0,
      risky: 0,
      unknown: 0,
    };

    const results: Array<{
      leadId: string;
      email?: string;
      status: string;
      verification: EmailVerificationResult;
    }> = [];

    // Controlled concurrency of 4 parallel checks
    await asyncPool(4, leads, async (lead) => {
      try {
        if (!lead.email || !lead.email.trim()) {
          const noEmailResult: EmailVerificationResult = {
            status: "invalid",
            syntaxValid: false,
            domainExists: false,
            mxRecord: false,
            mailServer: null,
            spf: null,
            dmarc: null,
            disposable: false,
            freeProvider: false,
            roleBased: false,
            smtpStatus: "rejected",
            catchAll: false,
            emailType: "Invalid",
            checkedAt: new Date().toISOString(),
            verificationMethod: "free_local",
            details: "No email address on file for this lead.",
          };
          lead.emailVerification = noEmailResult as any;
          await lead.save();
          counts.invalid++;
          results.push({
            leadId: lead._id.toString(),
            status: "invalid",
            verification: noEmailResult,
          });
          return;
        }

        const res = await verifyEmail(lead.email);

        lead.emailVerification = {
          status: res.status,
          syntaxValid: res.syntaxValid,
          domainExists: res.domainExists,
          mxRecord: res.mxRecord,
          mailServer: res.mailServer,
          spf: res.spf,
          dmarc: res.dmarc,
          disposable: res.disposable,
          freeProvider: res.freeProvider,
          roleBased: res.roleBased,
          smtpStatus: res.smtpStatus,
          catchAll: res.catchAll,
          emailType: res.emailType,
          mxRecords: res.mxRecords,
          checkedAt: new Date(res.checkedAt),
          verificationMethod: res.verificationMethod,
          details: res.details,
        } as any;

        await lead.save();

        // Also sync linked LeadFinderBusiness if present
        if (lead.finderBusinessId) {
          await LeadFinderBusiness.updateOne(
            { _id: lead.finderBusinessId, userId: authUser.userId },
            { $set: { emailVerification: lead.emailVerification } }
          ).catch(() => {});
        }

        if (res.status === "valid") counts.valid++;
        else if (res.status === "invalid") counts.invalid++;
        else if (res.status === "risky") counts.risky++;
        else counts.unknown++;

        results.push({
          leadId: lead._id.toString(),
          email: lead.email,
          status: res.status,
          verification: res,
        });
      } catch (err: any) {
        console.error(`Failed to verify lead ${lead._id}:`, err);
        counts.unknown++;
      }
    });

    return NextResponse.json({
      success: true,
      total: leads.length,
      verified: results.length,
      counts,
      results,
    });
  } catch (err: any) {
    console.error("POST /api/verify/bulk-email error:", err);
    return NextResponse.json(
      { error: "Bulk email verification failed", details: err.message },
      { status: 500 }
    );
  }
}
