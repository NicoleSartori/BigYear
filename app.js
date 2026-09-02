// ==========================================
// BIGYEAR - JAVASCRIPT
// ==========================================


// ==========================================
// ELEMENTI
// ==========================================

const addObservationButton =
    document.getElementById("addObservationButton");

const observationModal =
    document.getElementById("observationModal");

const closeObservationButton =
    document.getElementById("closeObservationButton");

const observationDate =
    document.getElementById("observationDate");

const observationTime =
    document.getElementById("observationTime");


// Posizione

const locationSelector =
    document.getElementById("locationSelector");

const currentLocationButton =
    document.getElementById("currentLocationButton");

const searchLocationButton =
    document.getElementById("searchLocationButton");

const locationSearch =
    document.getElementById("locationSearch");

const locationSearchInput =
    document.getElementById("locationSearchInput");

const locationResults =
    document.getElementById("locationResults");

const closeLocationSearchButton =
    document.getElementById(
        "closeLocationSearchButton"
    );


// Luogo selezionato

const selectedLocationCard =
    document.getElementById(
        "selectedLocationCard"
    );

const selectedLocationName =
    document.getElementById(
        "selectedLocationName"
    );

const selectedLocationCoordinates =
    document.getElementById(
        "selectedLocationCoordinates"
    );

const changeLocationButton =
    document.getElementById(
        "changeLocationButton"
    );


// Mappa

const chooseMapLocationButton =
    document.getElementById(
        "chooseMapLocationButton"
    );

const mapScreen =
    document.getElementById("mapScreen");

const closeMapButton =
    document.getElementById("closeMapButton");

const confirmMapLocationButton =
    document.getElementById(
        "confirmMapLocationButton"
    );



// ==========================================
// PARTECIPANTI - MODAL
// ==========================================

const addParticipantButton =
    document.getElementById("addParticipantButton");

const participantModal =
    document.getElementById("participantModal");

const closeParticipantModal =
    document.getElementById("closeParticipantModal");

const participantEmailInput =
    document.getElementById("participantEmail");

const sendParticipantInvite =
    document.getElementById("sendParticipantInvite");

// ==========================================
// STATO POSIZIONE
// ==========================================



// ==========================================
// MAPPA
// ==========================================




function setObservationModalMode(isEditing) {

    if (observationModal) {
        observationModal.classList.toggle("editing", Boolean(isEditing));
        observationModal.classList.toggle("page-mode", !isEditing);
    }

    const eyebrow =
        observationModal.querySelector(
            ".modal-header .eyebrow"
        );

    const title =
        observationModal.querySelector(
            ".modal-header h2"
        );

    if (eyebrow) {
        eyebrow.textContent =
            isEditing
                ? "MODIFICA OSSERVAZIONE"
                : "NUOVA OSSERVAZIONE";
    }

    if (title) {
        title.textContent =
            isEditing
                ? "Modifica osservazione"
                : "Aggiungi una specie";
    }

    if (saveObservationButton) {
        saveObservationButton.textContent =
            isEditing
                ? "Salva modifiche"
                : "Salva osservazione";
    }

    if (deleteObservationButton) {
        deleteObservationButton.style.display =
            isEditing
                ? "block"
                : "none";
    }
}


function getObserverNameByKey(
    project,
    observerKey
) {

    const participants =
        project &&
        Array.isArray(project.participants)
            ? project.participants
            : [];

    const normalized =
        String(observerKey ?? "")
            .trim()
            .toLowerCase();

    const participant =
        participants.find(
            function (item) {
                if (!item) return false;

                const email = item.email
                    ? item.email.trim().toLowerCase()
                    : "";
                const accountId = item.accountId
                    ? String(item.accountId).trim().toLowerCase()
                    : "";
                const participantId = item.id
                    ? String(item.id).trim().toLowerCase()
                    : "";
                const name = item.name || item.displayName
                    ? String(item.name || item.displayName).trim().toLowerCase()
                    : "";

                return normalized && (
                    email === normalized ||
                    accountId === normalized ||
                    participantId === normalized ||
                    name === normalized
                );
            }
        );

    return participant
        ? (
            participant.name ||
            participant.displayName ||
            (participant.email ? participant.email.split("@")[0] : "Partecipante")
        )
        : null;
}

function getObservationObserverKeys(observation, project) {
    const keys = [];
    const observerKeys = Array.isArray(observation?.observers)
        ? observation.observers
        : [];
    const accountIds = Array.isArray(observation?.observerAccountIds)
        ? observation.observerAccountIds
        : [];

    observerKeys.forEach(function (key) {
        const normalized = String(key ?? "").trim().toLowerCase();
        if (normalized && !keys.includes(normalized)) keys.push(normalized);
    });

    accountIds.forEach(function (accountId) {
        const normalized = String(accountId ?? "").trim().toLowerCase();
        if (!normalized) return;
        const participant = (project?.participants || []).find(function (item) {
            return item && item.accountId && String(item.accountId).trim().toLowerCase() === normalized;
        });
        const identity = participant ? getParticipantIdentity(participant) : normalized;
        if (identity) {
            const normalizedIdentity = String(identity).trim().toLowerCase();
            if (!keys.includes(normalizedIdentity)) keys.push(normalizedIdentity);
        }
    });

    return keys;
}


function openObservationForEdit(
    observationId
) {

    const observations =
        getSavedObservations();

    const observation =
        observations.find(
            item =>
                item.id === observationId
        );

    if (!observation) {
        return;
    }

    const project =
        getCurrentBigYearProject();

    if (!project) {
        return;
    }
    if (isBigYearConcluded(project)) {
        alert("Questo Big Year è concluso: le osservazioni possono essere consultate, ma non modificate.");
        return;
    }

    AppState.editingObservationId =
        observation.id;

    setObservationModalMode(true);

    AppState.selectedSpecies = {
        id:
            observation.species &&
            observation.species.id
                ? observation.species.id
                : null,

        nomeItaliano:
            observation.species &&
            observation.species.nomeItaliano
                ? observation.species.nomeItaliano
                : null,

        nomeScientifico:
            observation.species &&
            observation.species.nomeScientifico
                ? observation.species.nomeScientifico
                : null
    };

    if (AppState.selectedSpecies.id) {

        selectedSpeciesName.textContent =
            AppState.selectedSpecies.nomeItaliano;

        selectedSpeciesScientific.textContent =
            AppState.selectedSpecies.nomeScientifico;

        selectedSpeciesCard.style.display =
            "flex";

        speciesInput.parentElement.style.display =
            "none";
    }

    observationDate.value =
        observation.date || "";

    observationTime.value =
        observation.time || "";

    AppState.selectedLocation = {
        name:
            observation.location &&
            observation.location.name
                ? observation.location.name
                : null,

        latitude:
            observation.location &&
            typeof observation.location.latitude === "number"
                ? observation.location.latitude
                : null,

        longitude:
            observation.location &&
            typeof observation.location.longitude === "number"
                ? observation.location.longitude
                : null
    };

    if (
        AppState.selectedLocation.name &&
        AppState.selectedLocation.latitude !== null &&
        AppState.selectedLocation.longitude !== null
    ) {
        showSelectedLocation();
    }

    observationNotes.value =
        observation.notes || "";

    AppState.selectedObserverKeys = getObservationObserverKeys(
        observation,
        project
    );
    AppState.observerSelectionInitialized = true;

    renderObserverOptions();

    observationModal.classList.add(
        "open"
    );
}


async function deleteObservationById(
    observationId
) {

    const observations =
        getSavedObservations();

    const index =
        observations.findIndex(
            item =>
                item.id === observationId
        );

    if (index === -1) {
        return;
    }

    const confirmed =
        window.confirm(
            "Vuoi eliminare questa osservazione?"
        );

    if (!confirmed) {
        return;
    }

    const observation = observations[index];

    // If the observation exists online, delete it there first so a later
    // cloud sync cannot resurrect a locally deleted observation.
    if (window.BigYearCloud && window.BigYearAuth && BigYearAuth.isAuthenticated() &&
        typeof window.BigYearCloud.deleteObservation === "function" &&
        window.BigYearCloud.isUuid && window.BigYearCloud.isUuid(observation.id)) {
        try {
            await window.BigYearCloud.deleteObservation(observation.id);
        } catch (error) {
            console.error("BigYear: impossibile eliminare l'osservazione online.", error);
            alert("Non è stato possibile eliminare l'osservazione dal cloud. Nessun dato locale è stato cancellato.");
            return;
        }
    }

    observations.splice(
        index,
        1
    );

    BigYearStorage.set(
        "bigYearObservations",
        JSON.stringify(observations)
    );

    AppState.editingObservationId = null;
    setObservationModalMode(false);

    observationModal.classList.remove(
        "open"
    );

    resetObservationForm();
    updateHomeStatistics();
    renderChecklist();

    alert(
        "Osservazione eliminata."
    );
}

// ==========================================
// APRI NUOVA OSSERVAZIONE
// ==========================================

addObservationButton.addEventListener(
    "click",
    function () {

        const currentProject = getCurrentBigYearProject();
        if (!currentProject) {
            alert("Prima devi creare o aprire un Big Year.");
            return;
        }
        const status = getBigYearStatus(currentProject);
        if (status === "concluded") {
            alert("Questo Big Year è concluso e non può più ricevere nuove osservazioni.");
            return;
        }
        if (status === "planned") {
            alert(`Questo Big Year inizierà il ${formatDateForDisplay(currentProject.startDate)}. Non puoi ancora aggiungere osservazioni.`);
            return;
        }

        const now = new Date();

        const year =
            now.getFullYear();

        const month =
            String(
                now.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                now.getDate()
            ).padStart(2, "0");

        const hours =
            String(
                now.getHours()
            ).padStart(2, "0");

        const minutes =
            String(
                now.getMinutes()
            ).padStart(2, "0");


        observationDate.value =
            `${year}-${month}-${day}`;

        observationTime.value =
            `${hours}:${minutes}`;

        AppState.editingObservationId = null;

        const currentAccount = getCurrentAccount();
        const currentProjectForObservers = getCurrentBigYearProject();
        const currentParticipant = currentProjectForObservers && Array.isArray(currentProjectForObservers.participants)
            ? currentProjectForObservers.participants.find(function (participant) {
                return participant && currentAccount && (
                    (participant.accountId && currentAccount.id && String(participant.accountId) === String(currentAccount.id)) ||
                    (participant.email && currentAccount.email && participant.email.trim().toLowerCase() === currentAccount.email.trim().toLowerCase())
                );
            })
            : null;
        // Keep the observer selection while the user leaves and re-enters
        // the observation page. Only the first opening gets the current
        // account selected automatically. If the user deliberately unchecks
        // everyone, that choice must remain empty until a new observation is
        // saved or the session is reset.
        if (!AppState.observerSelectionInitialized) {
            AppState.selectedObserverKeys = currentParticipant && getParticipantIdentity(currentParticipant)
                ? [String(getParticipantIdentity(currentParticipant)).trim().toLowerCase()]
                : [];
            AppState.observerSelectionInitialized = true;
        }

        setObservationModalMode(false);

        renderObserverOptions();

        // Ogni apertura di una nuova osservazione riparte con la pin,
        // anche se la stessa istanza del bottone era stata usata prima.
        if (currentLocationButton) {
            currentLocationButton.disabled = false;
            currentLocationButton.innerHTML =
                "<img src=\"assets/pin.png\" alt=\"\" aria-hidden=\"true\">";
        }

        clearMainNavSections();
        if (observationModal) observationModal.classList.add("open", "page-mode");
        if (addObservationButton) addObservationButton.classList.add("active");

    }
);


// ==========================================
// CHIUDI OSSERVAZIONE
// ==========================================

closeObservationButton.addEventListener(
    "click",
    function () {

        if (observationModal.classList.contains("editing")) {
            observationModal.classList.remove("open", "editing");
            observationModal.classList.add("page-mode");
        } else {
            // In modalità nuova osservazione, la pagina si chiude solo tramite la bottom navigation.
            showHomeFromChecklist();
        }

    }
);


// ==========================================
// MOSTRA POSIZIONE SELEZIONATA
// ==========================================

function showSelectedLocation() {

    selectedLocationName.textContent =
        AppState.selectedLocation.name;


    selectedLocationCoordinates.textContent =
        `${AppState.selectedLocation.latitude.toFixed(6)}, ${AppState.selectedLocation.longitude.toFixed(6)}`;


    selectedLocationCard.style.display =
        "flex";


    locationSelector.style.display =
        "none";


    locationSearch.classList.remove(
        "open"
    );

    locationResults.innerHTML =
        "";

    locationSearchInput.value =
        "";

}


// ==========================================
// TORNA AL SELETTORE
// ==========================================

changeLocationButton.addEventListener(
    "click",
    function () {

        selectedLocationCard.style.display =
            "none";


        locationSelector.style.display =
            "grid";


        AppState.selectedLocation = {

            name: null,

            latitude: null,

            longitude: null

        };

    }
);


// ==========================================
// GPS
// ==========================================

currentLocationButton.addEventListener(
    "click",
    function () {

        currentLocationButton.disabled =
            true;


        currentLocationButton.innerHTML =
            "<span class=\"location-loading-dots\">…</span>";


        navigator.geolocation.getCurrentPosition(

            function (position) {

                const latitude =
                    position.coords.latitude;

                const longitude =
                    position.coords.longitude;


                // Il GPS ha terminato la fase di acquisizione:
                // ripristiniamo subito la pin, senza lasciare
                // l'indicatore di caricamento nello stato del bottone.
                currentLocationButton.innerHTML =
                    "<img src=\"assets/pin.png\" alt=\"\" aria-hidden=\"true\">";

                currentLocationButton.disabled =
                    false;

                reverseGeocode(
                    latitude,
                    longitude
                );

            },


            function (error) {

                console.log(
                    "Errore GPS:",
                    error
                );


                currentLocationButton.disabled =
                    false;


                currentLocationButton.innerHTML =
                    "<img src=\"assets/pin.png\" alt=\"\" aria-hidden=\"true\">";

            }

        );

    }
);


