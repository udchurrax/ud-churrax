const galleryItems = window.CHURRAX_GALLERY;
const galleryPhotos = Array.isArray(galleryItems)
    ? galleryItems.filter((item) => item.type !== "video")
    : [];
const galleryGrid = document.querySelector("#gallery-grid");
const galleryStatus = document.querySelector("#gallery-status");
const heroPhoto = document.querySelector(".hero-photo");
const photoCaptionTitle = document.querySelector(".photo-caption-title");
const photoCaptionSeason = document.querySelector(".photo-caption-season");
const galleryViewer = document.querySelector("#gallery-viewer");
const viewerImage = document.querySelector(".viewer-image");
const viewerVideo = document.querySelector(".viewer-video");
const viewerCaption = document.querySelector(".viewer-caption");
const viewerClose = document.querySelector(".viewer-close");

function setHeroPhoto(photo) {
    if (!heroPhoto || !photoCaptionTitle || !photoCaptionSeason) {
        return;
    }

    heroPhoto.src = photo.src;
    heroPhoto.alt = photo.alt;
    photoCaptionTitle.textContent = photo.title;
    photoCaptionSeason.textContent = photo.season;
}

function openGalleryItem(item) {
    if (!galleryViewer) {
        return;
    }

    viewerCaption.textContent = `${item.title} · ${item.season}`;

    if (item.type === "video") {
        viewerImage.hidden = true;
        viewerVideo.hidden = false;
        viewerVideo.removeAttribute("poster");
        if (item.poster) {
            viewerVideo.poster = item.poster;
        }
        viewerVideo.src = item.src;
        viewerVideo.load();
    } else {
        viewerVideo.pause();
        viewerVideo.removeAttribute("src");
        viewerVideo.removeAttribute("poster");
        viewerVideo.load();
        viewerVideo.hidden = true;
        viewerImage.src = item.src;
        viewerImage.alt = item.alt;
        viewerImage.hidden = false;
    }

    galleryViewer.showModal();
}

function loadRandomVideoFrame(item, placeholder) {
    const previewVideo = document.createElement("video");
    previewVideo.className = "gallery-video-source";
    previewVideo.muted = true;
    previewVideo.preload = "metadata";
    previewVideo.playsInline = true;

    const fail = (error) => {
        console.error(`No se pudo crear una miniatura para el vídeo "${item.src}".`, error);
        previewVideo.pause();
        previewVideo.removeAttribute("src");
        previewVideo.load();
        previewVideo.remove();
    };

    previewVideo.addEventListener("loadedmetadata", () => {
        if (!Number.isFinite(previewVideo.duration) || previewVideo.duration <= 0) {
            fail(new Error("El vídeo no tiene una duración válida."));
            return;
        }

        const randomPosition = 0.1 + Math.random() * 0.8;
        previewVideo.currentTime = previewVideo.duration * randomPosition;
    }, { once: true });

    previewVideo.addEventListener("seeked", () => {
        const canvas = document.createElement("canvas");
        canvas.width = previewVideo.videoWidth;
        canvas.height = previewVideo.videoHeight;

        if (!canvas.width || !canvas.height) {
            fail(new Error("No se pudieron leer las dimensiones del vídeo."));
            return;
        }

        try {
            canvas.getContext("2d").drawImage(previewVideo, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                if (!blob) {
                    fail(new Error("El navegador no pudo generar la imagen del fotograma."));
                    return;
                }

                const thumbnail = document.createElement("img");
                const thumbnailUrl = URL.createObjectURL(blob);
                thumbnail.src = thumbnailUrl;
                thumbnail.alt = "";
                thumbnail.onload = () => URL.revokeObjectURL(thumbnailUrl);
                thumbnail.onerror = () => {
                    URL.revokeObjectURL(thumbnailUrl);
                    console.error(`No se pudo mostrar la miniatura del vídeo "${item.src}".`);
                };
                placeholder.replaceWith(thumbnail);
                previewVideo.pause();
                previewVideo.removeAttribute("src");
                previewVideo.load();
                previewVideo.remove();
            }, "image/jpeg", 0.82);
        } catch (error) {
            fail(error);
        }
    }, { once: true });

    previewVideo.addEventListener("error", () => {
        fail(previewVideo.error || new Error("Error de carga del vídeo."));
    }, { once: true });

    placeholder.parentElement.append(previewVideo);
    previewVideo.src = item.src;
    previewVideo.load();
}

