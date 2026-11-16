# Enquire Now Form - ENECTRON

An exact, pixel-perfect replication of the **ENECTRON "Enquire Now"** corporate enquiry form with direct EmailJS transmission and a professional top pop-up notification toast.

---

## 📸 Features & Visual Fidelity

- **100% Exact Clean Layout**:
  - Pure, uncluttered presentation matching the original design.
  - **Brand Accent Bar**: Vertical berry-magenta bar (`#9a2579`) spanning alongside the bold title and subtitle.
  - **Signature Gradient Button**: Smooth multi-stop linear gradient from rich magenta (`#9b2386`) through violet (`#6b2377` / `#2d2460`) to midnight navy (`#0b214f`) with animated hover arrow transition.
  - **Rounded Modern Card**: 28px smooth border-radius, pure white card with elevation shadow on a subtle cool-slate background gradient.
  - **Typography**: Clean, geometric `Plus Jakarta Sans` font with calibrated weights (400, 600, 700, 800).
  - **Form Controls**: Perfectly proportioned 48px height inputs, rounded corners (12px), custom select arrow chevron, and requirement textarea with resize grip.
  - **Disclaimer**: Exact centered footer note matching the original layout.

- **📱 Smart Mobile Number Formatting & Strict Limit**:
  - **Default Prefix**: Automatically defaults to `+91 ` (India).
  - **Country Code Validation**: Strictly enforces exactly **10 digits** after `+91 `.
  - **No Extra Numbers Allowed**: Blocks typing beyond the 10-digit limit at both keyboard and input levels.
  - **Digit-Only Filter**: Automatically blocks any non-numeric characters.
  - **Automatic Spacing**: Cleanly formats as `+91 XXXXX XXXXX` (e.g. `+91 98765 43210`).

- **🔔 Professional Top Pop-up Notification (Toast)**:
  - Appears smoothly from the top of the viewport with spring-easing animation.
  - Features an animated countdown progress bar (5 seconds).
  - Automatically pauses countdown on mouse hover so the user can comfortably read it.
  - Supports Success and Error states with distinct icons and accents.
  - Subtle native audio chime via Web Audio API.

- **📧 Direct EmailJS Integration**:
  - Configured with your credentials:
    - **Service ID**: `service_wx37etm`
    - **Template ID**: `template_uohzi5v`
    - **Public Key**: `1lTzxmddJ_9rdgyxN`
  - Runs silently in the background with a loading spinner on the submit button.
  - Compatible with common template variables (`{{user_name}}`, `{{mobile_number}}`, `{{user_email}}`, `{{company_name}}`, `{{application}}`, `{{requirement}}`, `{{submission_time}}`).

---

## 🚀 How to Run the Project

1. Simply double-click **`index.html`** to open it directly in any web browser.
2. Fill out the fields and submit!

---

## 📁 File Structure

```
Assignment/
├── index.html        # Clean HTML5 structure matching the exact reference image
├── style.css         # Complete pixel-perfect styling, animations & responsive media queries
├── script.js         # Silent EmailJS submission, smart phone formatting & top toast pop-up
└── README.md         # Documentation
```