// ==========================================
// REVERSE GEOCODING
// ==========================================

function reverseGeocode(
    latitude,
    longitude
) {

    fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=14&accept-language=it`
    )

        .then(response =>
            response.json()
        )

        .then(data => {

            const address =
                data.address || {};


            const place =
                address.city ||
                address.town ||
                address.village ||
                address.municipality ||
                address.hamlet ||
                address.locality ||
                address.county ||
                "Posizione rilevata";


            AppState.selectedLocation.name =
                place;

            AppState.selectedLocation.latitude =
                latitude;

            AppState.selectedLocation.longitude =
                longitude;


            showSelectedLocation();

        })

        .catch(error => {

            console.log(
                "Errore reverse geocoding:",
                error
            );


            AppState.selectedLocation.name =
                "Posizione GPS";

            AppState.selectedLocation.latitude =
                latitude;

            AppState.selectedLocation.longitude =
                longitude;


            showSelectedLocation();

        });

}


// ==========================================
// APRI RICERCA
// ==========================================

searchLocationButton.addEventListener(
    "click",
    function () {

        locationSelector.style.display =
            "none";


        locationSearch.classList.add(
            "open"
        );


        locationSearchInput.focus();

    }
);


// ==========================================
// CHIUDI RICERCA
// ==========================================

closeLocationSearchButton.addEventListener(
    "click",
    function () {

        locationSearch.classList.remove(
            "open"
        );


        locationSearchInput.value =
            "";

        locationResults.innerHTML =
            "";


        locationSelector.style.display =
            "grid";

    }
);


// ==========================================
// AUTOCOMPLETE
// ==========================================



locationSearchInput.addEventListener(
    "input",
    function () {

        const searchText =
            locationSearchInput.value.trim();


        clearTimeout(AppState.searchTimeout);


        locationResults.innerHTML =
            "";


        if (
            searchText.length < 2
        ) {

            return;

        }


        AppState.searchTimeout =
            setTimeout(
                function () {

                    searchLocations(
                        searchText
                    );

                },
                500
            );

    }
);


// ==========================================
// RICERCA LOCALITÀ
// ==========================================

function searchLocations(
    searchText
) {

    locationResults.innerHTML =
        `
        <div class="location-result-item">

            <span class="location-result-description">
                Ricerca in corso...
            </span>

        </div>
        `;


    const url =
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(searchText)}&limit=5&accept-language=it`;


    fetch(url)

        .then(response =>
            response.json()
        )

        .then(data => {

            locationResults.innerHTML =
                "";


            if (
                data.length === 0
            ) {

                locationResults.innerHTML =
                    `
                    <div class="location-result-item">

                        <span class="location-result-description">
                            Nessun luogo trovato.
                        </span>

                    </div>
                    `;

                return;

            }


            data.forEach(
                function (result) {

                    const resultButton =
                        document.createElement(
                            "button"
                        );


                    resultButton.type =
                        "button";


                    resultButton.className =
                        "location-result-item";


                    const resultName =
                        result.name ||
                        "Luogo";


                    const resultDescription =
                        result.display_name;


                    resultButton.innerHTML =
                        `
                        <span class="location-result-name">
                            ${window.BigYearUtils.escapeHtml(resultName)}
                        </span>

                        <span class="location-result-description">
                            ${window.BigYearUtils.escapeHtml(resultDescription || "")}
                        </span>
                        `;


                    resultButton.addEventListener(
                        "click",
                        function () {

                            const latitude =
                                parseFloat(
                                    result.lat
                                );

                            const longitude =
                                parseFloat(
                                    result.lon
                                );


                            AppState.selectedLocation.name =
                                resultName;

                            AppState.selectedLocation.latitude =
                                latitude;

                            AppState.selectedLocation.longitude =
                                longitude;


                            showSelectedLocation();

                        }
                    );


                    locationResults.appendChild(
                        resultButton
                    );

                }
            );

        })

        .catch(error => {

            console.log(
                "Errore ricerca:",
                error
            );


            locationResults.innerHTML =
                `
                <div class="location-result-item">

                    <span class="location-result-description">
                        Errore nella ricerca.
                    </span>

                </div>
                `;

        });

}


// ==========================================
// APRI MAPPA
// ==========================================

chooseMapLocationButton.addEventListener(
    "click",
    function () {

        mapScreen.classList.add(
            "open"
        );


        setTimeout(
            function () {

                initializeMap();

            },
            100
        );

    }
);


// ==========================================
// INIZIALIZZA MAPPA
// ==========================================

function initializeMap() {

    if (
        AppState.map !== null
    ) {

        AppState.map.invalidateSize();

        return;

    }


    AppState.map =
        L.map("map");


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,

            attribution:
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(AppState.map);


    /*
       Se abbiamo già una posizione,
       partiamo da quella.

       Altrimenti usiamo l'Italia.
    */

    let initialLatitude =
        AppState.selectedLocation.latitude ||
        42.5;

    let initialLongitude =
        AppState.selectedLocation.longitude ||
        12.5;

    let initialZoom =
        AppState.selectedLocation.latitude
            ? 15
            : 6;


    AppState.map.setView(
        [
            initialLatitude,
            initialLongitude
        ],
        initialZoom
    );


    /*
       Marker iniziale.
    */

    updateMapMarker(
        initialLatitude,
        initialLongitude
    );


    /*
       Quando clicchi sulla mappa,
       il punto si sposta.
    */

    AppState.map.on(
        "click",
        function (event) {

            updateMapMarker(
                event.latlng.lat,
                event.latlng.lng
            );

        }
    );

}


// ==========================================
// MARKER MAPPA
// ==========================================



function updateMapMarker(
    latitude,
    longitude
) {

    if (
        AppState.mapMarker !== null
    ) {

        AppState.map.removeLayer(
            AppState.mapMarker
        );

    }


    AppState.mapMarker =
        L.marker(
            [
                latitude,
                longitude
            ],
            {
                draggable: true
            }
        ).addTo(AppState.map);


    /*
       Se trascini il marker,
       aggiorniamo automaticamente
       la posizione.
    */

    AppState.mapMarker.on(
        "dragend",
        function () {

            const position =
                AppState.mapMarker.getLatLng();


            console.log(
                "Nuova posizione:",
                position.lat,
                position.lng
            );

        }
    );

}


// ==========================================
// CHIUDI MAPPA
// ==========================================

closeMapButton.addEventListener(
    "click",
    function () {

        mapScreen.classList.remove(
            "open"
        );

    }
);


// ==========================================
// CONFERMA MAPPA
// ==========================================

confirmMapLocationButton.addEventListener(
    "click",
    function () {

        if (
            AppState.mapMarker === null
        ) {

            return;

        }


        const position =
            AppState.mapMarker.getLatLng();


        const latitude =
            position.lat;

        const longitude =
            position.lng;


        /*
           Recuperiamo automaticamente
           il nome del luogo dalle coordinate.
        */

        reverseGeocode(
            latitude,
            longitude
        );


        mapScreen.classList.remove(
            "open"
        );

    }
);// ==========================================
// DATABASE SPECIE
// ==========================================




// ==========================================
// ELEMENTI RICERCA SPECIE
// ==========================================

const speciesInput =
    document.getElementById("speciesInput");

const speciesResults =
    document.getElementById("speciesResults");

const speciesClearButton =
    document.getElementById("speciesClearButton");

const selectedSpeciesCard =
    document.getElementById(
        "selectedSpeciesCard"
    );

const selectedSpeciesName =
    document.getElementById(
        "selectedSpeciesName"
    );

const selectedSpeciesScientific =
    document.getElementById(
        "selectedSpeciesScientific"
    );

const changeSpeciesButton =
    document.getElementById(
        "changeSpeciesButton"
    );


// ==========================================
// CARICA SPECIES.JSON
// ==========================================

fetch("species.json")
    .then(response => {

        if (!response.ok) {

            throw new Error(
                "Impossibile caricare species.json"
            );

        }

        return response.json();

    })

    .then(data => {

        AppState.speciesDatabase = data;

        console.log(
            "Database specie caricato:",
            AppState.speciesDatabase.length,
            "specie"
        );

    })

    .catch(error => {

        console.error(
            "Errore caricamento database specie:",
            error
        );

    });


// ==========================================
// RICERCA SPECIE
// ==========================================

speciesInput.addEventListener(
    "input",
    function () {

        const searchText =
            speciesInput.value
                .trim()
                .toLowerCase();


        speciesClearButton.classList.toggle(
            "visible",
            searchText.length > 0
        );


        speciesResults.innerHTML =
            "";


        if (
            searchText.length < 2
        ) {

            speciesResults.classList.remove(
                "open"
            );

            return;

        }


        const results =
            AppState.speciesDatabase
                .filter(species => {

                    const italian =
                        species.nomeItaliano
                            .toLowerCase();

                    const scientific =
                        species.nomeScientifico
                            .toLowerCase();

                    return (
                        italian.includes(searchText) ||
                        scientific.includes(searchText)
                    );

                })
                .slice(0, 8);


        if (
            results.length === 0
        ) {

            speciesResults.innerHTML =
                `
                <div class="species-no-results">
                    Nessuna specie trovata.
                </div>
                `;

            speciesResults.classList.add(
                "open"
            );

            return;

        }


        results.forEach(
            function (species) {

                const resultButton =
                    document.createElement(
                        "button"
                    );


                resultButton.type =
                    "button";


                resultButton.className =
                    "species-result-item";


                resultButton.innerHTML =
                    `
                    <span class="species-result-name">
                        ${window.BigYearUtils.escapeHtml(species.nomeItaliano)}
                    </span>

                    <span class="species-result-scientific">
                        ${window.BigYearUtils.escapeHtml(species.nomeScientifico)}
                    </span>
                    `;


                resultButton.addEventListener(
                    "click",
                    function () {

                        selectSpecies(
                            species
                        );

                    }
                );


                speciesResults.appendChild(
                    resultButton
                );

            }
        );


        speciesResults.classList.add(
            "open"
        );

    }
);


// ==========================================
// SELEZIONA SPECIE
// ==========================================

function selectSpecies(species) {

    AppState.selectedSpecies = {

        id: species.id,

        nomeItaliano:
            species.nomeItaliano,

        nomeScientifico:
            species.nomeScientifico

    };


    selectedSpeciesName.textContent =
        species.nomeItaliano;


    selectedSpeciesScientific.textContent =
        species.nomeScientifico;


    selectedSpeciesCard.style.display =
        "flex";


    speciesResults.classList.remove(
        "open"
    );


    speciesInput.value =
        "";


    speciesInput.parentElement.style.display =
        "none";


    speciesClearButton.classList.remove(
        "visible"
    );


    console.log(
        "Specie selezionata:",
        AppState.selectedSpecies
    );

}


// ==========================================
// CAMBIA SPECIE
// ==========================================

changeSpeciesButton.addEventListener(
    "click",
    function () {

        selectedSpeciesCard.style.display =
            "none";


        speciesInput.parentElement.style.display =
            "flex";


        speciesInput.value =
            "";


        AppState.selectedSpecies = {

            id: null,

            nomeItaliano: null,

            nomeScientifico: null

        };


        speciesInput.focus();

    }
);


// ==========================================
// CANCELLA RICERCA
// ==========================================

speciesClearButton.addEventListener(
    "click",
    function () {

        speciesInput.value =
            "";

        speciesResults.innerHTML =
            "";

        speciesResults.classList.remove(
            "open"
        );

        speciesClearButton.classList.remove(
            "visible"
        );

        speciesInput.focus();

    }
);
// ==========================================
// SALVATAGGIO OSSERVAZIONI
// ==========================================

const saveObservationButton =
    document.getElementById("saveObservationButton");

const deleteObservationButton =
    document.getElementById(
        "deleteObservationButton"
    );



const observationNotes =
    document.getElementById("observationNotes");


// ==========================================
// LEGGI OSSERVAZIONI SALVATE
// ==========================================

function getBigYearStatus(project) {
    if (!project || !project.startDate || !project.endDate) return "active";
    const today = new Date();
    const todayValue = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
    if (todayValue < project.startDate) return "planned";
    if (todayValue > project.endDate) return "concluded";
    return "active";
}

function isObservationWithinBigYear(observation, project) {
    if (!observation || !project || !observation.date) return false;
    return observation.date >= project.startDate && observation.date <= project.endDate;
}

function isBigYearConcluded(project) {
    return getBigYearStatus(project) === "concluded";
}

function isBigYearCurrent(project) {
    const status = getBigYearStatus(project);
    return status === "planned" || status === "active";
}

function sortBigYearProjects(projects) {
    return (Array.isArray(projects) ? projects.slice() : []).sort((a, b) => {
        const aDate = String(a?.createdAt || a?.startDate || "");
        const bDate = String(b?.createdAt || b?.startDate || "");
        return bDate.localeCompare(aDate);
    });
}

function getSelectedBigYearCandidate(projects) {
    const sorted = sortBigYearProjects(projects);
    const currentCandidates = sorted.filter(isBigYearCurrent);
    return currentCandidates[0] || sorted.find(isBigYearConcluded) || null;
}

function getSavedObservations() {

    const saved =
        BigYearStorage.get(
            "bigYearObservations"
        );

    if (!saved) {
        return [];
    }

    try {

        const observations = JSON.parse(saved);

        if (!Array.isArray(observations)) {
            return [];
        }

        const project = getCurrentBigYearProject();

        if (!project || !project.id) {
            return [];
        }

        return observations.filter(
            observation =>
                observation.projectId === project.id &&
                observation.countsInBigYear !== false &&
                isObservationWithinBigYear(observation, project)
        );

    } catch (error) {

        console.error(
            "Errore nella lettura delle osservazioni:",
            error
        );

        return [];
    }
}

