# Outreach Tracker

A production-ready MVP application for tracking outreach activities through a sales funnel, powered by Temporal Cloud workflows and Next.js.

## Features

- Track outbound messages (Email, Slack, Phone, LinkedIn, Other)
- Manage contacts and their progress through the sales funnel
- Schedule follow-up reminders using Temporal workflows
- Track meetings (solo and with Account Executives)
- Monitor opportunities and Stage 1 conversions
- Visual dashboards with conversion metrics, velocity metrics, throughput analytics, and period comparisons (quarterly, monthly, yearly)
- Light/dark mode support

## Tech Stack

- **Frontend**: Next.js 16+ (App Router), React 19, TypeScript, Tailwind CSS, ShadCN UI
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL with Drizzle ORM
- **Workflows**: Temporal Cloud or local Temporal server
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Temporal Cloud account (or local Temporal server)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd outreach-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:

**For local Temporal server (recommended for development):**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/outreach_tracker

# Temporal (local)
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TLS=false

# Application
USER_ID=default-user
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For Temporal Cloud (production):**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/outreach_tracker

# Temporal Cloud
TEMPORAL_ADDRESS=your-namespace.tmprl.cloud:7233
TEMPORAL_NAMESPACE=your-namespace
TEMPORAL_TLS=true
TEMPORAL_API_KEY=your-api-key-here

# Application
USER_ID=default-user
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

1. Create a PostgreSQL database:
```bash
createdb outreach_tracker
```

2. Generate and run migrations:
```bash
npm run db:generate
npm run db:migrate
```

### Temporal Setup

You can use either a local Temporal server (recommended for development) or Temporal Cloud (for production).

#### Option 1: Local Temporal Server (Development)

1. Install Temporal CLI:
   
   **macOS:**
   ```bash
   brew install temporal
   ```
   
   **Linux/Windows:**
   - Download from [Temporal CLI releases](https://temporal.download/cli/archive/latest)
   - Extract and add to your PATH
   - Or see [official installation guide](https://docs.temporal.io/cli/setup-cli)

2. Start the Temporal server:
   ```bash
   temporal server start-dev
   ```
   This will start a local Temporal server at `localhost:7233` with a default namespace.
   
   **Note:** By default, the server uses an in-memory database. To persist data between restarts:
   ```bash
   temporal server start-dev --db-filename temporal.db
   ```

3. Verify it's running:
   - Temporal Web UI: http://localhost:8233
   - The server is ready when you see "Temporal server started" in the terminal

4. Your `.env.local` should already be configured for local development (see Installation step 3).

#### Option 2: Temporal Cloud (Production)

1. Sign up for Temporal Cloud at https://cloud.temporal.io
2. Create a namespace with API Key authentication enabled
3. Create an API key in Settings > API Keys
4. Update the environment variables with your Temporal Cloud credentials (see Installation step 3)

### Running the Application

1. Start the Next.js development server:
```bash
npm run dev
```

2. In a separate terminal, start the Temporal worker:
```bash
npm run worker
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                    # Next.js App Router (pages & API routes)
├── components/             # React components
│   ├── ui/                 # ShadCN UI components
│   ├── outreach/           # Domain-specific components
│   ├── dashboard/          # Dashboard components
│   └── layout/             # Layout components
├── server/                 # Server-side code
│   ├── services/          # Business logic
│   ├── repositories/       # Data access layer
│   ├── temporal/          # Temporal workflows & activities
│   └── database/          # Database connection & schema
├── models/                # Data models (Object.ts files)
└── lib/                   # Shared utilities & validations
```

## Key Concepts

### Temporal Workflows

- **ContactLifecycleWorkflow**: Long-running workflow that manages the entire contact lifecycle including:
  - Tracking outreach messages and their reminder schedules
  - Managing funnel stage transitions with audit history
  - Scheduling and executing follow-up reminders
  - Handling contact responses and workflow completion

### Data Models

- **Contact**: Person being reached out to (firstName OR slackUsername required)
- **Outreach**: Individual outreach event
- **Meeting**: Scheduled meetings (solo or with AE)
- **Opportunity**: Sales opportunity tracking
- **FollowUp**: Scheduled follow-up reminders
- **ContactEvent**: Timeline events tracking all contact interactions and stage changes

### Funnel Stages

1. OUTREACH - Initial outreach made
2. MEETING_BOOKED - Solo meeting scheduled
3. AE_MEETING - Meeting with Account Executive
4. OPPORTUNITY_CREATED - Opportunity created
5. STAGE_1 - Opportunity reached Stage 1 (compensation metric)
6. LOST - Opportunity lost
7. INACTIVE - Contact marked inactive

## Development

### Database Migrations

```bash
# Generate migration from schema changes
npm run db:generate

# Run migrations
npm run db:migrate

# Open Drizzle Studio
npm run db:studio
```

### TypeScript

The project uses strict TypeScript. Run type checking:

```bash
npm run build
```

## License

MIT

