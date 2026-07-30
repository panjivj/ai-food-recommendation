# PLAN.md

# AI Food Recommendation System

## Project Overview

Develop a simple **AI-powered Food Recommendation System** as a cross-platform mobile application using **Ionic Vue.js**.

The application helps users choose daily meals based on their body condition using a lightweight **Hybrid Recommendation Engine**.

The project started as a **UI demo/prototype** for final-project documentation.
It is now progressing through the integrated MVP: authentication and user
profiles use the real backend, while food recommendation screens retain
structured dummy data until the menu domain and recommendation engine are ready.

The application **does NOT provide medical diagnosis** and should only be positioned as an educational recommendation tool.

---

# Important Development Note

> **Current active phase: Phase 2 integrated MVP.**
>
> The UI demo remains available for report documentation. Backend foundation
> work has started with Express, TypeScript, SQLite migrations, shared HTTP
> middleware, a health endpoint, and email/password authentication.
> User-profile persistence and API endpoints are also implemented. Registration,
> login, session restoration, profile setup, and profile editing in Ionic are
> connected to those endpoints. The TKPI food catalog schema, importer, and
> 14 approved persistent pilot menus are now available. The 11 rejected pilot
> menus have been removed from the active catalog.
> Batch 2 through Batch 11 each add 60 unique approved menus, bringing the
> catalog to 614 menus, all approved. The minimum target of 600 approved menus
> has been exceeded by 14 menus.
> A read-only approved-menu API now provides pagination, name search, meal-type
> and calorie filters, plus complete menu details from the TKPI-backed catalog.
> An authenticated calorie-needs API calculates transparent Mifflin-St Jeor
> BMR, activity-adjusted TDEE, goal adjustment, and per-meal calorie targets
> from the latest user profile.
> A deterministic rule-based recommendation engine now selects four unique
> daily menus using calorie fit, hard allergy/dislike filters, preference
> matching, and an explainable score breakdown.
> Database-level normalized-name,
> weighted-component, and ingredient-set signatures prevent duplicate menus.
> Ionic recommendation, detail menu, persistent replacement, and recommendation
> history APIs and persistent menu feedback are available. Feedback-aware
> scoring weights and OpenAI explanations remain subsequent Phase 2 work.

The technical sections for backend, database, AI, API, security, and deployment
below describe the **target MVP architecture for Phase 2** and remain the
implementation reference.

---

# Development Phases

## Phase 1 — Demo UI for Report Screenshots (Completed)

Goal:

- Produce a convincing, consistent, and navigable application demo.
- Provide the important application pages and UI states needed in the final
  project report.
- Use local dummy data for all content and interactions.
- Prioritize visual completeness over production architecture.

Phase 1 includes:

- Splash/onboarding screen if needed for the report flow.
- Login and registration UI.
- User profile setup UI.
- Home/dashboard UI.
- Daily recommendation UI for breakfast, lunch, and dinner.
- Alternative/replacement recommendation UI.
- Food detail UI.
- Like, dislike, and consumed interaction states.
- AI explanation display using predefined dummy text.
- Profile view and edit UI.
- Loading, empty, success, and error states when relevant to screenshots.
- Navigation between the main pages.
- Responsive mobile layout and consistent styling.

Phase 1 does **not** require:

- A working Express.js backend.
- Email/password authentication or a real user session.
- SQLite database tables or persistent storage.
- Real REST API calls.
- A working recommendation algorithm.
- OpenAI API calls.
- Real calorie calculation or health-rule processing.
- Production security, Docker, or deployment infrastructure.
- Complete frontend-to-backend integration.

For demo interactions, use local state, Pinia, static TypeScript/JSON fixtures,
or mocked services. Buttons only need to produce a believable UI response and
must not imply that production processing is already implemented.

## Phase 2 — Integrated MVP (After the UI Demo)

After Phase 1 and the required report screenshots are complete, implement:

- Real user authentication.
- Persistent user profiles.
- Express REST API.
- SQLite database integration.
- Hybrid food recommendation engine.
- Recommendation replacement and feedback persistence.
- OpenAI-generated explanation after the recommendation engine finishes.
- Complete UI-to-backend integration.
- Validation, security, testing, and deployment.

## Phase 3 — Future Enhancements

Advanced features outside the integrated MVP remain in the Future Roadmap.

---

# Demo UI Scope (Phase 1)

The current demo should visually represent these planned application features:

- User Authentication
- User Profile
- Daily Food Recommendation
- Food Detail
- Replace Recommendation
- User Feedback
- AI Explanation

