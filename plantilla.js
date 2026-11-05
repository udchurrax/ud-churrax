const playerContainer = document.querySelector("#squad-players");
const coachContainer = document.querySelector("#squad-coach");
const squadPlayers = window.CHURRAX_SQUAD;
const squadCoach = window.CHURRAX_COACH;

function createRosterMessage(message, dark = false) {
    const notice = document.createElement("p");
    notice.className = dark ? "squad-empty squad-empty-dark" : "squad-empty";
    notice.textContent = message;
    return notice;
}

function createPersonCard(person, role, dark = false) {
    const card = document.createElement("article");
    card.className = dark ? "squad-person squad-person-dark" : "squad-person";

    const photoFrame = document.createElement("div");
    photoFrame.className = "squad-person-photo";
    const initials = person.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");
    const fallback = document.createElement("span");
    fallback.className = "squad-person-initials";
    fallback.setAttribute("aria-hidden", "true");
    fallback.textContent = initials;
    photoFrame.append(fallback);

    if (person.photo) {
        const image = document.createElement("img");
        image.src = person.photo;
        image.alt = `Foto de ${person.name}`;
        image.loading = "lazy";
        image.addEventListener("load", () => fallback.remove(), { once: true });
        image.addEventListener("error", () => {
            console.error(`No se pudo cargar la foto de "${person.name}": ${person.photo}`);
            image.remove();
        }, { once: true });
        photoFrame.append(image);
    }

    const details = document.createElement("div");
    details.className = "squad-person-details";
    if (Number.isInteger(person.number)) {
        const number = document.createElement("span");
        number.className = "squad-person-number";
        number.textContent = String(person.number).padStart(2, "0");
        details.append(number);
    }
    const name = document.createElement("h3");
    name.textContent = person.name;
    const position = document.createElement("p");
    position.className = "squad-person-position";
    position.textContent = role;
    details.append(name, position);
    card.append(photoFrame, details);
    return card;
}

function renderSquad() {
    if (playerContainer) {
        if (!Array.isArray(squadPlayers)) {
            console.error("No se pudo cargar la plantilla de UD Churrax.");
            playerContainer.replaceChildren(createRosterMessage("No se pudo cargar la plantilla. Consulta plantilla-data.js."));
        } else if (squadPlayers.length === 0) {
            playerContainer.replaceChildren(createRosterMessage("La plantilla 2026/27 se publicará cuando el club confirme los nombres, dorsales, posiciones y fotografías."));
        } else {
            playerContainer.replaceChildren(...squadPlayers.map((player) =>
                createPersonCard(player, player.position || "Posición pendiente")
            ));
        }
    }

    if (coachContainer) {
        if (!squadCoach) {
            coachContainer.replaceChildren(createRosterMessage("El nombre y la fotografía del entrenador se publicarán cuando el club los confirme.", true));
        } else if (typeof squadCoach.name !== "string" || squadCoach.name.trim() === "") {
            console.error("El entrenador de UD Churrax no tiene un nombre válido.");
            coachContainer.replaceChildren(createRosterMessage("No se pudo mostrar el entrenador. Comprueba los datos en plantilla-data.js.", true));
        } else {
            coachContainer.replaceChildren(createPersonCard(squadCoach, squadCoach.position || "Entrenador", true));
        }
    }
}

renderSquad();
