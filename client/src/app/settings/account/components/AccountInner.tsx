"use client";

import { authClient } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { useUpdateAccountSettings } from "../../../../api/admin/hooks/useAccountSettings";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Switch } from "../../../../components/ui/switch";
import { validateEmail } from "../../../../lib/auth-utils";
import { IS_CLOUD } from "../../../../lib/const";
import { ApiKeyManager } from "./ApiKeyManager";
import { ChangePassword } from "./ChangePassword";
import { DeleteAccount } from "./DeleteAccount";
import { useSignout } from "../../../../hooks/useSignout";
import { Mail } from "lucide-react";

export function AccountInner() {
  const session = authClient.useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const signout = useSignout();
  const updateAccountSettings = useUpdateAccountSettings();

  const [email, setEmail] = useState(session.data?.user.email ?? "");
  const [name, setName] = useState(session.data?.user.name ?? "");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isSendingReport, setIsSendingReport] = useState(false);

  useEffect(() => {
    setEmail(session.data?.user.email ?? "");
    setName(session.data?.user.name ?? "");
  }, [session]);

  const handleNameUpdate = async () => {
    if (!name) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      setIsUpdatingName(true);
      const response = await authClient.updateUser({
        name,
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to update name");
      }

      toast.success("Name updated successfully");
      session.refetch();
    } catch (error) {
      console.error("Error updating name:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update name");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleEmailUpdate = async () => {
    if (!email) {
      toast.error("Email cannot be empty");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setIsUpdatingEmail(true);
      const response = await authClient.changeEmail({
        newEmail: email,
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to update email");
      }

      toast.success("Email updated successfully");
      session.refetch();
    } catch (error) {
      console.error("Error updating email:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update email");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleEmailReportsToggle = async (checked: boolean) => {
    try {
      await updateAccountSettings.mutateAsync({
        sendAutoEmailReports: checked,
      });
      toast.success(`Email reports ${checked ? "enabled" : "disabled"}`);
      session.refetch();
    } catch (error) {
      console.error("Error updating email reports setting:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update email reports setting");
    }
  };

  const handleSendManualReport = async () => {
    try {
      setIsSendingReport(true);
      const organizationId = session.data?.session?.organizationId;
      
      if (!organizationId) {
        toast.error("No organization found");
        return;
      }

      const response = await fetch(`/api/organizations/${organizationId}/send-manual-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send report");
      }

      toast.success("Weekly report sent successfully! Check your email.");
    } catch (error) {
      console.error("Error sending manual report:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send manual report");
    } finally {
      setIsSendingReport(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-2">
        <CardHeader>
          <CardTitle className="text-xl">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Name</h4>
            <p className="text-xs text-neutral-500">Update your name displayed across the platform</p>
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Send Weekly Email Reports</h4>
                  <p className="text-xs text-neutral-500">Enable or disable automatic email reports for your account.</p>
                </div>
                <div className="flex space-x-2">
                  <Switch
                    checked={(session.data?.user as any).sendAutoEmailReports}
                    onCheckedChange={handleEmailReportsToggle}
                    disabled={updateAccountSettings.isPending}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Send Manual Report</h4>
                <p className="text-xs text-neutral-500">
                  Generate and send a weekly analytics report for the last 7 days to all members in your organization.
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleSendManualReport}
                  disabled={isSendingReport}
                  className="w-full sm:w-auto"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {isSendingReport ? "Sending..." : "Send Report Now"}
                </Button>
              </div>
            </lassName="text-sm font-medium">Email</h4>
            <p className="text-xs text-neutral-500">Update your email address for account notifications</p>
            <div className="flex space-x-2">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={({ target }) => setEmail(target.value)}
                placeholder="email@example.com"
              />
              <Button
                variant="outline"
                onClick={handleEmailUpdate}
                disabled={isUpdatingEmail || email === session.data?.user.email}
              >
                {isUpdatingEmail ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
          {(session.data?.user as any)?.sendAutoEmailReports !== undefined && (
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Send Weekly Email Reports</h4>
                <p className="text-xs text-neutral-500">Enable or disable automatic email reports for your account.</p>
              </div>
              <div className="flex space-x-2">
                <Switch
                  checked={(session.data?.user as any).sendAutoEmailReports}
                  onCheckedChange={handleEmailReportsToggle}
                  disabled={updateAccountSettings.isPending}
                />
              </div>
            </div>
          )}
          <Button variant="outline" onClick={signout}>
            Sign out
          </Button>
        </CardContent>
      </Card>

      <Card className="p-2">
        <CardHeader>
          <CardTitle className="text-xl">Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Password</h4>
            <p className="text-xs text-neutral-500">Change your account password</p>
            <div className="w-[200px]">
              <ChangePassword />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-red-500">Danger Zone</h4>
            <p className="text-xs text-neutral-500">Permanently delete your account and all associated data</p>
            <div className="w-[200px]">
              <DeleteAccount />
            </div>
          </div>
        </CardContent>
      </Card>
      <ApiKeyManager />
    </div>
  );
}
