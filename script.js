/**
 * =========================================================================
 *  ENECTRON "ENQUIRE NOW" FORM - EMAILJS & INTERACTION LOGIC
 * =========================================================================
 */

// =========================================================================
// 📧 EMAILJS CREDENTIALS
// =========================================================================
const EMAILJS_CONFIG = {
  SERVICE_ID: "service_wx37etm",
  TEMPLATE_ID: "template_uohzi5v",
  PUBLIC_KEY: "1lTzxmddJ_9rdgyxN"
};

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

    // Pause on hover so the user can easily read the message
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
    // Clear any existing timers
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
        const osc2 = ctx.createOscillator();
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
      // Audio autoplay may be prevented before user gesture; gracefully ignore
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

  // Initialize EmailJS immediately
  if (window.emailjs && EMAILJS_CONFIG.PUBLIC_KEY) {
    try {
      window.emailjs.init({ publicKey: EMAILJS_CONFIG.PUBLIC_KEY });
    } catch (err) {
      console.error("EmailJS initialization error:", err);
    }
  }

  // =========================================================================
  // 📱 SMART MOBILE NUMBER FORMATTING & STRICT DIGIT LIMITS
  // =========================================================================
  const DEFAULT_COUNTRY_CODE = "+91";
  const DEFAULT_MAX_DIGITS = 10; // Exactly 10 digits for +91 (India)

  // Determine active country code and max allowed digits
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

  // Extract subscriber digits (excluding country code)
  function extractSubscriberDigits(rawVal) {
    const { code, maxDigits } = getCountryDetails(rawVal);
    let afterCode = "";
    if (rawVal.startsWith(code)) {
      afterCode = rawVal.slice(code.length);
    } else {
      afterCode = rawVal.replace(/^\+91/, "").replace(/^\+/, "");
    }
    // Only digits, strictly up to maxDigits - NO extra numbers allowed!
    return {
      code,
      maxDigits,
      digits: afterCode.replace(/\D/g, "").slice(0, maxDigits)
    };
  }

  // Block extra digits at the keyboard level
  mobileInput.addEventListener("keydown", (e) => {
    // Allow navigation, delete, backspace, tab, enter, copy/paste shortcuts
    const navKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter", "Home", "End"];
    if (navKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
      return;
    }

    // If typing a digit, check if maximum subscriber digits are already reached
    if (/^\d$/.test(e.key)) {
      const { digits, maxDigits } = extractSubscriberDigits(mobileInput.value);
      // Check if user has selected text to replace
      const hasSelection = mobileInput.selectionStart !== mobileInput.selectionEnd;
      if (digits.length >= maxDigits && !hasSelection) {
        e.preventDefault(); // STRICTLY BLOCK extra number!
      }
    } else if (!/^[0-9+ ]$/.test(e.key)) {
      e.preventDefault(); // STRICTLY BLOCK non-numeric characters!
    }
  });

  // Format on input: maintains +91 prefix and spaces (e.g. +91 98765 43210)
  mobileInput.addEventListener("input", () => {
    let raw = mobileInput.value;
    
    // If field is cleared, reset cleanly
    if (!raw.trim()) {
      mobileInput.value = "";
      return;
    }

    const { code, digits, maxDigits } = extractSubscriberDigits(raw);

    // Format subscriber digits into chunks (e.g., 5 + 5 for 10 digits)
    if (digits.length > 5 && maxDigits === 10) {
      mobileInput.value = `${code} ${digits.slice(0, 5)} ${digits.slice(5)}`;
    } else if (digits.length > 0) {
      mobileInput.value = `${code} ${digits}`;
    } else {
      mobileInput.value = `${code} `;
    }

    // Real-time validation
    if (mobileInput.classList.contains("input-invalid")) {
      validateMobile();
    }
  });

  // On focus: auto-populate +91 default if field is empty
  mobileInput.addEventListener("focus", () => {
    if (!mobileInput.value.trim()) {
      mobileInput.value = `${DEFAULT_COUNTRY_CODE} `;
    }
  });

  // On blur: if user only left "+91 " with no digits, clear it back to placeholder
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

  // Clear errors on real-time typing
  nameInput.addEventListener("input", () => {
    if (nameInput.classList.contains("input-invalid")) validateName();
  });

  emailInput.addEventListener("input", () => {
    if (emailInput.classList.contains("input-invalid")) validateEmail();
  });

  // =========================================================================
  // 🚀 SUBMIT HANDLER (EMAILJS)
  // =========================================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validate required fields
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

    // UI Loading State
    setLoadingState(true);

    const { code, digits } = extractSubscriberDigits(mobileInput.value);
    const formattedPhone = `${code} ${digits}`;

    // Prepare complete template parameters (with aliases for any EmailJS template configuration)
    const formData = {
      // Name variables
      user_name: nameInput.value.trim(),
      name: nameInput.value.trim(),
      from_name: nameInput.value.trim(),

      // Mobile / Phone variables
      mobile_number: formattedPhone,
      phone: formattedPhone,
      contact_number: formattedPhone,

      // Email variables
      user_email: emailInput.value.trim(),
      email: emailInput.value.trim(),
      reply_to: emailInput.value.trim(),
      from_email: emailInput.value.trim(),

      // Company variables
      company_name: companyInput.value.trim() || "Not specified",
      company: companyInput.value.trim() || "Not specified",
      organisation: companyInput.value.trim() || "Not specified",

      // Application / Use Case variables
      application: applicationSelect.value || "Not selected",
      use_case: applicationSelect.value || "Not selected",
      application_use_case: applicationSelect.value || "Not selected",

      // Requirement / Message variables
      requirement: requirementTextarea.value.trim() || "No specific requirement provided",
      message: requirementTextarea.value.trim() || "No specific requirement provided",

      // Timestamps
      submission_time: new Date().toLocaleString(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    };

    try {
      if (!window.emailjs) {
        throw new Error("EmailJS SDK not loaded. Please check your internet connection.");
      }

      // Initialize with public key
      window.emailjs.init({ publicKey: EMAILJS_CONFIG.PUBLIC_KEY });

      // Send enquiry email
      const response = await window.emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        formData
      );

      console.log("EmailJS Sent Successfully:", response);
      setLoadingState(false);

      // Show professional top pop-up notification
      toastManager.show({
        title: "Enquiry Submitted Successfully!",
        message: `Thank you, ${formData.user_name}! The ENECTRON team has received your enquiry and will connect with you shortly.`,
        type: "success",
        duration: 5500
      });

      // Reset form fields
      form.reset();
      nameInput.classList.remove("input-invalid");
      mobileInput.classList.remove("input-invalid");
      emailInput.classList.remove("input-invalid");
      nameError.textContent = "";
      mobileError.textContent = "";
      emailError.textContent = "";

    } catch (error) {
      console.error("Submission Error:", error);
      setLoadingState(false);

      const errorMsg = error && (error.text || error.message) 
        ? (error.text || error.message) 
        : "Failed to send email. Please check your internet connection.";

      toastManager.show({
        title: "Submission Error",
        message: `Could not send enquiry: ${errorMsg}`,
        type: "error",
        duration: 6000
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
