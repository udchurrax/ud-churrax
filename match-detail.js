const matchDetail = document.querySelector("#match-detail");
const matchSchedule = window.CHURRAX_SCHEDULE;
const matchResults = Array.isArray(window.CHURRAX_RESULTS) ? window.CHURRAX_RESULTS : [];
const requestedRound = Number(new URLSearchParams(window.location.search).get("jornada"));
const roundData = Array.isArray(matchSchedule)
    ? matchSchedule.find((round) => round.round === requestedRound)
    : undefined;
const matchData = roundData?.matches.find(([home, away]) =>
    home === "UD CHURRAX" || away === "UD CHURRAX"
);
const matchResult = matchData && matchResults.find((result) =>
    result.round === requestedRound && result.home === matchData[0] && result.away === matchData[1]
);
const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function appendMatchField(container, label, content) {
    const field = document.createElement("section");
    field.className = "match-detail-field";
    const heading = document.createElement("h2");
    heading.textContent = label;
    field.append(heading, content);
    container.append(field);
}

function createMatchText(text, className = "match-detail-copy") {
    const paragraph = document.createElement("p");
    paragraph.className = className;
    paragraph.textContent = text;
    return paragraph;
}

function renderMatchDetail() {
    if (!matchDetail) {
        return;
    }

    if (!matchData) {
        const notFound = document.createElement("div");
        notFound.className = "match-detail-empty";
        notFound.append(
            createMatchText("No se encontró un partido del Churrax para la jornada indicada."),
        );
        const backLink = document.createElement("a");
        backLink.className = "inline-link";
        backLink.href = "competicion.html#calendario";
        backLink.textContent = "Volver al calendario ↗";
        notFound.append(backLink);
        matchDetail.replaceChildren(notFound);
        return;
    }

    const [home, away, date, time, weekday, venue] = matchData;
    const isHome = home === "UD CHURRAX";
    const opponent = isHome ? away : home;
    const [year, month, day] = date.split("-").map(Number);
    const formattedDate = `${weekday} ${day} de ${monthNames[month - 1]} de ${year}`;
    const lead = document.querySelector("#match-page-lead");
    if (lead) {
        lead.textContent = `${home} · ${away}`;
    }

    const header = document.createElement("div");
    header.className = "match-detail-scoreboard";
    const teams = document.createElement("p");
    teams.className = "match-detail-teams";
    teams.textContent = `${home}  ${matchResult ? `${matchResult.homeScore} – ${matchResult.awayScore}` : "VS"}  ${away}`;
    const matchMeta = document.createElement("p");
    matchMeta.className = "match-detail-meta";
    matchMeta.textContent = `JORNADA ${requestedRound} · ${formattedDate} · ${time} · ${venue}`;
    header.append(teams, matchMeta);
    matchDetail.replaceChildren(header);

    appendMatchField(matchDetail, "Resultado", createMatchText(
        matchResult ? `${matchResult.homeScore} – ${matchResult.awayScore}` : "Pendiente de disputarse",
        matchResult ? "match-detail-score" : "match-detail-copy"
    ));
    appendMatchField(matchDetail, "Jornada", createMatchText(String(requestedRound)));
    appendMatchField(matchDetail, "Fecha", createMatchText(`${formattedDate} · ${time}`));
    appendMatchField(matchDetail, "Rival", createMatchText(opponent));
    appendMatchField(matchDetail, "Condición", createMatchText(isHome ? "Local" : "Visitante"));

    const goals = Array.isArray(matchResult?.goals) ? matchResult.goals : [];
    const goalsContent = goals.length
        ? createMatchText(goals.join(" · "))
        : createMatchText("Goleadores pendientes de confirmar.");
    appendMatchField(matchDetail, "Goles", goalsContent);

    appendMatchField(
        matchDetail,
        "Crónica",
        createMatchText(matchResult?.chronicle || "La crónica estará disponible después del encuentro.")
    );

    const galleryLink = document.createElement("a");
    galleryLink.className = "inline-link";
    galleryLink.href = matchResult?.galleryUrl || "galeria.html";
    galleryLink.textContent = "Ver fotografías en la galería ↗";
    appendMatchField(matchDetail, "Fotografías", galleryLink);

    const backLink = document.createElement("a");
    backLink.className = "inline-link match-detail-back";
    backLink.href = `competicion.html#jornada-${requestedRound}`;
    backLink.textContent = "Volver al calendario ↗";
    matchDetail.append(backLink);
}

renderMatchDetail();
