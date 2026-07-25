# PLAN.md

# AI Food Recommendation System

## Project Overview

Develop a simple **AI-powered Food Recommendation System** as a cross-platform mobile application using **Ionic Vue.js**.

The application helps users choose daily meals based on their body condition using a lightweight **Hybrid Recommendation Engine**.

The current project priority is to produce a **UI demo/prototype** for final
project report documentation. The application pages and their important states
will be implemented using **dummy data** so they can be presented and captured
as screenshots before the backend is built.

The application **does NOT provide medical diagnosis** and should only be positioned as an educational recommendation tool.

---

# Important Development Note

> **Current active phase: Demo UI only.**
>
> Until the demo and report screenshots are complete, development must focus on
> the frontend appearance, navigation, page states, and realistic dummy data.
> A complete backend, real authentication, database connection, recommendation
> engine, OpenAI integration, and complete frontend-to-backend integration are
> deliberately postponed to the next phase.

The technical sections for backend, database, AI, API, security, and deployment
below describe the **target MVP architecture for Phase 2**. They are retained as
a reference and are **not current implementation requirements**.

---

# Development Phases

## Phase 1 — Demo UI for Report Screenshots (Current)

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
- Supabase Auth or a real user session.
- Supabase database tables or storage.
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
- Supabase database integration.
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

Supabase Cloud

Use:

- PostgreSQL
- Supabase Auth
- Supabase Storage (optional)

DO NOT self-host Supabase.

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
Supabase Cloud
(Auth + PostgreSQL)
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
direct navigation to enter the demo; do not connect Supabase Auth yet.

Use Supabase Authentication.

Flow:

```
Ionic Login

↓

Supabase Auth

↓

Access Token

↓

Express API

↓

Validate Token

↓

Execute Request
```

Express API must NEVER trust user_id sent from frontend.

Always verify Supabase JWT.

---

# Database — Phase 2

No database is required in Phase 1. Equivalent frontend models and local fixture
data may be used to render the UI.

## user_profiles

```
id

user_id

age

gender

height_cm

weight_kg

activity_level

goal

health_conditions

allergies

disliked_foods

created_at

updated_at
```

---

## menus

```
id

name

meal_type

description

image_url

calories

protein_g

carbohydrate_g

fat_g

fiber_g

sugar_g

added_sugar_g

sodium_mg

preparation_minutes

ingredients

allergens

instructions

is_active
```

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
GET /profile

POST /profile

PUT /profile
```

---

## Recommendation

```
POST /recommendations/generate

GET /recommendations/today

POST /recommendations/:id/replace
```

---

## Feedback

```
POST /feedback
```

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

Supabase Cloud is external.

OpenAI API is external.

```
Internet
      │
      ▼
Caddy
      │
      ▼
Express.js
      │
      ▼
Supabase Cloud
```

---

# Environment Variables — Phase 2

These variables are not required for the Phase 1 UI demo.

```
PORT=

SUPABASE_URL=

SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

OPENAI_API_KEY=
```

Never expose:

- SERVICE_ROLE_KEY
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
- Verify Supabase JWT.
- Never trust frontend data.
- Sanitize user input.
- Protect OpenAI API Key.
- Never expose Service Role Key.

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
