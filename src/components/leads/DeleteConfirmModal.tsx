"use client";

import React from "react";
import { useCRM } from "@/lib/context/crm-context";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

export function DeleteConfirmModal() {
  const { activeDeleteConfirm, closeDeleteConfirm, deleteLead } = useCRM();
  const { isOpen, leadId, businessName } = activeDeleteConfirm;

  if (!isOpen || !leadId) return null;

  const handleDelete = () => {
    deleteLead(leadId);
    closeDeleteConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeDeleteConfirm}
      maxWidth="sm"
      title={
        <div className="flex items-center gap-2 text-rose-600">
          <AlertTriangle className="w-5 h-5" />
          <span>Delete Lead?</span>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-600 leading-relaxed">
          Are you sure you want to delete{" "}
          <strong className="text-slate-900">&quot;{businessName || "this lead"}&quot;</strong>?
          All associated outreach activity history and follow-up tasks will also be removed.
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button variant="ghost" size="sm" onClick={closeDeleteConfirm}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Yes, Delete Lead
          </Button>
        </div>
      </div>
    </Modal>
  );
}
