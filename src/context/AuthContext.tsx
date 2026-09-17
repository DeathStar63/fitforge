"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User, AuthError } from "@supabase/supabase-js";

interface SignUpResult {
  error: AuthError | null;
  /** Account created, but Supabase requires the email to be confirmed first. */
  needsConfirmation: boolean;
  /** Email already belongs to an existing account. */
  alreadyRegistered: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
}

const notConfigured = { message: "Supabase not configured" } as AuthError;

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isPasswordRecovery: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, needsConfirmation: false, alreadyRegistered: false }),
  signOut: async () => {},
  resendConfirmation: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
});

/** Where Supabase should send the user back to after they click an emailed link. */
const redirectTarget = () =>
  typeof window !== "undefined" ? window.location.origin : undefined;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (event === "PASSWORD_RECOVERY") {
          setIsPasswordRecovery(true);
        } else if (event === "USER_UPDATED") {
          setIsPasswordRecovery(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: notConfigured };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string): Promise<SignUpResult> => {
    if (!supabase) {
      return { error: notConfigured, needsConfirmation: false, alreadyRegistered: false };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // Without this the confirmation link points at the project's Site URL
      // (localhost by default), which is a dead end on a phone.
      options: { emailRedirectTo: redirectTarget() },
    });

    if (error) {
      return { error, needsConfirmation: false, alreadyRegistered: false };
    }

    // When confirmations are on, Supabase hides "email already registered" by
    // returning a decoy user with no identities instead of an error.
    const alreadyRegistered = !!data.user && (data.user.identities?.length ?? 0) === 0;

    // No session back means the account is waiting on an email confirmation.
    const needsConfirmation = !data.session && !alreadyRegistered;

    return { error: null, needsConfirmation, alreadyRegistered };
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const resendConfirmation = async (email: string) => {
    if (!supabase) return { error: notConfigured };
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: redirectTarget() },
    });
    return { error };
  };

  const resetPassword = async (email: string) => {
    if (!supabase) return { error: notConfigured };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTarget(),
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    if (!supabase) return { error: notConfigured };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) setIsPasswordRecovery(false);
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isPasswordRecovery,
        signIn,
        signUp,
        signOut,
        resendConfirmation,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
