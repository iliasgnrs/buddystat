"use client";

import { Mail, Minus, Plus } from "lucide-react";
import React, { useState } from "react";
import { toast } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateSiteConfig } from "@/api/admin/endpoints";
import { useGetSite } from "@/api/admin/hooks/useSites";

interface EmailReportsManagerProps {
  siteId: number;
  disabled?: boolean;
}

export function EmailReportsManager({ siteId, disabled = false }: EmailReportsManagerProps) {
  const { data: siteData, isLoading, refetch } = useGetSite(siteId);

  const [emailList, setEmailList] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize email list when data is loaded
  React.useEffect(() => {
    if (siteData?.reportEmails) {
      setEmailList(siteData.reportEmails.length > 0 ? siteData.reportEmails : [""]);
      setHasUnsavedChanges(false);
    } else if (!isLoading) {
      setEmailList([""]);
    }
  }, [siteData, isLoading]);

  const addEmailField = () => {
    setEmailList([...emailList, ""]);
    setHasUnsavedChanges(true);
  };

  const removeEmailField = (index: number) => {
    if (emailList.length > 1) {
      const newList = emailList.filter((_, i) => i !== index);
      setEmailList(newList);
      setHasUnsavedChanges(true);
    }
  };

  const updateEmailField = (index: number, value: string) => {
    const newList = [...emailList];
    newList[index] = value.trim();
    setEmailList(newList);
    setHasUnsavedChanges(true);
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Empty is fine, will be filtered out
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = async () => {
    // Filter out empty entries and trim whitespace
    const filteredEmails = emailList.filter(email => email.trim() !== "").map(email => email.trim());
    const invalidEmails: string[] = [];

    filteredEmails.forEach(email => {
      if (!validateEmail(email)) {
        invalidEmails.push(email);
      }
    });

    if (invalidEmails.length > 0) {
      toast.error(`Invalid email addresses: ${invalidEmails.join(", ")}`);
      return;
    }

    if (filteredEmails.length > 10) {
      toast.error("Maximum 10 email addresses allowed");
      return;
    }

    try {
      setIsSaving(true);
      await updateSiteConfig(siteId, {
        reportEmails: filteredEmails,
      });
      toast.success("Weekly report recipients updated successfully");
      setHasUnsavedChanges(false);
      refetch();
    } catch (error) {
      console.error("Error updating report emails:", error);
      toast.error("Failed to update report recipients");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (siteData?.reportEmails) {
      setEmailList(siteData.reportEmails.length > 0 ? siteData.reportEmails : [""]);
    } else {
      setEmailList([""]);
    }
    setHasUnsavedChanges(false);
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading report settings...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Weekly Report Recipients
        </Label>
        <p className="text-xs text-muted-foreground mt-1">
          Receive weekly analytics reports for this site only. Each email address will get a separate report containing
          only this site's statistics every Monday at midnight UTC.
        </p>
      </div>

      <div className="space-y-2">
        {emailList.map((email, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Input
              type="email"
              value={email}
              onChange={e => updateEmailField(index, e.target.value)}
              placeholder="email@example.com"
              disabled={disabled || isSaving}
              className={!validateEmail(email) && email.trim() !== "" ? "border-red-500" : ""}
            />
            {emailList.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeEmailField(index)}
                disabled={disabled || isSaving}
                className="shrink-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addEmailField}
          disabled={disabled || emailList.length >= 10 || isSaving}
          className="flex items-center space-x-1"
        >
          <Plus className="h-4 w-4" />
          <span>Add Email</span>
        </Button>

        {hasUnsavedChanges && (
          <>
            <Button type="button" size="sm" onClick={handleSave} disabled={disabled || isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleReset} disabled={disabled || isSaving}>
              Reset
            </Button>
          </>
        )}
      </div>

      {emailList.filter(e => e.trim()).length > 0 && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
          <p className="font-medium mb-1">📧 Report Schedule:</p>
          <p>
            {emailList.filter(e => e.trim()).length} recipient(s) will receive weekly reports for {siteData?.domain}{" "}
            every Monday at midnight UTC.
          </p>
        </div>
      )}
    </div>
  );
}
