"use client";

import React, { useState, useEffect } from "react";
import { useCRM } from "@/lib/context/crm-context";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Calendar } from "lucide-react";

export function RescheduleModal() {
  const { activeReschedule, closeReschedule, rescheduleFollowUp } = useCRM();
  const { isOpen, followUpId, leadName, currentDate } = activeReschedule;

  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("10:00 AM");

  useEffect(() => {
    if (isOpen) {
      // Default to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setNewDate(currentDate || tomorrow.toISOString().split("T")[0]);
      setNewTime("10:00 AM");
    }
  }, [isOpen, currentDate]);

  if (!isOpen || !followUpId) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;
    rescheduleFollowUp(followUpId, newDate, newTime);
    closeReschedule();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeReschedule}
      maxWidth="sm"
      title={
        <div className="flex items-center gap-2 text-indigo-600">
          <Calendar className="w-5 h-5" />
          <span>Reschedule Follow-up</span>
        </div>
      }
      description={`Update scheduled outreach date for ${leadName}`}
    >
      <form onSubmit={handleSave} className="space-y-4">
        <Input
          label="New Follow-up Date"
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          required
        />

        <Input
          label="Preferred Time"
          type="text"
          value={newTime}
          onChange={(e) => setNewTime(e.target.value)}
          placeholder="e.g. 10:00 AM"
        />

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button variant="ghost" size="sm" type="button" onClick={closeReschedule}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Save Reschedule
          </Button>
        </div>
      </form>
    </Modal>
  );
}