function getAllSavedObservations() {

    const saved =
        BigYearStorage.get(
            "bigYearObservations"
        );

    if (!saved) {
        return [];
    }

    try {

        const observations = JSON.parse(saved);

        return Array.isArray(observations)
            ? observations
            : [];

    } catch (error) {

        console.error(
            "Errore nella lettura di tutte le osservazioni:",
            error
        );

        return [];
    }
}

function getCurrentBigYearProject() {

    const savedProject =
        BigYearStorage.get("bigYearProject");

    if (!savedProject) {
        return null;
    }

    try {
        return JSON.parse(savedProject);
    } catch (error) {

        console.error(
            "Errore nella lettura del Big Year:",
            error
        );

        return null;
    }
}
function getCurrentParticipants() {

    const project = getCurrentBigYearProject();

    if (!project || !Array.isArray(project.participants)) {
        return [];
    }

    return project.participants;
}


function ensureParticipantAccountLinks(project) {

    if (!project || !Array.isArray(project.participants)) {
        return false;
    }

    const account = getCurrentAccount();
    let changed = false;

    project.participants.forEach(
        function (participant) {

            if (
                participant.role === "owner" &&
                !participant.accountId &&
                account &&
                participant.email &&
                account.email &&
                participant.email.toLowerCase() ===
                    account.email.toLowerCase()
            ) {
                participant.accountId = account.id;
                changed = true;
            }

            if (
                participant.status === "accepted" &&
                participant.acceptedByAccountId &&
                !participant.accountId
            ) {
                participant.accountId =
                    participant.acceptedByAccountId;
                changed = true;
            }

            // The account is the source of truth for the current user's
            // username. Keep the Big Year participant and owner identity in sync.
            const matchesCurrentAccount = Boolean(
                account && (
                    (participant.accountId && account.id &&
                        String(participant.accountId) === String(account.id)) ||
                    (participant.email && account.email &&
                        participant.email.trim().toLowerCase() === account.email.trim().toLowerCase())
                )
            );

            if (matchesCurrentAccount) {
                if (account.name && participant.name !== account.name) {
                    participant.name = account.name;
                    changed = true;
                }
                if (account.email && participant.email !== account.email) {
                    participant.email = account.email;
                    changed = true;
                }
            }
        }
    );

    if (changed) {
        saveBigYearProject(project);
    }

    return changed;
}


// ==========================================
// OSSERVATORI DINAMICI
// ==========================================

function getParticipantIdentity(participant) {

    if (!participant) {
        return null;
    }

    // L'email è la chiave locale stabile del partecipante; l'accountId
    // resta il riferimento autorevole per la persistenza online.
    if (participant.email) {
        return participant.email
            .trim()
            .toLowerCase();
    }

    return (
        participant.accountId ||
        participant.invitedAccountId ||
        participant.acceptedByAccountId ||
        participant.id ||
        null
    );
}

function resolveObserverAccountIds(project, observerKeys) {
    if (!project || !Array.isArray(project.participants) || !Array.isArray(observerKeys)) {
        return [];
    }

    const normalizedKeys = new Set(
        observerKeys
            .filter(Boolean)
            .map(value => String(value).trim().toLowerCase())
    );

    const accountIds = new Set();

    project.participants.forEach(function (participant) {
        if (!participant || !["accepted", "pending"].includes(participant.status)) {
            return;
        }

        const candidateKeys = [
            getParticipantIdentity(participant),
            participant.email,
            participant.accountId,
            participant.invitedAccountId,
            participant.acceptedByAccountId,
            participant.id
        ]
            .filter(Boolean)
            .map(value => String(value).trim().toLowerCase());

        const selected = candidateKeys.some(key => normalizedKeys.has(key));
        const accountId = participant.accountId || participant.acceptedByAccountId ||
            (participant.invitedAccountId && window.BigYearCloud && window.BigYearCloud.isUuid && window.BigYearCloud.isUuid(participant.invitedAccountId)
                ? participant.invitedAccountId
                : null);

        if (selected && accountId) {
            accountIds.add(String(accountId));
        }
    });

    return Array.from(accountIds);
}


function renderObserverOptions() {

    const container =
        document.getElementById(
            "observerOptions"
        );

    if (!container) {
        return;
    }

    const project =
        getCurrentBigYearProject();

    if (!project) {
        container.innerHTML = "";
        return;
    }

    // Repair participant/account links before rendering.
    ensureParticipantAccountLinks(project);

    const participants =
        Array.isArray(project.participants)
            ? project.participants.filter(participant =>
                participant && (
                    participant.status === "accepted" ||
                    participant.status === "pending"
                )
            )
            : [];

    container.innerHTML = "";

    if (participants.length === 0) {

        const empty =
            document.createElement("span");

        empty.className =
            "observer-empty";

        empty.textContent =
            "Nessun partecipante accettato.";

        container.appendChild(empty);

        return;
    }

    participants.forEach(
        function (participant) {

            const identity =
                getParticipantIdentity(
                    participant
                );

            if (!identity) {
                return;
            }

            const label =
                document.createElement("label");

            label.className =
                "observer-option";

            const checkbox =
                document.createElement("input");

            checkbox.type = "checkbox";
            checkbox.name = "observer";

            // Chiave stabile nel prototipo locale.
            checkbox.value = identity;

            // ID account conservato separatamente per il futuro backend.
            checkbox.dataset.observerKey = identity;

            if (participant.accountId) {
                checkbox.dataset.accountId =
                    participant.accountId;
            } else {
                checkbox.dataset.accountId = "";
            }

            const span =
                document.createElement("span");

            span.textContent =
                participant.name ||
                participant.displayName ||
                (
                    participant.email
                        ? participant.email.split("@")[0]
                        : "Partecipante"
                );

            checkbox.checked = AppState.selectedObserverKeys.includes(
                String(identity).trim().toLowerCase()
            );

            checkbox.addEventListener("change", function () {
                const key = String(checkbox.dataset.observerKey || checkbox.value || "")
                    .trim()
                    .toLowerCase();
                const selected = new Set(
                    Array.isArray(AppState.selectedObserverKeys)
                        ? AppState.selectedObserverKeys.map(value => String(value).trim().toLowerCase())
                        : []
                );
                if (checkbox.checked) selected.add(key);
                else selected.delete(key);
                AppState.selectedObserverKeys = Array.from(selected);
            });

            label.appendChild(checkbox);
            label.appendChild(span);

            container.appendChild(label);
        }
    );
}


// ==========================================
// APRI / CHIUDI MODAL PARTECIPANTE
// ==========================================

if (addParticipantButton) {
    addParticipantButton.addEventListener(
        "click",
        function () {

            if (!participantModal) {
                return;
            }

            if (participantEmailInput) {
                participantEmailInput.value = "";
            }

            participantModal.classList.add("open");

            if (participantEmailInput) {
                setTimeout(
                    function () {
                        participantEmailInput.focus();
                    },
                    50
                );
            }
        }
    );
}

if (closeParticipantModal) {
    closeParticipantModal.addEventListener(
        "click",
        function () {

            if (participantModal) {
                participantModal.classList.remove("open");
            }

        }
    );
}

if (participantModal) {
    participantModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target === participantModal
            ) {
                participantModal.classList.remove(
                    "open"
                );
            }

        }
    );
}


// ==========================================
// INVITA PARTECIPANTE
// ==========================================

if (sendParticipantInvite) {
    sendParticipantInvite.addEventListener(
        "click",
        function () {

            const email =
                participantEmailInput
                    ? participantEmailInput.value.trim()
                    : "";

            if (!email) {
                alert("Inserisci l'email del partecipante.");
                if (participantEmailInput) {
                    participantEmailInput.focus();
                }
                return;
            }

            const project =
                getCurrentBigYearProject();

            const account =
                getCurrentAccount();

            if (!account) {
                alert(
                    "Devi prima accedere al tuo account."
                );
                return;
            }

            if (!project || !project.id) {
                alert("Prima devi creare o aprire un Big Year.");
                return;
            }

            if (!Array.isArray(project.participants)) {
                project.participants = [];
            }

            const emailLower =
                email.toLowerCase();

            const existingParticipant = project.participants.find(
                participant => participant.email && participant.email.toLowerCase() === emailLower
            );

            if (existingParticipant) {
                if (existingParticipant.status === "exited") {
                    existingParticipant.status = "pending";
                    existingParticipant.invitedAt = new Date().toISOString();
                    existingParticipant.invitedByAccountId = account.id;
                    saveBigYearProject(project);
                    updateHomeParticipantCount();
                    renderObserverOptions();
                    alert("Invito nuovamente registrato per " + email + ".");
                    return;
                }
                alert("Questo partecipante è già presente nel Big Year.");
                return;
            }

            const newParticipant = {
                id:
                    "participant_" +
                    Date.now() +
                    "_" +
                    Math.random()
                        .toString(36)
                        .slice(2, 7),

                name:
                    email.split("@")[0],

                email:
                    email,

                status:
                    "pending",

                role:
                    "member",

                invitedByEmail:
                    project.owner &&
                    project.owner.email
                        ? project.owner.email
                        : "",

                invitedByAccountId:
                    account && account.id
                        ? account.id
                        : ""
            };

            project.participants.push(
                newParticipant
            );

            saveBigYearProject(project);

            if (participantModal) {
                participantModal.classList.remove(
                    "open"
                );
            }

            if (participantEmailInput) {
                participantEmailInput.value = "";
            }

            updateHomeParticipantCount();
            updateHomeStatistics();
            updateParticipantInviteCode();
            renderObserverOptions();

            alert(
                "Invito registrato per " +
                email +
                "."
            );

            console.log(
                "Partecipante aggiunto:",
                newParticipant
            );
        }
    );
}


// ==========================================
// AGGIORNA CONTATORE PARTECIPANTI
// ==========================================

function updateHomeParticipantCount() {

    const participants =
        getCurrentParticipants();

    const countElement =
        document.getElementById(
            "homeParticipantCount"
        );

    if (countElement) {
        countElement.textContent =
            participants.length;
    }
}

// ==========================================
// SALVA OSSERVAZIONE
// ==========================================

saveObservationButton.addEventListener(
    "click",
    function () {

        // ------------------------------
        // CONTROLLO SPECIE
        // ------------------------------

        if (!AppState.selectedSpecies.id) {

            alert(
                "Seleziona una specie."
            );

            speciesInput.focus();

            return;
        }


        // ------------------------------
        // CONTROLLO OSSERVATORE
        // ------------------------------

        const observerContainer =
            document.getElementById("observerOptions");

        const selectedObserverCheckboxes =
            observerContainer
                ? Array.from(
                    observerContainer.querySelectorAll(
                        'input[name="observer"]:checked'
                    )
                )
                : [];

        const selectedObservers =
            selectedObserverCheckboxes
                .map(
                    checkbox =>
                        checkbox.dataset.observerKey ||
                        checkbox.value
                )
                .filter(Boolean)
                .filter(
                    (value, index, array) =>
                        array.indexOf(value) === index
                );


        if (selectedObservers.length === 0) {

            alert(
                "Seleziona almeno un osservatore."
            );

            return;
        }


        // ------------------------------
        // CONTROLLO DATA
        // ------------------------------

        if (!observationDate.value) {

            alert(
                "Inserisci la data dell'osservazione."
            );

            return;
        }


        // ------------------------------
        // CONTROLLO POSIZIONE
        // ------------------------------

        if (
            AppState.selectedLocation.latitude === null ||
            AppState.selectedLocation.longitude === null
        ) {

            alert(
                "Seleziona la posizione dell'osservazione."
            );

            return;
        }


        // ------------------------------
        // CREA OSSERVAZIONE
        // ------------------------------

        const currentProject =
            getCurrentBigYearProject();

        if (!currentProject || !currentProject.id) {

            alert(
                "Prima devi creare o aprire un Big Year."
            );

            return;
        }

        if (isBigYearConcluded(currentProject) && !AppState.editingObservationId) {
            alert("Questo Big Year è concluso e non può più ricevere nuove osservazioni.");
            return;
        }

        const observationIsWithinBigYear = isObservationWithinBigYear(
            { date: observationDate.value },
            currentProject
        );

        if (!observationIsWithinBigYear) {
            const direction = observationDate.value < currentProject.startDate ? "precede la data di inizio" : "successiva alla data di fine";
            const saveAnyway = window.confirm(
                `Questa osservazione ${direction} del Big Year (${formatDateForDisplay(currentProject.startDate)} — ${formatDateForDisplay(currentProject.endDate)}).\n\nPuoi salvarla comunque, ma non verrà conteggiata né mostrata nel Big Year. Vuoi salvarla?`
            );
            if (!saveAnyway) return;
        }

        const observation = {

            id:
                window.BigYearCloud && window.BigYearCloud.createId
                    ? window.BigYearCloud.createId()
                    : (window.crypto && window.crypto.randomUUID
                        ? window.crypto.randomUUID()
                        : "obs_" + Date.now()),

            projectId:
                currentProject.id,

            species: {

                id:
                    AppState.selectedSpecies.id,

                nomeItaliano:
                    AppState.selectedSpecies.nomeItaliano,

                nomeScientifico:
                    AppState.selectedSpecies.nomeScientifico

            },

            // Chiavi stabili degli osservatori nel prototipo locale.
            observers:
                selectedObservers,

            // Account ID corrispondenti, quando disponibili.
            observerAccountIds:
                resolveObserverAccountIds(
                    currentProject,
                    selectedObservers
                ),

            date:
                observationDate.value,

            time:
                observationTime.value || null,

            location: {

                name:
                    AppState.selectedLocation.name,

                latitude:
                    AppState.selectedLocation.latitude,

                longitude:
                    AppState.selectedLocation.longitude

            },

            notes:
                observationNotes.value.trim(),

            countsInBigYear: observationIsWithinBigYear,

            createdAt:
                new Date().toISOString()

        };


        // ------------------------------
        // AGGIUNGI AL DATABASE LOCALE
        // ------------------------------

        const observations =
            getSavedObservations();

        if (AppState.editingObservationId) {

            const index =
                observations.findIndex(
                    item =>
                        item.id ===
                        AppState.editingObservationId
                );

            if (index === -1) {

                alert(
                    "L'osservazione da modificare non è più disponibile."
                );

                return;
            }

            observation.id =
                AppState.editingObservationId;

            observation.createdAt =
                observations[index].createdAt ||
                observation.createdAt;

            observations[index] =
                observation;

        } else {

            observations.push(
                observation
            );

        }

        BigYearStorage.set(
            "bigYearObservations",
            JSON.stringify(observations)
        );

        if (window.BigYearCloud && BigYearAuth.isAuthenticated()) {
            window.BigYearCloud.pushObservation(observation)
                .then(function () {
                    BigYearStorage.set("bigYearObservations", JSON.stringify(getAllSavedObservations()));
                })
                .catch(function (error) {
                    console.error("BigYear: impossibile sincronizzare l'osservazione online.", error);
                    alert("Osservazione salvata sul dispositivo, ma non ancora sincronizzata online.");
                });
        }

        console.log(
            "Osservazione salvata:",
            observation
        );


        // ------------------------------
        // AGGIORNA HOME
        // ------------------------------

        updateHomeStatistics();


        // ------------------------------
        // RESET / CHIUSURA
        // ------------------------------

        const wasEditing =
            Boolean(AppState.editingObservationId);

        resetObservationForm();

        if (wasEditing) {
            observationModal.classList.remove("open", "editing", "page-mode");
        } else {
            // Dopo il salvataggio resta nella pagina Nuova osservazione, pronta per una nuova registrazione.
            observationModal.classList.add("open", "page-mode");
        }

        AppState.editingObservationId =
            null;

        setObservationModalMode(false);

        renderChecklist();

        // ------------------------------
        // CONFERMA
        // ------------------------------

        alert(
            wasEditing
                ? "Modifiche salvate!"
                : "Osservazione salvata!"
        );

    }
);



