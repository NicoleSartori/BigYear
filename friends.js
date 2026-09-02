/* BigYear Friends feature module */
(function (window, document) {
    "use strict";

    let deps = null;
    let selectedFriendKey = null;
    let selectedFriendView = "all";

    function init(dependencies) {
        deps = dependencies;
        bindFilterButtons();
    }

    function normalizeFriendKey(value) {
        return deps.utils.normalizeKey(value);
    }

    function participantMatchesObservation(participant, observation) {
        if (!participant || !observation) return false;
        const keys = new Set();
        [participant.email, participant.accountId, participant.invitedAccountId, participant.acceptedByAccountId]
            .filter(Boolean)
            .forEach(key => keys.add(normalizeFriendKey(key)));
        const observers = Array.isArray(observation.observers) ? observation.observers : [];
        const accountIds = Array.isArray(observation.observerAccountIds) ? observation.observerAccountIds : [];
        return observers.some(key => keys.has(normalizeFriendKey(key))) ||
            accountIds.some(key => keys.has(normalizeFriendKey(key)));
    }

    function getFriendParticipants() {
        const project = deps.getCurrentBigYearProject();
        const account = deps.getCurrentAccount();
        if (!project || !Array.isArray(project.participants)) return [];
        const currentKeys = new Set([
            account?.email,
            account?.id
        ].filter(Boolean).map(normalizeFriendKey));
        return project.participants.filter(participant => {
            if (!participant || !["accepted", "pending", "exited"].includes(participant.status)) return false;
            const keys = [participant.email, participant.accountId, participant.invitedAccountId, participant.acceptedByAccountId]
                .filter(Boolean).map(normalizeFriendKey);
            return !keys.some(key => currentKeys.has(key));
        });
    }

    function getSpeciesCatalogForFriends() {
        return Array.isArray(deps.speciesDatabase) ? deps.speciesDatabase : [];
    }

    function getFriendObservedSpecies(friend) {
        const observations = deps.getSavedObservations();
        const map = new Map();
        observations.forEach(observation => {
            if (!participantMatchesObservation(friend, observation)) return;
            const species = observation.species || {};
            const id = species.id != null ? String(species.id) : normalizeFriendKey(species.nomeItaliano);
            if (!id) return;
            if (!map.has(id)) map.set(id, species);
        });
        return map;
    }

    function getMyObservedSpecies() {
        const account = deps.getCurrentAccount();
        const project = deps.getCurrentBigYearProject();
        const currentParticipant = project?.participants?.find(participant => {
            const emailMatch = account?.email && participant.email &&
                normalizeFriendKey(account.email) === normalizeFriendKey(participant.email);
            const idMatch = account?.id &&
                (participant.accountId === account.id || participant.acceptedByAccountId === account.id);
            return emailMatch || idMatch;
        });
        const observations = deps.getSavedObservations();
        const map = new Map();
        observations.forEach(observation => {
            if (!currentParticipant || !participantMatchesObservation(currentParticipant, observation)) return;
            const species = observation.species || {};
            const id = species.id != null ? String(species.id) : normalizeFriendKey(species.nomeItaliano);
            if (id) map.set(id, species);
        });
        return map;
    }

    function renderFriendsSection() {
        const selector = document.getElementById("friendsSelector");
        const selectorLabel = document.getElementById("friendsSelectorLabel");
        const empty = document.getElementById("friendsEmpty");
        const detail = document.getElementById("friendDetail");
        const overviewCount = document.getElementById("friendsOverviewCount");
        const overviewText = document.getElementById("friendsOverviewText");
        if (!selector || !empty || !detail) return;

        const friends = getFriendParticipants();
        selector.innerHTML = "";

        if (overviewCount) overviewCount.textContent = friends.length;
        if (overviewText) {
            overviewText.textContent = friends.length === 1
                ? "1 partecipante con cui confrontare le osservazioni."
                : `${friends.length} partecipanti con cui confrontare le osservazioni.`;
        }

        if (!friends.length) {
            selector.hidden = true;
            if (selectorLabel) selectorLabel.hidden = true;
            empty.hidden = false;
            detail.hidden = true;
            selectedFriendKey = null;
            return;
        }

        selector.hidden = false;
        if (selectorLabel) selectorLabel.hidden = false;
        empty.hidden = true;

        const selected = friends.find(friend =>
            normalizeFriendKey(deps.getParticipantIdentity(friend)) === selectedFriendKey
        ) || friends[0];
        selectedFriendKey = normalizeFriendKey(deps.getParticipantIdentity(selected));

        friends.forEach(friend => {
            const key = normalizeFriendKey(deps.getParticipantIdentity(friend));
            const button = document.createElement("button");
            button.type = "button";
            button.className = `friend-person-button ${key === selectedFriendKey ? "active" : ""}`;

            const name = friend.name || (friend.email ? friend.email.split("@")[0] : "Partecipante");
            const status = friend.status === "pending" ? "In attesa" : friend.status === "exited" ? "Uscito" : "Attivo";
            const observedCount = getFriendObservedSpecies(friend).size;
            button.innerHTML = `
                <span class="friend-person-avatar">${deps.utils.escapeHtml(name.charAt(0).toUpperCase())}</span>
                <span class="friend-person-name">${deps.utils.escapeHtml(name)}</span>
                <span class="friend-person-meta">${observedCount} specie · ${status}</span>`;

            button.addEventListener("click", () => {
                selectedFriendKey = key;
                selectedFriendView = "all";
                renderFriendsSection();
            });
            selector.appendChild(button);
        });

        const activeFriendButton = selector.querySelector(".friend-person-button.active");
        if (activeFriendButton) {
            const selectorRect = selector.getBoundingClientRect();
            const buttonRect = activeFriendButton.getBoundingClientRect();
            const tailLeft = (buttonRect.left - selectorRect.left) + (buttonRect.width / 2);
            detail.style.setProperty("--bubble-tail-left", `${tailLeft}px`);
        }

        detail.hidden = false;
        const name = selected.name || (selected.email ? selected.email.split("@")[0] : "Partecipante");
        const avatar = document.getElementById("friendAvatar");
        const title = document.getElementById("friendDetailName");
        const status = document.getElementById("friendDetailStatus");
        if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
        if (title) title.textContent = name;
        if (status) {
            status.textContent = selected.status === "pending"
                ? "Invito non ancora accettato"
                : selected.status === "exited"
                    ? "Ha lasciato il Big Year"
                    : "Partecipante del Big Year";
            status.classList.toggle("pending", selected.status === "pending");
            status.classList.toggle("exited", selected.status === "exited");
        }

        renderFriendChecklist(selected);
    }

    function renderFriendChecklist(friend) {
        const list = document.getElementById("friendSpeciesList");
        const allButton = document.getElementById("friendAllButton");
        const missingButton = document.getElementById("friendMissingButton");
        const commonButton = document.getElementById("friendCommonButton");
        const observedCount = document.getElementById("friendObservedCount");
        const missingCount = document.getElementById("friendMissingCount");
        const commonCount = document.getElementById("friendCommonCount");
        if (!list) return;

        allButton?.classList.toggle("active", selectedFriendView === "all");
        missingButton?.classList.toggle("active", selectedFriendView === "missing");
        commonButton?.classList.toggle("active", selectedFriendView === "common");

        const friendSpecies = getFriendObservedSpecies(friend);
        const mySpecies = getMyObservedSpecies();
        const friendEntries = Array.from(friendSpecies.values());
        const missingEntries = friendEntries.filter(species => {
            const id = species.id != null ? String(species.id) : normalizeFriendKey(species.nomeItaliano);
            return !mySpecies.has(id);
        });
        const commonEntries = friendEntries.filter(species => {
            const id = species.id != null ? String(species.id) : normalizeFriendKey(species.nomeItaliano);
            return mySpecies.has(id);
        });

        if (observedCount) observedCount.textContent = friendEntries.length;
        if (missingCount) missingCount.textContent = missingEntries.length;
        if (commonCount) commonCount.textContent = commonEntries.length;

        let entries = friendEntries;
        if (selectedFriendView === "missing") entries = missingEntries;
        if (selectedFriendView === "common") entries = commonEntries;

        entries.sort((a, b) => String(a.nomeItaliano || "").localeCompare(String(b.nomeItaliano || ""), "it"));

        if (!entries.length) {
            const message = selectedFriendView === "missing"
                ? "Non ci sono specie che lui ha visto e che tu non hai ancora visto."
                : selectedFriendView === "common"
                    ? "Non avete ancora specie in comune."
                    : `${friend.name || "Questo amico"} non ha ancora osservazioni associate.`;
            list.innerHTML = `
                <div class="friend-list-empty">
                    <strong>Nessuna specie da mostrare</strong>
                    <span>${deps.utils.escapeHtml(message)}</span>
                </div>`;
            return;
        }

        list.innerHTML = entries.map(species => `
            <div class="friend-species-item ${selectedFriendView === "missing" ? "is-missing" : ""}">
                <div>
                    <div class="friend-species-name">${deps.utils.escapeHtml(species.nomeItaliano || "Specie non indicata")}</div>
                    <span class="friend-species-scientific">${deps.utils.escapeHtml(species.nomeScientifico || "")}</span>
                </div>
                <span class="friend-species-status">OSSERVATA</span>
            </div>`).join("");
    }

    function bindFilterButtons() {
        const allButton = document.getElementById("friendAllButton");
        const missingButton = document.getElementById("friendMissingButton");
        const commonButton = document.getElementById("friendCommonButton");
        allButton?.addEventListener("click", () => {
            selectedFriendView = "all";
            renderFriendsSection();
        });
        missingButton?.addEventListener("click", () => {
            selectedFriendView = "missing";
            renderFriendsSection();
        });
        commonButton?.addEventListener("click", () => {
            selectedFriendView = "common";
            renderFriendsSection();
        });
    }

    window.BigYearFriends = Object.freeze({
        init,
        renderFriendsSection,
        renderFriendChecklist,
        getFriendParticipants,
        getFriendObservedSpecies,
        getMyObservedSpecies,
        getSpeciesCatalogForFriends
    });
})(window, document);