These features are **simulated in the UI with dummy data** during Phase 1.

Everything outside this scope should be ignored unless explicitly requested.

---

# Technology Stack

## Frontend — Phase 1

- Ionic Framework
- Vue 3
- Vue Router
- Pinia
- Capacitor
- TypeScript
- Local dummy data or mock services

---

## Backend — Phase 2

- Express.js
- Node.js
- TypeScript

---

## Database — Phase 2

Use SQLite as the initial integrated MVP database.

- SQLite is owned and accessed only by the Express backend.
- Keep the database file in persistent server storage, not in the frontend app
  bundle or a disposable container layer.
- Use migrations and a repository/data-access layer so a later migration to
  PostgreSQL remains possible.
- Store menu image files outside SQLite and save only their paths or URLs.

---

## AI — Phase 2

Recommendation Engine

Implemented inside Express.js.

NO Python.

NO FastAPI.

NO Machine Learning model for MVP.

Use:

- Rule-Based Filtering
- Content-Based Scoring
- Feedback Adjustment

---

## LLM — Phase 2

OpenAI API

Purpose:

ONLY explain recommendation results.

LLM MUST NOT:

- calculate calories
- choose foods
- bypass health rules
- generate recommendation directly

Recommendation Engine must finish its work first.

LLM only converts structured recommendation into natural language.

---

# Architecture

## Phase 1 — Current Demo Architecture

```
Ionic Vue App
        │
        ├── Local dummy data / fixtures
        ├── Pinia or component state
        └── Mocked user interactions
```

No external service is required for the screenshot demo.

## Phase 2 — Target Integrated Architecture

```
Ionic Vue App
        │
        ▼
Express REST API
        │
        ├─────────────► OpenAI API
        │
        ▼
SQLite
```

---

# Recommendation Flow — Phase 2 Target

During Phase 1, the result of this flow is represented by predefined dummy
recommendations. The actual calculation is implemented in Phase 2.

```
User Profile
      │
      ▼
Calculate Daily Calories
      │
      ▼
Load Candidate Menus
      │
      ▼
Rule-Based Filter
      │
      ▼
Content Scoring
      │
      ▼
Feedback Adjustment
      │
      ▼
Sort Score
      │
      ▼
Top Recommendation
      │
      ▼
OpenAI Explanation
      │
      ▼
Return Result
```

---

# Recommendation Strategy — Phase 2 Target

Hybrid Recommendation consists of only three components.

## 1. Rule-Based Filter

Hard constraints.

Examples:

- allergy
- hypertension
- diabetes
- calorie target

Menus violating rules MUST be removed.

Never reduce score.

Immediately reject.

---

## 2. Content-Based Scoring

Each menu receives score.

Initial weight:

```
40% Calorie Match

25% Health Condition Match

20% User Preference

10% Preparation Time

5% Variety
```

Maximum score = 100.

---

## 3. Feedback Adjustment

User feedback:

- Like
- Dislike
- Consumed

Feedback slightly adjusts future recommendation score.

No Machine Learning.

---

# Future Roadmap

Not included in Phase 1 or the integrated MVP.

Future versions may include:

- Random Forest
- Decision Tree
- Case Based Reasoning
- Collaborative Filtering
- Weekly Meal Planning
- Shopping List
- Nutrition Analytics

---

# Authentication — Phase 2

For Phase 1, login and registration are presentation-only. Use a mock session or
direct navigation to enter the demo; do not connect a real authentication
service yet.

Use backend-managed email and password authentication. Google login and other
OAuth providers are not required for the initial phase.

Implementation status: register, login, Bearer access tokens, authenticated user
lookup, Ionic forms, persistent opt-in session storage, and route guards are
connected and tested.

Flow:

```
Ionic Login

↓

Express Auth Endpoint

↓

Validate Email + Password Hash

↓

Issue Access Token / Session

↓

Validate Token

↓

Execute Request
```

Express API must NEVER trust user_id sent from frontend.

Always derive the user identity from a verified token or server-side session.
Passwords must be hashed with a suitable password-hashing algorithm and must
never be stored or logged as plain text.

---

# Database — Phase 2

No database is required in Phase 1. Equivalent frontend models and local fixture
data may be used to render the UI. Phase 2 uses SQLite through the Express
backend.

## user_profiles

```
id

user_id

name

age

gender

height_cm

weight_kg

activity_level

goal

health_conditions

allergies

disliked_foods

food_preferences

created_at

updated_at
```

