import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Use globalThis to persist across hot reloads in Next.js
// This prevents creating multiple connections during development hot reloads
declare global {
     var _db: ReturnType<typeof drizzle> | undefined;
     var _client: ReturnType<typeof postgres> | undefined;
}

function getDatabase() {
     if (!process.env.DATABASE_URL) {
          throw new Error("DATABASE_URL environment variable is not set");
     }

     // Use global to persist connection across hot reloads in Next.js
     // This is the recommended pattern for Next.js to prevent connection leaks
     if (!global._db) {
          const connectionString = process.env.DATABASE_URL;
          global._client = postgres(connectionString, {
               max: 20, // Increased pool size from 10 to 20
          });
          global._db = drizzle(global._client, { schema });
     }

     return global._db;
}

export const db = getDatabase();
