# TVHUB — Cinema Hub & Movie Library
### Full-Stack Web Developer Interview Evaluation Test Submission
---

## 📖 Executive Summary

**TVHUB** is a modern, responsive, accessible full-stack web application developed as a submission for the **Web Developer Interview Evaluation Test**. 

The application meticulously follows the provided **Figma design specifications** while implementing all core requirements and optional advanced criteria:
- **Figma Design Reference**: [Figma Design File (Test — Node 0:1)](https://www.figma.com/file/6FDTiXOX7dvEmhk9dCJyym/Test?type=design&node-id=0:1&mode=dev)
---

## ⚡ Quick Start & Local Execution

### Prerequisites
- **PHP 8.0+** (verified on PHP 8.3 CLI)
- Any modern web browser (**Google Chrome, Mozilla Firefox, Microsoft Edge, Apple Safari**)

### Running the Application Locally
1. Clone the repository and navigate into the root directory:
   ```bash
   git clone https://github.com/Ashen06C/tvhub.git
   cd tvhub
   ```

2. Start the built-in PHP development server:
   ```bash
   php -S 127.0.0.1:8000 -t .
   ```

3. Open your browser and navigate to:
   ```
   http://127.0.0.1:8000
   ```
   *(Alternatively, `index.html` is provided in the root directory for immediate client-side evaluation without a local PHP server).*


## 🏗️ Project Architecture

```
tvhub/
├── .gitignore              # Ignores OS cache, editor files (.vscode/.idea), and temp logs
├── README.md               # Project documentation and submission overview
├── index.php               # Primary full-stack entry point (CSRF generation, PHP session, HTML5)
├── index.html              # Static mirror for standalone client-side preview
├── api/
│   ├── contact.php         # RESTful contact form endpoint (validation, JSON storage, dual email dispatch)
│   └── submissions.php     # Read-only inspector endpoint for evaluation review
├── assets/
│   └── images/
├── css/
│   └── style.css           # Vanilla CSS design system, typography, animations, responsive queries & RTL
├── data/
│   ├── submissions.json    # Persistent JSON storage for contact form submissions
│   └── mail_log.json       # Outgoing email dispatch ledger (recipients, subjects, HTML bodies)
└── js/
    └── app.js              # Application logic: TVMaze API, grid state, validation, modal, RTL & drawer
```

---

## 📧 Dual Email Dispatch System

The backend (`api/contact.php`) handles the contact form submission and generates two responsive, branded HTML emails:

```
                      ┌─────────────────────────┐
                      │   Contact Form Submit   │
                      └────────────┬────────────┘
                                   │
                     [Validation & Anti-CSRF Check]
                                   │
                     ┌─────────────┴─────────────┐
                     ▼                           ▼
        ┌─────────────────────────┐ ┌─────────────────────────┐
        │  1. User Auto-Response  │ │ 2. Admin Notification   │
        ├─────────────────────────┤ ├─────────────────────────┤
        │ • Sent to: Submitter    │ │ • Sent to:              │
        │ • Branded confirmation  │ │   [EMAIL_ADDRESS]│
        │ • Includes Reference ID │ │ • Full inquiry details  │
        │ • Estimated reply time  │ │ • Direct "Reply" mailto │
        └────────────┬────────────┘ └────────────┬────────────┘
                     │                           │
                     └─────────────┬─────────────┘
                                   ▼
                      ┌─────────────────────────┐
                      │  Logged in mail_log.json│
                      │  Saved in submissions.json
                      └─────────────────────────┘
```

1. **User Auto-Response Confirmation**:
   - **Recipient**: Submitter's email address
   - **Subject**: `Thank you for contacting TVHUB Movie Hub - Reference: SUB-XXXXXX`
   - **Body**: Responsive dark-themed cinema template confirming receipt, reiterating their submitted inquiry, providing their unique tracking Reference ID, and customer care contact details.

2. **Administrative Notification**:
   - **Recipient**: `[EMAIL_ADDRESS]`
   - **Subject**: `[New Contact Submission] {FirstName} {LastName} - Ref: SUB-XXXXXX`
   - **Body**: Clean administrative layout detailing the user's name, email, phone number, message, IP address, user-agent, timestamp, and a one-click **Reply Directly to Guest** button.

3. **Storage & Verification**:
   - All submissions are atomically recorded in `data/submissions.json`.
   - All outgoing email transmissions are recorded in `data/mail_log.json` for auditing and inspection.
   - Evaluators can inspect captured records directly or query `api/submissions.php?action=submissions` and `api/submissions.php?action=mail_logs`.

---

## 🎬 TVMaze API & Interactive Features

- **Live Autocomplete Search**: Debounced keystroke input queries `https://api.tvmaze.com/search/shows?q={query}` in real time.
- **Dynamic Grid Management**: Users can add any show from the search results directly into the cinema grid. Cards persist in `localStorage` across page reloads.
- **Show Details Modal**: Clicking on any movie card or preview opens an accessible modal with high-resolution poster art, show synopsis, average rating, network, premiere year, and cast list.
- **RTL Localization**: Clicking the **RTL / LTR** button toggles document direction, properly mirroring layouts, padding, text alignments, search dropdowns, and the mobile drawer.

---

## ♿ Accessibility (WCAG 2.1 Level AA)

- **Keyboard Traversal**: Entire UI is navigable using `Tab`, `Shift+Tab`, `Enter`, `Space`, and `Escape` (dismisses active modals and drawers).
- **Visible Focus**: High-contrast gold focus indicators (`:focus-visible`) on all interactive inputs and buttons.
- **Screen Reader Support**: Semantic HTML tags combined with ARIA roles (`role="dialog"`, `role="alert"`, `aria-expanded`, `aria-live="polite"`).
- **Skip Navigation**: Accessible hidden skip link (`#main-content`) allowing screen reader and keyboard users to bypass navigation.
- **Reduced Motion**: Respects user operating system settings via `@media (prefers-reduced-motion: reduce)`.

---

## 👨‍💻 Candidate Details

- **Candidate Name**: Ashen Wijesinghe
- **Repository**: [https://github.com/Ashen06C/tvhub](https://github.com/Ashen06C/tvhub)
