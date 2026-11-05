const trackerHistory = Array.isArray(window.CHURRAX_STANDINGS_HISTORY)
    ? window.CHURRAX_STANDINGS_HISTORY
        .filter((snapshot) => Number.isInteger(snapshot.round) && Array.isArray(snapshot.teams))
        .sort((a, b) => a.round - b.round)
    : [];
const trackerResults = Array.isArray(window.CHURRAX_RESULTS)
    ? window.CHURRAX_RESULTS.filter((result) =>
        result &&
        Number.isInteger(result.round) &&
        typeof result.home === "string" &&
        typeof result.away === "string" &&
        Number.isFinite(result.homeScore) &&
        Number.isFinite(result.awayScore) &&
        (result.home === "UD CHURRAX" || result.away === "UD CHURRAX")
    )
    : [];
const trackerSchedule = Array.isArray(window.CHURRAX_SCHEDULE) ? window.CHURRAX_SCHEDULE : [];
const trackerTeamName = "UD CHURRAX";
const trackerColors = ["#71829D", "#9AA6B8", "#C6A45A", "#0D182E"];
const trackerLatestSnapshot = [...trackerHistory].reverse().find((snapshot) => snapshot.round > 0);

function getTrackerFixture(result) {
    const round = trackerSchedule.find((item) => item.round === result.round);
    const match = round?.matches.find(([home, away]) => home === result.home && away === result.away);
    return match ? { date: match[2], time: match[3] } : undefined;
}

function trackerResultDate(result) {
    return result.playedOn || getTrackerFixture(result)?.date || "";
}

const trackerOrderedResults = [...trackerResults].sort((a, b) =>
    trackerResultDate(a).localeCompare(trackerResultDate(b)) || a.round - b.round
);

function createTrackerElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
        element.className = className;
    }
    if (text !== undefined) {
        element.textContent = text;
    }
    return element;
}

function getCurrentStreak(type) {
    let length = 0;
    for (let index = trackerOrderedResults.length - 1; index >= 0; index -= 1) {
        const result = trackerOrderedResults[index];
        const isHome = result.home === trackerTeamName;
        const ownGoals = isHome ? result.homeScore : result.awayScore;
        const opponentGoals = isHome ? result.awayScore : result.homeScore;
        const outcome = ownGoals > opponentGoals ? "V" : ownGoals === opponentGoals ? "E" : "D";
        if (outcome !== type) {
            break;
        }
        length += 1;
    }
    return length;
}

function getBestRun(type) {
    let best = 0;
    let current = 0;
    trackerOrderedResults.forEach((result) => {
        const isHome = result.home === trackerTeamName;
        const ownGoals = isHome ? result.homeScore : result.awayScore;
        const opponentGoals = isHome ? result.awayScore : result.homeScore;
        const outcome = ownGoals > opponentGoals ? "V" : ownGoals === opponentGoals ? "E" : "D";
        current = outcome === type ? current + 1 : 0;
        best = Math.max(best, current);
    });
    return best;
}

function renderTrackerStats() {
    const container = document.querySelector("#tracker-stats");
    if (!container) {
        return;
    }

    const values = trackerOrderedResults.reduce((stats, result) => {
        const isHome = result.home === trackerTeamName;
        const ownGoals = isHome ? result.homeScore : result.awayScore;
        const opponentGoals = isHome ? result.awayScore : result.homeScore;
        stats.gf += ownGoals;
        stats.gc += opponentGoals;
        if (ownGoals > opponentGoals) {
            stats.wins += 1;
        } else if (ownGoals === opponentGoals) {
            stats.draws += 1;
        } else {
            stats.losses += 1;
        }
        return stats;
    }, { wins: 0, draws: 0, losses: 0, gf: 0, gc: 0 });

    const hasResults = trackerOrderedResults.length > 0;
    const stats = [
        ["Victorias", values.wins],
        ["Empates", values.draws],
        ["Derrotas", values.losses],
        ["Goles marcados", values.gf],
        ["Goles recibidos", values.gc]
    ];
    container.replaceChildren(...stats.map(([label, value]) => {
        const card = createTrackerElement("div", "tracker-stat");
        card.append(
            createTrackerElement("strong", "", hasResults ? String(value) : "—"),
            createTrackerElement("span", "", label)
        );
        return card;
    }));
}

function createSvgElement(tagName, attributes = {}) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, String(value)));
    return element;
}