if (deleteObservationButton) {

    deleteObservationButton.addEventListener(
        "click",
        function () {

            if (!AppState.editingObservationId) {
                return;
            }

            deleteObservationById(
                AppState.editingObservationId
            );

        }
    );

}

// ==========================================
// RESET NUOVA OSSERVAZIONE
// ==========================================

function resetObservationForm(preserveObservers = false) {

    // SPECIE

    AppState.selectedSpecies = {

        id: null,

        nomeItaliano: null,

        nomeScientifico: null

    };


    selectedSpeciesCard.style.display =
        "none";


    speciesInput.parentElement.style.display =
        "flex";


    speciesInput.value =
        "";


    speciesResults.innerHTML =
        "";


    speciesResults.classList.remove(
        "open"
    );


    speciesClearButton.classList.remove(
        "visible"
    );


    // OSSERVATORI

    if (!preserveObservers) {
        AppState.selectedObserverKeys = [];
        AppState.observerSelectionInitialized = false;
    }
    renderObserverOptions();


    // POSIZIONE

    AppState.selectedLocation = {

        name: null,

        latitude: null,

        longitude: null

    };


    selectedLocationCard.style.display =
        "none";


    locationSelector.style.display =
        "grid";


    locationSearch.classList.remove(
        "open"
    );


    locationSearchInput.value =
        "";


    locationResults.innerHTML =
        "";


    // NOTE

    observationNotes.value =
        "";

}


// ==========================================
// STATISTICHE HOME
// ==========================================


function getParticipantSpeciesCount(
    participant,
    observations
) {

    if (
        !participant ||
        !Array.isArray(observations)
    ) {
        return 0;
    }

    const participantKeys = new Set();

    if (participant.email) {
        participantKeys.add(
            participant.email
                .trim()
                .toLowerCase()
        );
    }

    if (participant.accountId) {
        participantKeys.add(
            String(participant.accountId)
        );
    }

    if (participant.invitedAccountId) {
        participantKeys.add(
            String(participant.invitedAccountId)
        );
    }

    if (participant.acceptedByAccountId) {
        participantKeys.add(
            String(participant.acceptedByAccountId)
        );
    }

    if (participantKeys.size === 0) {
        return 0;
    }

    const speciesIds = new Set();

    observations.forEach(
        function (observation) {

            if (!observation || !observation.species) {
                return;
            }

            let isObserver = false;

            const observerKeys =
                Array.isArray(observation.observers)
                    ? observation.observers
                    : [];

            const accountKeys =
                Array.isArray(
                    observation.observerAccountIds
                )
                    ? observation.observerAccountIds
                    : [];

            isObserver =
                observerKeys.some(
                    key =>
                        participantKeys.has(
                            String(key)
                                .trim()
                                .toLowerCase()
                        )
                ) ||
                accountKeys.some(
                    key =>
                        participantKeys.has(
                            String(key)
                        )
                );

            if (isObserver) {
                speciesIds.add(
                    observation.species.id
                );
            }
        }
    );

    return speciesIds.size;
}


function updateHomeStatistics() {

    const observations =
        getSavedObservations();

    const currentAccount =
        getCurrentAccount();

    const currentEmail =
        currentAccount && currentAccount.email
            ? currentAccount.email.trim().toLowerCase()
            : null;

    const currentProject =
        getCurrentBigYearProject();

    const currentParticipant =
        currentProject &&
        Array.isArray(currentProject.participants)
            ? currentProject.participants.find(participant =>
                participant && currentAccount && participant.accountId &&
                String(participant.accountId) === String(currentAccount.id)
            ) || currentProject.participants.find(participant =>
                participant && participant.email && currentEmail &&
                participant.email.trim().toLowerCase() === currentEmail
            )
            : null;

    const currentObserverKey =
        currentParticipant
            ? getParticipantIdentity(currentParticipant)
            : currentEmail;

    const myObservations =
        observations.filter(function (observation) {
            if (!observation) return false;

            const observerKeys = Array.isArray(observation.observers)
                ? observation.observers
                : [];
            const observerAccountIds = Array.isArray(observation.observerAccountIds)
                ? observation.observerAccountIds
                : [];

            const emailMatch = currentObserverKey && observerKeys.some(key =>
                String(key).trim().toLowerCase() === String(currentObserverKey).trim().toLowerCase()
            );
            const accountIdMatch = currentAccount?.id && observerAccountIds.some(key =>
                String(key) === String(currentAccount.id)
            );

            return Boolean(emailMatch || accountIdMatch);
        });

    const observationCountElement =
        document.getElementById(
            "homeObservationCount"
        );

    const observationLabelElement =
        document.getElementById(
            "homeObservationLabel"
        );

    if (observationCountElement) {
        observationCountElement.textContent =
            myObservations.length;
    }

    if (observationLabelElement) {
        observationLabelElement.textContent =
            myObservations.length === 1
                ? "osservazione"
                : "osservazioni";
    }

    const recentContainer =
        document.getElementById(
            "recentObservations"
        );

    if (recentContainer) {

        recentContainer.innerHTML = "";

        const recent =
            [...myObservations]
                .sort(
                    function (a, b) {

                        const aDate =
                            `${a.date || ""} ${a.time || ""}`;

                        const bDate =
                            `${b.date || ""} ${b.time || ""}`;

                        return bDate.localeCompare(aDate);
                    }
                )
                .slice(0, 3);

        if (recent.length === 0) {

            const empty =
                document.createElement("span");

            empty.className =
                "recent-observations-empty";

            empty.textContent =
                "Ancora nessuna osservazione";

            recentContainer.appendChild(empty);

        } else {

            recent.forEach(
                function (observation) {

                    const pill =
                        document.createElement("span");

                    pill.className =
                        "recent-observation-pill";

                    pill.textContent =
                        observation.species &&
                        observation.species.nomeItaliano
                            ? observation.species.nomeItaliano
                            : "Specie";

                    recentContainer.appendChild(pill);
                }
            );
        }
    }

    // ------------------------------------------
    // PARTECIPANTI HOME
    // ------------------------------------------

    ensureParticipantAccountLinks(
        currentProject
    );

    const participants =
        getCurrentParticipants();

    const participantCountElement =
        document.getElementById(
            "homeParticipantCount"
        );

    if (participantCountElement) {
        participantCountElement.textContent =
            participants.length;
    }

    const participantCards =
        document.getElementById(
            "participantCards"
        );

    if (participantCards) {

        participantCards.innerHTML = "";

        participants.forEach(
            function (participant) {

                const card =
                    document.createElement("div");

                card.className =
                    "participant-card";

                const name =
                    participant.name ||
                    "Partecipante";

                const isPending =
                    participant.status === "pending";

                let subtitle =
                    "0 specie";

                if (
                    participant.status === "accepted"
                ) {

                    const participantSpeciesCount =
                        getParticipantSpeciesCount(
                            participant,
                            observations
                        );

                    subtitle =
                        participantSpeciesCount === 1
                            ? "1 specie"
                            : `${participantSpeciesCount} specie`;
                }

                if (isPending) {
                    subtitle =
                        "In attesa di accettazione";
                }

                const safeName = window.BigYearUtils.escapeHtml(name);

                card.innerHTML = `
                    <div class="avatar">
                        ${window.BigYearUtils.escapeHtml(name.charAt(0).toUpperCase())}
                    </div>

                    <div class="participant-info">
                        <strong>${safeName}</strong>
                        <span>${window.BigYearUtils.escapeHtml(subtitle)}</span>
                    </div>
                `;

                participantCards.appendChild(card);
            }
        );
    }
}


// ==========================================
// CARICA STATISTICHE ALL'AVVIO
// ==========================================

updateHomeStatistics();
updateHomeProjectInfo();
renderObserverOptions();
updateParticipantInviteCode();
// ==========================================
// CHECKLIST
// ==========================================

const homeButton =
    document.getElementById(
        "homeButton"
    );

const homeContent =
    document.getElementById(
        "homeContent"
    );

const checklistButton =
    document.getElementById(
        "checklistButton"
    );

const checklistScreen =
    document.getElementById(
        "checklistScreen"
    );

const closeChecklistButton =
    document.getElementById(
        "closeChecklistButton"
    );

const checklistList =
    document.getElementById(
        "checklistList"
    );

const checklistSpeciesCount =
    document.getElementById(
        "checklistSpeciesCount"
    );

const checklistSearchInput =
    document.getElementById(
        "checklistSearchInput"
    );


// ==========================================
// APRI CHECKLIST
// ==========================================

checklistButton.addEventListener(
    "click",
    function () {

        clearMainNavSections();
        checklistScreen.classList.add(
            "open"
        );

        if (observationsMapSection) observationsMapSection.classList.remove("active");
        if (friendsSection) friendsSection.classList.remove("active");

        homeContent.classList.add(
            "checklist-hidden"
        );

        homeButton.classList.remove(
            "active"
        );

        checklistButton.classList.add(
            "active"
        );

        renderChecklist();

    }
);


// ==========================================
// CHIUDI CHECKLIST
// ==========================================

function showHomeFromChecklist() {

    /* Always clear every main-section and nav active state first.
       This prevents Home and Mappa (or another section) from
       remaining highlighted at the same time. */
    if (typeof clearMainNavSections === "function") {
        clearMainNavSections();
    }

    if (observationModal) observationModal.classList.remove("open", "editing");
    if (checklistScreen) checklistScreen.classList.remove("open");
    if (homeContent) homeContent.classList.remove("checklist-hidden");
    if (homeButton) homeButton.classList.add("active");
}


homeButton.addEventListener(
    "click",
    showHomeFromChecklist
);


closeChecklistButton.addEventListener(
    "click",
    showHomeFromChecklist
);


// ==========================================
// CREA MAPPA DELLE OSSERVAZIONI
// ==========================================

function getObservedSpecies() {

    const observations =
        getSavedObservations();


    const speciesMap =
        new Map();


    observations.forEach(
        function (observation) {

            const species =
                observation.species;


            const existing =
                speciesMap.get(
                    species.id
                );


            /*
               Se abbiamo già osservato
               questa specie, conserviamo
               l'osservazione più recente.
            */

            if (
                !existing ||
                observation.createdAt >
                    existing.createdAt
            ) {

                speciesMap.set(
                    species.id,
                    observation
                );

            }

        }
    );


    return Array.from(
        speciesMap.values()
    );

}


// ==========================================
// RENDER CHECKLIST
// ==========================================

function renderChecklist(
    searchText = ""
) {

    const observedSpecies =
        getObservedSpecies();


    checklistSpeciesCount.textContent =
        observedSpecies.length;


    const normalizedSearch =
        searchText
            .trim()
            .toLowerCase();


    const filtered =
        observedSpecies
            .filter(
                function (observation) {

                    if (
                        !normalizedSearch
                    ) {

                        return true;

                    }


                    return (

                        observation.species
                            .nomeItaliano
                            .toLowerCase()
                            .includes(
                                normalizedSearch
                            )

                        ||

                        observation.species
                            .nomeScientifico
                            .toLowerCase()
                            .includes(
                                normalizedSearch
                            )

                    );

                }
            )
            .sort(
                function (a, b) {

                    return a.species
                        .nomeItaliano
                        .localeCompare(
                            b.species.nomeItaliano,
                            "it"
                        );

                }
            );


    checklistList.innerHTML =
        "";


    if (
        observedSpecies.length === 0
    ) {

        checklistList.innerHTML =
            `
            <div class="checklist-empty">

                Non hai ancora registrato
                nessuna specie.

                <br><br>

                Aggiungi la tua prima
                osservazione dalla Home.

            </div>
            `;

        return;

    }


    if (
        filtered.length === 0
    ) {

        checklistList.innerHTML =
            `
            <div class="checklist-no-results">

                Nessuna specie trovata.

            </div>
            `;

        return;

    }


    filtered.forEach(
        function (observation) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "checklist-item";


            const date =
                formatObservationDate(
                    observation.date
                );


            const location =
                observation.location &&
                observation.location.name
                    ? observation.location.name
                    : "Posizione non specificata";

            const project =
                getCurrentBigYearProject();

            const observerNames =
                getObservationObserverKeys(observation, project)
                    .map(key => getObserverNameByKey(project, key))
                    .filter(Boolean)
                    .filter((name, index, array) => array.indexOf(name) === index);

            const observerText =
                observerNames.length
                    ? "Osservato da " +
                        observerNames.join(" e ")
                    : "Osservatore non specificato";


            item.innerHTML =
                `
                <div class="checklist-check">
                    ✓
                </div>

                <div class="checklist-item-content">

                    <div class="checklist-item-name">
                        ${window.BigYearUtils.escapeHtml(observation.species.nomeItaliano)}
                    </div>

                    <div class="checklist-item-scientific">
                        ${window.BigYearUtils.escapeHtml(observation.species.nomeScientifico)}
                    </div>

                    <div class="checklist-item-details">
                        ${window.BigYearUtils.escapeHtml(date)} · ${window.BigYearUtils.escapeHtml(location)}
                    </div>

                    <div class="checklist-item-observers">
                        ${window.BigYearUtils.escapeHtml(observerText)}
                    </div>

                </div>

                ${observation.notes && observation.notes.trim() ? `
                <button type="button" class="checklist-note-button" aria-label="Visualizza nota">
                    <img src="assets/note.svg" alt="" aria-hidden="true">
                </button>` : ""}

                <div class="checklist-item-action">
                    Modifica
                </div>
                `;

            const noteButton = item.querySelector(".checklist-note-button");
            if (noteButton) {
                noteButton.addEventListener("click", function (event) {
                    event.stopPropagation();
                    openObservationNote(observation);
                });
            }

            item.addEventListener(
                "click",
                function () {

                    openObservationForEdit(
                        observation.id
                    );

                }
            );


            checklistList.appendChild(
                item
            );

        }
    );

}


