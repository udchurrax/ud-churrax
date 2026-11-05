const scheduleContainer = document.querySelector("#fixture-calendar");
const scheduleRoundSelect = document.querySelector("#schedule-round-select");
const scheduleChurraxOnly = document.querySelector("#schedule-churrax-only");
const scheduleRounds = window.CHURRAX_SCHEDULE;
const scheduleResults = Array.isArray(window.CHURRAX_RESULTS) ? window.CHURRAX_RESULTS : [];
const monthNames = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

function formatFixtureDate(date) {
    const [year, month, day] = date.split("-");
    return `${day} ${monthNames[Number(month) - 1]} ${year}`;
}

function getFixtureResult(round, home, away) {
    return scheduleResults.find((result) =>
        result.round === round && result.home === home && result.away === away
    );
}

function createFixture(match, round) {
    const [home, away, date, time, weekday, venue] = match;
    const isChurraxMatch = home === "UD CHURRAX" || away === "UD CHURRAX";
    const result = getFixtureResult(round, home, away);
    const fixture = document.createElement("article");
    fixture.className = "schedule-fixture";

    if (isChurraxMatch) {
        fixture.classList.add("schedule-fixture-churrax");
        fixture.id = `partido-ud-churrax-jornada-${round}`;
    }

    const dateBlock = document.createElement("div");
    dateBlock.className = "schedule-date";
    const weekdayText = document.createElement("span");
    weekdayText.textContent = weekday.toUpperCase();
    const dateText = document.createElement("strong");
    dateText.textContent = formatFixtureDate(date);
    const timeText = document.createElement("span");
    timeText.textContent = time;
    dateBlock.append(weekdayText, dateText, timeText);

    const teams = document.createElement("div");
    teams.className = "schedule-teams";
    const homeTeam = document.createElement("strong");
    homeTeam.textContent = home;
    const versus = document.createElement("span");
    versus.textContent = "VS";
    const awayTeam = document.createElement("strong");
    awayTeam.textContent = away;
    if (home === "UD CHURRAX") {
        homeTeam.className = "schedule-churrax-name";
    }
    if (away === "UD CHURRAX") {
        awayTeam.className = "schedule-churrax-name";
    }
    teams.append(homeTeam, versus, awayTeam);

    const venueText = document.createElement("p");
    venueText.className = "schedule-venue";
    venueText.textContent = venue;

    const resultText = document.createElement("p");
    resultText.className = result ? "schedule-result" : "schedule-result schedule-result-pending";
    resultText.textContent = result
        ? `${result.homeScore} – ${result.awayScore}`
        : "Por disputar";
    resultText.setAttribute("aria-label", result
        ? `Resultado: ${result.homeScore} a ${result.awayScore}`
        : "Partido por disputar");

    fixture.append(dateBlock, teams, venueText, resultText);
    if (isChurraxMatch) {
        const detailLink = document.createElement("a");
        detailLink.className = "schedule-detail-link";
        detailLink.href = `ficha-partido.html?jornada=${round}`;
        detailLink.textContent = "Ficha del partido ↗";
        fixture.append(detailLink);
    }
    return fixture;
}

function populateScheduleRoundSelect() {
    if (!scheduleRoundSelect) {
        return;
    }

    scheduleRounds.forEach((round) => {
        const option = document.createElement("option");
        option.value = String(round.round);
        option.textContent = `Jornada ${String(round.round).padStart(2, "0")}`;
        scheduleRoundSelect.append(option);
    });
}

function renderSchedule() {
    if (!scheduleContainer) {
        return;
    }

    if (!Array.isArray(scheduleRounds)) {
        console.error("No se pudo cargar el calendario de UD Churrax.");
        scheduleContainer.textContent = "No se pudo cargar el calendario. Recarga la página o consulta el archivo schedule-data.js.";
        return;
    }

    scheduleContainer.replaceChildren();
    const selectedRound = scheduleRoundSelect?.value || "all";
    const churraxOnly = scheduleChurraxOnly?.checked || false;
    const filteredRounds = scheduleRounds
        .filter((round) => selectedRound === "all" || round.round === Number(selectedRound))
        .map((round) => ({
            ...round,
            matches: round.matches.filter((match) =>
                !churraxOnly || match[0] === "UD CHURRAX" || match[1] === "UD CHURRAX"
            )
        }))
        .filter((round) => round.matches.length > 0);

    if (filteredRounds.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "schedule-empty";
        emptyMessage.textContent = "No hay partidos que coincidan con los filtros seleccionados.";
        scheduleContainer.append(emptyMessage);
        return;
    }

    ["1.ª VUELTA", "2.ª VUELTA"].forEach((leg) => {
        const legRounds = filteredRounds.filter((round) => round.leg === leg);
        if (legRounds.length === 0) {
            return;
        }

        const legSection = document.createElement("section");
        legSection.className = "fixture-leg";

        const heading = document.createElement("h3");
        heading.className = "fixture-leg-title";
        heading.textContent = leg;
        legSection.append(heading);

        legRounds.forEach((round) => {
            const details = document.createElement("details");
            details.className = "fixture-round";
            details.id = `jornada-${round.round}`;
            details.open = selectedRound !== "all" || round.round === 1;

            const summary = document.createElement("summary");
            const roundName = document.createElement("strong");
            roundName.textContent = `JORNADA ${String(round.round).padStart(2, "0")}`;
            const matchCount = document.createElement("span");
            matchCount.textContent = `${round.matches.length} ${round.matches.length === 1 ? "PARTIDO" : "PARTIDOS"}`;
            summary.append(roundName, matchCount);

            const matchList = document.createElement("div");
            matchList.className = "schedule-match-list";
            round.matches.forEach((match) => matchList.append(createFixture(match, round.round)));
            details.append(summary, matchList);
            legSection.append(details);
        });

        scheduleContainer.append(legSection);
    });
}

if (Array.isArray(scheduleRounds)) {
    populateScheduleRoundSelect();
}
scheduleRoundSelect?.addEventListener("change", renderSchedule);
scheduleChurraxOnly?.addEventListener("change", renderSchedule);
renderSchedule();
