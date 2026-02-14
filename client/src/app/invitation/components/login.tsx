"use client";

import { useState } from "react";
import { authClient } from "../../../lib/auth";
import { userStore } from "../../../lib/userStore";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthError } from "@/components/auth/AuthError";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { Turnstile } from "@/components/auth/Turnstile";
import { IS_CLOUD } from "../../../lib/const";

interface LoginProps {
  callbackURL: string;
}

export function Login({ callbackURL }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string>("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Validate Turnstile token if in cloud mode and production
      if (IS_CLOUD && process.env.NODE_ENV === "production" && !turnstileToken) {
        setError("Please complete the captcha verification");
        setIsLoading(false);
        return;
      }

      const { data, error } = await authClient.signIn.email(
        {
          email,
          password,
        },
        {
          onRequest: context => {
            if (IS_CLOUD && process.env.NODE_ENV === "production" && turnstileToken) {
              context.headers.set("x-captcha-response", turnstileToken);
            }
          },
        }
      );

      if (data?.user) {
        userStore.setState({
          user: data.user,
        });
        // Force reload to show the AcceptInvitationInner component
        window.location.reload();
      }

      if (error) {
        setError(error.message || "An error occurred during login");
      }
    } catch (error) {
      setError(String(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <div className="flex flex-col gap-4">
        <SocialButtons onError={setError} callbackURL={callbackURL} />
        <AuthInput
          id="email"
          label="Email"
          type="email"
          placeholder="example@email.com"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <AuthInput
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {IS_CLOUD && process.env.NODE_ENV === "production" && (
          <Turnstile
            onSuccess={token => setTurnstileToken(token)}
            onError={() => setTurnstileToken("")}
            onExpire={() => setTurnstileToken("")}
            className="flex justify-center"
          />
        )}
        <AuthButton isLoading={isLoading} loadingText="Logging in..." disabled={IS_CLOUD && process.env.NODE_ENV === "production" ? !turnstileToken || isLoading : isLoading}>
          Login to Accept Invitation
        </AuthButton>
        <AuthError error={error} />
      </div>
    </form>
  );
}