// ==========================================
// NOTE OSSERVAZIONI
// ==========================================

function openObservationNote(observation) {
    const overlay = document.getElementById("observationNoteOverlay");
    const text = document.getElementById("observationNoteText");
    if (!overlay || !text) return;
    text.textContent = observation.notes || "";
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
}

function closeObservationNote() {
    const overlay = document.getElementById("observationNoteOverlay");
    if (!overlay) return;
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
}

const closeObservationNoteButton = document.getElementById("closeObservationNoteButton");
if (closeObservationNoteButton) closeObservationNoteButton.addEventListener("click", closeObservationNote);
const observationNoteOverlay = document.getElementById("observationNoteOverlay");
if (observationNoteOverlay) {
    observationNoteOverlay.addEventListener("click", function(event) {
        if (event.target === observationNoteOverlay) closeObservationNote();
    });
}

// ==========================================
// FORMATTA DATA
// ==========================================

function formatObservationDate(dateString) {

    if (!dateString) {
        return "";
    }

    const parts = String(dateString).split("-");
    if (parts.length !== 3) {
        return String(dateString);
    }

    const year = parts[0];
    const month = parts[1];
    const day = parts[2];

    const months = [
        "gennaio",
        "febbraio",
        "marzo",
        "aprile",
        "maggio",
        "giugno",
        "luglio",
        "agosto",
        "settembre",
        "ottobre",
        "novembre",
        "dicembre"
    ];

    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}

function formatObservationDateTime(observation) {
    if (!observation?.date) return "Data non disponibile";
    const parts = String(observation.date).split("-");
    if (parts.length !== 3) return String(observation.date);
    const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    return observation.time ? `${formatted} · ${observation.time}` : formatted;
}

// ==========================================
// RICERCA CHECKLIST
// ==========================================

checklistSearchInput.addEventListener(
    "input",
    function () {

        renderChecklist(
            checklistSearchInput.value
        );

    }
);
// ==========================================
// ONBOARDING
// ==========================================

const welcomeScreen = document.getElementById("welcomeScreen");
const authScreen = document.getElementById("authScreen");
const loginScreen = document.getElementById("loginScreen");
const bigyearChoiceScreen = document.getElementById("bigyearChoiceScreen");
const bigyearConfigScreen = document.getElementById("bigyearConfigScreen");
const joinBigYearScreen = document.getElementById("joinBigYearScreen");

const menuButton = document.querySelector(".menu-button");
const appMenuOverlay = document.getElementById("appMenuOverlay");
const appMenuClose = document.getElementById("appMenuClose");
const openGuideButton = document.getElementById("openGuideButton");
const openBigYearButton = document.getElementById("openBigYearButton");
const openInfoButton = document.getElementById("openInfoButton");
const logoutButton = document.getElementById("logoutButton");
const choiceLogoutButton = document.getElementById("choiceLogoutButton");
const openAccountButton = document.getElementById("openAccountButton");
const accountSettingsScreen = document.getElementById("accountSettingsScreen");
const accountSettingsBackButton = document.getElementById("accountSettingsBackButton");
const accountSettingsName = document.getElementById("accountSettingsName");
const accountSettingsEmail = document.getElementById("accountSettingsEmail");
const saveAccountSettingsButton = document.getElementById("saveAccountSettingsButton");
const deleteAccountButton = document.getElementById("deleteAccountButton");
const menuAccountEmail = document.getElementById("menuAccountEmail");
const guideScreen = document.getElementById("guideScreen");
const infoScreen = document.getElementById("infoScreen");
const guideBackButton = document.getElementById("guideBackButton");
const infoBackButton = document.getElementById("infoBackButton");
const bigYearSettingsScreen = document.getElementById("bigYearSettingsScreen");
const bigYearSettingsBackButton = document.getElementById("bigYearSettingsBackButton");
const settingsBigYearName = document.getElementById("settingsBigYearName");
const settingsBigYearArea = document.getElementById("settingsBigYearArea");
const settingsBigYearAreaType = document.getElementById("settingsBigYearAreaType");
const settingsBigYearStart = document.getElementById("settingsBigYearStart");
const settingsBigYearEnd = document.getElementById("settingsBigYearEnd");
const saveBigYearSettingsButton = document.getElementById("saveBigYearSettingsButton");
const leaveBigYearButton = document.getElementById("leaveBigYearButton");
const deleteBigYearButton = document.getElementById("deleteBigYearButton");
const transferBigYearButton = document.getElementById("transferBigYearButton");
const exportObservationsButton = document.getElementById("exportObservationsButton");
const startNewBigYearButton = document.getElementById("startNewBigYearButton");
const joinAnotherBigYearButton = document.getElementById("joinAnotherBigYearButton");
const bigYearStatusBadge = document.getElementById("bigYearStatusBadge");
const bigYearConcludedCard = document.getElementById("bigYearConcludedCard");
const bigYearHistoryList = document.getElementById("bigYearHistoryList");
const bigYearRoleNote = document.getElementById("bigYearRoleNote");

function closeAppMenu() {
    if (!appMenuOverlay) return;
    appMenuOverlay.classList.remove("open");
    appMenuOverlay.setAttribute("aria-hidden", "true");
}
function openAppMenu() {
    if (!appMenuOverlay) return;
    appMenuOverlay.classList.add("open");
    appMenuOverlay.setAttribute("aria-hidden", "false");
}
function closeSecondaryScreen(screen) {
    if (!screen) return;
    screen.classList.remove("open");
    screen.setAttribute("aria-hidden", "true");
}
function openSecondaryScreen(screen) {
    if (!screen) return;
    closeAppMenu();
    clearMainNavSections();
    screen.classList.add("open");
    screen.setAttribute("aria-hidden", "false");
}
if (menuButton) menuButton.addEventListener("click", openAppMenu);
if (appMenuClose) appMenuClose.addEventListener("click", closeAppMenu);
if (appMenuOverlay) appMenuOverlay.addEventListener("click", e => { if (e.target === appMenuOverlay) closeAppMenu(); });
function getCurrentBigYearForSettings() {
    const raw = BigYearStorage.get("bigYearProject");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (error) { return null; }
}

function isCurrentUserBigYearOwner(project) {
    const account = getCurrentAccount();
    if (!project || !account) return false;
    if (project.owner && project.owner.email && account.email && project.owner.email.toLowerCase() === account.email.toLowerCase()) return true;
    return Array.isArray(project.participants) && project.participants.some(p =>
        p && p.role === "owner" && p.accountId && p.accountId === account.id
    );
}

function refreshSettingsAreaOptions(selectedArea = "") {
    if (!settingsBigYearArea || !settingsBigYearAreaType) return;
    const type = settingsBigYearAreaType.value || "country";
    const options = {
        country: ["Italia", "Slovenia", "Francia", "Spagna", "Regno Unito", "Germania"],
        ecozone: ["Paleartica", "Afrotropicale", "Indomalese", "Neartica", "Neotropicale", "Australasiana", "Oceaniana", "Antartica"],
        world: ["Mondo"]
    };
    settingsBigYearArea.innerHTML = (options[type] || options.country)
        .map(value => `<option value="${value}">${value}</option>`)
        .join("");
    if (selectedArea && (options[type] || []).includes(selectedArea)) {
        settingsBigYearArea.value = selectedArea;
    }
}

function getLocalBigYearProjects() {
    const projects = BigYearStorage.readJSON("bigYearProjects", []);
    const all = Array.isArray(projects) ? projects.filter(Boolean) : [];
    const selected = getSelectedBigYearCandidate(all);
    if (!selected) return [];
    return all.filter(project => project.id === selected.id || isBigYearConcluded(project));
}

function renderBigYearHistory() {
    if (!bigYearHistoryList) return;
    const current = getCurrentBigYearForSettings();
    const projects = getLocalBigYearProjects();
    const selectedId = current?.id || null;
    projects.sort((a, b) => {
        if (a.id === selectedId) return -1;
        if (b.id === selectedId) return 1;
        return String(b.startDate || b.createdAt || "").localeCompare(String(a.startDate || a.createdAt || ""));
    });
    bigYearHistoryList.innerHTML = "";
    projects.forEach(project => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "bigyear-history-item" + (current && current.id === project.id ? " active" : "");
        const status = getBigYearStatus(project);
        const statusText = status === "concluded" ? "Concluso" : status === "planned" ? "In programma" : "Attivo";
        item.innerHTML = `<span><strong>${window.BigYearUtils.escapeHtml(project.name || "Big Year")}</strong><small>${window.BigYearUtils.escapeHtml(project.area || "Area non specificata")} · ${formatDateForDisplay(project.startDate)} — ${formatDateForDisplay(project.endDate)}</small></span><em>${statusText}</em>`;
        item.addEventListener("click", () => {
            BigYearStorage.writeJSON("bigYearProject", project);
            populateBigYearSettings();
            updateHomeProjectInfo();
            updateHomeStatistics();
            updateHomeParticipantCount();
            renderObserverOptions();
            renderChecklist();
            renderBigYearHistory();
        });
        bigYearHistoryList.appendChild(item);
    });
}

function populateBigYearSettings() {
    const project = getCurrentBigYearForSettings();
    if (!project) return;
    settingsBigYearName.value = project.name || "";
    if (settingsBigYearAreaType) settingsBigYearAreaType.value = project.areaType || "country";
    refreshSettingsAreaOptions(project.area || "");
    settingsBigYearStart.value = project.startDate || "";
    settingsBigYearEnd.value = project.endDate || "";
    const owner = isCurrentUserBigYearOwner(project);
    const status = getBigYearStatus(project);
    const concluded = status === "concluded";
    [settingsBigYearName, settingsBigYearAreaType, settingsBigYearArea, settingsBigYearStart, settingsBigYearEnd, saveBigYearSettingsButton].forEach(el => { if (el) el.disabled = !owner; });
    if (bigYearStatusBadge) {
        bigYearStatusBadge.textContent = status === "concluded" ? "Concluso" : status === "planned" ? "In programma" : "Attivo";
        bigYearStatusBadge.dataset.status = status;
    }
    if (bigYearRoleNote) bigYearRoleNote.textContent = concluded ? (owner ? "Questo Big Year è concluso: puoi consultarlo e correggerne le impostazioni, ma non puoi aggiungere nuove osservazioni." : "Questo Big Year è concluso: puoi consultarlo, ma non puoi aggiungere nuove osservazioni.") : owner ? "Sei l’amministratore di questo Big Year." : "Puoi consultare le impostazioni, ma solo l’amministratore può modificarle.";
    if (deleteBigYearButton) deleteBigYearButton.hidden = !owner;
    if (transferBigYearButton) transferBigYearButton.hidden = !owner || concluded;
    if (leaveBigYearButton) leaveBigYearButton.hidden = concluded;
    if (bigYearConcludedCard) bigYearConcludedCard.hidden = status !== "concluded";
    if (startNewBigYearButton) startNewBigYearButton.hidden = status !== "concluded";
    if (joinAnotherBigYearButton) joinAnotherBigYearButton.hidden = status !== "concluded";
    renderBigYearHistory();
}

function openBigYearSettings() {
    populateBigYearSettings();
    openSecondaryScreen(bigYearSettingsScreen);
}

if (openBigYearButton) openBigYearButton.addEventListener("click", openBigYearSettings);
if (openGuideButton) openGuideButton.addEventListener("click", () => openSecondaryScreen(guideScreen));
if (openInfoButton) openInfoButton.addEventListener("click", () => openSecondaryScreen(infoScreen));
async function performLogout() {
    const confirmed = window.confirm("Vuoi uscire dal tuo account su questo dispositivo?");
    if (!confirmed) return;
    try {
        await BigYearAuth.signOut();
        closeAppMenu();
        closeSecondaryScreen(accountSettingsScreen);
        showScreen(welcomeScreen);
    } catch (error) {
        console.error(error);
        alert("Non è stato possibile uscire dall'account. Riprova.");
    }
}
if (logoutButton) logoutButton.addEventListener("click", performLogout);
if (choiceLogoutButton) choiceLogoutButton.addEventListener("click", performLogout);
function populateAccountSettings() {
    const account = getCurrentAccount();
    if (accountSettingsName) accountSettingsName.value = account?.name || "";
    if (accountSettingsEmail) accountSettingsEmail.value = account?.email || "";
}

function openAccountSettings() {
    populateAccountSettings();
    closeAppMenu();
    openSecondaryScreen(accountSettingsScreen);
}

