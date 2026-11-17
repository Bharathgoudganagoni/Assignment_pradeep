/**
 * =========================================================================
 *  ENECTRON "ENQUIRE NOW" FORM - FULL-STACK BACKEND API CLIENT
 * =========================================================================
 * 
 *  Preserves 100% of the existing website design, animations, phone formatting,
 *  and top pop-up notification toast while connecting seamlessly to the
 *  Node.js / Express backend API (POST /api/enquiry).
 */

// =========================================================================
// 🌐 BACKEND API ENDPOINT RESOLVER
// =========================================================================
function getApiEndpoint() {
  // 1. Explicit override via window.ENV_API_URL if configured
  if (typeof window.ENV_API_URL === 'string' && window.ENV_API_URL.trim() !== '') {
    return window.ENV_API_URL.trim().replace(/\/+$/, '') + '/api/enquiry';
  }

  // 2. When running on a separate local dev server (e.g. Live Server on 3000 / 5500)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    if (window.location.port !== '5000') {
      return 'http://localhost:5000/api/enquiry';
    }
  }

  // 3. Fallback when opened directly via file:// protocol
  if (window.location.protocol === 'file:') {
    return 'http://localhost:5000/api/enquiry';
  }

  // 4. Default relative URL when served directly by Express (single-server local or Render)
  return '/api/enquiry';
}

// =========================================================================
// 🔔 PROFESSIONAL TOP POP-UP NOTIFICATION (TOAST)
// =========================================================================
class TopNotificationManager {
  constructor() {
    this.toast = document.getElementById("topToast");
    this.title = document.getElementById("toastTitle");
    this.message = document.getElementById("toastMessage");
    this.progressBar = document.getElementById("toastProgressBar");
    this.closeBtn = document.getElementById("toastCloseBtn");
    this.iconWrapper = document.getElementById("toastIconWrapper");

    this.successIcon = document.getElementById("toastSuccessIcon");
    this.errorIcon = document.getElementById("toastErrorIcon");
    this.infoIcon = document.getElementById("toastInfoIcon");

    this.dismissTimeout = null;
    this.progressInterval = null;
    this.remainingMs = 0;
    this.totalDuration = 5000;
    this.paused = false;

    this.initEvents();
  }

  initEvents() {
    this.closeBtn.addEventListener("click", () => this.hide());

    // Pause countdown on hover so user can easily read message
    this.toast.addEventListener("mouseenter", () => {
      this.paused = true;
      if (this.progressBar) {
        this.progressBar.style.animationPlayState = "paused";
      }
    });

    this.toast.addEventListener("mouseleave", () => {
      this.paused = false;
      if (this.progressBar) {
        this.progressBar.style.animationPlayState = "running";
      }
    });
  }

  show({ title, message, type = "success", duration = 5000 }) {
    if (this.dismissTimeout) clearTimeout(this.dismissTimeout);
    if (this.progressInterval) clearInterval(this.progressInterval);

    this.totalDuration = duration;
    this.remainingMs = duration;
    this.paused = false;

    // Set text
    this.title.textContent = title;
    this.message.textContent = message;

    // Set classes for toast type
    this.toast.classList.remove("toast-success", "toast-error", "toast-info");
    this.toast.classList.add(`toast-${type}`);

    // Update icons
    this.successIcon.classList.add("hidden");
    this.errorIcon.classList.add("hidden");
    this.infoIcon.classList.add("hidden");

    if (type === "success") {
      this.successIcon.classList.remove("hidden");
    } else if (type === "error") {
      this.errorIcon.classList.remove("hidden");
    } else {
      this.infoIcon.classList.remove("hidden");
    }

    // Reset and trigger progress bar animation
    this.progressBar.style.transition = "none";
    this.progressBar.style.width = "100%";
    
    // Force DOM reflow
    void this.progressBar.offsetWidth;

    // Slide down smoothly
    this.toast.classList.add("toast-visible");

    // Audio chime feedback via Web Audio API
    this.playNotificationSound(type);

    // Animate progress bar smoothly
    this.progressInterval = setInterval(() => {
      if (!this.paused) {
        this.remainingMs -= 50;
        const percent = Math.max(0, (this.remainingMs / this.totalDuration) * 100);
        this.progressBar.style.width = `${percent}%`;

        if (this.remainingMs <= 0) {
          clearInterval(this.progressInterval);
          this.hide();
        }
      }
    }, 50);
  }

  hide() {
    if (this.dismissTimeout) clearTimeout(this.dismissTimeout);
    if (this.progressInterval) clearInterval(this.progressInterval);
    this.toast.classList.remove("toast-visible");
  }

  playNotificationSound(type) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      if (type === "success") {
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.setValueAtTime(880.00, now + 0.08); // A5

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.35);
      } else if (type === "error") {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.setValueAtTime(260, now + 0.1);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {
      // Audio autoplay restrictions; fail silently
    }
  }
}

