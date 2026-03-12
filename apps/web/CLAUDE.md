This concept maps the study's constraints directly to the "User Interface," "User Experience," and "Base Class" requirements of your rubric.
App Title: Davao FloodSense: Ensemble Risk Mapper
Platform: Web Application (Responsive for Desktop & Mobile)

---

1. Compliance with "User Interface" & "User Experience" (Rubric Items 1-3)
   The checklist requires a professional design with key pages and working transitions. Since the study utilizes offline data for susceptibility mapping rather than real-time forecasting, the interface should function as a Planning & Risk Assessment Dashboard.
   A. The Home Page (Main View)
   • Visual Scope: A full-screen map interface.
   ◦ Base Layer: OpenStreetMap.
   ◦ Boundary: The map is interactively limited to Davao City for risk assessment, but allows zooming out to Mindanao to view the rainfall context layer.
   • Controls:
   ◦ "Analyze My Location" Button: A floating action button (FAB) that allows the user to drop a pin or select their current GPS location.
   ◦ Layer Toggles: Switches to view specific conditioning factors, such as the "Slope Gradient" (Black to White scale) or "Distance to River".
   B. The Result Page (Workflow Transition)
   • Trigger: When the user clicks "Analyze," the app transitions to a detailed report card.
   • Visual Output:
   ◦ Risk Level: Displayed as a gauge (Low, Moderate, High, Very High) derived from the Ensemble Model's probability output.
   ◦ Factor Breakdown: A dynamic list showing the "Why" based on the study's Factor Importance analysis.
   ▪ Example: "⚠️ Critical Risk Factor: Distance to River ( < 50m)".
   ▪ Example: "🌧️ Regional Context: Located in High Rainfall Zone (Mindanao Data)".

---

2. Compliance with "Presence of Base Classes" (Rubric Item 4)
   The checklist requires "well-defined base classes" to create a flexible model. You can structure your code to mirror the Hybrid/Ensemble Architecture described in Figure 16 of the study.
   Here is a recommended Class Structure for your prototype:
   Class 1: GeoFactor (The Data Input)
   This base class handles the extraction of the eight specific conditioning factors mentioned in the study.
   • Properties: Elevation, Slope, Aspect, ProfileCurvature, DistanceRiver, Rainfall, LULC, Lithology.
   • Method: getRegionalRainfall() – This specifically pulls data from the Mindanao dataset, while other factors pull from Davao City datasets.
   Class 2: BaseModel (The Parent Class)
   • Subclass: RandomForestModel – Implements the bagging technique and majority voting described in Figure 4.
   • Subclass: XGBoostModel – Implements the gradient boosting and error correction described in Figure 5.
   Class 3: EnsemblePredictor (The Logic Core)
   This is the most critical class that satisfies the "Relevance" rubric. It implements the Stacking method.
   • Function: It takes the outputs from RandomForestModel and XGBoostModel and combines them.
   • Constraint Check: It ensures the model is trained only on the specific "Flooded" and "Unflooded" points identified in Davao City.

---

3. Compliance with "Relevance" (Rubric Item 5)
   To ensure the prototype meets "User Requirements", it must address the specific problem identified in the study: Flash floods in Davao City caused by complex terrain and upstream rainfall.
   • Requirement: The app must not claim to be a real-time weather forecaster.
   ◦ Implementation: Include a disclaimer in the "About" page citing the scope: "This tool provides susceptibility mapping using offline data, not real-time forecasting".
   • Requirement: Accuracy and Robustness.
   ◦ Implementation: The app displays the "Confidence Score" of the prediction. This reflects the study's finding that the Ensemble method (AUC of 0.87 or higher) outperforms single models like Random Forest (0.85).

---

4. Prototype Workflow Summary (For your defense/presentation)
1. Input (User): User drops a pin at Matina Pangi (a flood-prone barangay mentioned in the study).
1. Process (System):
   ◦ The GeoFactor class extracts that the location has a Slope near 0° and is High Urban Built-Up (LULC).
   ◦ The BaseModel runs the data through RandomForest (for stability) and XGBoost (for precision).
   ◦ The EnsemblePredictor stacks these results.