if (openAccountButton) openAccountButton.addEventListener("click", openAccountSettings);
if (accountSettingsBackButton) accountSettingsBackButton.addEventListener("click", () => { closeSecondaryScreen(accountSettingsScreen); openAppMenu(); });
if (saveAccountSettingsButton) saveAccountSettingsButton.addEventListener("click", async () => {
    const name = accountSettingsName?.value.trim() || "";
    const email = accountSettingsEmail?.value.trim() || "";
    if (!name) { alert("Inserisci il nome utente."); accountSettingsName?.focus(); return; }
    if (!email) { alert("Inserisci la tua email."); accountSettingsEmail?.focus(); return; }

    saveAccountSettingsButton.disabled = true;
    const originalText = saveAccountSettingsButton.textContent;
    saveAccountSettingsButton.textContent = "Salvataggio…";
    try {
        const result = await BigYearAuth.updateAccount(name, email);
        updateMenuAccount();
        updateHomeStatistics();
        updateHomeProjectInfo();
        renderObserverOptions();
        closeSecondaryScreen(accountSettingsScreen);
        openAppMenu();
        alert(result?.emailChanged
            ? "Nome utente aggiornato. Controlla la nuova email per completare il cambio di indirizzo."
            : "Nome utente aggiornato.");
    } catch (error) {
        console.error(error);
        alert(error?.message || "Non è stato possibile aggiornare l'account.");
    } finally {
        saveAccountSettingsButton.disabled = false;
        saveAccountSettingsButton.textContent = originalText;
    }
});

if (deleteAccountButton) deleteAccountButton.addEventListener("click", async () => {
    const first = window.confirm("Eliminare definitivamente il tuo account? Verranno rimossi anche i Big Year che amministri e i relativi dati.");
    if (!first) return;
    const second = window.confirm("Conferma definitiva: vuoi davvero eliminare l'account? Questa operazione non può essere annullata.");
    if (!second) return;

    deleteAccountButton.disabled = true;
    try {
        await BigYearAuth.deleteAccount();
        closeSecondaryScreen(accountSettingsScreen);
        closeAppMenu();
        showScreen(welcomeScreen);
        alert("Account eliminato.");
    } catch (error) {
        console.error(error);
        alert(error?.message || "Non è stato possibile eliminare l'account.");
    } finally {
        deleteAccountButton.disabled = false;
    }
});

if (guideBackButton) guideBackButton.addEventListener("click", () => { closeSecondaryScreen(guideScreen); openAppMenu(); });
if (infoBackButton) infoBackButton.addEventListener("click", () => { closeSecondaryScreen(infoScreen); openAppMenu(); });
if (bigYearSettingsBackButton) bigYearSettingsBackButton.addEventListener("click", () => { closeSecondaryScreen(bigYearSettingsScreen); openAppMenu(); });
if (settingsBigYearAreaType) settingsBigYearAreaType.addEventListener("change", () => refreshSettingsAreaOptions());
if (saveBigYearSettingsButton) saveBigYearSettingsButton.addEventListener("click", () => {
    const project = getCurrentBigYearForSettings();
    if (!project || !isCurrentUserBigYearOwner(project)) return;
    const name = settingsBigYearName.value.trim();
    const area = settingsBigYearArea.value;
    const areaType = settingsBigYearAreaType ? settingsBigYearAreaType.value : (project.areaType || "country");
    const start = settingsBigYearStart.value;
    const end = settingsBigYearEnd.value;
    if (!name || !area || !start || !end) { alert("Completa tutti i campi."); return; }
    if (end < start) { alert("La data di fine non può essere precedente alla data di inizio."); return; }
    const allProjectObservations = BigYearStorage.readJSON("bigYearObservations", []);
    const beforeValid = Array.isArray(allProjectObservations) ? allProjectObservations.filter(o => o && o.projectId === project.id && o.countsInBigYear !== false && isObservationWithinBigYear(o, project)).length : 0;
    const afterValid = Array.isArray(allProjectObservations) ? allProjectObservations.filter(o => o && o.projectId === project.id && isObservationWithinBigYear(o, { startDate: start, endDate: end })).length : 0;
    if (beforeValid !== afterValid) {
        const delta = Math.abs(beforeValid - afterValid);
        const message = afterValid < beforeValid
            ? `Modificando il periodo, ${delta} ${delta === 1 ? "osservazione non rientrerà" : "osservazioni non rientreranno"} più nel Big Year e non ${delta === 1 ? "verrà conteggiata" : "verranno conteggiate"}. Le osservazioni non verranno cancellate.\n\nVuoi continuare?`
            : `Modificando il periodo, ${delta} ${delta === 1 ? "osservazione rientrerà" : "osservazioni rientreranno"} nel Big Year e ${delta === 1 ? "verrà conteggiata" : "verranno conteggiate"}.\n\nVuoi continuare?`;
        if (!window.confirm(message)) return;
    }
    project.name = name; project.area = area; project.areaType = areaType; project.startDate = start; project.endDate = end;
    if (!saveBigYearProject(project)) return;
    updateHomeProjectInfo();
    updateHomeStatistics();
    closeSecondaryScreen(bigYearSettingsScreen);
    openAppMenu();
});
function clearCurrentBigYearLocalCache(projectToRemove = null) {
    const currentProject = projectToRemove || getCurrentBigYearForSettings();
    const projectId = currentProject?.id || null;
    const history = BigYearStorage.readJSON("bigYearProjects", []);
    const remaining = Array.isArray(history)
        ? history.filter(project => !projectId || project?.id !== projectId)
        : [];
    BigYearStorage.writeJSON("bigYearProjects", remaining);

    if (currentProject && currentProject.joinCode) {
        BigYearStorage.remove("bigYearProject_" + currentProject.joinCode);
    }

    const observations = BigYearStorage.readJSON("bigYearObservations", []);
    if (projectId && Array.isArray(observations)) {
        BigYearStorage.writeJSON(
            "bigYearObservations",
            observations.filter(observation => observation?.projectId !== projectId)
        );
    }

    const nextProject = getSelectedBigYearCandidate(remaining);
    if (nextProject) {
        BigYearStorage.writeJSON("bigYearProject", nextProject);
    } else {
        BigYearStorage.remove("bigYearProject");
    }
    return nextProject;
}

async function finishBigYearExit(projectToRemove = null) {
    const nextProject = clearCurrentBigYearLocalCache(projectToRemove);
    closeSecondaryScreen(bigYearSettingsScreen);
    closeAppMenu();
    if (nextProject) {
        showScreen(null);
        updateHomeProjectInfo();
        updateHomeStatistics();
        updateHomeParticipantCount();
        renderObserverOptions();
        renderChecklist();
    } else {
        showScreen(bigyearChoiceScreen);
    }
}

if (leaveBigYearButton) leaveBigYearButton.addEventListener("click", async () => {
    const project = getCurrentBigYearForSettings();
    if (!project || !window.BigYearCloud || typeof window.BigYearCloud.leaveBigYear !== "function") return;

    if (isBigYearConcluded(project)) { alert("Questo Big Year è già concluso."); return; }
    const owner = isCurrentUserBigYearOwner(project);
    if (owner) {
        alert("Prima di uscire devi trasferire l’amministrazione a un altro partecipante.");
        return;
    }
    const message = "Vuoi uscire da questo Big Year? Le tue osservazioni già registrate non verranno cancellate.";

    if (!window.confirm(message)) return;

    leaveBigYearButton.disabled = true;
    try {
        await window.BigYearCloud.leaveBigYear(project.id);
        await finishBigYearExit();
    } catch (error) {
        console.error(error);
        alert(error && error.message ? error.message : "Non è stato possibile uscire dal Big Year.");
    } finally {
        leaveBigYearButton.disabled = false;
    }
});

if (transferBigYearButton) transferBigYearButton.addEventListener("click", async () => {
    const project = getCurrentBigYearForSettings();
    if (!project || !isCurrentUserBigYearOwner(project) || !window.BigYearCloud?.transferBigYearOwnership) return;
    const candidates = (project.participants || []).filter(p => p && p.status === "accepted" && p.accountId && p.accountId !== getCurrentAccount()?.id);
    if (!candidates.length) { alert("Non ci sono altri partecipanti accettati a cui trasferire l’amministrazione."); return; }
    const choices = candidates.map((p, i) => `${i + 1}. ${p.name || p.email || "Partecipante"}`).join("\n");
    const answer = window.prompt("A chi vuoi trasferire l’amministrazione?\n\n" + choices + "\n\nInserisci il numero del partecipante.");
    const index = Number(answer) - 1;
    if (!Number.isInteger(index) || !candidates[index]) return;
    const selected = candidates[index];
    if (!window.confirm(`Trasferire l’amministrazione a ${selected.name || selected.email}? Dopo il trasferimento non sarai più amministratore.`)) return;
    try {
        await window.BigYearCloud.transferBigYearOwnership(project.id, selected.accountId);
        project.owner = { accountId: selected.accountId, name: selected.name || "", email: selected.email || "" };
        project.participants = project.participants.map(p => p.accountId === selected.accountId ? { ...p, role: "owner" } : p.accountId === getCurrentAccount()?.id ? { ...p, role: "member" } : p);
        saveBigYearProject(project);
        populateBigYearSettings();
        alert("Amministrazione trasferita.");
    } catch (error) { console.error(error); alert(error?.message || "Non è stato possibile trasferire l’amministrazione."); }
});

if (startNewBigYearButton) startNewBigYearButton.addEventListener("click", () => {
    closeSecondaryScreen(bigYearSettingsScreen);
    setDefaultBigYearDate();
    showScreen(bigyearConfigScreen);
});

if (joinAnotherBigYearButton) joinAnotherBigYearButton.addEventListener("click", () => {
    closeSecondaryScreen(bigYearSettingsScreen);
    showScreen(joinBigYearScreen);
    if (inviteCode) { inviteCode.value = ""; updatePendingInvitationCard(); inviteCode.focus(); }
});