// =========================================================================
// 🚀 DOM INITIALIZATION & EVENT LOGIC
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
  const toastManager = new TopNotificationManager();

  const form = document.getElementById("enquiryForm");
  const submitBtn = document.getElementById("submitBtn");
  const btnText = submitBtn.querySelector(".btn-text");
  const btnArrow = submitBtn.querySelector(".btn-arrow");
  const btnSpinner = submitBtn.querySelector(".btn-spinner");

  // Inputs
  const nameInput = document.getElementById("userName");
  const mobileInput = document.getElementById("mobileNumber");
  const emailInput = document.getElementById("userEmail");
  const companyInput = document.getElementById("companyName");
  const applicationSelect = document.getElementById("applicationUseCase");
  const requirementTextarea = document.getElementById("userRequirement");

  // Error placeholders
  const nameError = document.getElementById("userNameError");
  const mobileError = document.getElementById("mobileNumberError");
  const emailError = document.getElementById("userEmailError");

  // =========================================================================
  // 📱 SMART MOBILE NUMBER FORMATTING & STRICT DIGIT LIMITS
  // =========================================================================
  const DEFAULT_COUNTRY_CODE = "+91";
  const DEFAULT_MAX_DIGITS = 10; // Exactly 10 digits for India

  function getCountryDetails(val) {
    if (val.startsWith("+1")) return { code: "+1", maxDigits: 10 };
    if (val.startsWith("+44")) return { code: "+44", maxDigits: 10 };
    if (val.startsWith("+971")) return { code: "+971", maxDigits: 9 };
    if (val.startsWith("+")) {
      const match = val.match(/^\+\d{1,3}/);
      if (match) return { code: match[0], maxDigits: 10 };
    }
    return { code: DEFAULT_COUNTRY_CODE, maxDigits: DEFAULT_MAX_DIGITS };
  }

  function extractSubscriberDigits(rawVal) {
    const { code, maxDigits } = getCountryDetails(rawVal);
    let afterCode = "";
    if (rawVal.startsWith(code)) {
      afterCode = rawVal.slice(code.length);
    } else {
      afterCode = rawVal.replace(/^\+91/, "").replace(/^\+/, "");
    }
    // Only digits, strictly up to maxDigits
    return {
      code,
      maxDigits,
      digits: afterCode.replace(/\D/g, "").slice(0, maxDigits)
    };
  }

  // Block extra digits at the keyboard level
  mobileInput.addEventListener("keydown", (e) => {
    const navKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter", "Home", "End"];
    if (navKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
      return;
    }

    if (/^\d$/.test(e.key)) {
      const { digits, maxDigits } = extractSubscriberDigits(mobileInput.value);
      const hasSelection = mobileInput.selectionStart !== mobileInput.selectionEnd;
      if (digits.length >= maxDigits && !hasSelection) {
        e.preventDefault(); // Strictly block extra digit
      }
    } else if (!/^[0-9+ ]$/.test(e.key)) {
      e.preventDefault(); // Strictly block non-numeric characters
    }
  });

  // Format on input
  mobileInput.addEventListener("input", () => {
    const raw = mobileInput.value;
    if (!raw.trim()) {
      mobileInput.value = "";
      return;
    }

    const { code, digits, maxDigits } = extractSubscriberDigits(raw);

    if (digits.length > 5 && maxDigits === 10) {
      mobileInput.value = `${code} ${digits.slice(0, 5)} ${digits.slice(5)}`;
    } else if (digits.length > 0) {
      mobileInput.value = `${code} ${digits}`;
    } else {
      mobileInput.value = `${code} `;
    }

    if (mobileInput.classList.contains("input-invalid")) {
      validateMobile();
    }
  });

  mobileInput.addEventListener("focus", () => {
    if (!mobileInput.value.trim()) {
      mobileInput.value = `${DEFAULT_COUNTRY_CODE} `;
    }
  });

  mobileInput.addEventListener("blur", () => {
    const { digits } = extractSubscriberDigits(mobileInput.value);
    if (!digits) {
      mobileInput.value = "";
      mobileInput.classList.remove("input-invalid");
      mobileError.textContent = "";
    } else {
      validateMobile();
    }
  });

  // =========================================================================
  // 📋 FORM VALIDATION
  // =========================================================================
  function validateName() {
    const val = nameInput.value.trim();
    if (!val) {
      nameInput.classList.add("input-invalid");
      nameError.textContent = "Please enter your name";
      return false;
    }
    if (val.length < 2) {
      nameInput.classList.add("input-invalid");
      nameError.textContent = "Name must be at least 2 characters";
      return false;
    }
    nameInput.classList.remove("input-invalid");
    nameError.textContent = "";
    return true;
  }

  function validateMobile() {
    const raw = mobileInput.value.trim();
    const { digits, maxDigits } = extractSubscriberDigits(raw);

    if (!raw || !digits) {
      mobileInput.classList.add("input-invalid");
      mobileError.textContent = "Please enter your mobile number";
      return false;
    }

    if (digits.length < maxDigits) {
      mobileInput.classList.add("input-invalid");
      mobileError.textContent = `Please enter a valid ${maxDigits}-digit mobile number (${digits.length}/${maxDigits} digits)`;
      return false;
    }

    mobileInput.classList.remove("input-invalid");
    mobileError.textContent = "";
    return true;
  }

  function validateEmail() {
    const val = emailInput.value.trim();
    if (!val) {
      emailInput.classList.add("input-invalid");
      emailError.textContent = "Please enter your email address";
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
      emailInput.classList.add("input-invalid");
      emailError.textContent = "Please enter a valid email address";
      return false;
    }
    emailInput.classList.remove("input-invalid");
    emailError.textContent = "";
    return true;
  }

  nameInput.addEventListener("input", () => {
    if (nameInput.classList.contains("input-invalid")) validateName();
  });

  emailInput.addEventListener("input", () => {
    if (emailInput.classList.contains("input-invalid")) validateEmail();
  });

  // =========================================================================
  // 🚀 SUBMIT HANDLER (CONNECTS TO BACKEND POST /api/enquiry)
  // =========================================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Client-side field validations
    const isNameValid = validateName();
    const isMobileValid = validateMobile();
    const isEmailValid = validateEmail();

    if (!isNameValid || !isMobileValid || !isEmailValid) {
      if (!isNameValid) nameInput.focus();
      else if (!isMobileValid) mobileInput.focus();
      else if (!isEmailValid) emailInput.focus();

      toastManager.show({
        title: "Please Complete Required Fields",
        message: "Check the highlighted fields before submitting your enquiry.",
        type: "error",
        duration: 4000
      });
      return;
    }

    // 2. Prevent multiple simultaneous clicks & set loading UI state
    setLoadingState(true);

    const { code, digits } = extractSubscriberDigits(mobileInput.value);
    const formattedPhone = `${code} ${digits}`;

    // Payload matching backend API schema
    const payload = {
      user_name: nameInput.value.trim(),
      mobile_number: formattedPhone,
      user_email: emailInput.value.trim(),
      company_name: companyInput.value.trim() || null,
      application: applicationSelect.value || null,
      requirement: requirementTextarea.value.trim() || null
    };

    const targetUrl = getApiEndpoint();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const progressTimer = setTimeout(() => {
      if (submitBtn.disabled) {
        btnText.textContent = "Connecting to mail server...";
      }
    }, 4000);

    try {
      // 3. Send to Node.js backend using fetch API
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      clearTimeout(progressTimer);

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        let errorMsg = "Unable to process your enquiry. Please try again.";
        if (data && data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          errorMsg = data.errors.join(" ");
        } else if (data && data.message) {
          errorMsg = data.message;
        } else if (response.status === 429) {
          errorMsg = "Too many requests. Please wait a few moments before trying again.";
        }

        throw new Error(errorMsg);
      }

      // 4. Success Response Handling
      setLoadingState(false);

      const customerName = payload.user_name;
      toastManager.show({
        title: "Enquiry Submitted Successfully!",
        message: `Thank you, ${customerName}! Your enquiry has been received. Our team will connect with you shortly.`,
        type: "success",
        duration: 5500
      });

      // 5. Clean form reset
      form.reset();
      nameInput.classList.remove("input-invalid");
      mobileInput.classList.remove("input-invalid");
      emailInput.classList.remove("input-invalid");
      nameError.textContent = "";
      mobileError.textContent = "";
      emailError.textContent = "";

    } catch (error) {
      clearTimeout(timeoutId);
      clearTimeout(progressTimer);
      console.error("[Submission Error]", error);
      setLoadingState(false);

      let displayMsg = error.message;
      if (error.name === "AbortError") {
        displayMsg = "Request timed out. The server took too long to respond. If hosted on Render, the free server may be waking up from sleep — please try again in a moment.";
      } else if (error instanceof TypeError && error.message.includes("fetch")) {
        displayMsg = "Cannot connect to backend server. Please verify your internet connection or check that the server is online.";
      }

      toastManager.show({
        title: "Submission Failed",
        message: displayMsg,
        type: "error",
        duration: 6500
      });
    }
  });

  function setLoadingState(loading) {
    if (loading) {
      submitBtn.disabled = true;
      btnText.textContent = "Sending Enquiry...";
      btnArrow.classList.add("hidden");
      btnSpinner.classList.remove("hidden");
    } else {
      submitBtn.disabled = false;
      btnText.textContent = "Submit Enquiry";
      btnArrow.classList.remove("hidden");
      btnSpinner.classList.add("hidden");
    }
  }
});