---

## food_categories and food_ingredients

The imported TKPI reference catalog stores source category metadata, unique
TKPI codes, food names and types, nutrients per 100 grams of edible portion,
nullable unavailable values, and source provenance.

---

## menus, menu_ingredients, and menu_nutrition

```
menus
  id
  slug
  name
  description
  meal_type
  serving_size_g
  serving_description
  curation_status
  is_pilot
  nutrition_source
  calculation_version
  curation_notes

menu_ingredients
  menu_id
  food_ingredient_id
  amount_g
  component_role
  preparation_note
  sort_order

menu_nutrition
  menu_id
  energy_kcal
  protein_g
  fat_g
  carbohydrate_g
  fiber_g
  sodium_mg
  other TKPI nutrients
```

Menu tags, allergen assumptions, and manual review decisions are stored in
separate relational tables. Only approved menus may later be exposed to the
recommendation engine.

---

## recommendations

```
id

user_id

recommendation_date

daily_calorie_target

status

created_at
```

---

## recommendation_items

```
id

recommendation_id

menu_id

meal_type

score

reason_codes

ai_explanation
```

---

## feedback

```
id

user_id

menu_id

action

created_at
```

action:

- like
- dislike
- consumed

---

# Backend Folder Structure — Phase 2

```
backend/

src/

    app.ts

    server.ts

    routes/

    controllers/

    middleware/

    services/

        recommendation/

            calorie.service.ts

            rule.service.ts

            scoring.service.ts

            feedback.service.ts

            recommendation.service.ts

        openai/

            openai.service.ts

    repositories/

    config/

    utils/
```

Business logic belongs inside services.

Controllers should remain thin.

---

# Frontend Folder Structure — Phase 1

```
mobile/

src/

    components/

    pages/

        LoginPage

        ProfileSetupPage

        HomePage

        RecommendationPage

        MenuDetailPage

        ProfilePage

    services/

    stores/

    mocks/

    router/

    composables/

    assets/
```

Suggested dummy-data files:

```
mobile/src/mocks/

    user.ts

    menus.ts

    recommendations.ts

    feedback.ts
```

---

# Pages and Screenshot Requirements — Phase 1

Each page should be populated with realistic Indonesian dummy content. Prepare
the main state and important alternative states before taking screenshots.

## Login

- Login
- Register
- Filled form state
- Validation message state if needed

---

## Profile Setup

Collect:

- Age
- Gender
- Height
- Weight
- Activity
- Goal
- Health Condition
- Allergy
- Food Preference
- Completed form state ready to save

---

## Home

Display:

- Today's Calories
- Today's Recommendation
- Quick Summary
- Greeting and demo user identity
- Clear navigation to recommendation details

---

## Recommendation

Display:

Breakfast

Lunch

Dinner

Alternative Menu

Also prepare:

- Default daily recommendation state
- Replacement/alternative menu state
- Loading state if it is useful for the report

---

## Menu Detail

Display:

- Image
- Calories
- Nutrition
- Ingredients
- Instructions
- AI Explanation

Buttons:

- Replace
- Like
- Dislike
- Consumed

---

## Profile

Edit user profile.

Prepare both profile summary and edit form states.

---

# Phase 1 Dummy Data Guidelines

- Store dummy data locally and keep it separate from page components.
- Use consistent user, calorie, nutrition, and menu information across pages.
- Use realistic Indonesian food names, ingredients, and descriptions.
- Use local assets or stable placeholder images suitable for screenshots.
- Clearly label AI explanations as recommendation explanations, not medical
  diagnoses.
- Simulate replace, like, dislike, and consumed actions through local UI state.
- Resetting the demo to its initial state should be easy.
- Do not add temporary production credentials or API keys.

Recommended minimum dataset:

- 1 complete demo user profile.
- 3 primary daily menus: breakfast, lunch, and dinner.
- At least 2 alternative menus for replacement interactions.
- Nutrition details and preparation steps for every displayed menu.
- 1 predefined AI explanation for every main menu.

---

# Phase 1 Deliverables and Completion Criteria

Phase 1 is complete when:

- All important pages can be opened without a backend.
- Navigation works for the main demo flow.
- Every screen contains coherent dummy data and has no obvious placeholder copy.
- The replace and feedback buttons show believable local state changes.
- Mobile layouts have no clipped, overlapping, or overflowing content.
- Loading, empty, or error states required by the report are available.
- Screenshots have been captured for the required report sections.
- Backend-related work is still documented but has not blocked UI completion.

---

