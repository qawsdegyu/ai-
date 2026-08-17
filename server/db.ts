import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _dbPromise: Promise<ReturnType<typeof drizzle> | null> | null = null;

export async function getDb() {
  if (!_dbPromise) {
    _dbPromise = (async () => {
      try {
        const connectionString = ENV.databaseUrl;
        if (!connectionString) {
          throw new Error("DATABASE_URL is not set");
        }
        const client = postgres(connectionString, { 
          prepare: false,
          ssl: 'require',
          connect_timeout: 10
        });
        const dbInstance = drizzle(client);
        
        // Auto-create new OneDrive tables to bypass drizzle-kit push data-loss issues
        try {
          await dbInstance.execute(sql`
            CREATE TABLE IF NOT EXISTS onedrive_files (
              id SERIAL PRIMARY KEY,
              "userId" INTEGER NOT NULL,
              "driveItemId" TEXT NOT NULL UNIQUE,
              name TEXT NOT NULL,
              "webUrl" TEXT,
              "parentPath" TEXT,
              "sizeBytes" INTEGER,
              "eTag" TEXT,
              "lastModifiedDateTime" TIMESTAMP,
              status TEXT NOT NULL DEFAULT 'discovered',
              "sheetCount" INTEGER DEFAULT 0,
              "indexedRows" INTEGER DEFAULT 0,
              "indexedCells" INTEGER DEFAULT 0,
              "lastSyncTime" TIMESTAMP,
              "lastError" TEXT,
              "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
              "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
            );
            
            CREATE TABLE IF NOT EXISTS onedrive_indexed_data (
              id SERIAL PRIMARY KEY,
              "driveItemId" TEXT NOT NULL,
              "sheetName" TEXT NOT NULL,
              "rowIndex" INTEGER,
              "cellAddress" TEXT,
              content TEXT NOT NULL
            );
            
            CREATE INDEX IF NOT EXISTS idx_onedrive_data_driveitemid ON onedrive_indexed_data ("driveItemId");
          `);
          console.log("[DB] OneDrive tables verified/created successfully.");
        } catch (err) {
          console.error("[DB] Failed to auto-create OneDrive tables:", err);
        }

        return dbInstance;
      } catch (error) {
        console.warn("[Database] Failed to connect:", error);
        _dbPromise = null;
        return null;
      }
    })();
  }
  return _dbPromise;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}
