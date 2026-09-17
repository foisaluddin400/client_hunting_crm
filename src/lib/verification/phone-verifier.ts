import {
  PhoneNumberUtil,
  PhoneNumberFormat,
  PhoneNumberType,
} from "google-libphonenumber";
import { VerificationStatus } from "./email-verifier";

export interface PhoneVerificationResult {
  status: VerificationStatus;
  valid: boolean;
  possible: boolean;
  country: string;
  countryCode: string;
  regionCode: string;
  numberType: string;
  internationalFormat: string;
  nationalFormat: string;
  e164Format: string;
  whatsappStatus: "yes" | "no" | "unknown";
  checkedAt: string;
  verificationMethod: "free_local";
  details?: string;
}

const phoneUtil = PhoneNumberUtil.getInstance();

// Region name helper using standard Intl
function getCountryName(regionCode?: string): string {
  if (!regionCode || regionCode === "ZZ") return "Unknown";
  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
    return displayNames.of(regionCode) || regionCode;
  } catch {
    return regionCode;
  }
}

// Convert libphonenumber type to readable label
function getNumberTypeLabel(type: PhoneNumberType): string {
  switch (type) {
    case PhoneNumberType.MOBILE:
      return "Mobile";
    case PhoneNumberType.FIXED_LINE:
      return "Landline";
    case PhoneNumberType.FIXED_LINE_OR_MOBILE:
      return "Mobile / Landline";
    case PhoneNumberType.VOIP:
      return "VoIP";
    case PhoneNumberType.TOLL_FREE:
      return "Toll Free";
    case PhoneNumberType.PREMIUM_RATE:
      return "Premium Rate";
    case PhoneNumberType.SHARED_COST:
      return "Shared Cost";
    case PhoneNumberType.PERSONAL_NUMBER:
      return "Personal Number";
    case PhoneNumberType.PAGER:
      return "Pager";
    case PhoneNumberType.UAN:
      return "UAN";
    case PhoneNumberType.VOICEMAIL:
      return "Voicemail";
    default:
      return "Unknown";
  }
}

/**
 * Free phone number verifier using open-source google-libphonenumber
 * Parses, validates, determines possibility, region, and line type.
 * WhatsApp is set to "unknown" per rules unless verified.
 */
export function verifyPhone(
  rawPhone: string,
  defaultRegion: string = "US"
): PhoneVerificationResult {
  const checkedAt = new Date().toISOString();
  const phone = (rawPhone || "").trim();

  if (!phone || phone.length < 3) {
    return {
      status: "invalid",
      valid: false,
      possible: false,
      country: "Unknown",
      countryCode: "",
      regionCode: "",
      numberType: "Unknown",
      internationalFormat: phone,
      nationalFormat: phone,
      e164Format: phone,
      whatsappStatus: "unknown",
      checkedAt,
      verificationMethod: "free_local",
      details: "Phone number is empty or too short.",
    };
  }

  try {
    // Attempt parse
    // If it doesn't start with +, let's try with default region
    let parsed;
    try {
      parsed = phoneUtil.parseAndKeepRawInput(phone, defaultRegion);
    } catch {
      // If failed, try prefixing with '+' if all digits
      if (/^\d{7,15}$/.test(phone.replace(/[\s\(\)\-\.]/g, ""))) {
        parsed = phoneUtil.parseAndKeepRawInput("+" + phone.replace(/[\s\(\)\-\.]/g, ""), defaultRegion);
      } else {
        throw new Error("Invalid phone number format");
      }
    }

    const possible = phoneUtil.isPossibleNumber(parsed);
    const valid = phoneUtil.isValidNumber(parsed);
    const countryCode = String(parsed.getCountryCode() || "");
    const regionCode = phoneUtil.getRegionCodeForNumber(parsed) || "";
    const country = getCountryName(regionCode);
    const numType = phoneUtil.getNumberType(parsed);
    const numberTypeLabel = getNumberTypeLabel(numType);

    let internationalFormat = phone;
    let nationalFormat = phone;
    let e164Format = phone;

    try {
      internationalFormat = phoneUtil.format(parsed, PhoneNumberFormat.INTERNATIONAL);
      nationalFormat = phoneUtil.format(parsed, PhoneNumberFormat.NATIONAL);
      e164Format = phoneUtil.format(parsed, PhoneNumberFormat.E164);
    } catch {
      // fallback
    }

    let status: VerificationStatus = "unknown";
    let details = "";

    if (valid) {
      if (numType === PhoneNumberType.PREMIUM_RATE || numType === PhoneNumberType.SHARED_COST) {
        status = "risky";
        details = "Valid number but high-rate / shared cost.";
      } else {
        status = "valid";
        details = `Valid ${numberTypeLabel} number for ${country}.`;
      }
    } else if (possible) {
      status = "risky";
      details = `Possible number structure for ${country}, but format or carrier prefix is unverified.`;
    } else {
      status = "invalid";
      details = "Invalid phone number structure or country code.";
    }

    return {
      status,
      valid,
      possible,
      country,
      countryCode: countryCode ? `+${countryCode}` : "",
      regionCode,
      numberType: numberTypeLabel,
      internationalFormat,
      nationalFormat,
      e164Format,
      whatsappStatus: "unknown", // Strict rule: No paid WhatsApp API, return Unknown
      checkedAt,
      verificationMethod: "free_local",
      details,
    };
  } catch (err: any) {
    return {
      status: "invalid",
      valid: false,
      possible: false,
      country: "Unknown",
      countryCode: "",
      regionCode: "",
      numberType: "Unknown",
      internationalFormat: phone,
      nationalFormat: phone,
      e164Format: phone,
      whatsappStatus: "unknown",
      checkedAt,
      verificationMethod: "free_local",
      details: err.message || "Could not parse phone number.",
    };
  }
}