if (exportObservationsButton) exportObservationsButton.addEventListener("click", () => {
    const project = getCurrentBigYearForSettings();
    if (!project || typeof XLSX === "undefined") { alert("Esportazione non disponibile."); return; }
    const all = BigYearStorage.readJSON("bigYearObservations", []);
    const rows = (Array.isArray(all) ? all : []).filter(o => o && o.projectId === project.id).map(o => ({
        Data: o.date || "", Ora: o.time || "", Specie: o.species?.nomeItaliano || "", "Nome scientifico": o.species?.nomeScientifico || "",
        Osservatori: Array.isArray(o.observers) ? o.observers.join(", ") : "", Luogo: o.location?.name || "", Latitudine: o.location?.latitude ?? "", Longitudine: o.location?.longitude ?? "",
        Note: o.notes || "", "Conta nel Big Year": o.countsInBigYear !== false ? "Sì" : "No"
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Osservazioni");
    XLSX.writeFile(wb, `${(project.name || "BigYear").replace(/[^a-z0-9àèéìòù_-]+/gi, "_")}_osservazioni.xlsx`);
});

if (deleteBigYearButton) deleteBigYearButton.addEventListener("click", async () => {
    const project = getCurrentBigYearForSettings();
    if (!project || !isCurrentUserBigYearOwner(project) || !window.BigYearCloud || typeof window.BigYearCloud.deleteBigYear !== "function") return;

    const confirmed = window.confirm(
        "Eliminare il Big Year per tutti? Verranno rimossi partecipanti e osservazioni associate. Questa azione non può essere annullata."
    );
    if (!confirmed) return;
    const secondConfirm = window.confirm(
        "CONFERMA DEFINITIVA\n\nStai per eliminare definitivamente questo Big Year per tutti i partecipanti.\n\nPremi OK solo se sei assolutamente sicuro."
    );
    if (!secondConfirm) return;

    deleteBigYearButton.disabled = true;
    try {
        await window.BigYearCloud.deleteBigYear(project.id);
        await finishBigYearExit(project);
    } catch (error) {
        console.error(error);
        alert(error && error.message ? error.message : "Non è stato possibile eliminare il Big Year.");
    } finally {
        deleteBigYearButton.disabled = false;
    }
});

const startButton = document.getElementById("startButton");
const welcomeLoginButton = document.getElementById("welcomeLoginButton");
const authBackButton = document.getElementById("authBackButton");
const createAccountButton = document.getElementById("createAccountButton");
const authLoginButton = document.getElementById("authLoginButton");

const loginBackButton = document.getElementById("loginBackButton");
const loginSubmitButton = document.getElementById("loginSubmitButton");
const goToRegisterButton = document.getElementById("goToRegisterButton");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const accountName = document.getElementById("accountName");
const accountEmail = document.getElementById("accountEmail");
const accountPassword = document.getElementById("accountPassword");

const createBigYearButton = document.getElementById("createBigYearButton");
const joinBigYearButton = document.getElementById("joinBigYearButton");
const configBackButton = document.getElementById("configBackButton");
const joinBackButton = document.getElementById("joinBackButton");
const saveBigYearButton = document.getElementById("saveBigYearButton");
const sendJoinRequestButton = document.getElementById("sendJoinRequestButton");

const bigYearName = document.getElementById("bigYearName");
const bigYearStartDate = document.getElementById("bigYearStartDate");
const bigYearEndDate = document.getElementById("bigYearEndDate");
const countrySelect = document.getElementById("countrySelect");
const ecozoneSelect = document.getElementById("ecozoneSelect");
const countryAreaPanel = document.getElementById("countryAreaPanel");
const ecozoneAreaPanel = document.getElementById("ecozoneAreaPanel");
const areaChoiceCards = document.querySelectorAll(".area-choice-card");
const inviteCode = document.getElementById("inviteCode");

const pendingInvitationCard =
    document.getElementById("pendingInvitationCard");

const pendingInvitationTitle =
    document.getElementById("pendingInvitationTitle");

const pendingInvitationDetails =
    document.getElementById("pendingInvitationDetails");

const acceptPendingInvitationButton =
    document.getElementById("acceptPendingInvitationButton");



function showScreen(screen) {
    [welcomeScreen, authScreen, loginScreen, bigyearChoiceScreen, bigyearConfigScreen, joinBigYearScreen].forEach(item => {
        if (item) item.style.display = "none";
    });
    if (screen) screen.style.display = "flex";
}

function hasBigYear() {
    return !!BigYearStorage.get("bigYearProject");
}

function openAfterAuthentication() {
    if (hasBigYear()) {
        showScreen(null);
    } else {
        showScreen(bigyearChoiceScreen);
    }
}

function formatDateForDisplay(dateString) {
    if (!dateString) return "—";
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("it-IT", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function calculateEndDate() {
    if (!bigYearStartDate.value) {
        bigYearEndDate.textContent = "—";
        return;
    }
    const date = new Date(bigYearStartDate.value + "T00:00:00");
    date.setFullYear(date.getFullYear() + 1);
    date.setDate(date.getDate() - 1);
    const end =
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0");
    bigYearEndDate.dataset.value = end;
    bigYearEndDate.textContent = formatDateForDisplay(end);
}

function setDefaultBigYearDate() {
    const today = new Date();
    const value = today.toISOString().slice(0, 10);
    bigYearStartDate.value = value;
    bigYearName.value = `Big Year ${today.getFullYear()}`;
    calculateEndDate();
}

function updateAreaSelection(type) {
    AppState.selectedAreaType = type;

    areaChoiceCards.forEach(card => {
        const isSelected = card.dataset.areaType === type;
        card.classList.toggle("selected", isSelected);

        const option = card.closest(".area-choice-option");
        if (option) {
            option.classList.toggle("open", isSelected && type !== "world");
        }
    });

    countryAreaPanel.style.display = type === "country" ? "block" : "none";
    ecozoneAreaPanel.style.display = type === "ecozone" ? "block" : "none";
}

// PRIMA APERTURA
startButton.addEventListener("click", function () {
    showScreen(authScreen);
    accountName.focus();
});

welcomeLoginButton.addEventListener("click", function () {
    showScreen(loginScreen);
    loginEmail.focus();
});

// REGISTRAZIONE
authBackButton.addEventListener("click", function () {
    showScreen(welcomeScreen);
});

authLoginButton.addEventListener("click", function () {
    showScreen(loginScreen);
    loginEmail.focus();
});

createAccountButton.addEventListener("click", async function () {
    const name = accountName.value.trim();
    const email = accountEmail.value.trim();
    const password = accountPassword.value;

    if (!name) { alert("Inserisci il tuo nome."); accountName.focus(); return; }
    if (!email) { alert("Inserisci la tua email."); accountEmail.focus(); return; }
    if (!password) { alert("Inserisci una password."); accountPassword.focus(); return; }
    if (password.length < 6) { alert("La password deve contenere almeno 6 caratteri."); accountPassword.focus(); return; }

    createAccountButton.disabled = true;
    const originalText = createAccountButton.textContent;
    createAccountButton.textContent = "Creazione…";

    try {
        const result = await BigYearAuth.signUp(name, email, password);

        if (!result.session) {
            alert("Account creato. Controlla la tua email per confermare l'account, poi accedi da BigYear.");
            showScreen(loginScreen);
            loginEmail.value = email;
            loginPassword.value = "";
            loginEmail.focus();
            return;
        }

        const account = getCurrentAccount();
        console.log("Account creato:", account);
        showScreen(bigyearChoiceScreen);
    } catch (error) {
        console.error(error);
        alert(error && error.message ? error.message : "Non è stato possibile creare l'account.");
    } finally {
        createAccountButton.disabled = false;
        createAccountButton.textContent = originalText;
    }
});

// LOGIN
loginBackButton.addEventListener("click", function () {
    showScreen(welcomeScreen);
});

goToRegisterButton.addEventListener("click", function () {
    showScreen(authScreen);
    accountName.focus();
});

loginSubmitButton.addEventListener("click", async function () {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email) { alert("Inserisci la tua email."); loginEmail.focus(); return; }
    if (!password) { alert("Inserisci la tua password."); loginPassword.focus(); return; }

    loginSubmitButton.disabled = true;
    const originalText = loginSubmitButton.textContent;
    loginSubmitButton.textContent = "Accesso…";

    try {
        await BigYearAuth.signIn(email, password);
        await synchronizeAuthenticatedApp();
        console.log("Accesso effettuato:", getCurrentAccount());
        openAfterAuthentication();
    } catch (error) {
        console.error(error);
        alert(error && error.message ? error.message : "Email o password non corrette.");
    } finally {
        loginSubmitButton.disabled = false;
        loginSubmitButton.textContent = originalText;
    }
});

// SCELTA BIG YEAR

// ==========================================
// CODICE UNIVOCO BIG YEAR
// ==========================================

function generateBigYearJoinCode() {

    const alphabet =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code;

    do {

        let randomPart = "";

        for (let i = 0; i < 6; i++) {
            randomPart +=
                alphabet[
                    Math.floor(
                        Math.random() * alphabet.length
                    )
                ];
        }

        code = "BY-" + randomPart;

    } while (
        BigYearStorage.get(
            "bigYearProject_" + code
        )
    );

    return code;
}

createBigYearButton.addEventListener("click", function () {
    setDefaultBigYearDate();
    updateAreaSelection("country");
    showScreen(bigyearConfigScreen);
});

joinBigYearButton.addEventListener("click", function () {
    showScreen(joinBigYearScreen);
    updatePendingInvitationCard();
    inviteCode.focus();
});

configBackButton.addEventListener("click", function () {
    showScreen(bigyearChoiceScreen);
});

joinBackButton.addEventListener("click", function () {
    showScreen(bigyearChoiceScreen);
});

areaChoiceCards.forEach(card => {
    card.addEventListener("click", function () {
        updateAreaSelection(card.dataset.areaType);
    });
});

bigYearStartDate.addEventListener("change", calculateEndDate);

function updateHomeProjectInfo() {

    const savedProject =
        BigYearStorage.get("bigYearProject");

    if (!savedProject) {
        return;
    }

    try {

        const project =
            JSON.parse(savedProject);

        ensureBigYearJoinCode(project);

        const nameElement =
            document.getElementById(
                "homeProjectName"
            );

        const datesElement =
            document.getElementById(
                "homeProjectDates"
            );

        const areaElement =
            document.getElementById(
                "homeProjectArea"
            );

        const statusElement =
            document.getElementById(
                "homeProjectStatus"
            );

        if (nameElement) {
            nameElement.textContent =
                project.name ||
                "Big Year";
        }

        if (datesElement) {
            datesElement.textContent =
                `${formatDateForDisplay(project.startDate)} — ${formatDateForDisplay(project.endDate)}`;
        }

        if (areaElement) {
            areaElement.textContent =
                project.area ||
                "Area non specificata";
        }

        if (statusElement) {
            const status = getBigYearStatus(project);
            statusElement.textContent = status === "concluded" ? "Big Year concluso" : status === "planned" ? "Big Year in programma" : "Big Year attivo";
            statusElement.dataset.status = status;
            statusElement.hidden = false;
        }

    } catch (error) {

        console.error(
            "Errore nella lettura del Big Year:",
            error
        );
    }
}


saveBigYearButton.addEventListener("click", function () {
    const name = bigYearName.value.trim() || `Big Year ${new Date(bigYearStartDate.value).getFullYear()}`;
    const start = bigYearStartDate.value;
    const end = bigYearEndDate.dataset.value;

    if (!start || !end) {
        alert("Scegli la data di inizio del Big Year.");
        return;
    }

    let areaName;
    if (AppState.selectedAreaType === "country") areaName = countrySelect.value;
    else if (AppState.selectedAreaType === "ecozone") areaName = ecozoneSelect.value;
    else areaName = "Mondo";

    const savedAccount = BigYearStorage.get("bigYearAccount");
    const account = savedAccount
        ? JSON.parse(savedAccount)
        : null;

    const project = {
        id:
            window.BigYearCloud && window.BigYearCloud.createId
                ? window.BigYearCloud.createId()
                : (window.crypto && window.crypto.randomUUID
                    ? window.crypto.randomUUID()
                    : "by_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8)),

        joinCode:
            generateBigYearJoinCode(),

        name,
        areaType: AppState.selectedAreaType,
        area: areaName,
        startDate: start,
        endDate: end,

                owner: account
            ? {
                name: account.name,
                email: account.email
            }
            : null,

        participants: [
            {
                id: "participant_owner",
                name: account ? account.name : "Tu",
                email: account ? account.email : "",
                accountId: account ? account.id : "",
                status: "accepted",
                role: "owner"
            }
        ],

        createdAt:
            new Date().toISOString()
    };

    if (!saveBigYearProject(project)) {
        return;
    }

    console.log("Big Year creato:", project);

    showScreen(null);
    updateHomeProjectInfo();
    updateHomeStatistics();
    updateHomeProjectInfo();
});


// ==========================================

function ensureLocalAccountId(account) {

    if (!account) {
        return null;
    }

    if (!account.id) {

        account.id =
            "user_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .slice(2, 8);

        BigYearStorage.set(
            "bigYearAccount",
            JSON.stringify(account)
        );
    }

    return account;
}

function getCurrentAccount() {

    const raw =
        BigYearStorage.get("bigYearAccount");

    if (!raw) {
        return null;
    }

    try {
        return ensureLocalAccountId(
            JSON.parse(raw)
        );
    } catch (error) {
        return null;
    }
}

// ==========================================
// SALVA IL BIG YEAR E IL REGISTRO DEL CODICE
// ==========================================

function saveBigYearProject(project) {

    if (!project) {
        return false;
    }

    const history = BigYearStorage.readJSON("bigYearProjects", []);
    const anotherCurrent = Array.isArray(history) && isBigYearCurrent(project) && history.some(item => item && item.id !== project.id && isBigYearCurrent(item));
    if (anotherCurrent) {
        alert("Hai già un Big Year in programma o attivo. Concludilo prima di iniziarne un altro.");
        return false;
    }

    BigYearStorage.set(
        "bigYearProject",
        JSON.stringify(project)
    );
    const projectHistory = BigYearStorage.readJSON("bigYearProjects", []);
    const normalizedHistory = Array.isArray(projectHistory) ? projectHistory.filter(p => p && p.id !== project.id) : [];
    normalizedHistory.push(project);
    BigYearStorage.writeJSON("bigYearProjects", normalizedHistory);

    if (project.joinCode) {
        BigYearStorage.set(
            "bigYearProject_" + project.joinCode,
            JSON.stringify({
                projectId: project.id,
                project: project
            })
        );
    }

    if (window.BigYearCloud && window.BigYearAuth && BigYearAuth.isAuthenticated()) {
        window.BigYearCloud.pushProject(project).catch(function (error) {
            console.error("BigYear: impossibile sincronizzare il Big Year online.", error);
        });
    }
    return true;
}

// ==========================================

function ensureBigYearJoinCode(project) {

    if (!project) {
        return null;
    }

    if (!project.joinCode) {
        project.joinCode =
            generateBigYearJoinCode();
    }

    saveBigYearProject(project);

    return project.joinCode;
}

function updateBigYearJoinCodeDisplay() {

    const display =
        document.getElementById(
            "bigYearJoinCodeDisplay"
        );

    const value =
        document.getElementById(
            "bigYearJoinCodeValue"
        );

    const project =
        getCurrentBigYearProject();

    if (!display || !value || !project) {
        return;
    }

    const code =
        ensureBigYearJoinCode(project);

    if (!code) {
        display.style.display = "none";
        return;
    }

    value.textContent = code;
    display.style.display = "flex";
}


function updateParticipantInviteCode() {

    const codeElement =
        document.getElementById(
            "participantInviteCode"
        );

    const project =
        getCurrentBigYearProject();

    if (!codeElement || !project) {
        return;
    }

    const code =
        ensureBigYearJoinCode(project);

    if (code) {
        codeElement.textContent = code;
    }
}

const copyParticipantInviteCode =
    document.getElementById(
        "copyParticipantInviteCode"
    );

if (copyParticipantInviteCode) {
    copyParticipantInviteCode.addEventListener(
        "click",
        async function () {

            const project =
                getCurrentBigYearProject();

            if (!project) {
                return;
            }

            const code =
                ensureBigYearJoinCode(project);

            if (!code) {
                return;
            }

            try {
                await navigator.clipboard.writeText(code);

                const originalText =
                    copyParticipantInviteCode.textContent;

                copyParticipantInviteCode.textContent =
                    "Copiato";

                setTimeout(
                    function () {
                        copyParticipantInviteCode.textContent =
                            originalText;
                    },
                    1400
                );

            } catch (error) {

                // Fallback for browsers where clipboard
                // access is unavailable.
                window.prompt(
                    "Copia questo codice:",
                    code
                );
            }
        }
    );
}

// ==========================================
// INVITO: CERCA E ACCETTA
// ==========================================

function normalizeInviteCode(value) {

    return value
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");
}

function getPendingInvitationByCode(code) {

    const normalizedCode =
        normalizeInviteCode(code);

    if (!normalizedCode) {
        return null;
    }

    const projectRef =
        BigYearStorage.get(
            "bigYearProject_" + normalizedCode
        );

    if (!projectRef) {
        return null;
    }

    let reference;

    try {
        reference =
            JSON.parse(projectRef);
    } catch (error) {
        return null;
    }

    // Il codice identifica il Big Year.
    // Il progetto completo viene dal registro locale del codice;
    // se il registro è ancora nel vecchio formato, usiamo il Big Year corrente.
    const project =
        reference.project ||
        getCurrentBigYearProject();

    if (
        !project ||
        project.id !== reference.projectId ||
        !Array.isArray(project.participants)
    ) {
        return null;
    }

    const account =
        getCurrentAccount();

    if (!account) {
        return null;
    }

    const accountEmail =
        account.email
            ? account.email.trim().toLowerCase()
            : "";

    const invitation =
        project.participants.find(
            participant => {

                if (
                    participant.status !== "pending" ||
                    !participant.email
                ) {
                    return false;
                }

                const invitedEmail =
                    participant.email
                        .trim()
                        .toLowerCase();

                const invitedAccountId =
                    participant.invitedAccountId
                        ? participant.invitedAccountId
                        : "";

                return (
                    (
                        invitedAccountId &&
                        account.id &&
                        invitedAccountId === account.id
                    )
                    ||
                    (
                        invitedEmail &&
                        invitedEmail === accountEmail
                    )
                );
            }
        );

    if (!invitation) {
        return null;
    }

    return {
        project,
        invitation
    };
}


function updatePendingInvitationCard() {

    if (!pendingInvitationCard) {
        return;
    }

    const code = inviteCode ? inviteCode.value : "";
    const result = code ? getPendingInvitationByCode(code) : null;

    if (result) {
        pendingInvitationCard.style.display = "flex";
        if (sendJoinRequestButton) {
            sendJoinRequestButton.dataset.invitationFound = "true";
            sendJoinRequestButton.disabled = false;
        }
        if (pendingInvitationTitle) {
            pendingInvitationTitle.textContent =
                `Invito a partecipare a "${result.project.name}"`;
        }
        if (pendingInvitationDetails) {
            pendingInvitationDetails.textContent =
                `${result.project.area} · ${formatDateForDisplay(result.project.startDate)} — ${formatDateForDisplay(result.project.endDate)}`;
        }
        return;
    }

    pendingInvitationCard.style.display = "none";

    if (sendJoinRequestButton) {
        sendJoinRequestButton.dataset.invitationFound = "false";
        sendJoinRequestButton.disabled = !normalizeInviteCode(code);
    }

    // In Step 46 the invitation can also live online. The RPC only
    // reveals a matching invitation for the authenticated account.
    if (
        normalizeInviteCode(code) &&
        window.BigYearCloud &&
        window.BigYearAuth &&
        BigYearAuth.isAuthenticated()
    ) {
        const requestedCode = normalizeInviteCode(code);

        window.BigYearCloud.getInvitation(requestedCode)
            .then(function (remoteInvitation) {
                if (!inviteCode || normalizeInviteCode(inviteCode.value) !== requestedCode) {
                    return;
                }

                if (!remoteInvitation) {
                    return;
                }

                pendingInvitationCard.style.display = "flex";
                if (sendJoinRequestButton) {
                    sendJoinRequestButton.dataset.invitationFound = "true";
                    sendJoinRequestButton.disabled = false;
                }
                if (pendingInvitationTitle) {
                    pendingInvitationTitle.textContent =
                        `Invito a partecipare a "${remoteInvitation.name}"`;
                }
                if (pendingInvitationDetails) {
                    pendingInvitationDetails.textContent =
                        `${remoteInvitation.area} · ${formatDateForDisplay(remoteInvitation.start_date)} — ${formatDateForDisplay(remoteInvitation.end_date)}`;
                }
            })
            .catch(function (error) {
                console.warn("BigYear: impossibile verificare l'invito online.", error);
            });
    }
}


if (inviteCode) {
    inviteCode.addEventListener("input", updatePendingInvitationCard);
}


if (sendJoinRequestButton) {
    sendJoinRequestButton.addEventListener("click", async function () {

        const code = normalizeInviteCode(inviteCode.value);

        if (!code) {
            alert("Inserisci il codice del Big Year.");
            inviteCode.focus();
            return;
        }

        const localResult = getPendingInvitationByCode(code);

        // Online invitation: accept through the protected RPC.
        if (!localResult && window.BigYearCloud && BigYearAuth.isAuthenticated()) {
            sendJoinRequestButton.disabled = true;
            const originalText = sendJoinRequestButton.textContent;
            sendJoinRequestButton.textContent = "Verifica…";

            try {
                const accepted = await window.BigYearCloud.acceptInvitation(code);
                await synchronizeAuthenticatedApp();

                pendingInvitationCard.style.display = "none";
                sendJoinRequestButton.dataset.invitationFound = "false";
                sendJoinRequestButton.textContent = originalText;
                sendJoinRequestButton.disabled = false;

                alert(`Hai accettato l'invito a "${accepted.name}".`);
                showScreen(null);
                updateHomeProjectInfo();
                updateHomeStatistics();
                updateHomeParticipantCount();
                renderObserverOptions();
                return;
            } catch (error) {
                console.error(error);
                alert(error && error.message
                    ? error.message
                    : "Codice non valido oppure non hai un invito per questo Big Year.");
                sendJoinRequestButton.textContent = originalText;
                sendJoinRequestButton.disabled = false;
                return;
            }
        }

        if (!localResult) {
            alert("Codice non valido oppure non hai un invito per questo Big Year.");
            pendingInvitationCard.style.display = "none";
            return;
        }

        const account = getCurrentAccount();
        if (!account) {
            alert("Devi prima accedere al tuo account.");
            return;
        }

        localResult.invitation.status = "accepted";
        localResult.invitation.acceptedAt = new Date().toISOString();
        localResult.invitation.acceptedByAccountId = account.id;
        localResult.invitation.accountId = account.id;
        localResult.invitation.invitedAccountId = account.id;
        localResult.invitation.name = account.name || localResult.invitation.name || localResult.invitation.email.split("@")[0];
        localResult.invitation.email = account.email || localResult.invitation.email;
        saveBigYearProject(localResult.project);

        pendingInvitationCard.style.display = "none";
        sendJoinRequestButton.dataset.invitationFound = "false";
        alert(`Hai accettato l'invito a "${localResult.project.name}".`);
        showScreen(null);
        updateHomeProjectInfo();
        updateHomeStatistics();
        updateHomeParticipantCount();
        renderObserverOptions();
    });
}


// ==========================================
// NAVIGAZIONE PRINCIPALE — MAPPA / AMICI
// ==========================================

const mapNavButton = document.getElementById("mapNavButton");
const friendsNavButton = document.getElementById("friendsNavButton");
const observationsMapSection = document.getElementById("observationsMapSection");
const friendsSection = document.getElementById("friendsSection");
const observationsMapElement = document.getElementById("observationsMap");
const observationsMapCount = document.getElementById("observationsMapCount");
const observationsMapEmpty = document.getElementById("observationsMapEmpty");
const observationMapListOverlay = document.getElementById("observationMapListOverlay");
const observationMapList = document.getElementById("observationMapList");
const observationMapListTitle = document.getElementById("observationMapListTitle");
const closeObservationMapListButton = document.getElementById("closeObservationMapListButton");

function clearMainNavSections() {
    if (homeContent) homeContent.classList.remove("checklist-hidden");
    if (checklistScreen) checklistScreen.classList.remove("open");
    if (observationsMapSection) observationsMapSection.classList.remove("active");
    if (friendsSection) friendsSection.classList.remove("active");
    if (observationModal) observationModal.classList.remove("open", "editing");
    if (homeButton) homeButton.classList.remove("active");
    if (checklistButton) checklistButton.classList.remove("active");
    if (addObservationButton) addObservationButton.classList.remove("active");
    if (mapNavButton) mapNavButton.classList.remove("active");
    if (friendsNavButton) friendsNavButton.classList.remove("active");
}

function showMainNavSection(section) {
    clearMainNavSections();
    section.classList.add("active");
}

if (mapNavButton) {
    mapNavButton.addEventListener("click", function () {
        showMainNavSection(observationsMapSection);
        mapNavButton.classList.add("active");
        renderObservationMap();
    });
}

function distanceMeters(lat1, lon1, lat2, lon2) {
    const earthRadius = 6371000;
    const toRad = value => value * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

function clusterMapObservations(observations, radius = 50) {
    const clusters = [];
    observations.forEach(observation => {
        const lat = Number(observation?.location?.latitude);
        const lon = Number(observation?.location?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

        let target = clusters.find(cluster => distanceMeters(
            cluster.latitude, cluster.longitude, lat, lon
        ) <= radius);

        if (!target) {
            target = { latitude: lat, longitude: lon, observations: [] };
            clusters.push(target);
        }

        target.observations.push(observation);
        const n = target.observations.length;
        target.latitude = ((target.latitude * (n - 1)) + lat) / n;
        target.longitude = ((target.longitude * (n - 1)) + lon) / n;
    });
    return clusters;
}


function openObservationMapList(cluster) {
    if (!observationMapListOverlay || !observationMapList) return;
    const firstName = cluster.observations[0]?.location?.name || "Posizione";
    observationMapListTitle.textContent = firstName;
    const project = getCurrentBigYearProject();
    observationMapList.innerHTML = cluster.observations
        .slice()
        .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
        .map(observation => {
            const species = observation.species || {};
            const observerNames = getObservationObserverKeys(observation, project)
                .map(key => getObserverNameByKey(project, key))
                .filter(Boolean)
                .filter((name, index, array) => array.indexOf(name) === index);
            const observers = observerNames.length
                ? ` · ${observerNames.join(", ")}`
                : "";
            return `
                <div class="observation-map-list-item">
                    <div>
                        <strong>${window.BigYearUtils.escapeHtml(species.nomeItaliano || "Specie non indicata")}</strong>
                        <span>${window.BigYearUtils.escapeHtml(species.nomeScientifico || "")}</span>
                    </div>
                    <small>${window.BigYearUtils.escapeHtml(formatObservationDateTime(observation))}${window.BigYearUtils.escapeHtml(observers)}</small>
                </div>`;
        }).join("");
    observationMapListOverlay.classList.add("open");
    observationMapListOverlay.setAttribute("aria-hidden", "false");
}

function renderObservationMap() {
    if (!observationsMapElement || typeof L === "undefined") return;
    const observations = getSavedObservations();
    const geolocated = observations.filter(o =>
        Number.isFinite(Number(o?.location?.latitude)) &&
        Number.isFinite(Number(o?.location?.longitude))
    );
    const clusters = clusterMapObservations(geolocated, 50);
    if (observationsMapCount) observationsMapCount.textContent = geolocated.length;
    if (observationsMapEmpty) observationsMapEmpty.hidden = geolocated.length > 0;

    if (!AppState.observationsMap) {
        AppState.observationsMap = L.map(observationsMapElement, { zoomControl: true });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(AppState.observationsMap);
        AppState.observationsMapLayer = L.layerGroup().addTo(AppState.observationsMap);
    }

    AppState.observationsMapLayer.clearLayers();

    if (!clusters.length) {
        AppState.observationsMap.setView([42.5, 12.5], 6);
        setTimeout(() => AppState.observationsMap.invalidateSize(), 50);
        return;
    }

    const bounds = [];
    clusters.forEach(cluster => {
        const count = cluster.observations.length;
        const icon = L.divIcon({
            className: "observation-map-marker-wrapper",
            html: `<div class="observation-map-marker ${count > 1 ? "cluster" : "single"}"><img src="assets/pin.png" alt=""><span>${count}</span></div>`,
            iconSize: [46, 52],
            iconAnchor: [23, 46]
        });
        const marker = L.marker([cluster.latitude, cluster.longitude], { icon });
        marker.on("click", () => openObservationMapList(cluster));
        marker.addTo(AppState.observationsMapLayer);
        bounds.push([cluster.latitude, cluster.longitude]);
    });
    AppState.observationsMap.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
    setTimeout(() => AppState.observationsMap.invalidateSize(), 50);
}

if (closeObservationMapListButton) {
    closeObservationMapListButton.addEventListener("click", function () {
        observationMapListOverlay.classList.remove("open");
        observationMapListOverlay.setAttribute("aria-hidden", "true");
    });
}



// ==========================================
// AMICI - FEATURE MODULE
// ==========================================

BigYearFriends.init({
    getCurrentBigYearProject,
    getCurrentAccount,
    getSavedObservations,
    getParticipantIdentity,
    speciesDatabase: AppState.speciesDatabase,
    utils: BigYearUtils
});

if (friendsNavButton) {
    friendsNavButton.addEventListener("click", function () {
        showMainNavSection(friendsSection);
        friendsNavButton.classList.add("active");
        BigYearFriends.renderFriendsSection();
    });
}



// ==========================================
// AUTENTICAZIONE + SINCRONIZZAZIONE ONLINE
// ==========================================

async function synchronizeAuthenticatedApp() {
    if (!window.BigYearCloud || !BigYearAuth.isAuthenticated()) {
        return null;
    }

    try {
        const result = await window.BigYearCloud.syncFromCloud();

        if (result && result.project) {
            updateHomeProjectInfo();
            updateHomeStatistics();
            updateHomeParticipantCount();
            renderObserverOptions();
            updateParticipantInviteCode();
        }

        return result;
    } catch (error) {
        console.error("BigYear: sincronizzazione online non riuscita.", error);
        return null;
    }
}

function updateMenuAccount() {
    if (!menuAccountEmail) return;
    const account = getCurrentAccount();
    menuAccountEmail.textContent = account && account.email
        ? account.email
        : "—";
}

window.addEventListener("bigyear:auth", async function (event) {
    const detail = event.detail || {};

    if (detail.user) {
        updateMenuAccount();
        const result = await synchronizeAuthenticatedApp();

        if (detail.event === "SIGNED_IN" || detail.event === "INITIAL_SESSION") {
            if (result && result.project) {
                showScreen(null);
                updateHomeProjectInfo();
                updateHomeStatistics();
                updateHomeParticipantCount();
                renderObserverOptions();
            } else {
                openAfterAuthentication();
            }
        }
    } else if (detail.event === "SIGNED_OUT") {
        updateMenuAccount();
        showScreen(welcomeScreen);
    }
});

(async function initializeBigYearAuthentication() {
    await BigYearAuth.init();
    updateMenuAccount();

    if (BigYearAuth.isAuthenticated()) {
        const result = await synchronizeAuthenticatedApp();
        if (result && result.project) {
            showScreen(null);
            updateHomeProjectInfo();
            updateHomeStatistics();
            updateHomeParticipantCount();
            renderObserverOptions();
            updateParticipantInviteCode();
        } else {
            openAfterAuthentication();
        }
    } else {
        showScreen(welcomeScreen);
    }
})();
