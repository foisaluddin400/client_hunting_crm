"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useCRM } from "@/lib/context/crm-context";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { WebsiteStatus, LeadStatus } from "@/lib/types";
import {
  TwitterXIcon,
  LinkedinIcon,
  InstagramIcon,
  FacebookIcon,
} from "@/components/ui/Icons";
import {
  Building2,
  User,
  MapPin,
  Globe,
  Mail,
  MessageSquare,
  Sparkles,
  Briefcase,
} from "lucide-react";

export function AddLeadModal() {
  const { activeAddLead, closeAddLead, addLead, updateLead, leads, categories } = useCRM();
  const { isOpen, initialData, mode = "add", editLeadId } = activeAddLead;

  // Memoize dynamic categories to prevent unnecessary re-render loops and input wipes
  const dynamicCategories = useMemo(
    () => categories.filter((c) => c.toLowerCase() !== "others" && c.toLowerCase() !== "other"),
    [categories]
  );

  const [businessName, setBusinessName] = useState("");
  const [ceoName, setCeoName] = useState("");
  const [selectedNicheCategory, setSelectedNicheCategory] = useState<string>("Restaurants");
  const [customNiche, setCustomNiche] = useState<string>("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [websiteStatus, setWebsiteStatus] = useState<WebsiteStatus>("No Website");
  const [status, setStatus] = useState<LeadStatus>("New");
  const [leadScore, setLeadScore] = useState<number>(85);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Initialize form fields once when the modal is opened
  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && editLeadId) {
      const leadToEdit = leads.find((l) => l.id === editLeadId);
      if (leadToEdit) {
        setBusinessName(leadToEdit.businessName || "");
        setCeoName(leadToEdit.ceoName || "");
        
        const rawNiche = leadToEdit.niche || "Restaurants";
        const matchedCategory = dynamicCategories.find(
          (c) => c.toLowerCase() === rawNiche.toLowerCase()
        );
        if (matchedCategory) {
          setSelectedNicheCategory(matchedCategory);
          setCustomNiche("");
        } else if (rawNiche.toLowerCase() === "others" || rawNiche.toLowerCase() === "other") {
          setSelectedNicheCategory("Others");
          setCustomNiche("");
        } else {
          setSelectedNicheCategory("Others");
          setCustomNiche(rawNiche);
        }

        setLocation(leadToEdit.location || "");
        setWebsite(leadToEdit.website || "");
        setWebsiteStatus(leadToEdit.websiteStatus || "No Website");
        setStatus(leadToEdit.status || "New");
        setLeadScore(leadToEdit.leadScore || 80);
        setEmail(leadToEdit.email || "");
        setWhatsapp(leadToEdit.whatsapp || "");
        setPhone(leadToEdit.phone || "");
        setLinkedin(leadToEdit.linkedin || "");
        setInstagram(leadToEdit.instagram || "");
        setFacebook(leadToEdit.facebook || "");
        setTwitter(leadToEdit.twitter || "");
        setNotes(leadToEdit.notes || "");
      }
    } else {
      // Add Mode
      setBusinessName(initialData?.businessName || "");
      setCeoName(initialData?.ceoName || "");

      const rawNiche = initialData?.niche || dynamicCategories[0] || "Restaurants";
      const matchedCategory = dynamicCategories.find(
        (c) => c.toLowerCase() === rawNiche.toLowerCase()
      );
      if (matchedCategory) {
        setSelectedNicheCategory(matchedCategory);
        setCustomNiche("");
      } else if (rawNiche.toLowerCase() === "others" || rawNiche.toLowerCase() === "other") {
        setSelectedNicheCategory("Others");
        setCustomNiche("");
      } else {
        setSelectedNicheCategory("Others");
        setCustomNiche(rawNiche);
      }

      setLocation(initialData?.location || "");
      setWebsite(initialData?.website || "");
      setWebsiteStatus(initialData?.websiteStatus || "No Website");
      setStatus(initialData?.status || "New");
      setLeadScore(initialData?.leadScore || 80);
      setEmail(initialData?.email || "");
      setWhatsapp(initialData?.whatsapp || "");
      setPhone(initialData?.phone || "");
      setLinkedin(initialData?.linkedin || "");
      setInstagram(initialData?.instagram || "");
      setFacebook(initialData?.facebook || "");
      setTwitter(initialData?.twitter || "");
      setNotes(initialData?.notes || "");
    }
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, editLeadId]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    // Validation requirement: Only Business Name OR CEO Name must be required, plus Location.
    if (!businessName.trim() && !ceoName.trim()) {
      newErrors.identity = "Please provide either a Business Name or CEO / Contact Person Name.";
    }

    if (!location.trim()) {
      newErrors.location = "Location is required (e.g. Austin, TX or London, UK).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalNiche =
      selectedNicheCategory === "Others"
        ? customNiche.trim() || "Others"
        : selectedNicheCategory;

    const leadPayload = {
      businessName: businessName.trim() || ceoName.trim() + " Enterprise",
      ceoName: ceoName.trim() || undefined,
      niche: finalNiche,
      location: location.trim(),
      website: website.trim() || undefined,
      websiteStatus,
      leadScore: Number(leadScore) || 75,
      email: email.trim() || undefined,
      whatsapp: whatsapp.trim() || undefined,
      phone: phone.trim() || undefined,
      linkedin: linkedin.trim() || undefined,
      instagram: instagram.trim() || undefined,
      facebook: facebook.trim() || undefined,
      twitter: twitter.trim() || undefined,
      status,
      notes: notes.trim() || undefined,
    };

    if (mode === "edit" && editLeadId) {
      updateLead(editLeadId, leadPayload);
    } else {
      addLead(leadPayload);
    }

    closeAddLead();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeAddLead}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600" />
          <span>{mode === "edit" ? "Edit Lead Profile" : "Add New Lead to CRM"}</span>
        </div>
      }
      description="Enter business and contact details for your multi-channel outreach pipeline."
    >
      <form onSubmit={handleSave} className="space-y-4">
        {errors.identity && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {errors.identity}
          </div>
        )}

        {/* Basic Business Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Business Name"
            placeholder="e.g. Red Rock Trattoria"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            leftIcon={<Building2 className="w-4 h-4" />}
            helperText="Required if CEO name is empty"
          />

          <Input
            label="CEO / Founder / Decision Maker"
            placeholder="e.g. Marco Bellini"
            value={ceoName}
            onChange={(e) => setCeoName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            helperText="Required if Business name is empty"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Location *"
            placeholder="e.g. Wichita, Kansas"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            leftIcon={<MapPin className="w-4 h-4" />}
            error={errors.location}
          />

          <Select
            label="Industry / Niche"
            value={selectedNicheCategory}
            onChange={(e) => setSelectedNicheCategory(e.target.value)}
          >
            {dynamicCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="Others">Others</option>
          </Select>
        </div>

        {selectedNicheCategory === "Others" && (
          <div className="animate-in fade-in duration-150">
            <Input
              label="Specify Custom Industry / Niche"
              placeholder="e.g. Solar Energy Installers, Pet Services, Bakeries..."
              value={customNiche}
              onChange={(e) => setCustomNiche(e.target.value)}
              leftIcon={<Briefcase className="w-4 h-4 text-indigo-600" />}
              helperText="Enter a custom category or leave as Others"
            />
          </div>
        )}

        {/* Website Status Section */}
        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Globe className="w-4 h-4 text-indigo-600" />
            <span>Website & Opportunity Assessment</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Website URL"
              placeholder="e.g. www.business.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />

            <Select
              label="Website Status *"
              value={websiteStatus}
              onChange={(e) => setWebsiteStatus(e.target.value as WebsiteStatus)}
            >
              <option value="No Website">No Website (High Opportunity)</option>
              <option value="Redesign">Redesign Needed (Outdated/Slow)</option>
              <option value="SEO Performance">SEO Performance (Poor Rankings)</option>
              <option value="Other">Other / Good Site</option>
            </Select>
          </div>
        </div>

        {/* Social & Contact Channels */}
        <div>
          <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Contact & Social Channels</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4 text-indigo-600" />}
            />

            <Input
              placeholder="WhatsApp / Mobile phone"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              leftIcon={<MessageSquare className="w-4 h-4 text-emerald-600" />}
            />

            <Input
              placeholder="LinkedIn profile or company URL"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              leftIcon={<LinkedinIcon className="w-4 h-4 text-[#0A66C2]" />}
            />

            <Input
              placeholder="Instagram profile URL / handle"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              leftIcon={<InstagramIcon className="w-4 h-4 text-[#E1306C]" />}
            />

            <Input
              placeholder="Facebook page URL"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              leftIcon={<FacebookIcon className="w-4 h-4 text-[#1877F2]" />}
            />

            <Input
              placeholder="Twitter / X profile URL"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              leftIcon={<TwitterXIcon className="w-4 h-4 text-slate-800" />}
            />
          </div>
        </div>

        {/* Lead Status & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Initial Pipeline Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
          >
            <option value="New">New</option>
            <option value="Qualified">Qualified</option>
            <option value="Contacted">Contacted</option>
            <option value="Replied">Replied</option>
            <option value="Interested">Interested</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Meeting">Meeting</option>
            <option value="Proposal">Proposal</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </Select>

          <Input
            label="Lead Opportunity Score (0-100)"
            type="number"
            min="0"
            max="100"
            value={leadScore}
            onChange={(e) => setLeadScore(Number(e.target.value))}
          />
        </div>

        <Textarea
          label="Notes & Observations"
          placeholder="e.g. Owner noticed slow mobile load times; wants to upgrade online ordering system."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="ghost" type="button" onClick={closeAddLead}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {mode === "edit" ? "Save Changes" : "Save Lead"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
