// ==========================================
// BIGYEAR - SUPABASE CLIENT
// Step 44: backend connection preparation
// ==========================================

const BIGYEAR_SUPABASE_URL =
    "https://iqjaheksjhiuzzhvbosj.supabase.co";

const BIGYEAR_SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_g7zyQvZ_8VtTbunh2vj2dw_LV9VpbSn";

if (!window.supabase || typeof window.supabase.createClient !== "function") {
    throw new Error("Supabase JS non è stato caricato correttamente.");
}

const BigYearSupabaseClient = window.supabase.createClient(
    BIGYEAR_SUPABASE_URL,
    BIGYEAR_SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
);

window.BigYearSupabase = {
    client: BigYearSupabaseClient,
    url: BIGYEAR_SUPABASE_URL,
    isConfigured: true
};