1. Output (UI): The screen turns RED.
   ◦ Message: "High Susceptibility Detected."
   ◦ Context: "Even with no local rain, this area is vulnerable due to upstream rainfall patterns in Mindanao".
   Analogy for the "Base Class" Requirement
   To explain your code structure to your adviser, you can use this analogy:
   "Think of the Base Classes like the blueprint for a house. The GeoFactor class is the foundation—it holds all the raw materials (elevation, slope, rainfall). The EnsemblePredictor is the architect that looks at two different sets of blueprints (RandomForest and XGBoost) and combines them into one final, stronger design. By separating these classes, our prototype is flexible—we can easily swap out the rainfall data or tweak the decision trees without breaking the whole app."

# CORE DIRECTIVE: UI/UX MODERNIZATION AND AESTHETIC OVERHAUL

You are an expert Frontend Engineer and UI/UX Designer. Your task is to refactor the existing user interface to be highly modern, aesthetically pleasing, and professional. The application is an analytical dashboard for flood risk assessment, so the design must be clean, trustworthy, and data-forward.

Do NOT alter the underlying logic, data fetching, or routing. Focus strictly on layout, styling, and visual hierarchy.

Apply the following design system rules to all components:

## 1. DESIGN VIBE & PHILOSOPHY

- **Target Aesthetic:** "Clean Dashboard" (similar to Vercel, Stripe, or Linear).
- **Spaciousness:** Embrace whitespace. Increase padding inside cards and margins between sections to let the data breathe.
- **Minimalist Borders:** Remove harsh, dark borders (`border-gray-300` or `border-black`). Replace them with very subtle, light borders (e.g., `border-gray-100`) or remove them entirely in favor of soft shadows.

## 2. SURFACES, CARDS, & CONTAINERS

- **Card Styling:** All data containers (like the Susceptibility score, Conditioning Factors, etc.) should use rounded corners (`rounded-xl` or `rounded-2xl`) and soft, diffused shadows (`shadow-sm` or `shadow-md`) to lift them off the background.
- **Background Contrast:** Ensure the main app background is an off-white or very light gray (e.g., `#f8fafc` or `bg-slate-50`), while the cards are pure white (`bg-white`). This creates depth.
- **Glassmorphism (Optional/Accents):** For map overlays (like the "How to use" box), consider using a subtle backdrop blur with semi-transparent white backgrounds (`bg-white/80 backdrop-blur-md`).

## 3. TYPOGRAPHY & DATA HIERARCHY

- **Visual Hierarchy:** Not all text is equal.
    - Section titles should be bold and slightly larger, but use a dark slate color (e.g., `text-slate-800`), not pure black.
    - Secondary text (descriptions, methodology, units like "mm" or "m") should be muted (`text-gray-500` or `text-slate-400`).
- **Metric Emphasis:** For key numbers (like the "97% Flood Probability"), make the font massive and bold (`text-5xl` or `text-6xl`, `font-extrabold`), with tight tracking.
- **Font Choice:** If possible, ensure a modern sans-serif font like Inter, Roboto, or system-ui is applied globally.

## 4. COLOR & SEMANTICS

- **Modern Semantic Colors:** Update the "Risk Level" colors to be modern and vibrant, but not blinding.
    - **High Risk (Red):** Instead of a flat, harsh red, use a modern rose/red gradient or a polished solid like `bg-red-500` with a soft `shadow-red-500/30` glow.
    - **Moderate (Yellow/Orange):** Use warm amber tones.
    - **Low (Green):** Use emerald or teal tones.
- **Badges/Pills:** For status indicators (like "Ensemble (RF + XGBoost)" or "High - Flooded"), style them as modern pill badges: heavily rounded (`rounded-full`), with a very light background and dark text of the same hue (e.g., `bg-red-100 text-red-700`).

## 5. SPECIFIC COMPONENT INSTRUCTIONS

- **Conditioning Factors Grid:** Transform this into a clean CSS Grid (`grid-cols-2` or `grid-cols-3` depending on screen size). Each factor should be a distinct, cohesive card with a unified icon style.
- **Model Performance Comparison:** Clean up the visual separation between the Baseline and Improved models. Use subtle background colors to highlight the "Improved Model" as the preferred data point.

---

**OUTPUT INSTRUCTIONS:** When refactoring a component, explain briefly which specific modern UI principle (e.g., "improved visual hierarchy", "softened card surfaces") you applied to the code.
