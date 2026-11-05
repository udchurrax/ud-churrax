const competitionConfig = {
    league: "Primera División · IMD Sevilla",
    season: "2026/27",
    division: "Primera División"
};
const competitionSchedule = window.CHURRAX_SCHEDULE;
const competitionStandings = window.CHURRAX_STANDINGS;
const competitionResults = window.CHURRAX_RESULTS;
const clubName = "UD CHURRAX";
const monthNamesLong = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

function createSummaryElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) {
        element.className = className;
    }
    if (text !== undefined) {
        element.textContent = text;
    }
    return element;
}

function flattenSchedule() {
    if (!Array.isArray(competitionSchedule)) {
        return [];
    }
    return competitionSchedule.flatMap((round) =>
        round.matches.map((match, index) => ({
            round: round.round,
            leg: round.leg,
            home: match[0],
            away: match[1],
            date: match[2],
            time: match[3],
            weekday: match[4],
            venue: match[5],
            fixtureIndex: index
        }))
    );
}

function matchFixture(result, fixtures) {
    return fixtures.find((fixture) =>
        fixture.round === result.round &&
        fixture.home === result.home &&
        fixture.away === result.away
    );
}

function resultFixtureId(result, fixture, resultIndex) {
    const fixtureIndex = fixture ? fixture.fixtureIndex : resultIndex;
    return `ficha-jornada-${result.round}-partido-${fixtureIndex + 1}`;
}

function findTeam(teamName) {
    return Array.isArray(competitionStandings)
        ? competitionStandings.find((team) => team.name === teamName)
        : undefined;
}

function createTeamCrest(teamName, imagePath) {
    const crest = createSummaryElement("span", "summary-team-crest");
    const initials = teamName.split(/\s+/)
        .filter((part) => !["CD", "CF", "C.F.", "UD", "FC", "F.C.", "DE", "DEL"].includes(part.toUpperCase()))
        .slice(0, 2)
        .map((part) => part[0])
        .join("");
    const fallback = createSummaryElement("span", "summary-team-crest-fallback", initials);
    fallback.setAttribute("aria-hidden", "true");
    crest.append(fallback);

    if (imagePath) {
        const image = createSummaryElement("img", "summary-team-crest-image");
        image.src = imagePath;
        image.alt = "";
        image.addEventListener("load", () => fallback.remove(), { once: true });
        image.addEventListener("error", () => {
            console.error(`No se pudo cargar el escudo de "${teamName}": ${imagePath}`);
            image.remove();
        }, { once: true });
        crest.append(image);
    }

    crest.setAttribute("aria-label", teamName);
    return crest;
}

function matchDateTime(fixture) {
    return new Date(`${fixture.date}T${fixture.time}:00`);
}

