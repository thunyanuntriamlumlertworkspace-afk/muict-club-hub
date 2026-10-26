import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { amIAdmin } from "@/lib/admin.functions";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";

const AccountContext = createContext<{ user: User | null; loading: boolean; recovery: boolean }>({ user: null, loading: true, recovery: false });
export const useAccount = () => useContext(AccountContext);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  useEffect(() => {
    let active = true;
    const refreshUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (active) { setUser(data.user); setLoading(false); }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") { setRecovery(true); void refreshUser(); return; }
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      if (event === "SIGNED_OUT") { setUser(null); setLoading(false); }
      else { setLoading(true); void refreshUser(); }
      void router.invalidate();
      if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
    });
    void refreshUser();
    return () => { active = false; subscription.unsubscribe(); };
  }, [queryClient, router]);
  return <AccountContext.Provider value={{ user, loading, recovery }}>{children}</AccountContext.Provider>;
}

export function AccountActions() {
  const { user, loading } = useAccount();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const checkAdmin = useServerFn(amIAdmin);
  const admin = useQuery({ queryKey: ["admin-access", user?.id], queryFn: () => checkAdmin(), enabled: Boolean(user) && !loading });
  async function signOut() {
    setBusy(true); setError("");
    await queryClient.cancelQueries();
    queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) { setError("Could not sign out. Try again."); setBusy(false); return; }
    await navigate({ to: "/auth", replace: true });
    setBusy(false);
  }
  if (loading) return <span className="text-sm text-muted-foreground">Checking account…</span>;
  return <div className="flex flex-wrap items-center gap-3">
    {user && !loading && admin.data && <Button asChild variant="ghost"><Link to="/admin">Admin</Link></Button>}
    {user ? <><span className="max-w-48 truncate text-sm text-muted-foreground">{user.email}</span><Button variant="outline" disabled={busy} onClick={signOut}><LogOut />Sign out</Button></> : <Button asChild variant="outline"><Link to="/auth"><LogIn />Sign in</Link></Button>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}