# Cards AI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Cards AI is a web application designed to accelerate the creation of high-quality English-Polish language flashcards. It allows users to semi-automatically generate cards from pasted text, review them in a simple triage process, and start learning effectively with the Spaced Repetition System (SRS).

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Tech Stack

### Frontend
- **[Astro 5](https://astro.build/)**: For building fast, content-focused websites.
- **[React 19](https://react.dev/)**: For creating interactive UI components.
- **[TypeScript 5](https://www.typescriptlang.org/)**: For strong typing and improved code quality.
- **[Tailwind CSS 4](https://tailwindcss.com/)**: For utility-first styling.
- **[Shadcn/ui](https://ui.shadcn.com/)**: For accessible and reusable React components.

### Backend
- **[Supabase](https://supabase.com/)**: An open-source Firebase alternative providing a PostgreSQL database, authentication, and a Backend-as-a-Service SDK.

### AI Integration
- **[OpenRouter.ai](https://openrouter.ai/)**: A service to access a wide range of AI models for flashcard generation.

### CI/CD & Hosting
- **[GitHub Actions](https://github.com/features/actions)**: For continuous integration and deployment pipelines.
- **[DigitalOcean](https://www.digitalocean.com/)**: For hosting the application via a Docker image.

## Getting Started Locally

To set up and run the project on your local machine, follow these steps:

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/marcskow/10xCards.git
    cd 10xCards
    ```

2.  **Set up the Node.js version:**
    This project uses a specific version of Node.js. We recommend using a version manager like `nvm`.
    ```sh
    nvm use
    ```
    If you don't have `nvm` installed, please install Node.js version `22.14.0`.

3.  **Install dependencies:**
    ```sh
    npm install
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the necessary environment variables for Supabase and OpenRouter.

5.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:4321`.

## Available Scripts

The following scripts are available in the `package.json`:

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run preview`: Previews the production build locally.
- `npm run lint`: Lints the codebase for errors.
- `npm run lint:fix`: Lints the codebase and automatically fixes issues.
- `npm run format`: Formats the code using Prettier.
- `npm test`: Runs all tests (unit + E2E).
- `npm run test:unit`: Runs unit tests with Vitest.
- `npm run test:unit:watch`: Runs unit tests in watch mode.
- `npm run test:unit:ui`: Opens Vitest UI.
- `npm run test:unit:coverage`: Generates test coverage report.
- `npm run test:e2e`: Runs E2E tests with Playwright.
- `npm run test:e2e:headed`: Runs E2E tests with visible browser.
- `npm run test:e2e:debug`: Runs E2E tests in debug mode.

## Testing

This project uses **Vitest** for unit tests and **Playwright** for end-to-end tests.

### Quick Start

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run E2E tests only
npm run test:e2e

# Run tests in watch mode
npm run test:unit:watch
```

### Documentation

- 📖 [Testing Quick Start Guide](./docs/testing-quick-start.md)
- 📖 [Test Plan](./docs/test-plan.md)
- 📖 [Test Setup Summary](./docs/test-setup-summary.md)
- 📖 [Tests README](./tests/README.md)

### Coverage

Target test coverage: **70%**

Generate coverage report:
```bash
npm run test:unit:coverage
```

## Project Scope

The primary goal of the MVP is to deliver a functional web application for generating and learning language flashcards.

### Key Features (In Scope for MVP)
- Manual and AI-powered flashcard creation (EN↔PL).
- User account management (registration, login).
- Organization of flashcards into decks.
- A triage interface to review and approve AI-generated cards.
- A simple learning mode based on "know/don't know".
- Integration with an open-source Spaced Repetition System (SRS) algorithm like SM-2.

### Out of Scope for MVP
- Advanced or custom SRS algorithms.
- Importing content from file formats like PDF or DOCX.
- Deck sharing or user collaboration features.
- Native mobile applications (the initial focus is on the web).

## Project Status

The project is currently in the **development phase**. The initial milestones are focused on building the core functionalities, from basic CRUD operations for flashcards to integrating the AI-powered generation and learning modules.

## License

This project is licensed under the MIT License.