# API — Phase 2

During Phase 1, frontend services may expose similarly shaped mock functions,
but they must not make real network requests.

## Profile

```
GET /api/v1/profile

POST /api/v1/profile

PUT /api/v1/profile
```

Implementation status: implemented with Bearer authentication, per-user data
isolation, and connected Ionic profile setup/view/edit flows.

---

## Recommendation

```
GET /api/v1/recommendations/daily

GET /api/v1/recommendations/daily?date=YYYY-MM-DD

GET /api/v1/recommendations/daily/alternatives
```

Implementation status: rule-based v1 is available with Bearer authentication,
approved-menu enforcement, calorie and preference scoring, hard
allergy/disliked-food filters, deterministic daily rotation, structured
reasons, and unique menu IDs per day. Alternative lookup, transactional
replacement, immutable daily snapshots, and paginated history are available.

---

## Feedback

```
GET /api/v1/feedback/:menuId

PUT /api/v1/feedback/:menuId
```

Implementation status: like/dislike and consumed status are persisted
independently, dislike is a hard filter for new daily snapshots, and all
feedback signals are captured for a future scoring version.

---

# OpenAI Usage — Phase 2

During Phase 1, display predefined explanation text from dummy data. Do not use
an OpenAI API key for the UI demo.

Recommendation Engine produces JSON.

Example:

```json
{
  "menu":"Grilled Chicken",
  "goal":"weight_loss",
  "reasons":[
      "high protein",
      "low sodium",
      "matched calorie target"
  ]
}
```

Prompt:

```
Explain why this menu is recommended.

Maximum 60 words.

Simple Indonesian language.

Do not diagnose disease.

Do not claim food cures disease.

Use only supplied information.
```

If OpenAI fails:

Use local template.

Never block recommendation.

---

# Deployment — Phase 2

Docker Compose

Containers:

- app
- caddy

OpenAI API is external.

The SQLite database file must be mounted on persistent storage.

```
Internet
      │
      ▼
Caddy (HTTPS + reverse proxy)
      │
      ▼
Express.js
      │
      ▼
SQLite persistent volume
```

---

# Environment Variables — Phase 2

These variables are not required for the Phase 1 UI demo.

```
PORT=

DATABASE_URL=

AUTH_TOKEN_SECRET=

OPENAI_API_KEY=
```

Never expose:

- AUTH_TOKEN_SECRET
- OPENAI_API_KEY

to frontend.

---

# Coding Guidelines

- Use TypeScript everywhere.
- Follow SOLID principles where practical.
- Keep controllers thin.
- Phase 2 business logic belongs in services.
- Never duplicate business rules.
- Keep recommendation logic modular.
- Use async/await.
- Handle all errors gracefully.
- Write readable code over clever code.
- In Phase 1, keep mock data separate from UI components so it can later be
  replaced by API services.
- Do not build speculative backend infrastructure during Phase 1.

---

# UI Guidelines

Design philosophy:

Simple

Clean

Minimal

Fast

Use Ionic components whenever possible.

Avoid unnecessary animations.

Prefer card-based layouts.

Primary screens should require minimal user interaction.

---

# Security — Phase 2

Production security requirements apply when backend integration begins. During
Phase 1, never place real secrets or API keys in frontend code or dummy data.

- Validate every API request.
- Verify every access token or session.
- Never trust frontend data.
- Sanitize user input.
- Hash passwords and never store or log plain-text passwords.
- Protect OpenAI API Key.
- Never expose the authentication secret.

---

# Out of Scope

Do NOT implement unless requested.

- Admin Dashboard
- Nutrition Dashboard
- Chatbot
- AI Chat
- OCR
- Barcode Scanner
- Camera Recognition
- Voice Input
- Machine Learning
- Python
- FastAPI
- Redis
- Notification
- Meal Scheduler
- Grocery Shopping
- Social Features
- Wearable Integration
- Multi Language

---

# Development Principle

When making implementation decisions:

1. Choose the simplest solution.
2. Avoid over-engineering.
3. Prioritize readability.
4. Prioritize maintainability.
5. Prefer composition over complexity.
6. Keep MVP small.
7. Complete the screenshot-ready UI demo before starting full integration.
8. Every feature should solve a real user problem.
9. Recommendation quality is more important than AI complexity.
10. If two solutions are equally good, choose the one with fewer dependencies.
11. Treat backend, database, AI API, and full integration as Phase 2 work.
12. Dummy data in Phase 1 must be structured so it can be replaced by real API
    responses later.
