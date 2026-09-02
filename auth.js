// ==========================================
// BIGYEAR - SUPABASE AUTH
// Step 46: real account/session handling
// ==========================================

(function (window) {
    "use strict";

    const supabase = window.BigYearSupabase && window.BigYearSupabase.client;

    let currentSession = null;
    let currentUser = null;
    let initialized = false;

    function getDisplayName(user) {
        if (!user) return "";
        const metadata = user.user_metadata || {};
        return (
            metadata.display_name ||
            metadata.name ||
            metadata.full_name ||
            (user.email ? user.email.split("@")[0] : "")
        ).trim();
    }

    function prepareLocalCacheForUser(userId) {
        if (!window.BigYearStorage || !userId) return;

        const cacheOwnerId = window.BigYearStorage.get("bigYearCacheOwnerId");

        // A browser can still contain data created by a previous local
        // prototype account. Never let that cache become the data source for
        // a different Supabase account.
        if (cacheOwnerId !== userId) {
            window.BigYearStorage.clearProjectCache();
            window.BigYearStorage.set("bigYearCacheOwnerId", userId);
        }
    }

    function saveLocalAccount(user) {
        if (!user) return null;

        prepareLocalCacheForUser(user.id);

        const existing = window.BigYearStorage
            ? window.BigYearStorage.readJSON("bigYearAccount", {})
            : {};

        const account = {
            ...(existing || {}),
            id: user.id,
            name: getDisplayName(user),
            email: user.email || ""
        };

        if (window.BigYearStorage) {
            window.BigYearStorage.writeJSON("bigYearAccount", account);
        }

        return account;
    }

    async function ensureProfile(user) {
        if (!supabase || !user) return;

        const name = getDisplayName(user);
        const { error } = await supabase
            .from("profiles")
            .upsert({
                id: user.id,
                email: user.email || "",
                display_name: name || null
            }, { onConflict: "id" });

        if (error) {
            console.warn("BigYear: profilo online non sincronizzato.", error);
        }
    }

    async function handleSession(session) {
        currentSession = session || null;
        currentUser = session && session.user ? session.user : null;

        if (currentUser) {
            saveLocalAccount(currentUser);
            await ensureProfile(currentUser);
        }

        return currentUser;
    }

    async function init() {
        if (initialized) return currentSession;
        initialized = true;

        if (!supabase) {
            console.error("BigYear: client Supabase non disponibile.");
            return null;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) {
            console.error("BigYear: impossibile recuperare la sessione.", error);
        }

        await handleSession(data ? data.session : null);

        const { data: listener } = supabase.auth.onAuthStateChange(
            function (event, session) {
                // Keep the callback synchronous: Supabase recommends not
                // awaiting work directly inside the auth-state callback.
                currentSession = session || null;
                currentUser = session && session.user ? session.user : null;

                if (currentUser) {
                    saveLocalAccount(currentUser);
                }

                window.dispatchEvent(new CustomEvent("bigyear:auth", {
                    detail: {
                        event,
                        session,
                        user: currentUser
                    }
                }));

                if (currentUser) {
                    ensureProfile(currentUser).catch(function (profileError) {
                        console.warn("BigYear: profilo online non sincronizzato.", profileError);
                    });
                }
            }
        );

        window.BigYearAuth._subscription = listener && listener.subscription
            ? listener.subscription
            : null;

        return currentSession;
    }

    async function signUp(name, email, password) {
        if (!supabase) throw new Error("Supabase non configurato.");

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: name
                }
            }
        });

        if (error) throw error;

        if (data && data.session) {
            await handleSession(data.session);
        }

        return data;
    }

    async function signIn(email, password) {
        if (!supabase) throw new Error("Supabase non configurato.");

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        await handleSession(data.session);
        return data;
    }

    async function updateAccount(name, email) {
        if (!supabase) throw new Error("Supabase non configurato.");
        if (!currentUser) throw new Error("Devi prima accedere al tuo account.");

        const oldEmail = currentUser.email || "";
        const normalizedEmail = String(email || "").trim();
        const normalizedName = String(name || "").trim();

        const { data, error } = await supabase.auth.updateUser({
            email: normalizedEmail,
            data: { display_name: normalizedName }
        });
        if (error) throw error;

        // Keep the public profile and every Big Year membership row in sync
        // immediately. The username is public within a shared Big Year and
        // must not depend only on auth.user_metadata or on a database trigger.
        const updatedUser = data && data.user ? data.user : currentUser;
        currentUser = updatedUser || currentUser;
        await ensureProfile(currentUser);

        const { error: participantError } = await supabase
            .from("big_year_participants")
            .update({
                display_name: normalizedName,
                email: normalizedEmail
            })
            .eq("account_id", currentUser.id);

        if (participantError) {
            console.warn("BigYear: partecipanti non aggiornati con il nuovo username.", participantError);
        }

        await handleSession(data && data.session ? data.session : currentSession);

        return {
            user: data && data.user ? data.user : currentUser,
            emailChanged: oldEmail.toLowerCase() !== normalizedEmail.toLowerCase()
        };
    }

    async function deleteAccount() {
        if (!supabase) throw new Error("Supabase non configurato.");
        if (!currentUser) throw new Error("Devi prima accedere al tuo account.");

        const { error } = await supabase.rpc("delete_my_account");
        if (error) throw error;

        try {
            await supabase.auth.signOut({ scope: "local" });
        } catch (signOutError) {
            console.warn("BigYear: sessione locale già non disponibile dopo l'eliminazione account.", signOutError);
        }

        currentSession = null;
        currentUser = null;
        if (window.BigYearStorage) {
            window.BigYearStorage.remove("bigYearAccount");
            window.BigYearStorage.clearProjectCache();
            window.BigYearStorage.remove("bigYearCacheOwnerId");
            window.BigYearStorage.remove("bigYearProjects");
        }
    }

    async function signOut() {
        if (!supabase) return;

        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        currentSession = null;
        currentUser = null;

        if (window.BigYearStorage) {
            window.BigYearStorage.remove("bigYearAccount");
            window.BigYearStorage.clearProjectCache();
        }

        // Do not leave credentials in BigYear's form after logout.
        // Browser password managers may still offer autofill independently.
        ["accountEmail", "accountPassword", "loginEmail", "loginPassword"].forEach(function (id) {
            const field = document.getElementById(id);
            if (field) field.value = "";
        });
    }

    window.BigYearAuth = {
        init,
        signUp,
        signIn,
        signOut,
        updateAccount,
        deleteAccount,
        ensureProfile,
        getSession: function () { return currentSession; },
        getUser: function () { return currentUser; },
        getDisplayName,
        isAuthenticated: function () { return !!currentSession; },
        _subscription: null
    };
})(window);
