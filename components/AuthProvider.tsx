"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

/**
 * Supabase returns bare codes (e.g. "Invalid login credentials") that don't
 * tell an editor what to do next. Map the common ones to actionable messages.
 */
function describeAuthError(error: { message: string; status?: number; code?: string }): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Incorrect email or password.";
    case "email_not_confirmed":
      return "This email hasn't been confirmed yet. Confirm it in Supabase (Authentication → Users) and try again.";
    case "email_provider_disabled":
      return "Email + password sign-in is disabled for this Supabase project.";
    case "user_banned":
      return "This account has been banned.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many sign-in attempts. Wait a minute and try again.";
    case "insufficient_aal":
      return "This account requires multi-factor authentication.";
    default:
      break;
  }

  if (error.status === 403) {
    return "Supabase rejected the sign-in (403). Check this project's Auth settings and Auth logs.";
  }

  return error.message;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({}),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await getSupabaseBrowser().auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (!error) return {};

    if (process.env.NODE_ENV !== "production") {
      console.error("[auth] signInWithPassword failed", {
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }

    return { error: describeAuthError(error) };
  };

  const signOut = async () => {
    await getSupabaseBrowser().auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