function formatLongDate(date) {
    return new Intl.DateTimeFormat("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(date);
}

function renderCompetitionFacts(results) {
    const container = document.querySelector("#competition-facts");
    if (!container) {
        return;
    }

    const rounds = Array.isArray(competitionSchedule) ? competitionSchedule : [];
    const resultKeys = new Set(results.map((result) => `${result.round}|${result.home}|${result.away}`));
    const disputedRounds = rounds.filter((round) =>
        round.matches.some((match) =>
            resultKeys.has(`${round.round}|${match[0]}|${match[1]}`)
        )
    ).length;
    const facts = [
        ["LIGA", competitionConfig.league],
        ["TEMPORADA", competitionConfig.season],
        ["DIVISIÓN", competitionConfig.division],
        ["EQUIPOS", String(Array.isArray(competitionStandings) ? competitionStandings.length : 0)],
        ["JORNADAS DISPUTADAS", String(disputedRounds)],
        ["JORNADAS PENDIENTES", String(Math.max(0, rounds.length - disputedRounds))]
    ];

    facts.forEach(([label, value]) => {
        const fact = createSummaryElement("article", "competition-fact");
        fact.append(createSummaryElement("span", "", label), createSummaryElement("strong", "", value));
        container.append(fact);
    });
}

function renderLastChurraxMatch(results, fixtures) {
    const container = document.querySelector("#last-churrax-match");
    if (!container) {
        return;
    }

    const latestResult = results
        .filter((result) => result.home === clubName || result.away === clubName)
        .map((result, index) => ({
            result,
            fixture: matchFixture(result, fixtures),
            index
        }))
        .sort((a, b) => {
            const aDate = a.result.playedOn || a.fixture?.date || "";
            const bDate = b.result.playedOn || b.fixture?.date || "";
            return bDate.localeCompare(aDate) || b.result.round - a.result.round;
        })[0];

    if (!latestResult) {
        const match = createSummaryElement("div", "summary-last-match");
        const teams = createSummaryElement("div", "summary-result-teams");
        const churrax = createSummaryElement("div", "summary-result-team");
        churrax.append(createTeamCrest(clubName, findTeam(clubName)?.image), createSummaryElement("span", "", clubName));
        const opponent = createSummaryElement("div", "summary-result-team");
        opponent.append(
            createTeamCrest("RIVAL POR CONFIRMAR", ""),
            createSummaryElement("span", "", "RIVAL POR CONFIRMAR")
        );
        teams.append(churrax, createSummaryElement("strong", "summary-score", "—"), opponent);
        const link = createSummaryElement("a", "dashboard-more-link", "La ficha aparecerá tras el primer partido ↗");
        link.href = "#resultados";
        match.append(
            teams,
            createSummaryElement("p", "summary-match-meta", "Fecha pendiente · Jornada pendiente"),
            createSummaryElement("p", "summary-empty-copy", "Aún no se ha disputado ningún partido."),
            link
        );
        container.append(match);
        return;
    }

    const { result, fixture, index } = latestResult;
    const opponent = result.home === clubName ? result.away : result.home;
    const match = createSummaryElement("div", "summary-last-match");
    const teams = createSummaryElement("div", "summary-result-teams");
    const home = createSummaryElement("div", "summary-result-team");
    home.append(createTeamCrest(result.home, findTeam(result.home)?.image), createSummaryElement("span", "", result.home));
    const away = createSummaryElement("div", "summary-result-team");
    away.append(createTeamCrest(result.away, findTeam(result.away)?.image), createSummaryElement("span", "", result.away));
    teams.append(home, createSummaryElement("strong", "summary-score", `${result.homeScore} – ${result.awayScore}`), away);
    const date = result.playedOn || fixture?.date;
    match.append(
        teams,
        createSummaryElement("p", "summary-match-meta", `JORNADA ${result.round} · ${date ? formatLongDate(new Date(`${date}T12:00:00`)) : "Fecha pendiente"}`),
        createSummaryElement("p", "summary-match-meta", fixture?.venue || "Campo pendiente")
    );
    const link = createSummaryElement("a", "dashboard-more-link", "Acceder a la ficha del partido ↗");
    link.href = `ficha-partido.html?jornada=${result.round}`;
    match.append(link);
    container.append(match);
}

function formatCountdown(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

function renderNextChurraxMatch(fixtures) {
    const container = document.querySelector("#next-churrax-match");
    if (!container) {
        return;
    }

    const nextMatch = fixtures
        .filter((fixture) =>
            (fixture.home === clubName || fixture.away === clubName) &&
            matchDateTime(fixture).getTime() > Date.now()
        )
        .sort((a, b) => matchDateTime(a) - matchDateTime(b))[0];

    if (!nextMatch) {
        container.append(createSummaryElement("p", "summary-empty-copy", "No hay próximos partidos programados."));
        return;
    }

    const opponent = nextMatch.home === clubName ? nextMatch.away : nextMatch.home;
    const match = createSummaryElement("div", "summary-next-match");
    const teams = createSummaryElement("div", "summary-next-teams");
    teams.append(
        createTeamCrest(clubName, findTeam(clubName)?.image),
        createSummaryElement("strong", "", `UD CHURRAX vs ${opponent}`),
        createTeamCrest(opponent, findTeam(opponent)?.image)
    );
    const countdown = createSummaryElement("strong", "summary-countdown");
    countdown.setAttribute("aria-live", "off");
    const kickoff = matchDateTime(nextMatch);
    const updateCountdown = () => {
        const remaining = kickoff.getTime() - Date.now();
        countdown.textContent = remaining > 0
            ? formatCountdown(remaining)
            : "Partido en juego o finalizado";
    };

    match.append(
        teams,
        createSummaryElement("p", "summary-match-meta", `JORNADA ${nextMatch.round} · ${formatLongDate(kickoff)} · ${nextMatch.time}`),
        createSummaryElement("p", "summary-match-meta", nextMatch.venue),
        createSummaryElement("span", "summary-countdown-label", "CUENTA ATRÁS"),
        countdown
    );
    container.append(match);
    updateCountdown();
    window.setInterval(updateCountdown, 1000);
}

function rankSlice() {
    if (!Array.isArray(competitionStandings) || competitionStandings.length === 0) {
        return [];
    }
    const clubIndex = competitionStandings.findIndex((team) => team.name === clubName);
    if (clubIndex < 0) {
        return [];
    }
    if (clubIndex <= 2) {
        return competitionStandings.slice(0, Math.min(5, competitionStandings.length))
            .map((team, index) => ({ team, position: index + 1 }));
    }
    if (clubIndex >= competitionStandings.length - 3) {
        const start = Math.max(0, competitionStandings.length - 5);
        return competitionStandings.slice(start)
            .map((team, index) => ({ team, position: start + index + 1 }));
    }
    const start = clubIndex - 2;
    return competitionStandings.slice(start, clubIndex + 3)
        .map((team, index) => ({ team, position: start + index + 1 }));
}

function renderNearbyStandings() {
    const container = document.querySelector("#nearby-standings");
    if (!container) {
        return;
    }

    const teams = rankSlice();
    if (teams.length === 0) {
        container.append(createSummaryElement("p", "summary-empty-copy", "La clasificación todavía no está disponible."));
        return;
    }

    const table = createSummaryElement("table", "nearby-standings-table");
    table.setAttribute("aria-label", "Clasificación resumida alrededor de UD Churrax");
    const body = document.createElement("tbody");
    teams.forEach(({ team, position }) => {
        const row = document.createElement("tr");
        if (team.name === clubName) {
            row.className = "nearby-standings-churrax";
        }
        const place = createSummaryElement("td", "nearby-position", String(position));
        const name = document.createElement("th");
        name.scope = "row";
        const teamCell = createSummaryElement("span", "nearby-team");
        teamCell.append(createTeamCrest(team.name, team.image), createSummaryElement("span", "", team.name));
        name.append(teamCell);
        row.append(place, name, createSummaryElement("td", "nearby-points", String(team.points)));
        body.append(row);
    });
    table.append(body);
    container.append(table);
}

function renderRoundResults(fixtures, results) {
    const container = document.querySelector("#latest-round-results");
    if (!container) {
        return;
    }
    if (results.length === 0) {
        container.append(createSummaryElement("p", "summary-empty-copy", "Todavía no hay jornadas disputadas ni resultados publicados."));
        return;
    }

    const latestRound = Math.max(...results.map((result) => result.round));
    const roundFixtures = fixtures.filter((fixture) => fixture.round === latestRound);
    const latestRoundResults = results.filter((result) => result.round === latestRound);
    const resultByMatch = new Map(latestRoundResults.map((result) => [`${result.home}|${result.away}`, result]));
    const list = createSummaryElement("div", "latest-round-list");
    const heading = createSummaryElement("p", "latest-round-label", `JORNADA ${latestRound}`);

    roundFixtures.forEach((fixture) => {
        const result = resultByMatch.get(`${fixture.home}|${fixture.away}`);
        const row = createSummaryElement("div", "latest-round-match");
        const teams = createSummaryElement("span", "latest-round-teams", `${fixture.home} · ${fixture.away}`);
        const score = createSummaryElement("strong", "latest-round-score", result
            ? `${result.homeScore} – ${result.awayScore}`
            : "PEND.");
        row.append(teams, score);
        list.append(row);
    });
    container.append(heading, list);
}

function renderMatchHistory(fixtures, results) {
    const container = document.querySelector("#match-history");
    if (!container) {
        return;
    }
    if (results.length === 0) {
        const empty = createSummaryElement("div", "result-placeholder");
        empty.append(
            createSummaryElement("span", "", competitionConfig.season),
            createSummaryElement("div", ""),
        );
        const copy = empty.lastElementChild;
        copy.append(
            createSummaryElement("h3", "", "Los resultados comenzarán aquí."),
            createSummaryElement("p", "", "El calendario está publicado. Tras cada partido añadiremos el marcador y, cuando esté disponible, su crónica.")
        );
        container.append(empty);
        return;
    }

    const orderedResults = [...results].sort((a, b) => b.round - a.round);
    orderedResults.forEach((result, index) => {
        const fixture = matchFixture(result, fixtures);
        const card = createSummaryElement("article", "history-match");
        card.id = resultFixtureId(result, fixture, index);
        const date = result.playedOn || fixture?.date;
        const teams = createSummaryElement("div", "history-match-teams");
        teams.append(
            createSummaryElement("strong", "", result.home),
            createSummaryElement("b", "summary-score", `${result.homeScore} – ${result.awayScore}`),
            createSummaryElement("strong", "", result.away)
        );
        card.append(
            createSummaryElement("span", "history-match-round", `JORNADA ${result.round}`),
            teams,
            createSummaryElement("p", "summary-match-meta", `${date ? formatLongDate(new Date(`${date}T12:00:00`)) : "Fecha pendiente"} · ${fixture?.venue || "Campo pendiente"}`)
        );
        if (result.home === clubName || result.away === clubName) {
            const detailLink = createSummaryElement("a", "dashboard-more-link", "Ficha del partido ↗");
            detailLink.href = `ficha-partido.html?jornada=${result.round}`;
            card.append(detailLink);
        }
        container.append(card);
    });
}

function renderCompetitionSummary() {
    const validResults = Array.isArray(competitionResults)
        ? competitionResults.filter((result) =>
            result !== null &&
            typeof result === "object" &&
            Number.isInteger(result.round) &&
            typeof result.home === "string" &&
            typeof result.away === "string" &&
            Number.isFinite(result.homeScore) &&
            Number.isFinite(result.awayScore)
        )
        : [];
    const fixtures = flattenSchedule();

    if (!Array.isArray(competitionSchedule)) {
        console.error("No se pudo cargar el calendario para el resumen de competición.");
    }
    if (!Array.isArray(competitionStandings)) {
        console.error("No se pudo cargar la clasificación para el resumen de competición.");
    }
    if (!Array.isArray(competitionResults)) {
        console.error("No se pudo cargar el histórico de resultados de competición.");
    } else if (validResults.length !== competitionResults.length) {
        console.error("Hay resultados con datos incompletos en results-data.js; no se mostrarán.");
    }

    renderCompetitionFacts(validResults);
    renderLastChurraxMatch(validResults, fixtures);
    renderNextChurraxMatch(fixtures);
    renderNearbyStandings();
    renderRoundResults(fixtures, validResults);
    renderMatchHistory(fixtures, validResults);
}

renderCompetitionSummary();