function renderGallery() {
    if (galleryGrid && Array.isArray(galleryItems)) {
        galleryItems.forEach((item) => {
        const card = document.createElement("button");
        const caption = document.createElement("span");
        const title = document.createElement("strong");
        const season = document.createElement("span");
        const isVideo = item.type === "video";

        card.className = "gallery-card";
        if (isVideo) {
            card.classList.add("gallery-card-video");
        }
        card.type = "button";
        card.setAttribute(
            "aria-label",
            `${isVideo ? "Reproducir vídeo" : "Ampliar foto"}: ${item.title}, ${item.season}`
        );

        if (isVideo && !item.poster) {
            const placeholder = document.createElement("span");
            placeholder.className = "gallery-video-placeholder";
            placeholder.setAttribute("aria-hidden", "true");
            placeholder.textContent = "▶";
            card.append(placeholder);
            loadRandomVideoFrame(item, placeholder);
        } else {
            const image = document.createElement("img");
            image.src = isVideo ? item.poster : item.src;
            image.alt = isVideo ? "" : item.alt;
            image.loading = "lazy";
            card.append(image);
        }

        caption.className = "gallery-card-caption";
        title.textContent = item.title;
        season.textContent = item.season;
        caption.append(title, season);

        if (isVideo) {
            const videoBadge = document.createElement("span");
            videoBadge.className = "gallery-video-badge";
            videoBadge.textContent = "VÍDEO · ▶";
            card.append(videoBadge);
        }

        card.append(caption);
        card.addEventListener("click", () => openGalleryItem(item));
        galleryGrid.append(card);
        });
    }

    const photoCount = galleryPhotos.length;
    const itemCount = Array.isArray(galleryItems) ? galleryItems.length : 0;
    const videoCount = itemCount - photoCount;
    const counts = [];

    if (photoCount) {
        counts.push(`${photoCount} ${photoCount === 1 ? "foto" : "fotos"}`);
    }
    if (videoCount) {
        counts.push(`${videoCount} ${videoCount === 1 ? "vídeo" : "vídeos"}`);
    }
    if (galleryStatus) {
        galleryStatus.textContent = counts.length
            ? `${counts.join(" y ")} en la galería.`
            : "Todavía no hay fotos ni vídeos en la galería.";
    }

    if (photoCount === 0 || !heroPhoto) {
        return;
    }

    let currentPhotoIndex = Math.floor(Math.random() * photoCount);
    setHeroPhoto(galleryPhotos[currentPhotoIndex]);

    window.setInterval(() => {
        if (photoCount < 2) {
            return;
        }

        let nextPhotoIndex = Math.floor(Math.random() * (photoCount - 1));
        if (nextPhotoIndex >= currentPhotoIndex) {
            nextPhotoIndex += 1;
        }

        currentPhotoIndex = nextPhotoIndex;
        setHeroPhoto(galleryPhotos[currentPhotoIndex]);
    }, 60 * 60 * 1000);
}

renderGallery();

if (viewerClose && galleryViewer && viewerVideo) {
    viewerClose.addEventListener("click", () => galleryViewer.close());

    viewerVideo.addEventListener("error", () => {
        if (galleryViewer.open) {
            viewerCaption.textContent = "No se pudo cargar el vídeo. Comprueba el archivo y que el formato sea compatible.";
        }
    });

    galleryViewer.addEventListener("close", () => {
        viewerVideo.pause();
        viewerVideo.removeAttribute("src");
        viewerVideo.removeAttribute("poster");
        viewerVideo.load();
    });

    galleryViewer.addEventListener("click", (event) => {
        if (event.target === galleryViewer) {
            galleryViewer.close();
        }
    });
}
