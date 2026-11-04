(() => {
  const section = document.querySelector(".cinema-scroll");
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const track = document.querySelector(".sights-track");
  const sightsControls = document.querySelector(".sights-controls");
  const prevBtn = document.querySelector(".sight-prev");
  const nextBtn = document.querySelector(".sight-next");
  const originalCards = Array.from(document.querySelectorAll(".sight-card"));

  let targetMouseX = 0;
  let targetMouseY = 0;
  let mouseX = 0;
  let mouseY = 0;
  let targetScroll = 0;
  let smoothScroll = 0;
  let initialized = false;
  let rafPending = false;
  let sightCards = [];
  const originalSightCount = originalCards.length;
  let activeSight = originalSightCount;

  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const smoothstep = (e0, e1, v) => {
    const x = clamp((v - e0) / (e1 - e0));
    return x * x * (3 - 2 * x);
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const segmentInOut = (s, a, b, c, d) => {
    const enter = smoothstep(a, b, s);
    const exit = smoothstep(c, d, s);
    return { enter, exit, active: enter * (1 - exit) };
  };
  const getScrollDistance = () =>
    clamp(
      -section.getBoundingClientRect().top,
      0,
      section.offsetHeight - window.innerHeight
    );

  function update() {
    rafPending = false;

    targetScroll = getScrollDistance();
    if (!initialized || reduceMotion.matches) {
      smoothScroll = targetScroll;
      initialized = true;
    } else {
      smoothScroll = lerp(smoothScroll, targetScroll, 0.14);
    }
    if (Math.abs(smoothScroll - targetScroll) < 0.08) {
      smoothScroll = targetScroll;
    }

    mouseX = lerp(mouseX, targetMouseX, 0.12);
    mouseY = lerp(mouseY, targetMouseY, 0.12);

    const effMouseX = reduceMotion.matches ? 0 : mouseX;
    const effMouseY = reduceMotion.matches ? 0 : mouseY;

    const frame2 = segmentInOut(smoothScroll, 560, 900, 1300, 1620);
    const frame3 = segmentInOut(smoothScroll, 1760, 2140, 2540, 2700);
    const progress = clamp(smoothScroll / 2700);
    const introExit = smoothstep(90, 650, smoothScroll);
    const sightsEnterRaw = smoothstep(2760, 3560, smoothScroll);
    const sightsEnter = Math.pow(sightsEnterRaw, 1.55);
    const sightsControlsEnter = smoothstep(3360, 3660, smoothScroll);
    const blurActive = clamp(frame2.active + frame3.active);
    const frame2Opacity = frame2.active * (1 - frame3.enter);
    const splitDrift = Math.pow(frame2.enter, 1.5);
    const panel2Opacity = frame2.active * (1 - frame2.exit);
    const panel3Opacity = frame3.active * (1 - frame3.exit);
    const backScale =
      0.76 + progress * 0.2 + frame2.enter * 0.18 + frame3.enter * 0.16;
    const sharedHeroY = progress * -74;
    const sharedHeroScale = progress * 0.23;
    const sightsScreenTop =
      Math.min(220, Math.max(112, window.innerHeight * 0.19)) - 50;
    const sightsParentTop =
      window.innerHeight - (window.innerHeight - sightsScreenTop) / backScale;

    root.style.setProperty("--mx", effMouseX.toFixed(4));
    root.style.setProperty("--my", effMouseY.toFixed(4));

    root.style.setProperty("--back-opacity", (1 - frame2.active * 0.06).toFixed(4));
    root.style.setProperty("--back-x", `${(effMouseX * -12).toFixed(2)}px`);
    root.style.setProperty("--back-y", `${(effMouseY * -4).toFixed(2)}px`);
    root.style.setProperty("--back-scale", backScale.toFixed(4));
    root.style.setProperty("--four-y", `${(10 + progress * 10).toFixed(3)}vh`);
    root.style.setProperty("--four-scale", (0.78 + progress * 0.16).toFixed(4));
    root.style.setProperty("--bazaar-y", `${(20 - progress * 8).toFixed(3)}vh`);
    root.style.setProperty("--blur-px", `${(blurActive * 14).toFixed(2)}px`);
    root.style.setProperty("--back-brightness", (1 - blurActive * 0.255).toFixed(4));
    root.style.setProperty("--bazaar-blur-px", `${(frame2.active * 14).toFixed(2)}px`);
    root.style.setProperty(
      "--bazaar-brightness",
      (1 - frame2.active * 0.255 - frame3.active * 0.06).toFixed(4)
    );
    root.style.setProperty(
      "--bazaar-saturation",
      (1 + frame3.active * 0.18).toFixed(4)
    );
    root.style.setProperty("--shade-opacity", "1");
    root.style.setProperty("--shade-z", frame2.active > 0.02 ? "2" : "0");
    root.style.setProperty("--shade-top-alpha", (blurActive * 0.465).toFixed(4));
    root.style.setProperty("--shade-mid-alpha", (blurActive * 0.42).toFixed(4));
    root.style.setProperty("--shade-bottom-alpha", (blurActive * 0.51).toFixed(4));

    root.style.setProperty("--title-y", `${(introExit * -210).toFixed(2)}px`);
    root.style.setProperty("--title-scale", (1 - introExit * 0.08).toFixed(4));
    root.style.setProperty("--title-opacity", (1 - introExit).toFixed(4));

    root.style.setProperty(
      "--bridge-x",
      `calc(-50% + ${(effMouseX * 18).toFixed(2)}px)`
    );
    root.style.setProperty(
      "--bridge-y",
      `${(effMouseY * 8 + sharedHeroY - frame2.exit * 760).toFixed(2)}px`
    );
    root.style.setProperty(
      "--bridge-bottom",
      `${(5 - frame2.enter * 13).toFixed(3)}vh`
    );
    root.style.setProperty(
      "--bridge-width",
      `${(67.2 + frame2.enter * 37.8).toFixed(3)}vw`
    );
    root.style.setProperty(
      "--bridge-scale",
      (1.02 + sharedHeroScale + frame2.exit * 0.46).toFixed(4)
    );

    root.style.setProperty(
      "--split-left-x",
      `calc(-50% + ${(-splitDrift * 46).toFixed(3)}vw + ${(effMouseX * 22).toFixed(2)}px)`
    );
    root.style.setProperty(
      "--split-left-y",
      `${(effMouseY * 10 + sharedHeroY - splitDrift * 180).toFixed(2)}px`
    );
    root.style.setProperty(
      "--split-left-scale",
      (1 + sharedHeroScale + frame2.enter * 0.74).toFixed(4)
    );
    root.style.setProperty(
      "--split-right-x",
      `calc(-50% + ${(splitDrift * 46).toFixed(3)}vw + ${(effMouseX * 22).toFixed(2)}px)`
    );
    root.style.setProperty(
      "--split-right-y",
      `${(effMouseY * 10 + sharedHeroY - splitDrift * 180).toFixed(2)}px`
    );
    root.style.setProperty(
      "--split-right-scale",
      (1 + sharedHeroScale + frame2.enter * 0.74).toFixed(4)
    );

    root.style.setProperty("--frame2-opacity", frame2Opacity.toFixed(4));
    root.style.setProperty(
      "--frame2-x",
      `calc(-50% + ${(effMouseX * 10).toFixed(2)}px)`
    );
    root.style.setProperty(
      "--frame2-y",
      `calc(-50% + ${(effMouseY * 8 - frame2.exit * 150).toFixed(2)}px)`
    );
    root.style.setProperty(
      "--frame2-scale",
      (1.06 + frame2.enter * 0.08 + frame2.exit * 0.08).toFixed(4)
    );

    root.style.setProperty("--intro-copy-y", `${(introExit * 90).toFixed(2)}px`);
    root.style.setProperty("--intro-copy-opacity", (1 - introExit).toFixed(4));
    root.style.setProperty("--panel2-opacity", panel2Opacity.toFixed(4));
    root.style.setProperty(
      "--panel2-y",
      `calc(-50% + ${(-frame2.exit * 86 + (1 - frame2.enter) * 58).toFixed(2)}px)`
    );
    root.style.setProperty("--panel3-opacity", panel3Opacity.toFixed(4));
    root.style.setProperty(
      "--panel3-y",
      `calc(-50% + ${(-frame3.exit * 86 + (1 - frame3.enter) * 58).toFixed(2)}px)`
    );

    root.style.setProperty("--sights-opacity", sightsEnter.toFixed(4));
    root.style.setProperty(
      "--sights-controls-opacity",
      sightsControlsEnter.toFixed(4)
    );
    if (sightsControls) {
      sightsControls.classList.toggle("is-ready", sightsControlsEnter > 0.98);
    }
    root.style.setProperty(
      "--sights-visibility",
      sightsEnter > 0.01 ? "visible" : "hidden"
    );
    root.style.setProperty("--sights-y", "0px");
    root.style.setProperty(
      "--sights-enter-x",
      `${((1 - sightsEnter) * 420).toFixed(3)}vw`
    );
    root.style.setProperty("--sights-scale", (1 / backScale).toFixed(4));
    root.style.setProperty("--sights-top", `${sightsParentTop.toFixed(2)}px`);
    root.style.setProperty(
      "--sights-screen-top",
      `${sightsScreenTop.toFixed(2)}px`
    );

    if (
      Math.abs(smoothScroll - targetScroll) > 0.08 ||
      Math.abs(mouseX - targetMouseX) > 0.001 ||
      Math.abs(mouseY - targetMouseY) > 0.001
    ) {
      requestTick();
    }
  }

  function requestTick() {
    if (!rafPending) {
      rafPending = true;
      window.requestAnimationFrame(update);
    }
  }

  function updateSightSlider() {
    if (!sightCards.length) return;
    const cardWidth = sightCards[0].offsetWidth;
    const gap = parseFloat(window.getComputedStyle(track).columnGap || "0");
    root.style.setProperty(
      "--sights-shift",
      `${-(cardWidth + gap) * activeSight}px`
    );
    sightCards.forEach((card, idx) => {
      card.classList.toggle("is-active", idx === activeSight);
    });
  }

  function moveSightSlider(dir) {
    activeSight += dir;
    updateSightSlider();
  }

  function selectSightCard(card) {
    const index = Number(card.dataset.sightIndex);
    if (Number.isFinite(index)) {
      activeSight = index;
      updateSightSlider();
    }
    const suiteCode = card.dataset.suiteCode;
    if (suiteCode) {
      openBookingModal(suiteCode);
    }
  }

  function jumpSightSlider(i) {
    track.classList.add("is-jumping");
    activeSight = i;
    updateSightSlider();
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        track.classList.remove("is-jumping");
      });
    });
  }

  function normalizeSightSlider() {
    if (activeSight >= originalSightCount * 2) {
      jumpSightSlider(activeSight - originalSightCount);
    } else if (activeSight < originalSightCount) {
      jumpSightSlider(activeSight + originalSightCount);
    }
  }

  function setupSightSlider() {
    if (!track || !originalSightCount) return;
    track.replaceChildren();
    for (let setIndex = 0; setIndex < 3; setIndex += 1) {
      originalCards.forEach((card, cardIndex) => {
        const clone = card.cloneNode(true);
        clone.dataset.sightIndex = String(
          setIndex * originalSightCount + cardIndex
        );
        clone.addEventListener("click", () => selectSightCard(clone));
        clone.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectSightCard(clone);
          }
        });
        track.appendChild(clone);
      });
    }
    sightCards = Array.from(track.querySelectorAll(".sight-card"));
    activeSight = originalSightCount;
    track.addEventListener("transitionend", normalizeSightSlider);
    updateSightSlider();
  }

  /* =========================================================
     Guest Sanctuary Portal Controller (Personal Stays Experience)
     ========================================================= */
  const crudBackdrop = document.getElementById("crud-backdrop");
  const crudModal = document.querySelector(".crud-modal");
  const openHeaderBtn = document.getElementById("open-bookings-header");
  const openPanelBtn = document.getElementById("open-crud-panel-btn");
  const closeCrudBtn = document.getElementById("crud-close-btn");
  const tabBookBtn = document.getElementById("tab-book-btn");
  const tabManageBtn = document.getElementById("tab-manage-btn");
  const viewBookRoom = document.getElementById("view-book-room");
  const viewMyBookings = document.getElementById("view-my-bookings");

  const bookingForm = document.getElementById("booking-form");
  const bookingIdInput = document.getElementById("booking-id");
  const formModeTitle = document.getElementById("form-mode-title");
  const guestNameInput = document.getElementById("guest-name");
  const guestEmailInput = document.getElementById("guest-email");
  const suiteSelect = document.getElementById("suite-select");
  const checkInInput = document.getElementById("check-in");
  const checkOutInput = document.getElementById("check-out");
  const guestCountInput = document.getElementById("guest-count");
  const bookingStatusInput = document.getElementById("booking-status");
  const guestNotesInput = document.getElementById("guest-notes");
  const feedbackEl = document.getElementById("crud-feedback");
  const submitBtn = document.getElementById("crud-submit-btn");
  const cancelEditBtn = document.getElementById("crud-cancel-edit");

  // Billing breakdown elements
  const billingBaseDesc = document.getElementById("billing-base-desc");
  const billingBaseSum = document.getElementById("billing-base-sum");
  const billingTaxSum = document.getElementById("billing-tax-sum");
  const billingTotalSum = document.getElementById("billing-total-sum");

  // Receipt elements
  const receiptCard = document.getElementById("booking-receipt-card");
  const receiptRefCode = document.getElementById("receipt-ref-code");
  const receiptMsg = document.getElementById("receipt-msg");
  const receiptDetails = document.getElementById("receipt-details");
  const receiptCopyBtn = document.getElementById("receipt-copy-btn");
  const receiptViewBookingsBtn = document.getElementById("receipt-view-bookings-btn");
  const receiptBookAnotherBtn = document.getElementById("receipt-book-another-btn");

  // Suite Preview Card elements
  const suitePreviewCard = document.getElementById("suite-preview-card");
  const previewKicker = document.getElementById("preview-kicker");
  const previewCapacity = document.getElementById("preview-capacity");
  const previewTitle = document.getElementById("preview-title");
  const previewPin = document.getElementById("preview-pin");
  const previewDesc = document.getElementById("preview-desc");
  const previewPerks = document.getElementById("preview-perks");
  const previewRate = document.getElementById("preview-rate");

  // My Bookings Tab elements
  const searchInput = document.getElementById("booking-search");
  const filterSelect = document.getElementById("booking-filter");
  const statsEl = document.getElementById("booking-stats");
  const guestCountBadge = document.getElementById("guest-booking-count");
  const bookingListEl = document.getElementById("booking-list");
  const emptyStateEl = document.getElementById("bookings-empty-state");
  const emptyBookBtn = document.getElementById("empty-book-btn");

  const SUITE_INFO = {
    "stari-most": {
      name: "Stari Most Suite",
      kicker: "Bridge View · €240/nt",
      rate: 240,
      capacity: "Max 4 Guests",
      desc: "Private stone terrace overlooking the Neretva arch with artisan breakfast included.",
      pin: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230438_d526b8b6-8a2e-4e3b-9993-3908acae03a7.png",
      perks: [
        "Direct Neretva arch panoramas",
        "Ottoman stonework & private loggia",
        "Complimentary artisan riverside breakfast",
        "Private evening telescope view"
      ]
    },
    "kujundziluk": {
      name: "Kujundziluk Loft",
      kicker: "Bazaar Wing · €185/nt",
      rate: 185,
      capacity: "Max 3 Guests",
      desc: "Artisanal timber loft perched directly above the historic copper bazaar lane.",
      pin: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230442_140bc25b-b165-4249-904a-f708bff6970e.png",
      perks: [
        "Bazaar cobblestone & minaret view",
        "Hand-carved Bosnian timber ceiling",
        "Traditional copper espresso bar",
        "Curated artisanal bazaar walk"
      ]
    },
    "koski-suite": {
      name: "Koski Panorama Suite",
      kicker: "Penthouse · €310/nt",
      rate: 310,
      capacity: "Max 4 Guests",
      desc: "Top-floor sanctuary with panoramic minaret and emerald river vistas.",
      pin: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230448_825949c9-ccdb-4857-b4a6-e349eccc9010.png",
      perks: [
        "360° river & old city panorama",
        "Private minaret rooftop terrace",
        "Dedicated heritage concierge service",
        "Sunset champagne river basket"
      ]
    },
    "kajtaz-villa": {
      name: "Kajtaz Courtyard",
      kicker: "Ottoman Villa · €275/nt",
      rate: 275,
      capacity: "Max 6 Guests",
      desc: "Preserved 16th-century residence with walled courtyard garden & plunge fountain.",
      pin: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230438_d526b8b6-8a2e-4e3b-9993-3908acae03a7.png",
      perks: [
        "Private secluded walled courtyard",
        "Stone plunge fountain & herbs garden",
        "Authentic Ottoman divan salon",
        "Exclusive family estate privacy"
      ]
    },
    "neretva-studio": {
      name: "Neretva Cliff Studio",
      kicker: "Riverfront · €150/nt",
      rate: 150,
      capacity: "Max 2 Guests",
      desc: "Quiet cliffside studio cantilevered directly above the emerald river bend.",
      pin: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230442_140bc25b-b165-4249-904a-f708bff6970e.png",
      perks: [
        "Cantilevered emerald river balcony",
        "Acoustic white-water calming sounds",
        "Direct water-access stone steps",
        "Sunset wine & pomegranate tray"
      ]
    }
  };

  const STORAGE_KEY_GUEST_REFS = "mostar_guest_reservation_refs";

  function getMyReservationRefs() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_GUEST_REFS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  function addMyReservationRef(refCode) {
    if (!refCode) return;
    try {
      const refs = getMyReservationRefs();
      if (!refs.includes(refCode)) {
        refs.push(refCode);
        localStorage.setItem(STORAGE_KEY_GUEST_REFS, JSON.stringify(refs));
      }
    } catch {
      // ignore localstorage exceptions
    }
  }

  function removeMyReservationRef(refCode) {
    if (!refCode) return;
    try {
      let refs = getMyReservationRefs();
      refs = refs.filter(r => r !== refCode);
      localStorage.setItem(STORAGE_KEY_GUEST_REFS, JSON.stringify(refs));
    } catch {
      // ignore
    }
  }

  function setActiveTab(tab) {
    clearFeedback();
    const isBook = tab === "book";
    if (crudModal) {
      crudModal.setAttribute("data-active-tab", tab);
    }
    const modalTitleEl = document.getElementById("crud-modal-title");
    if (modalTitleEl) {
      modalTitleEl.textContent = isBook ? "Guest Room Booking" : "My Stays & Reservations";
    }
    if (tabBookBtn && tabManageBtn) {
      tabBookBtn.classList.toggle("is-active", isBook);
      tabBookBtn.setAttribute("aria-selected", isBook ? "true" : "false");
      tabManageBtn.classList.toggle("is-active", !isBook);
      tabManageBtn.setAttribute("aria-selected", !isBook ? "true" : "false");
    }

    // Strict view isolation
    if (viewBookRoom && viewMyBookings) {
      if (isBook) {
        viewBookRoom.classList.add("is-active");
        viewBookRoom.hidden = false;
        viewMyBookings.classList.remove("is-active");
        viewMyBookings.hidden = true;
      } else {
        viewBookRoom.classList.remove("is-active");
        viewBookRoom.hidden = true;
        viewMyBookings.classList.add("is-active");
        viewMyBookings.hidden = false;
        loadBookings();
      }
    }
  }

  function updateSuitePreview(animate = true) {
    const code = suiteSelect ? (suiteSelect.value || "stari-most") : "stari-most";
    const info = SUITE_INFO[code] || SUITE_INFO["stari-most"];

    if (animate && suitePreviewCard) {
      suitePreviewCard.classList.add("is-updating");
    }

    setTimeout(() => {
      if (previewTitle) previewTitle.textContent = info.name;
      if (previewKicker) previewKicker.textContent = info.kicker;
      if (previewCapacity) previewCapacity.textContent = info.capacity;
      if (previewDesc) previewDesc.textContent = info.desc;
      if (previewPin) previewPin.src = info.pin;
      if (previewRate) previewRate.textContent = `€${info.rate.toFixed(2)} / night`;

      if (previewPerks && Array.isArray(info.perks)) {
        previewPerks.innerHTML = info.perks.map(p => `<li>${escapeHtml(p)}</li>`).join("");
      }

      if (animate && suitePreviewCard) {
        suitePreviewCard.classList.remove("is-updating");
      }
    }, animate ? 120 : 0);
  }

  function setDefaultDates() {
    const today = new Date();
    const checkIn = new Date(today.getTime() + 86400000 * 3);
    const checkOut = new Date(today.getTime() + 86400000 * 5);
    if (checkInInput) checkInInput.value = checkIn.toISOString().slice(0, 10);
    if (checkOutInput) checkOutInput.value = checkOut.toISOString().slice(0, 10);
    if (checkInInput) checkInInput.min = today.toISOString().slice(0, 10);
    updatePricePreview();
    updateSuitePreview(false);
  }

  function showFeedback(message, isError = false) {
    if (!feedbackEl) return;
    feedbackEl.hidden = false;
    feedbackEl.textContent = message;
    feedbackEl.className = `crud-feedback ${isError ? "is-error" : "is-success"}`;
  }

  function clearFeedback() {
    if (!feedbackEl) return;
    feedbackEl.hidden = true;
    feedbackEl.textContent = "";
  }

  function updatePricePreview() {
    if (!checkInInput || !checkOutInput || !suiteSelect) return;
    const info = SUITE_INFO[suiteSelect.value] || SUITE_INFO["stari-most"];
    const inTime = Date.parse(checkInInput.value);
    const outTime = Date.parse(checkOutInput.value);

    // Strict validation: check-out must be strictly after check-in
    if (checkInInput.value) {
      const nextDay = new Date(inTime + 86400000).toISOString().slice(0, 10);
      checkOutInput.min = nextDay;
    }

    let nights = 1;
    let validDates = true;

    if (!Number.isFinite(inTime) || !Number.isFinite(outTime) || outTime <= inTime) {
      validDates = false;
      nights = 1;
    } else {
      nights = Math.max(1, Math.round((outTime - inTime) / 86400000));
    }

    const baseSum = nights * info.rate;
    const cityTax = nights * 4.0; // €4/night transparent tourist tax
    const grandTotal = baseSum + cityTax;

    if (billingBaseDesc) {
      billingBaseDesc.textContent = `${nights} night${nights === 1 ? "" : "s"} × €${info.rate.toFixed(2)}`;
    }
    if (billingBaseSum) {
      billingBaseSum.textContent = `€${baseSum.toFixed(2)}`;
    }
    if (billingTaxSum) {
      billingTaxSum.textContent = `€${cityTax.toFixed(2)}`;
    }
    if (billingTotalSum) {
      billingTotalSum.textContent = `€${grandTotal.toFixed(2)}`;
    }

    if (!validDates && checkOutInput.value) {
      showFeedback("Check-out date must be at least one day after check-in.", true);
    } else {
      clearFeedback();
    }
  }

  function resetFormToCreate(preselectedSuite = "") {
    if (receiptCard) {
      receiptCard.classList.remove("is-visible");
      receiptCard.hidden = true;
    }
    if (crudModal) {
      crudModal.classList.remove("is-fading-out");
      crudModal.hidden = false;
    }
    if (bookingForm) bookingForm.hidden = false;

    if (bookingIdInput) bookingIdInput.value = "";
    if (bookingStatusInput) bookingStatusInput.value = "Confirmed";
    if (formModeTitle) formModeTitle.textContent = "Reserve Your Suite";
    if (submitBtn) submitBtn.textContent = "Confirm Suite Reservation";
    if (cancelEditBtn) cancelEditBtn.hidden = true;
    if (guestNameInput) guestNameInput.value = "";
    if (guestEmailInput) guestEmailInput.value = "";
    if (preselectedSuite && SUITE_INFO[preselectedSuite] && suiteSelect) {
      suiteSelect.value = preselectedSuite;
    }
    if (guestCountInput) guestCountInput.value = "2";
    if (guestNotesInput) guestNotesInput.value = "";
    setDefaultDates();
  }

  function openBookingModal(suiteCode = "", defaultTab = "book") {
    clearFeedback();
    if (receiptCard) {
      receiptCard.classList.remove("is-visible");
      receiptCard.hidden = true;
    }
    if (crudModal) {
      crudModal.classList.remove("is-fading-out");
      crudModal.hidden = false;
    }
    if (bookingForm) bookingForm.hidden = false;

    setActiveTab(defaultTab);
    if (suiteCode && !bookingIdInput.value && suiteSelect) {
      suiteSelect.value = suiteCode;
      updatePricePreview();
      updateSuitePreview(false);
    }
    crudBackdrop.classList.add("is-open");
    crudBackdrop.setAttribute("aria-hidden", "false");
    loadBookings();
  }

  function closeBookingModal() {
    crudBackdrop.classList.remove("is-open");
    crudBackdrop.setAttribute("aria-hidden", "true");
    if (receiptCard) {
      receiptCard.classList.remove("is-visible");
      receiptCard.hidden = true;
    }
    if (crudModal) {
      crudModal.classList.remove("is-fading-out");
      crudModal.hidden = false;
    }
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
  }

  function renderBookingList(bookings, stats, allUnfilteredBookings = null) {
    // Restrict view scope strictly to the active guest's personal reservations via localStorage
    const myRefs = getMyReservationRefs();
    const rawAll = Array.isArray(allUnfilteredBookings) ? allUnfilteredBookings : (Array.isArray(bookings) ? bookings : []);
    const rawList = Array.isArray(bookings) ? bookings : [];

    const guestScopedAll = rawAll.filter(b => myRefs.includes(b.booking_ref));
    const guestScopedList = rawList.filter(b => myRefs.includes(b.booking_ref));

    cachedBookings = guestScopedList;

    // Calculate personal status breakdown
    const totalCount = guestScopedAll.length;

    if (guestCountBadge) guestCountBadge.textContent = String(totalCount);
    if (statsEl) {
      statsEl.textContent = `${cachedBookings.length} ${cachedBookings.length === 1 ? "stay" : "stays"}`;
    }

    if (!cachedBookings.length) {
      if (bookingListEl) {
        bookingListEl.innerHTML = "";
        bookingListEl.style.display = "none";
      }
      if (emptyStateEl) {
        emptyStateEl.hidden = false;
        emptyStateEl.style.display = "flex";
        const emptyTitle = document.getElementById("empty-title");
        const emptyDesc = document.getElementById("empty-desc");
        const hasSearch = searchInput && searchInput.value.trim() !== "";
        const hasFilter = filterSelect && filterSelect.value !== "All";
        if (hasSearch || hasFilter) {
          if (emptyTitle) emptyTitle.textContent = "No Matching Reservations";
          if (emptyDesc) emptyDesc.textContent = "No personal stays match your current search or status filter.";
        } else {
          if (emptyTitle) emptyTitle.textContent = "No Stays Reserved Yet";
          if (emptyDesc) emptyDesc.textContent = "Reserve your sanctuary above the Neretva to begin your heritage stay.";
        }
      }
      return;
    }

    if (emptyStateEl) {
      emptyStateEl.hidden = true;
      emptyStateEl.style.display = "none";
    }
    if (bookingListEl) {
      bookingListEl.style.display = "flex";
    }

    if (bookingListEl) {
      bookingListEl.innerHTML = cachedBookings
        .map((item) => {
          const totalFormatted = Number(item.total_price).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          const suiteData = SUITE_INFO[item.suite_code] || {
            pin: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230438_d526b8b6-8a2e-4e3b-9993-3908acae03a7.png",
            kicker: "Heritage Suite",
          };
          const notesHtml = item.special_requests
            ? `<div class="crud-card-request">Special Request: ${escapeHtml(item.special_requests)}</div>`
            : "";
          const refDisplay = item.booking_ref
            ? `<span class="crud-ref-badge tabular">${escapeHtml(item.booking_ref.slice(0, 8).toUpperCase())}</span>`
            : "";

          return `
            <article class="crud-card" data-booking-id="${Number(item.id)}" data-booking-ref="${escapeHtml(item.booking_ref || "")}">
              <div class="crud-card-icon-col">
                <img src="${escapeHtml(suiteData.pin)}" alt="" width="40" height="40" />
              </div>
              <div class="crud-card-main">
                <div class="crud-card-head">
                  ${refDisplay}
                  <h4 class="crud-guest-name">${escapeHtml(item.guest_name)}</h4>
                  <span class="crud-status-tag" data-status="${escapeHtml(item.status)}">${escapeHtml(item.status)}</span>
                </div>
                <div class="crud-card-suite-row">
                  <span class="crud-card-suite-name">${escapeHtml(item.suite_name)}</span>
                  <span class="crud-card-suite-meta">· ${escapeHtml(suiteData.kicker)}</span>
                </div>
                <div class="crud-card-timeline">
                  <div class="timeline-dates">
                    <span>${escapeHtml(item.check_in)}</span>
                    <span class="timeline-arrow" aria-hidden="true">→</span>
                    <span>${escapeHtml(item.check_out)}</span>
                  </div>
                  <div class="timeline-stats">
                    <span>${Number(item.nights)} nights</span>
                    <span>·</span>
                    <span>${Number(item.guests)} guests</span>
                    <span>·</span>
                    <span class="timeline-total">€${totalFormatted}</span>
                  </div>
                </div>
                ${notesHtml}
              </div>
              <div class="crud-card-actions">
                <button class="crud-btn-edit" type="button" data-edit-id="${Number(item.id)}" title="Modify stay dates or guests">
                  Modify Dates
                </button>
                <button class="crud-btn-delete" type="button" data-delete-id="${Number(item.id)}" data-ref="${escapeHtml(item.booking_ref || "")}" title="Cancel this reservation">
                  Cancel Reservation
                </button>
              </div>
            </article>
          `;
        })
        .join("");
    }
  }

  let fullBookingsCache = [];

  async function loadBookings() {
    const search = encodeURIComponent(searchInput ? searchInput.value.trim() : "");
    const status = encodeURIComponent(filterSelect ? filterSelect.value : "All");
    try {
      const response = await fetch(
        `api.php?action=list&search=${search}&status=${status}`,
        { headers: { Accept: "application/json" } }
      );
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Unable to fetch bookings.");
      }

      // If unfiltered, update fullBookingsCache for pills
      if (search === "" && (status === "All" || status === "")) {
        fullBookingsCache = data.bookings;
      }
      renderBookingList(data.bookings, data.stats, fullBookingsCache.length ? fullBookingsCache : data.bookings);
    } catch (err) {
      showFeedback(err.message || "Unable to connect to reservation service.", true);
    }
  }

  function startEditBooking(id) {
    const record = cachedBookings.find((b) => Number(b.id) === Number(id));
    if (!record) return;
    clearFeedback();
    setActiveTab("book");
    if (receiptCard) {
      receiptCard.classList.remove("is-visible");
      receiptCard.hidden = true;
    }
    if (crudModal) {
      crudModal.classList.remove("is-fading-out");
      crudModal.hidden = false;
    }
    if (bookingForm) bookingForm.hidden = false;

    bookingIdInput.value = String(record.id);
    bookingStatusInput.value = record.status || "Confirmed";
    formModeTitle.textContent = `Modify Stay Dates — Reservation ${record.booking_ref || `#${record.id}`}`;
    submitBtn.textContent = "Save Stay Changes";
    cancelEditBtn.hidden = false;

    guestNameInput.value = record.guest_name;
    guestEmailInput.value = record.guest_email;
    suiteSelect.value = record.suite_code;
    checkInInput.value = record.check_in;
    checkOutInput.value = record.check_out;
    guestCountInput.value = String(record.guests);
    guestNotesInput.value = record.special_requests || "";
    updatePricePreview();
    updateSuitePreview(true);
    checkInInput.focus();
  }

  async function handleDeleteBooking(id, bookingRef = "") {
    clearFeedback();
    const confirmed = window.confirm("Are you sure you wish to cancel this sanctuary reservation?");
    if (!confirmed) return;

    try {
      const response = await fetch("api.php?action=delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ action: "delete", id: Number(id) }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to cancel reservation.");
      }
      if (Number(bookingIdInput.value) === Number(id)) {
        resetFormToCreate();
      }
      if (bookingRef) {
        removeMyReservationRef(bookingRef);
      }
      renderBookingList(data.bookings, data.stats);
      showFeedback("Your sanctuary reservation has been successfully cancelled.");
    } catch (err) {
      showFeedback(err.message || "Unable to cancel reservation at this time.", true);
    }
  }

  async function handleFormSubmit(event) {
    event.preventDefault();
    clearFeedback();

    const inTime = Date.parse(checkInInput.value);
    const outTime = Date.parse(checkOutInput.value);
    if (!Number.isFinite(inTime) || !Number.isFinite(outTime) || outTime <= inTime) {
      showFeedback("Check-out date must be strictly after check-in date.", true);
      return;
    }

    const editingId = Number(bookingIdInput.value || 0);
    const action = editingId > 0 ? "update" : "create";

    const payload = {
      action,
      id: editingId > 0 ? editingId : undefined,
      guest_name: guestNameInput.value.trim(),
      guest_email: guestEmailInput.value.trim(),
      suite_code: suiteSelect.value,
      check_in: checkInInput.value,
      check_out: checkOutInput.value,
      guests: Number(guestCountInput.value),
      status: "Confirmed",
      special_requests: guestNotesInput.value.trim(),
    };

    submitBtn.disabled = true;
    try {
      const response = await fetch(`api.php?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Could not confirm booking.");
      }

      const bookedSuiteName = SUITE_INFO[payload.suite_code]?.name || "Heritage Suite";
      const refCode = data.booking_ref || `MST-${Math.floor(1000 + Math.random() * 9000)}`;

      if (action === "create") {
        addMyReservationRef(refCode);
      }
      
      renderBookingList(data.bookings, data.stats);

      if (action === "create") {
        // High-end transition: Guest Room Booking fades away and Receipt Confirmation Card appears
        if (receiptRefCode) receiptRefCode.textContent = refCode;
        if (receiptMsg) receiptMsg.textContent = `We are preparing your suite above the Neretva.`;
        if (receiptDetails) {
          const nights = Math.max(1, Math.round((outTime - inTime) / 86400000));
          const total = (nights * (SUITE_INFO[payload.suite_code]?.rate || 240)).toFixed(2);
          receiptDetails.innerHTML = `
            <div><strong>Suite:</strong> ${escapeHtml(bookedSuiteName)}</div>
            <div><strong>Dates:</strong> ${escapeHtml(payload.check_in)} → ${escapeHtml(payload.check_out)} (${nights} nights)</div>
            <div><strong>Guests:</strong> ${Number(payload.guests)} | <strong>Contact:</strong> ${escapeHtml(payload.guest_email)}</div>
            <div><strong>Total Investment:</strong> €${total} (Taxes & Breakfast included)</div>
          `;
        }

        if (crudModal) {
          crudModal.classList.add("is-fading-out");
        }

        setTimeout(() => {
          if (crudModal) {
            crudModal.hidden = true;
          }
          if (receiptCard) {
            receiptCard.hidden = false;
            // Trigger reflow for smooth opacity/transform transition
            void receiptCard.offsetWidth;
            receiptCard.classList.add("is-visible");
          }
        }, 280);
      } else {
        resetFormToCreate(payload.suite_code);
        showFeedback(`Your stay changes have been saved successfully.`);
      }
    } catch (err) {
      showFeedback(err.message || "Please check your reservation details.", true);
    } finally {
      submitBtn.disabled = false;
    }
  }

  function initBookingCRUD() {
    setDefaultDates();
    loadBookings();

    if (openHeaderBtn) {
      openHeaderBtn.addEventListener("click", () => openBookingModal());
    }
    if (openPanelBtn) {
      openPanelBtn.addEventListener("click", () => openBookingModal());
    }
    if (closeCrudBtn) {
      closeCrudBtn.addEventListener("click", closeBookingModal);
    }
    if (crudBackdrop) {
      crudBackdrop.addEventListener("click", (event) => {
        if (event.target === crudBackdrop) {
          closeBookingModal();
        }
      });
    }
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && crudBackdrop.classList.contains("is-open")) {
        closeBookingModal();
      }
    });

    if (tabBookBtn) {
      tabBookBtn.addEventListener("click", () => setActiveTab("book"));
    }
    if (tabManageBtn) {
      tabManageBtn.addEventListener("click", () => setActiveTab("manage"));
    }

    if (suiteSelect) {
      suiteSelect.addEventListener("change", () => {
        updatePricePreview();
        updateSuitePreview(true);
      });
    }
    if (checkInInput) {
      checkInInput.addEventListener("change", updatePricePreview);
    }
    if (checkOutInput) {
      checkOutInput.addEventListener("change", updatePricePreview);
    }
    if (bookingForm) {
      bookingForm.addEventListener("submit", handleFormSubmit);
    }
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener("click", () => {
        clearFeedback();
        resetFormToCreate();
      });
    }

    // Receipt card actions
    if (receiptCopyBtn) {
      receiptCopyBtn.addEventListener("click", () => {
        const code = receiptRefCode ? receiptRefCode.textContent : "";
        if (code) {
          navigator.clipboard.writeText(code).then(() => {
            const label = receiptCopyBtn.querySelector(".copy-label");
            if (label) {
              label.textContent = "Copied!";
              setTimeout(() => { label.textContent = "Copy Code"; }, 2000);
            }
          }).catch(() => {});
        }
      });
    }

    if (receiptViewBookingsBtn) {
      receiptViewBookingsBtn.addEventListener("click", () => {
        if (receiptCard) {
          receiptCard.classList.remove("is-visible");
          receiptCard.hidden = true;
        }
        if (crudModal) {
          crudModal.classList.remove("is-fading-out");
          crudModal.hidden = false;
        }
        setActiveTab("manage");
      });
    }

    if (receiptBookAnotherBtn) {
      receiptBookAnotherBtn.addEventListener("click", () => {
        resetFormToCreate();
        setActiveTab("book");
      });
    }

    if (emptyBookBtn) {
      emptyBookBtn.addEventListener("click", () => {
        setActiveTab("book");
      });
    }

    if (searchInput) searchInput.addEventListener("input", () => loadBookings());
    if (filterSelect) {
      filterSelect.addEventListener("change", () => loadBookings());
    }

    if (bookingListEl) {
      bookingListEl.addEventListener("click", (event) => {
        const editBtn = event.target.closest("[data-edit-id]");
        if (editBtn) {
          startEditBooking(Number(editBtn.dataset.editId));
          return;
        }
        const deleteBtn = event.target.closest("[data-delete-id]");
        if (deleteBtn) {
          const ref = deleteBtn.dataset.ref || "";
          handleDeleteBooking(Number(deleteBtn.dataset.deleteId), ref);
        }
      });
    }

    document.querySelectorAll(".site-nav a[data-scroll-to]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const offset = Number(link.dataset.scrollTo || 0);
        window.scrollTo({ top: offset, behavior: "smooth" });
      });
    });
  }

  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", () => {
    updateSightSlider();
    requestTick();
  });
  window.addEventListener(
    "pointermove",
    (event) => {
      targetMouseX = event.clientX / window.innerWidth - 0.5;
      targetMouseY = event.clientY / window.innerHeight - 0.5;
      requestTick();
    },
    { passive: true }
  );

  if (prevBtn) {
    prevBtn.addEventListener("click", () => moveSightSlider(-1));
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => moveSightSlider(1));
  }

  setupSightSlider();
  initBookingCRUD();
  requestTick();
})();
