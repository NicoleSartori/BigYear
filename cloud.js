// ==========================================
// BIGYEAR - SUPABASE DATA SYNC
// Step 46: online persistence / multi-user data
// ==========================================

(function (window) {
    "use strict";

    const supabase = window.BigYearSupabase && window.BigYearSupabase.client;

    function isUuid(value) {
        return typeof value === "string" &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    }

    function newId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }
        return "00000000-0000-4000-8000-" +
            Math.random().toString(16).slice(2).padEnd(12, "0").slice(0, 12);
    }

    function dedupeParticipants(participants) {
        const result = [];
        const seenAccount = new Set();
        const seenEmailWithoutAccount = new Set();
        (participants || []).forEach(function (p) {
            if (!p) return;
            const accountId = p.account_id || "";
            const email = (p.email || "").trim().toLowerCase();

            // account_id is the authoritative identity. An email may be the
            // same as an already-linked participant, so it must NOT suppress
            // a different linked account. Only duplicate email-only pending
            // rows are collapsed here.
            if (accountId && seenAccount.has(accountId)) return;
            if (!accountId && email && seenEmailWithoutAccount.has(email)) return;

            if (accountId) {
                seenAccount.add(accountId);
            } else if (email) {
                seenEmailWithoutAccount.add(email);
            }

            result.push(p);
        });
        return result;
    }

    function profileNameForAccount(profilesById, accountId) {
        const profile = accountId && profilesById ? profilesById[accountId] : null;
        return profile && profile.display_name ? profile.display_name : "";
    }

    function participantDisplayName(participant, profilesById) {
        return (
            profileNameForAccount(profilesById, participant && participant.account_id) ||
            (participant && participant.display_name) ||
            (participant && participant.email ? participant.email.split("@")[0] : "Partecipante")
        );
    }

    function toLocalProject(row, participants, profilesById) {
        return {
            id: row.id,
            joinCode: row.join_code,
            name: row.name,
            areaType: row.area_type,
            area: row.area,
            startDate: row.start_date,
            endDate: row.end_date,
            owner: row.owner_id
                ? {
                    accountId: row.owner_id,
                    name: profileNameForAccount(profilesById, row.owner_id) || participants.find(p => p.account_id === row.owner_id)?.display_name || "",
                    email: participants.find(p => p.account_id === row.owner_id)?.email || ""
                }
                : null,
            participants: dedupeParticipants(participants).map(function (participant) {
                return {
                    id: participant.id,
                    name: participantDisplayName(participant, profilesById),
                    email: participant.email || "",
                    accountId: participant.account_id || "",
                    status: participant.status,
                    role: participant.role,
                    invitedByAccountId: participant.invited_by || "",
                    invitedAt: participant.invited_at || null,
                    acceptedAt: participant.accepted_at || null
                };
            }),
            createdAt: row.created_at
        };
    }

    function toLocalObservation(row, participants, profilesById) {
        const observerIds = Array.isArray(row.observer_ids) ? row.observer_ids : [];
        // Keep observer references stable. Display names are resolved by the UI;
        // storing names here breaks identity matching when a username changes.
        const observers = observerIds.map(function (id) {
            const participant = participants.find(p => p.account_id === id);
            return participant
                ? (participant.account_id || (participant.email || "").trim().toLowerCase() || id)
                : id;
        });

        return {
            id: row.id,
            projectId: row.big_year_id,
            species: {
                id: row.species_id,
                nomeItaliano: row.species_name_it,
                nomeScientifico: row.species_name_scientific
            },
            observers,
            observerAccountIds: observerIds,
            date: row.observation_date,
            time: row.observation_time,
            location: {
                name: row.location_name,
                latitude: row.latitude,
                longitude: row.longitude
            },
            notes: row.notes || "",
            createdAt: row.created_at
        };
    }

    async function migrateLocalProjectId(project) {
        if (!project || isUuid(project.id)) return project;

        const oldId = project.id;
        project.id = newId();

        const observations = window.BigYearStorage.readJSON("bigYearObservations", []);
        if (Array.isArray(observations)) {
            observations.forEach(function (observation) {
                if (observation.projectId === oldId) {
                    observation.projectId = project.id;
                }
            });
            window.BigYearStorage.writeJSON("bigYearObservations", observations);
        }

        window.BigYearStorage.writeJSON("bigYearProject", project);
        if (project.joinCode) {
            window.BigYearStorage.writeJSON("bigYearProject_" + project.joinCode, {
                projectId: project.id,
                project
            });
        }

        return project;
    }

    async function pushProject(project) {
        if (!supabase || !project) return null;

        const account = window.BigYearAuth && window.BigYearAuth.getUser();
        if (!account) return null;

        project = await migrateLocalProjectId(project);

        // The Big Year owner is part of the project identity. A member may
        // save local participant changes, but must never rewrite owner_id to
        // their own account. This was a subtle source of failed/partial syncs
        // when Account 2 interacted with a Big Year owned by Account 1.
        const ownerId = isUuid(project.owner && project.owner.accountId)
            ? project.owner.accountId
            : (project.participants || []).find(p => p && p.role === "owner" && isUuid(p.accountId))?.accountId || null;

        if (!ownerId) {
            throw new Error("Big Year senza account amministratore valido.");
        }

        const bigYearRow = {
            id: project.id,
            owner_id: ownerId,
            name: project.name,
            area_type: project.areaType,
            area: project.area,
            start_date: project.startDate,
            end_date: project.endDate,
            join_code: project.joinCode
        };

        const { error: bigYearError } = await supabase
            .from("big_years")
            .upsert(bigYearRow, { onConflict: "id" });

        if (bigYearError) throw bigYearError;

        const { data: existingParticipants, error: participantReadError } = await supabase
            .from("big_year_participants")
            .select("*")
            .eq("big_year_id", project.id);

        if (participantReadError) throw participantReadError;

        const existing = Array.isArray(existingParticipants) ? existingParticipants : [];

        for (const participant of (project.participants || [])) {
            const email = (participant.email || "").trim().toLowerCase();
            const accountId = participant.accountId || participant.invitedAccountId || null;
            const match = existing.find(function (row) {
                return (accountId && row.account_id === accountId) ||
                    (email && row.email && row.email.toLowerCase() === email);
            });

            const row = {
                big_year_id: project.id,
                account_id: accountId,
                email: email || null,
                display_name: participant.name || null,
                status: participant.status || "pending",
                role: participant.role || "member",
                invited_by: participant.invitedByAccountId || account.id,
                invited_at: participant.invitedAt || new Date().toISOString(),
                accepted_at: participant.acceptedAt ||
                    (participant.status === "accepted" ? new Date().toISOString() : null)
            };

            if (match && isUuid(match.id)) row.id = match.id;

            const { error } = await supabase
                .from("big_year_participants")
                .upsert(row, { onConflict: "id" });

            if (error) throw error;
        }

        return project;
    }

    async function pushObservation(observation) {
        if (!supabase || !observation) return null;

        const account = window.BigYearAuth && window.BigYearAuth.getUser();
        if (!account) return null;

        if (!isUuid(observation.id)) {
            observation.id = newId();
        }

        const observerIds = new Set(
            Array.isArray(observation.observerAccountIds)
                ? observation.observerAccountIds.filter(isUuid)
                : []
        );

        // Recover account IDs from authoritative participant rows too.
        // This protects observations created from an older/stale local cache
        // where a participant had an email but no accountId yet.
        const observerKeys = Array.isArray(observation.observers)
            ? observation.observers.map(value => String(value).trim().toLowerCase()).filter(Boolean)
            : [];

        if (observerKeys.length && isUuid(observation.projectId)) {
            const { data: participantRows, error: participantError } = await supabase
                .from("big_year_participants")
                .select("account_id, email, id")
                .eq("big_year_id", observation.projectId);

            if (participantError) throw participantError;

            (Array.isArray(participantRows) ? participantRows : []).forEach(function (participant) {
                if (!participant || !isUuid(participant.account_id)) return;
                const candidateKeys = [participant.account_id, participant.email, participant.id]
                    .filter(Boolean)
                    .map(value => String(value).trim().toLowerCase());
                if (candidateKeys.some(key => observerKeys.includes(key))) {
                    observerIds.add(participant.account_id);
                }
            });
        }

        observation.observerAccountIds = Array.from(observerIds);

        const row = {
            id: observation.id,
            big_year_id: observation.projectId,
            species_id: observation.species && observation.species.id,
            species_name_it: observation.species && observation.species.nomeItaliano,
            species_name_scientific: observation.species && observation.species.nomeScientifico,
            observer_ids: Array.from(observerIds),
            observation_date: observation.date,
            observation_time: observation.time || null,
            location_name: observation.location && observation.location.name,
            latitude: observation.location && observation.location.latitude,
            longitude: observation.location && observation.location.longitude,
            notes: observation.notes || "",
            created_by: account.id
        };

        const { error } = await supabase
            .from("observations")
            .upsert(row, { onConflict: "id" });

        if (error) throw error;

        return observation;
    }

    async function deleteObservation(id) {
        if (!supabase || !isUuid(id)) return;
        const { error } = await supabase
            .from("observations")
            .delete()
            .eq("id", id);
        if (error) throw error;
    }

    async function leaveBigYear(projectId) {
        if (!supabase || !isUuid(projectId)) throw new Error("Big Year non valido.");
        const { data, error } = await supabase.rpc("leave_big_year", {
            p_big_year_id: projectId
        });
        if (error) throw error;
        return data;
    }

    async function transferBigYearOwnership(projectId, newOwnerId) {
        if (!supabase || !isUuid(projectId) || !isUuid(newOwnerId)) throw new Error("Dati amministratore non validi.");
        const { data, error } = await supabase.rpc("transfer_big_year_ownership", {
            p_big_year_id: projectId,
            p_new_owner_id: newOwnerId
        });
        if (error) throw error;
        return data;
    }

    async function deleteBigYear(projectId) {
        if (!supabase || !isUuid(projectId)) throw new Error("Big Year non valido.");
        const { data, error } = await supabase.rpc("delete_big_year", {
            p_big_year_id: projectId
        });
        if (error) throw error;
        return data;
    }

    function getStatusForRow(row) {
        const today = new Date();
        const todayValue = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
        if (todayValue < row.start_date) return "planned";
        if (todayValue > row.end_date) return "concluded";
        return "active";
    }

    function chooseCurrentRow(rows, currentUserId, participantRows) {
        const sorted = (rows || []).slice().sort((a, b) => String(b.created_at || b.start_date || "").localeCompare(String(a.created_at || a.start_date || "")));

        // Prefer a Big Year in which the current account is actually owner or
        // accepted member. Relying only on recency can select the wrong visible
        // project when historical/current rows coexist.
        const ownedOrAccepted = sorted.filter(function (row) {
            if (!row || !currentUserId) return false;
            if (row.owner_id === currentUserId) return true;
            return (participantRows || []).some(function (p) {
                return p && p.big_year_id === row.id &&
                    p.account_id === currentUserId &&
                    p.status === "accepted";
            });
        });

        const candidates = ownedOrAccepted.length ? ownedOrAccepted : sorted;
        return candidates.find(row => getStatusForRow(row) !== "concluded") ||
            candidates.find(row => getStatusForRow(row) === "concluded") ||
            null;
    }

    async function syncFromCloud() {
        if (!supabase || !window.BigYearAuth || !window.BigYearAuth.isAuthenticated()) {
            return { project: null, projects: [], observations: [] };
        }

        const { data: projects, error: projectError } = await supabase
            .from("big_years")
            .select("*")
            .order("created_at", { ascending: false });
        if (projectError) throw projectError;

        const projectRows = Array.isArray(projects) ? projects : [];
        if (!projectRows.length) {
            window.BigYearStorage.writeJSON("bigYearProjects", []);
            window.BigYearStorage.remove("bigYearProject");
            window.BigYearStorage.writeJSON("bigYearObservations", []);
            return { project: null, projects: [], observations: [] };
        }

        const ids = projectRows.map(row => row.id);
        const { data: participantRows, error: participantError } = await supabase
            .from("big_year_participants")
            .select("*")
            .in("big_year_id", ids);
        if (participantError) throw participantError;

        const allParticipants = Array.isArray(participantRows) ? participantRows : [];

        const participantAccountIds = Array.from(new Set(
            allParticipants
                .map(p => p && p.account_id)
                .filter(id => !!id)
        ));
        let profilesById = {};
        if (participantAccountIds.length) {
            const { data: profileRows, error: profileError } = await supabase
                .from("profiles")
                .select("id, display_name")
                .in("id", participantAccountIds);
            if (!profileError && Array.isArray(profileRows)) {
                profileRows.forEach(profile => { profilesById[profile.id] = profile; });
            }
        }

        const currentUser = window.BigYearAuth.getUser();
        const currentProjectRow = chooseCurrentRow(projectRows, currentUser && currentUser.id, allParticipants);
        const allLocalProjects = projectRows.map(row => {
            const ps = dedupeParticipants(allParticipants.filter(p => p.big_year_id === row.id));
            return toLocalProject(row, ps, profilesById);
        });
        const localProjects = allLocalProjects.filter(project =>
            project.id === currentProjectRow?.id || getStatusForRow(projectRows.find(row => row.id === project.id)) === "concluded"
        );

        const { data: observationRows, error: observationError } = await supabase
            .from("observations")
            .select("*")
            .in("big_year_id", ids)
            .order("created_at", { ascending: true });
        if (observationError) throw observationError;

        const observations = (Array.isArray(observationRows) ? observationRows : [])
            .map(row => toLocalObservation(row, allParticipants, profilesById));

        const currentProject = localProjects.find(p => p.id === currentProjectRow.id) || null;
        window.BigYearStorage.writeJSON("bigYearProjects", localProjects);
        if (currentProject) {
            window.BigYearStorage.writeJSON("bigYearProject", currentProject);
            if (currentProject.joinCode) {
                window.BigYearStorage.writeJSON("bigYearProject_" + currentProject.joinCode, { projectId: currentProject.id, project: currentProject });
            }
        }
        window.BigYearStorage.writeJSON("bigYearObservations", observations);

        return { project: currentProject, projects: localProjects, observations };
    }

    async function getInvitation(joinCode) {
        if (!supabase) throw new Error("Supabase non configurato.");

        const { data, error } = await supabase.rpc("get_big_year_invitation", {
            p_join_code: String(joinCode || "").trim().toUpperCase()
        });

        if (error) throw error;
        return data;
    }

    async function acceptInvitation(joinCode) {
        if (!supabase) throw new Error("Supabase non configurato.");

        const { data, error } = await supabase.rpc("accept_big_year_invitation", {
            p_join_code: String(joinCode || "").trim().toUpperCase()
        });

        if (error) throw error;
        return data;
    }

    window.BigYearCloud = {
        isConfigured: !!supabase,
        pushProject,
        pushObservation,
        deleteObservation,
        leaveBigYear,
        deleteBigYear,
        transferBigYearOwnership,
        syncFromCloud,
        getInvitation,
        acceptInvitation,
        isUuid,
        createId: newId
    };
})(window);
