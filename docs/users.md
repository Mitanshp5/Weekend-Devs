# PRISM Demo Users & Credentials

Below are the pre-seeded student accounts available for testing and demonstration in PRISM.

## Demo Student Accounts

All student accounts are automatically seeded into PostgreSQL on startup via `run-dev.bat`.

| # | Name | Email Address | Password | Role | Performance Profile |
|---|------|---------------|----------|------|---------------------|
| 1 | **Aanya Sharma** | `aanya@prism.demo` | `Prism_demo_1` | Student | Grade-level learner, consistent performer |
| 2 | **Ravi Kumar** | `ravi@prism.demo` | `Prism_demo_2` | Student | Foundational learner, needs prerequisite support |
| 3 | **Priya Patel** | `priya@prism.demo` | `Prism_demo_3` | Student | Advanced learner, quick mastery |
| 4 | **Arjun Singh** | `arjun@prism.demo` | `Prism_demo_4` | Student | Developing learner, improving steadily |
| 5 | **Meera Iyer** | `meera@prism.demo` | `Prism_demo_5` | Student | Grade-level learner, strong in Science |
| 6 | **Kabir Das** | `kabir@prism.demo` | `Prism_demo_6` | Student | Foundational learner, struggles with word problems |
| 7 | **Nisha Reddy** | `nisha@prism.demo` | `Prism_demo_7` | Student | Advanced learner, excels in English |
| 8 | **Vikram Joshi** | `vikram@prism.demo` | `Prism_demo_8` | Student | Developing learner, inconsistent performance |

---

## Authentication Notes

- **Sign In URL**: [http://localhost:5173/auth](http://localhost:5173/auth)
- **Role Assignment**: Logging in with any of the demo student credentials above will bypass onboarding and route directly to the Student Dashboard (`/learn`).
- **New Registrations**: Any newly created account via Sign Up or Google OAuth will prompt a one-time role selection (Student vs. Teacher) which persists permanently in the database.