function renderTrackerChart(containerId, title, datasets, valueOptions) {
    const container = document.querySelector(containerId);
    if (!container) {
        return;
    }

    const snapshots = trackerHistory.filter((snapshot) => snapshot.round > 0);
    const validData = datasets
        .map((dataset) => ({
            ...dataset,
            values: snapshots
                .map((snapshot) => ({
                    round: snapshot.round,
                    team: snapshot.teams.find((team) => team.name === dataset.name),
                    position: snapshot.teams.findIndex((team) => team.name === dataset.name) + 1
                }))
                .filter((entry) => entry.team && (dataset.stat === "position" || Number.isFinite(entry.team[dataset.stat])))
                .map((entry) => ({
                    round: entry.round,
                    value: dataset.stat === "position" ? entry.position : entry.team[dataset.stat]
                }))
        }))
        .filter((dataset) => dataset.values.length > 0);

    if (validData.length === 0) {
        container.replaceChildren(createTrackerElement("p", "tracker-empty", "Aún no hay jornadas disputadas con clasificación registrada."));
        return;
    }

    const allValues = validData.flatMap((dataset) => dataset.values.map((entry) => entry.value));
    const minimum = valueOptions.invert ? 1 : Math.min(0, ...allValues);
    const maximum = valueOptions.invert ? Math.max(10, ...allValues) : Math.max(1, ...allValues);
    const rounds = snapshots.map((snapshot) => snapshot.round);
    const minRound = Math.min(...rounds);
    const maxRound = Math.max(...rounds);
    const width = 720;
    const height = 260;
    const padding = { top: 20, right: 24, bottom: 38, left: 42 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const x = (round) => padding.left + ((round - minRound) / Math.max(1, maxRound - minRound)) * plotWidth;
    const y = (value) => valueOptions.invert
        ? padding.top + ((value - minimum) / (maximum - minimum)) * plotHeight
        : padding.top + ((maximum - value) / (maximum - minimum)) * plotHeight;
    const svg = createSvgElement("svg", {
        class: "tracker-chart-svg",
        viewBox: `0 0 ${width} ${height}`,
        role: "img",
        "aria-label": title
    });
    const titleElement = createSvgElement("title");
    titleElement.textContent = title;
    svg.append(titleElement);

    const ticks = [...new Set([minimum, Math.round((minimum + maximum) / 2), maximum])];
    ticks.forEach((tick) => {
        const tickY = y(tick);
        svg.append(
            createSvgElement("line", {
                x1: padding.left,
                x2: width - padding.right,
                y1: tickY,
                y2: tickY,
                class: "tracker-grid-line"
            })
        );
        const label = createSvgElement("text", {
            x: padding.left - 10,
            y: tickY + 4,
            "text-anchor": "end",
            class: "tracker-axis-label"
        });
        label.textContent = String(tick);
        svg.append(label);
    });

    const labelRounds = minRound === maxRound ? [minRound] : [minRound, maxRound];
    labelRounds.forEach((round) => {
        const label = createSvgElement("text", {
            x: x(round),
            y: height - 11,
            "text-anchor": round === minRound ? "start" : "end",
            class: "tracker-axis-label"
        });
        label.textContent = `J${round}`;
        svg.append(label);
    });

    validData.forEach((dataset) => {
        const color = dataset.color;
        if (dataset.values.length > 1) {
            svg.append(createSvgElement("polyline", {
                points: dataset.values.map((entry) => `${x(entry.round)},${y(entry.value)}`).join(" "),
                class: dataset.name === trackerTeamName ? "tracker-line tracker-line-churrax" : "tracker-line",
                stroke: color
            }));
        }
        dataset.values.forEach((entry) => {
            const point = createSvgElement("circle", {
                cx: x(entry.round),
                cy: y(entry.value),
                r: dataset.name === trackerTeamName ? 4.5 : 3.5,
                fill: color,
                class: "tracker-point"
            });
            const pointTitle = createSvgElement("title");
            pointTitle.textContent = `${dataset.name} · Jornada ${entry.round}: ${entry.value}${dataset.stat === "position" ? "º" : " pts"}`;
            point.append(pointTitle);
            svg.append(point);
        });
    });
    container.replaceChildren(svg);
}

function renderTrackerPointsLegend(teams) {
    const legend = document.querySelector("#tracker-points-legend");
    if (!legend) {
        return;
    }
    legend.replaceChildren(...teams.map((team, index) => {
        const item = createTrackerElement("span", "tracker-legend-item");
        const marker = createTrackerElement("i", "", "");
        marker.style.backgroundColor = team.color || trackerColors[index % trackerColors.length];
        item.append(marker, createTrackerElement("span", "", team.name));
        return item;
    }));
}

function renderTrackerComparison() {
    const container = document.querySelector("#tracker-comparison-table");
    const streakContainer = document.querySelector("#tracker-streaks");
    if (container) {
        if (!trackerLatestSnapshot) {
            container.replaceChildren(createTrackerElement("p", "tracker-empty", "La comparación estará disponible al registrar la primera clasificación."));
        } else {
            const leadingTeams = trackerLatestSnapshot.teams.slice(0, 3);
            const churrax = trackerLatestSnapshot.teams.find((team) => team.name === trackerTeamName);
            const comparisonTeams = [...new Set([...leadingTeams.map((team) => team.name), trackerTeamName])];
            const table = document.createElement("table");
            table.className = "tracker-comparison-table";
            const header = document.createElement("thead");
            const headingRow = document.createElement("tr");
            ["Equipo", "Pos.", "Pts", "Dif. Churrax"].forEach((label) => headingRow.append(createTrackerElement("th", "", label)));
            header.append(headingRow);
            const body = document.createElement("tbody");
            comparisonTeams.forEach((name) => {
                const team = trackerLatestSnapshot.teams.find((entry) => entry.name === name);
                if (!team) {
                    return;
                }
                const row = document.createElement("tr");
                if (team.name === trackerTeamName) {
                    row.className = "tracker-churrax-row";
                }
                const gap = churrax && Number.isFinite(team.points) && Number.isFinite(churrax.points)
                    ? team.points - churrax.points
                    : undefined;
                const gapLabel = gap === undefined || gap === 0
                    ? "—"
                    : gap > 0
                        ? `+${gap}`
                        : `−${Math.abs(gap)}`;
                [
                    team.name,
                    `${trackerLatestSnapshot.teams.indexOf(team) + 1}`,
                    Number.isFinite(team.points) ? String(team.points) : "—",
                    gapLabel
                ].forEach((value) => row.append(createTrackerElement("td", "", value)));
                body.append(row);
            });
            table.append(header, body);
            const note = createTrackerElement("p", "tracker-table-note", `Clasificación registrada tras la jornada ${trackerLatestSnapshot.round}.`);
            container.replaceChildren(table, note);
        }
    }

    if (streakContainer) {
        if (trackerOrderedResults.length === 0) {
            streakContainer.replaceChildren(createTrackerElement("p", "tracker-empty", "Las rachas se calcularán cuando haya resultados."));
        } else {
            const best = getBestRun("V");
            const worst = getBestRun("D");
            const currentWins = getCurrentStreak("V");
            const currentLosses = getCurrentStreak("D");
            streakContainer.replaceChildren(
                createTrackerElement("p", "tracker-streak-row", `Mejor racha · ${best} ${best === 1 ? "victoria consecutiva" : "victorias consecutivas"}`),
                createTrackerElement("p", "tracker-streak-row", `Peor racha · ${worst} ${worst === 1 ? "derrota consecutiva" : "derrotas consecutivas"}`),
                createTrackerElement("p", "tracker-streak-current", currentWins
                    ? `Racha actual: ${currentWins} ${currentWins === 1 ? "victoria" : "victorias"}`
                    : currentLosses
                        ? `Racha actual: ${currentLosses} ${currentLosses === 1 ? "derrota" : "derrotas"}`
                        : "Sin racha activa de victorias o derrotas.")
            );
        }
    }
}

function renderSeasonTracker() {
    if (!document.querySelector("#season-tracker")) {
        return;
    }

    renderTrackerStats();
    renderTrackerChart(
        "#tracker-position-chart",
        "Posición de UD Churrax por jornada",
        [{ name: trackerTeamName, stat: "position", color: "#C6A45A" }],
        { invert: true }
    );

    const latestSnapshot = trackerLatestSnapshot;
    const comparisonNames = latestSnapshot
        ? [...new Set([
            ...latestSnapshot.teams.slice(0, 3).map((team) => team.name),
            trackerTeamName
        ])]
        : [trackerTeamName];
    const pointsDatasets = comparisonNames.map((name, index) => ({
        name,
        stat: "points",
        color: name === trackerTeamName ? "#C6A45A" : trackerColors[index % trackerColors.length]
    }));
    renderTrackerChart(
        "#tracker-points-chart",
        "Puntos de UD Churrax y equipos de zona alta por jornada",
        pointsDatasets,
        { invert: false }
    );
    renderTrackerPointsLegend(pointsDatasets);
    renderTrackerComparison();
}

renderSeasonTracker();
