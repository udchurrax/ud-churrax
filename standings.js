const standingsBody = document.querySelector("#standings-body");
const standingsRoundSelect = document.querySelector("#standings-round-select");
const standingsRoundStatus = document.querySelector("#standings-round-status");
const standingTeams = window.CHURRAX_STANDINGS;
const standingHistory = Array.isArray(window.CHURRAX_STANDINGS_HISTORY)
    ? window.CHURRAX_STANDINGS_HISTORY
    : [{ round: 0, teams: standingTeams }];

function getTeamInitials(teamName) {
    return teamName
        .split(/\s+/)
        .filter((part) => !["CD", "CF", "C.F.", "UD", "FC", "F.C.", "DE", "DEL"].includes(part.toUpperCase()))
        .slice(0, 2)
        .map((part) => part[0])
        .join("");
}

function createTeamCell(team) {
    const cell = document.createElement("th");
    cell.scope = "row";
    const wrapper = document.createElement("div");
    wrapper.className = "standings-team";

    const badge = document.createElement("span");
    badge.className = "standings-team-badge";
    badge.setAttribute("aria-hidden", "true");
    badge.textContent = getTeamInitials(team.name);

    if (team.image) {
        const image = document.createElement("img");
        image.className = "standings-team-image";
        image.src = team.image;
        image.alt = "";
        image.addEventListener("load", () => badge.remove(), { once: true });
        image.addEventListener("error", () => {
            console.error(`No se pudo cargar la imagen del equipo "${team.name}": ${team.image}`);
            image.remove();
        }, { once: true });
        wrapper.append(image);
    }

    const name = document.createElement("span");
    name.textContent = team.name;
    wrapper.append(badge, name);
    cell.append(wrapper);
    return cell;
}

function createStreakCell(results) {
    const cell = document.createElement("td");
    cell.className = "standings-streak";
    const streak = Array.isArray(results) ? results.slice(-5) : [];

    for (let index = 0; index < 5; index += 1) {
        const result = streak[index];
        const marker = document.createElement("span");
        if (["V", "E", "D"].includes(result)) {
            marker.className = `streak-marker streak-${result.toLowerCase()}`;
            marker.textContent = result;
            marker.setAttribute("aria-label", result === "V" ? "Victoria" : result === "E" ? "Empate" : "Derrota");
        } else {
            marker.className = "streak-marker streak-pending";
            marker.textContent = "–";
            marker.setAttribute("aria-label", "Sin partido registrado");
        }
        cell.append(marker);
    }

    return cell;
}

function appendEmptyState(message) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 12;
    cell.className = "table-empty-light";
    cell.textContent = message;
    row.append(cell);
    standingsBody.append(row);
}

function renderStandings(teams, round) {
    standingsBody.replaceChildren();

    if (!Array.isArray(teams)) {
        appendEmptyState("La clasificación de esta jornada todavía no está disponible.");
        standingsRoundStatus.textContent = `La clasificación tras la jornada ${round} aún no está publicada.`;
        return;
    }

    teams.forEach((team, index) => {
        const row = document.createElement("tr");
        const position = document.createElement("td");
        position.className = "standings-position";
        position.textContent = String(index + 1);
        row.append(position, createTeamCell(team));

        ["pj", "pg", "pe", "pp", "pnp", "gf", "gc"].forEach((stat) => {
            const cell = document.createElement("td");
            cell.textContent = Number.isFinite(team[stat]) ? String(team[stat]) : "—";
            row.append(cell);
        });

        const goalDifference = document.createElement("td");
        goalDifference.textContent = Number.isFinite(team.gf) && Number.isFinite(team.gc)
            ? String(team.gf - team.gc)
            : "—";
        row.append(goalDifference);

        const points = document.createElement("td");
        points.className = "standings-points";
        points.textContent = Number.isFinite(team.points) ? String(team.points) : "—";
        row.append(points, createStreakCell(team.lastFive));

        if (index < 2) {
            row.classList.add("standings-promotion");
            row.title = "Zona de ascenso";
        } else if (index >= teams.length - 3) {
            row.classList.add("standings-relegation");
            row.title = "Zona de descenso";
        }
        if (team.name === "UD CHURRAX") {
            row.classList.add("standings-churrax");
        }

        standingsBody.append(row);
    });

    standingsRoundStatus.textContent = round === 0
        ? "Clasificación inicial, antes de la primera jornada."
        : `Clasificación al término de la jornada ${round}.`;
}

function populateRoundSelector() {
    if (!standingsRoundSelect) {
        return;
    }

    for (let round = 0; round <= 18; round += 1) {
        const option = document.createElement("option");
        option.value = String(round);
        option.textContent = round === 0 ? "Inicio de temporada" : `Jornada ${round}${standingHistory.some((snapshot) => snapshot.round === round) ? "" : " · pendiente"}`;
        standingsRoundSelect.append(option);
    }

    const availableRounds = standingHistory
        .filter((snapshot) => Number.isInteger(snapshot.round) && Array.isArray(snapshot.teams))
        .map((snapshot) => snapshot.round);
    const latestRound = availableRounds.length > 0 ? Math.max(...availableRounds) : 0;
    standingsRoundSelect.value = String(latestRound);
    standingsRoundSelect.addEventListener("change", () => {
        const selectedRound = Number(standingsRoundSelect.value);
        const snapshot = standingHistory.find((entry) => entry.round === selectedRound);
        renderStandings(snapshot?.teams, selectedRound);
    });
}

function renderInitialStandings() {
    if (!standingsBody) {
        return;
    }

    if (!Array.isArray(standingTeams)) {
        console.error("No se pudo cargar la clasificación de UD Churrax.");
        appendEmptyState("No se pudo cargar la clasificación. Recarga la página o consulta standings-data.js.");
        return;
    }

    populateRoundSelector();
    const initialRound = standingsRoundSelect ? Number(standingsRoundSelect.value) : 0;
    const snapshot = standingHistory.find((entry) => entry.round === initialRound);
    renderStandings(snapshot?.teams || standingTeams, initialRound);
}

renderInitialStandings();
