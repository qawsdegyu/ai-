var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc3) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc3 = __getOwnPropDesc(from, key)) || desc3.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// shared/const.ts
var COOKIE_NAME, ONE_YEAR_MS, AXIOS_TIMEOUT_MS, UNAUTHED_ERR_MSG, NOT_ADMIN_ERR_MSG, OAUTH_STATE_COOKIE, decodeOAuthState;
var init_const = __esm({
  "shared/const.ts"() {
    "use strict";
    COOKIE_NAME = "app_session_id";
    ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
    AXIOS_TIMEOUT_MS = 3e4;
    UNAUTHED_ERR_MSG = "Please login (10001)";
    NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
    OAUTH_STATE_COOKIE = "__Host-oauth_state";
    decodeOAuthState = (state) => {
      let decoded;
      try {
        decoded = atob(state);
      } catch {
        return { redirectUri: "" };
      }
      try {
        const parsed = JSON.parse(decoded);
        if (parsed && typeof parsed.redirectUri === "string") return parsed;
      } catch {
      }
      return { redirectUri: decoded };
    };
  }
});

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  aiConversations: () => aiConversations,
  aiMessages: () => aiMessages,
  auditLogs: () => auditLogs,
  fileCellSources: () => fileCellSources,
  fileCells: () => fileCells,
  fileIngestionRuns: () => fileIngestionRuns,
  fileSheets: () => fileSheets,
  inventoryRecords: () => inventoryRecords,
  onedriveFiles: () => onedriveFiles,
  onedriveIndexedData: () => onedriveIndexedData,
  uploadedFiles: () => uploadedFiles,
  userOauthConnections: () => userOauthConnections,
  users: () => users
});
import { integer, pgTable, text, serial, timestamp, boolean, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { pgView } from "drizzle-orm/pg-core";
var users, inventoryRecords, auditLogs, aiConversations, aiMessages, userOauthConnections, uploadedFiles, onedriveFiles, onedriveIndexedData, fileIngestionRuns, fileSheets, fileCells, fileCellSources;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      openId: text("openId").notNull().unique(),
      name: text("name"),
      email: text("email"),
      loginMethod: text("loginMethod"),
      role: text("role").default("user").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    inventoryRecords = pgTable("inventory_records", {
      id: serial("id").primaryKey(),
      source: text("source").notNull(),
      country: text("country").notNull().default(""),
      city: text("city").notNull().default(""),
      routerName: text("routerName").notNull(),
      oldRouterName: text("oldRouterName").notNull().default(""),
      siteId: text("siteId").notNull().default(""),
      subnetIp: text("subnetIp").notNull().default(""),
      contactDetails: text("contactDetails"),
      location: text("location"),
      operationalHours: text("operationalHours"),
      proactiveEmailContacts: text("proactiveEmailContacts"),
      switchName: text("switchName").notNull().default(""),
      mcsStatus: text("mcsStatus").notNull().default(""),
      circuitType: text("circuitType").notNull().default(""),
      migrationStatus: text("migrationStatus").notNull(),
      serialNumber: text("serialNumber").notNull().default(""),
      fromProductId: text("fromProductId").notNull().default(""),
      rack: text("rack").notNull().default(""),
      port: text("port").notNull().default(""),
      vlan: text("vlan").notNull().default(""),
      toVlan: text("toVlan").notNull().default(""),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    auditLogs = pgTable("audit_logs", {
      id: serial("id").primaryKey(),
      userId: integer("userId"),
      userName: text("userName").notNull().default("System"),
      action: text("action").notNull(),
      entityType: text("entityType").notNull(),
      entityId: integer("entityId"),
      summary: text("summary").notNull(),
      metadata: text("metadata"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    aiConversations = pgTable("ai_conversations", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull(),
      title: text("title").notNull().default("New AI conversation"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull(),
      archivedAt: timestamp("archivedAt")
    });
    aiMessages = pgTable("ai_messages", {
      id: serial("id").primaryKey(),
      conversationId: integer("conversationId").notNull(),
      userId: integer("userId").notNull(),
      role: text("role").notNull(),
      content: text("content").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    userOauthConnections = pgTable("user_oauth_connections", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull(),
      provider: text("provider").notNull(),
      // 'microsoft'
      accountId: text("accountId"),
      // Microsoft user ID
      accountEmail: text("accountEmail"),
      accessToken: text("accessToken"),
      refreshToken: text("refreshToken"),
      expiresAt: timestamp("expiresAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    uploadedFiles = pgTable("uploaded_files", {
      id: serial("id").primaryKey(),
      userId: integer("userId"),
      fileName: text("fileName").notNull(),
      originalFilename: text("originalFilename").notNull(),
      content: text("content").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull(),
      storagePath: text("storagePath"),
      mimeType: text("mimeType"),
      fileSize: integer("fileSize"),
      fileExtension: text("fileExtension"),
      uploadStatus: text("uploadStatus").default("ready"),
      processingError: text("processingError"),
      sheetCount: integer("sheetCount"),
      sheetNames: text("sheetNames"),
      sha256Hash: text("sha256Hash"),
      missingSheets: jsonb("missingSheets"),
      workbookHasVba: boolean("workbookHasVba"),
      workbookMetadata: jsonb("workbookMetadata"),
      // OneDrive Integration Fields
      sourceType: text("sourceType").default("local"),
      externalId: text("externalId"),
      webUrl: text("webUrl"),
      eTag: text("eTag"),
      lastSyncDate: timestamp("lastSyncDate")
    });
    onedriveFiles = pgTable("onedrive_files", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull(),
      driveItemId: text("driveItemId").notNull().unique(),
      name: text("name").notNull(),
      webUrl: text("webUrl"),
      parentPath: text("parentPath"),
      sizeBytes: integer("sizeBytes"),
      eTag: text("eTag"),
      lastModifiedDateTime: timestamp("lastModifiedDateTime"),
      status: text("status").notNull().default("discovered"),
      // discovered, selected, syncing, processing, active, failed, archived
      sheetCount: integer("sheetCount").default(0),
      indexedRows: integer("indexedRows").default(0),
      indexedCells: integer("indexedCells").default(0),
      lastSyncTime: timestamp("lastSyncTime"),
      lastError: text("lastError"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    onedriveIndexedData = pgTable("onedrive_indexed_data", {
      id: serial("id").primaryKey(),
      internalFileId: integer("internalFileId"),
      driveItemId: text("driveItemId").notNull(),
      eTag: text("eTag"),
      fileName: text("fileName"),
      sheetName: text("sheetName").notNull(),
      rowIndex: integer("rowIndex"),
      cellAddress: text("cellAddress"),
      content: text("content").notNull()
    });
    fileIngestionRuns = pgTable("file_ingestion_runs", {
      id: serial("id").primaryKey(),
      file_id: integer("file_id"),
      requested_by: text("requested_by"),
      status: text("status"),
      parser_name: text("parser_name"),
      parser_version: text("parser_version"),
      actual_sheet_count: integer("actual_sheet_count"),
      indexed_sheet_count: integer("indexed_sheet_count"),
      cells_seen: integer("cells_seen"),
      cells_indexed: integer("cells_indexed"),
      matches_ready: integer("matches_ready"),
      error_message: text("error_message"),
      started_at: timestamp("started_at"),
      finished_at: timestamp("finished_at"),
      created_at: timestamp("created_at").defaultNow().notNull()
    });
    fileSheets = pgTable("file_sheets", {
      id: serial("id").primaryKey(),
      file_id: integer("file_id"),
      ingestion_run_id: integer("ingestion_run_id"),
      sheet_name: text("sheet_name"),
      sheet_order: integer("sheet_order"),
      sheet_state: text("sheet_state"),
      dimension_ref: text("dimension_ref"),
      max_row: integer("max_row"),
      max_column: integer("max_column"),
      row_count: integer("row_count"),
      cell_count: integer("cell_count"),
      formula_count: integer("formula_count"),
      hyperlink_count: integer("hyperlink_count"),
      merged_ranges: jsonb("merged_ranges"),
      sheet_metadata: jsonb("sheet_metadata")
    });
    fileCells = pgTable("file_cells", {
      id: serial("id").primaryKey(),
      file_id: integer("file_id"),
      sheet_id: integer("sheet_id"),
      ingestion_run_id: integer("ingestion_run_id"),
      cell_address: text("cell_address"),
      row_number: integer("row_number"),
      column_number: integer("column_number"),
      column_letter: text("column_letter"),
      column_header: text("column_header"),
      cell_type: text("cell_type"),
      raw_value: text("raw_value"),
      calculated_value: text("calculated_value"),
      numeric_value: doublePrecision("numeric_value"),
      date_value: timestamp("date_value"),
      boolean_value: boolean("boolean_value"),
      formula: text("formula"),
      formula_result_type: text("formula_result_type"),
      is_formula: boolean("is_formula"),
      is_blank: boolean("is_blank"),
      normalized_text: text("normalized_text"),
      source_method: text("source_method"),
      source_metadata: jsonb("source_metadata"),
      hyperlink_target: text("hyperlink_target"),
      hyperlink_location: text("hyperlink_location"),
      comment_text: text("comment_text"),
      style_metadata: jsonb("style_metadata")
    });
    fileCellSources = pgView("file_cell_sources").as((qb) => {
      return qb.select({
        file_id: uploadedFiles.id,
        original_filename: uploadedFiles.originalFilename,
        file_hash: uploadedFiles.sha256Hash,
        sheet_name: fileSheets.sheet_name,
        cell_address: fileCells.cell_address,
        row_number: fileCells.row_number,
        column_number: fileCells.column_number,
        column_header: fileCells.column_header,
        raw_value: fileCells.raw_value,
        calculated_value: fileCells.calculated_value,
        formula: fileCells.formula,
        source_method: fileCells.source_method,
        source_metadata: fileCells.source_metadata
      }).from(fileCells).innerJoin(fileSheets, sql`${fileCells.sheet_id} = ${fileSheets.id}`).innerJoin(uploadedFiles, sql`${fileCells.file_id} = ${uploadedFiles.id}`);
    });
  }
});

// server/_core/env.ts
var env_exports = {};
__export(env_exports, {
  ENV: () => ENV
});
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
      supabaseUrl: process.env.VITE_SUPABASE_URL ?? "",
      supabaseKey: process.env.VITE_SUPABASE_ANON_KEY ?? ""
    };
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  getDb: () => getDb,
  getUserByOpenId: () => getUserByOpenId,
  upsertUser: () => upsertUser
});
import { eq, sql as sql2 } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
async function getDb() {
  if (!_dbPromise) {
    _dbPromise = (async () => {
      try {
        const connectionString = ENV.databaseUrl;
        if (!connectionString) {
          throw new Error("DATABASE_URL is not set");
        }
        const client = postgres(connectionString, {
          prepare: false,
          ssl: "require",
          connect_timeout: 10
        });
        const dbInstance = drizzle(client);
        try {
          await dbInstance.execute(sql2`
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
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
var _dbPromise;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    _dbPromise = null;
  }
});

// shared/_core/errors.ts
var HttpError, ForbiddenError;
var init_errors = __esm({
  "shared/_core/errors.ts"() {
    "use strict";
    HttpError = class extends Error {
      constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "HttpError";
      }
    };
    ForbiddenError = (msg) => new HttpError(403, msg);
  }
});

// server/_core/sdk.ts
var sdk_exports = {};
__export(sdk_exports, {
  sdk: () => sdk
});
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var isNonEmptyString, EXCHANGE_TOKEN_PATH, GET_USER_INFO_PATH, GET_USER_INFO_WITH_JWT_PATH, OAuthService, createOAuthHttpClient, SDKServer, CRON_OPEN_ID_PREFIX, sdk;
var init_sdk = __esm({
  "server/_core/sdk.ts"() {
    "use strict";
    init_const();
    init_errors();
    init_db();
    init_env();
    isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
    EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
    GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
    GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
    OAuthService = class {
      constructor(client) {
        this.client = client;
        console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
        if (!ENV.oAuthServerUrl) {
          console.error(
            "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
          );
        }
      }
      decodeState(state) {
        return decodeOAuthState(state).redirectUri;
      }
      async getTokenByCode(code, state) {
        const payload = {
          clientId: ENV.appId,
          grantType: "authorization_code",
          code,
          redirectUri: this.decodeState(state)
        };
        const { data } = await this.client.post(
          EXCHANGE_TOKEN_PATH,
          payload
        );
        return data;
      }
      async getUserInfoByToken(token) {
        const { data } = await this.client.post(
          GET_USER_INFO_PATH,
          {
            accessToken: token.accessToken
          }
        );
        return data;
      }
    };
    createOAuthHttpClient = () => axios.create({
      baseURL: ENV.oAuthServerUrl,
      timeout: AXIOS_TIMEOUT_MS
    });
    SDKServer = class {
      client;
      oauthService;
      constructor(client = createOAuthHttpClient()) {
        this.client = client;
        this.oauthService = new OAuthService(this.client);
      }
      deriveLoginMethod(platforms, fallback) {
        if (fallback && fallback.length > 0) return fallback;
        if (!Array.isArray(platforms) || platforms.length === 0) return null;
        const set = new Set(
          platforms.filter((p) => typeof p === "string")
        );
        if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
        if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
        if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
        if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
          return "microsoft";
        if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
        const first = Array.from(set)[0];
        return first ? first.toLowerCase() : null;
      }
      /**
       * Exchange OAuth authorization code for access token
       * @example
       * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
       */
      async exchangeCodeForToken(code, state) {
        return this.oauthService.getTokenByCode(code, state);
      }
      /**
       * Get user information using access token
       * @example
       * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
       */
      async getUserInfo(accessToken) {
        const data = await this.oauthService.getUserInfoByToken({
          accessToken
        });
        const loginMethod = this.deriveLoginMethod(
          data?.platforms,
          data?.platform ?? data.platform ?? null
        );
        return {
          ...data,
          platform: loginMethod,
          loginMethod
        };
      }
      parseCookies(cookieHeader) {
        if (!cookieHeader) {
          return /* @__PURE__ */ new Map();
        }
        const parsed = parseCookieHeader(cookieHeader);
        return new Map(Object.entries(parsed));
      }
      getSessionSecret() {
        const secret = ENV.cookieSecret;
        return new TextEncoder().encode(secret);
      }
      /**
       * Create a session token for a Manus user openId
       * @example
       * const sessionToken = await sdk.createSessionToken(userInfo.openId);
       */
      async createSessionToken(openId, options = {}) {
        return this.signSession(
          {
            openId,
            appId: ENV.appId,
            name: options.name || ""
          },
          options
        );
      }
      async signSession(payload, options = {}) {
        const issuedAt = Date.now();
        const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
        const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
        const secretKey = this.getSessionSecret();
        return new SignJWT({
          openId: payload.openId,
          appId: payload.appId,
          name: payload.name
        }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
      }
      async verifySession(cookieValue) {
        if (!cookieValue) {
          console.warn("[Auth] Missing session cookie");
          return null;
        }
        try {
          const secretKey = this.getSessionSecret();
          const { payload } = await jwtVerify(cookieValue, secretKey, {
            algorithms: ["HS256"]
          });
          const { openId, appId, name } = payload;
          if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
            console.warn("[Auth] Session payload missing required fields");
            return null;
          }
          return {
            openId,
            appId,
            name
          };
        } catch (error) {
          console.warn("[Auth] Session verification failed", String(error));
          return null;
        }
      }
      async getUserInfoWithJwt(jwtToken) {
        const payload = {
          jwtToken,
          projectId: ENV.appId
        };
        const { data } = await this.client.post(
          GET_USER_INFO_WITH_JWT_PATH,
          payload
        );
        const loginMethod = this.deriveLoginMethod(
          data?.platforms,
          data?.platform ?? data.platform ?? null
        );
        return {
          ...data,
          platform: loginMethod,
          loginMethod
        };
      }
      async authenticateRequest(req) {
        const cookies = this.parseCookies(req.headers.cookie);
        let sessionToken = cookies.get(COOKIE_NAME);
        if (!sessionToken) {
          const authHeader = req.headers.authorization;
          if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
            sessionToken = authHeader.slice(7);
          }
        }
        const session = await this.verifySession(sessionToken);
        if (!session) {
          throw ForbiddenError("Invalid session cookie");
        }
        if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
          const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
          const taskUid = userInfo.taskUid ?? null;
          if (!taskUid) {
            throw ForbiddenError("Cron session missing task_uid");
          }
          return buildCronUser(userInfo);
        }
        const sessionUserId = session.openId;
        const signedInAt = /* @__PURE__ */ new Date();
        let user = await getUserByOpenId(sessionUserId);
        if (!user) {
          try {
            const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
            await upsertUser({
              openId: userInfo.openId,
              name: userInfo.name || null,
              email: userInfo.email ?? null,
              loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
              lastSignedIn: signedInAt
            });
            user = await getUserByOpenId(userInfo.openId);
          } catch (error) {
            console.error("[Auth] Failed to sync user from OAuth:", error);
            throw ForbiddenError("Failed to sync user info");
          }
        }
        if (!user) {
          throw ForbiddenError("User not found");
        }
        await upsertUser({
          openId: user.openId,
          lastSignedIn: signedInAt
        });
        return user;
      }
    };
    CRON_OPEN_ID_PREFIX = "cron_";
    sdk = new SDKServer();
  }
});

// server/_core/context.ts
var context_exports = {};
__export(context_exports, {
  createContext: () => createContext,
  getUserFromRequest: () => getUserFromRequest
});
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return { req: opts.req, res: opts.res, user };
}
async function getUserFromRequest(req) {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    return null;
  }
}
var init_context = __esm({
  "server/_core/context.ts"() {
    "use strict";
    init_sdk();
  }
});

// server/microsoftOAuth.ts
var microsoftOAuth_exports = {};
__export(microsoftOAuth_exports, {
  refreshMicrosoftToken: () => refreshMicrosoftToken,
  registerMicrosoftOAuthRoutes: () => registerMicrosoftOAuthRoutes
});
import { eq as eq2 } from "drizzle-orm";
import cookie from "cookie";
function getMicrosoftRedirectUri() {
  if (process.env.NODE_ENV === "production") {
    return "https://ai-blush-phi.vercel.app/api/auth/microsoft/callback";
  }
  return process.env.MICROSOFT_REDIRECT_URI || "http://localhost:3000/api/auth/microsoft/callback";
}
function registerMicrosoftOAuthRoutes(app) {
  const CLIENT_ID = process.env.VITE_MICROSOFT_CLIENT_ID;
  const CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
  const TENANT_ID = process.env.MICROSOFT_TENANT_ID || "common";
  const REDIRECT_URI = getMicrosoftRedirectUri();
  app.get("/api/auth/microsoft", async (req, res) => {
    const { sdk: sdk2 } = await Promise.resolve().then(() => (init_sdk(), sdk_exports));
    const startUser = await (await Promise.resolve().then(() => (init_context(), context_exports))).getUserFromRequest(req);
    if (!startUser) return res.redirect("/login?error=auth_required_for_microsoft");
    const state = await sdk2.signSession({ openId: startUser.openId, appId: "microsoft-link", name: "microsoft" }, { expiresInMs: 10 * 60 * 1e3 });
    res.cookie("microsoft_oauth_state", state, { httpOnly: true, maxAge: 10 * 60 * 1e3, secure: process.env.NODE_ENV === "production", sameSite: "lax" });
    const authUrl = new URL(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize`);
    authUrl.searchParams.set("client_id", CLIENT_ID || "");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("response_mode", "query");
    authUrl.searchParams.set("scope", "offline_access user.read files.read.all");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("prompt", "select_account");
    res.redirect(authUrl.toString());
  });
  app.get("/api/auth/microsoft/callback", async (req, res) => {
    const code = req.query.code;
    const state = req.query.state;
    const error = req.query.error;
    const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
    const savedState = cookies.microsoft_oauth_state;
    res.clearCookie("microsoft_oauth_state");
    if (error) {
      console.error("[Microsoft OAuth] Error from provider:", error);
      return res.redirect("/assistant?error=microsoft_auth_failed");
    }
    const { sdk: sdk2 } = await Promise.resolve().then(() => (init_sdk(), sdk_exports));
    const stateSession = state ? await sdk2.verifySession(state) : null;
    if (!state || state !== savedState && !stateSession) {
      console.error("[Microsoft OAuth] State mismatch");
      return res.redirect("/assistant?error=microsoft_invalid_state");
    }
    if (!code) {
      return res.redirect("/assistant?error=microsoft_missing_code");
    }
    try {
      const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
      const body = new URLSearchParams({
        client_id: CLIENT_ID || "",
        scope: "offline_access user.read files.read.all",
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
        client_secret: CLIENT_SECRET || ""
      });
      const tokenRes = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString()
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        console.error("[Microsoft OAuth] Token exchange failed:", tokenData);
        return res.redirect("/assistant?error=microsoft_token_failed");
      }
      const { access_token, refresh_token, expires_in } = tokenData;
      const userRes = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      const userData = await userRes.json();
      if (!userRes.ok) {
        console.error("[Microsoft OAuth] Profile fetch failed:", userData);
        return res.redirect("/assistant?error=microsoft_profile_failed");
      }
      const db = await getDb();
      if (!db) {
        return res.redirect("/assistant?error=database_unavailable");
      }
      const user = stateSession ? await getUserByOpenId(stateSession.openId) : await (await Promise.resolve().then(() => (init_context(), context_exports))).getUserFromRequest(req);
      if (!user) return res.redirect("/login?error=auth_required_for_microsoft");
      const expiresAt = new Date(Date.now() + expires_in * 1e3);
      const existing = await db.select().from(userOauthConnections).where(eq2(userOauthConnections.userId, user.id)).limit(1);
      if (existing.length > 0) {
        await db.update(userOauthConnections).set({
          accountId: userData.id,
          accountEmail: userData.userPrincipalName || userData.mail,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq2(userOauthConnections.id, existing[0].id));
      } else {
        await db.insert(userOauthConnections).values({
          userId: user.id,
          provider: "microsoft",
          accountId: userData.id,
          accountEmail: userData.userPrincipalName || userData.mail,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt
        });
      }
      res.redirect("/import?microsoft_connected=true");
    } catch (err) {
      console.error("[Microsoft OAuth] Unhandled exception:", err);
      res.redirect("/assistant?error=microsoft_internal_error");
    }
  });
}
async function refreshMicrosoftToken(userId, db) {
  const { userOauthConnections: userOauthConnections2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { eq: eq7 } = await import("drizzle-orm");
  const existing = await db.select().from(userOauthConnections2).where(eq7(userOauthConnections2.userId, userId)).limit(1);
  if (existing.length === 0 || !existing[0].refreshToken) return null;
  try {
    const CLIENT_ID = process.env.VITE_MICROSOFT_CLIENT_ID;
    const CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
    const TENANT_ID = process.env.MICROSOFT_TENANT_ID || "common";
    const REDIRECT_URI = getMicrosoftRedirectUri();
    const body = new URLSearchParams({
      client_id: CLIENT_ID || "",
      grant_type: "refresh_token",
      refresh_token: existing[0].refreshToken,
      client_secret: CLIENT_SECRET || "",
      redirect_uri: REDIRECT_URI
    });
    const tokenRes = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });
    if (!tokenRes.ok) {
      console.error("[Microsoft OAuth] Token refresh failed:", await tokenRes.text());
      return null;
    }
    const tokenData = await tokenRes.json();
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1e3);
    await db.update(userOauthConnections2).set({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || existing[0].refreshToken,
      expiresAt,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq7(userOauthConnections2.id, existing[0].id));
    return tokenData.access_token;
  } catch (err) {
    console.error("[Microsoft OAuth] Refresh error:", err);
    return null;
  }
}
var init_microsoftOAuth = __esm({
  "server/microsoftOAuth.ts"() {
    "use strict";
    init_db();
    init_schema();
  }
});

// server/inventory-seed.json
var inventory_seed_default;
var init_inventory_seed = __esm({
  "server/inventory-seed.json"() {
    inventory_seed_default = {
      newInventory: [
        {
          source: "NewInventory",
          country: "EGYPT",
          city: "ALEXANDRIA",
          routerName: "VTOALYSV01",
          oldRouterName: "PALY065",
          siteId: "ALYRASV",
          subnetIp: "10.203.8.0/24",
          contactDetails: '"Contact Name :  Ahmed M. Baz \nContact Number : +2 03 5533629 \nContact Email address:  aalghahtani@saudia.com\nAlternative Contact details : Mob: +2 01003580740\n"',
          location: "P2, Bldg Nbr 752, El Geich Road street - Al Mandara, 1st Floor, PO Box 203",
          operationalHours: "",
          proactiveEmailContacts: "mmostaf@saudia.com;\nmounirs@saudia.com;\nslsmgraly@saudia.com;",
          switchName: "ALYRASV-3560-1",
          mcsStatus: "Primary",
          circuitType: "Desktop || EGYPT || VTOALYSV01 || ALYRASV,ALYAASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "Jordan",
          city: "Amman",
          routerName: "VAPAMM001",
          oldRouterName: "PAMM315",
          siteId: "AMMKASV",
          subnetIp: "10.200.95.0 /24",
          contactDetails: '"Contact Name: Ahmed Almaseri\nContact Phone: +962 6 4451166\\5\n00 962795567111\n00 962795305018\nContact email:ahalmasri@saudia.com\n"',
          location: "Saudi Arabian Airlines at Queen Alia Air port at Amman \u2013Jordan . Station Manager Office Terminal 2 North building,  2nd floor , next to KWAIT airlines",
          operationalHours: "",
          proactiveEmailContacts: "ahalmasri@saudia.com",
          switchName: "NA",
          mcsStatus: "Primary",
          circuitType: "Desktop || JORDAN || VAPAMM001, VAPAMM002 || AMMKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "Jordan",
          city: "Amman",
          routerName: "VAPAMM002",
          oldRouterName: "PAMM316",
          siteId: "AMMKASV",
          subnetIp: "10.200.95.0 /24",
          contactDetails: '"Contact Name: Ahmed Almaseri\nContact Phone: +962 6 4451166\\5\n00 962795567111\n00 962795305018\nContact email:ahalmasri@saudia.com\n"',
          location: "Saudi Arabian Airlines at Queen Alia Air port at Amman \u2013Jordan . Station Manager Office Terminal 2 North building,  2nd floor , next to KWAIT airlines",
          operationalHours: "",
          proactiveEmailContacts: "ahalmasri@saudia.com",
          switchName: "NA",
          mcsStatus: "Secondary",
          circuitType: "Desktop || JORDAN || VAPAMM001, VAPAMM002 || AMMKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "Jordan",
          city: "Amman",
          routerName: "VTOAMMSV01",
          oldRouterName: "PAMM159",
          siteId: "AMMRASV",
          subnetIp: "10.200.85.0 /24",
          contactDetails: '"Contact Name : Mohammad A. Alqudah\nContact Number : 0096265537050  , 00962799949901 \nContact Email address: ""ALQUDAH, MOHAMMAD A"" <malqudah@saudia.com> dfoadmin1amm@saudia.com\nAlternative Contact details :  KHATTAB,KHATTAB AHMAD +962-65539799\n"',
          location: '"ALMADINA ALMUNAWARA STREET, \nALHAITHAM COMPLEX, \n2ND FLOOR"',
          operationalHours: "",
          proactiveEmailContacts: "FARAHAHMAD@saudia.com;ralkhatib@saudia.com;malqudah@saudia.com;",
          switchName: "AMMRASV-3560-1 and AMMRASV-3560-2",
          mcsStatus: "Primary",
          circuitType: "Desktop || JORDAN || VTOAMMSV01 || AMMRASV,AMMAASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "BAHRAIN",
          city: "BAHRAIN",
          routerName: "VAPBAH002",
          oldRouterName: "PBAH465",
          siteId: "BAHKASV",
          subnetIp: "10.200.1.0/24",
          contactDetails: '"Contact Name :   Mr. sohail ismaeel alhassn, Emad A Alghatam \nContact Number : +97317321230, 0097317321231 - Office \nContact Email address: stnsupvbah@saudia.com, <eabdulnabi@saudia.com>\nAlternative Contact details : NA"',
          location: "BAHRAIN INTERNATIONAL AIRPORT 4TH FLOUR, OFFICE NO.33",
          operationalHours: "",
          proactiveEmailContacts: "ymhasan@saudia.com;BAHKKSV@saudia.com, eabdulnabi@saudia.com",
          switchName: "NA",
          mcsStatus: "Secondary",
          circuitType: "Desktop || BAHRAIN || VAPBAH001, VAPBAH002 || BAHKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "BAHRAIN",
          city: "BAHRAIN",
          routerName: "VAPBAH001",
          oldRouterName: "PBAH464",
          siteId: "BAHKASV",
          subnetIp: "10.200.1.0/24",
          contactDetails: '"Contact Name :   Mr. sohail ismaeel alhassn, Emad A Alghatam \nContact Number : +97317321230, 0097317321231 - Office \nContact Email address: stnsupvbah@saudia.com, <eabdulnabi@saudia.com>\nAlternative Contact details : NA"',
          location: "BAHRAIN INTERNATIONAL AIRPORT 4TH FLOUR, OFFICE NO.33",
          operationalHours: "",
          proactiveEmailContacts: "ymhasan@saudia.com;BAHKKSV@saudia.com, eabdulnabi@saudia.com",
          switchName: "NA",
          mcsStatus: "Primary",
          circuitType: "Desktop || BAHRAIN || VAPBAH001, VAPBAH002 || BAHKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "BAHRAIN",
          city: "BAHRAIN",
          routerName: "VTOBAHSV01",
          oldRouterName: "PBAH260",
          siteId: "BAHRASV,BAHAASV",
          subnetIp: "10.200.3.0/24",
          contactDetails: '"Contact Name :  Fadhel Darwish Hussain\nContact Number :  (+973) 17 213268 | 17 211550 | 17211660\nContact Email address: fhusain@saudia.com\nAlternative Contact details : Mobil: (+973) 32229985\n"',
          location: '"Bahrain Rsvns/CTO, Suite no.406, City Center\nBuilding no.203,Govrnment Avenue, Block no.304,\nManama-Bahrain"',
          operationalHours: "",
          proactiveEmailContacts: "fhusain@saudia.com;\nymhasan@saudia.com;BAHSMSV@saudia.com; BAHRRSV@saudia.com; BAHSDSV@saudia.com; BAHAASV@saudia.com",
          switchName: "BAHRASV-3560-1 , 2 and 3",
          mcsStatus: "Primary",
          circuitType: "Desktop || BAHRAIN || VTOBAHSV01 || BAHRASV,BAHAASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "Lebanon",
          city: "Beirut",
          routerName: "VAPBEY001",
          oldRouterName: "PBEY256",
          siteId: "BEYKASV",
          subnetIp: "10.200.105.0 /24",
          contactDetails: '"Contact Name :  MISS CAROL ABI HAIDAR //  wassim karout \nContact Number : +961 3 909914 // 009613496933 \nContact Email address:  abihaidar@saudia.com // wkarout@saudia.com \nAlternative Contact details : Office :+9611629366\n"',
          location: "RAFIQ HARIRI AIRPORT SECOND FLOOR - NEXT TO ALJAZEERA OFFICES",
          operationalHours: "",
          proactiveEmailContacts: "abihaidar@saudia.com; wkarout@saudia.com;",
          switchName: "BEYKASV-3560-1, AND 2",
          mcsStatus: "Primary",
          circuitType: "Desktop || LEBANON || PBEY256 || BEYKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "Lebanon",
          city: "Beirut",
          routerName: "VTOBEYSV01",
          oldRouterName: "PBEY370",
          siteId: "BEYRASV",
          subnetIp: "10.200.103.0/24",
          contactDetails: '"Contact Name :  Sylvie El-Allaf\nContact Number : +961-1-999125 Ext-4111\nContact Email address:  selallaf@saudia.com\nAlternative Contact details : \n"',
          location: '"HAMRA STREET\nNEAR CENTRAL BANK,\nSEHNAOUI BLDG - 3rd floor\nBeirut - Lebanon"',
          operationalHours: "",
          proactiveEmailContacts: "selallaf@saudia.com;  svmgrbey&amm@saudia.com;  farhata@saudia.com;",
          switchName: "BEYRASV-3750-1, BEYRASV-3560-3",
          mcsStatus: "Primary",
          circuitType: "Desktop || LEBANON || VTOBEYSV01 || BEYRASV, BEYAASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "INDIA",
          city: "DEVANAHALLI,BANGALORE",
          routerName: "VAPBLR001",
          oldRouterName: "Physical (PBLR471,PBLR469) , Virtual (PBLR796.PBLR797)",
          siteId: "BLRKASV",
          subnetIp: "10.200.254.0 /24",
          contactDetails: '"Contact Name: Nitin Krishnamurthy \nContact Number: + 91 9900139949\nContact Email: <nkrishnamurhty@saudia.com>\nAlternate contact number: +919742239140 - Viga "',
          location: "Saudi Arabian Airlines, Room no.154, Ground floor, Terminal Building, Bengaluru International Airport, Devanahalli, Bengaluru -560300, Karnataka \u2013 India",
          operationalHours: "",
          proactiveEmailContacts: "nkrishnamurhty@saudia.com; sdurai@saudia.com; stnmgrblr@saudia.com; slsmgrblr@saudia.com; dfosupvblr@saudia.com;",
          switchName: "NA",
          mcsStatus: "Primary",
          circuitType: "Desktop || INDIA || VAPBLR001, VAPBLR002 || BLRKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "INDIA",
          city: "DEVANAHALLI,BANGALORE",
          routerName: "VAPBLR002",
          oldRouterName: "Physical (PBLR471,PBLR469) , Virtual (PBLR796.PBLR797)",
          siteId: "BLRKASV",
          subnetIp: "10.200.254.0 /24",
          contactDetails: '"Contact Name: Nitin Krishnamurthy \nContact Number: + 91 9900139949\nContact Email: <nkrishnamurhty@saudia.com>\nAlternate contact number: +919742239140 - Viga "',
          location: "Saudi Arabian Airlines, Room no.154, Ground floor, Terminal Building, Bengaluru International Airport, Devanahalli, Bengaluru -560300, Karnataka \u2013 India",
          operationalHours: "",
          proactiveEmailContacts: "nkrishnamurhty@saudia.com; sdurai@saudia.com; stnmgrblr@saudia.com; slsmgrblr@saudia.com; dfosupvblr@saudia.com;",
          switchName: "NA",
          mcsStatus: "Secondary",
          circuitType: "Desktop || INDIA || VAPBLR001, VAPBLR002 || BLRKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "INDIA",
          city: "MUMBAI",
          routerName: "VAPBOM001",
          oldRouterName: "PBOM1991",
          siteId: "BOMOPSV, BOMKBSV",
          subnetIp: "10.200.34.0/24",
          contactDetails: "Contact Name: PARESH SHIRODKAR, DCRUZ SUNITA\nContact Number: (0091 22 66859092 , 0091 22 66859089) // AA number: 00912266850183\xA0\nContact Email: pshirodkar@saudia.com;",
          location: "Room no 37, 2nd floor Terminal 2A, C. S. International Airport, Mumbai - 400 099",
          operationalHours: "",
          proactiveEmailContacts: "pshirodkar@saudia.com; svmgrbom@saudia.com;",
          switchName: "NA",
          mcsStatus: "Primary",
          circuitType: "Desktop || INDIA || VAPBOM001, VAPBOM002 (SD-WAN Connection) || BOMOPSV, BOMKBSV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "INDIA",
          city: "MUMBAI",
          routerName: "VAPBOM002",
          oldRouterName: "PBOM1992",
          siteId: "BOMOPSV, BOMKBSV",
          subnetIp: "10.200.34.0/24",
          contactDetails: "Contact Name: PARESH SHIRODKAR, DCRUZ SUNITA\nContact Number: (0091 22 66859092 , 0091 22 66859089) // AA number: 00912266850183\xA0\nContact Email: pshirodkar@saudia.com;",
          location: "Room no 37, 2nd floor Terminal 2A, C. S. International Airport, Mumbai - 400 099",
          operationalHours: "",
          proactiveEmailContacts: "pshirodkar@saudia.com; svmgrbom@saudia.com;",
          switchName: "NA",
          mcsStatus: "Secondary",
          circuitType: "Desktop || INDIA || VAPBOM001, VAPBOM002 (SD-WAN Connection) || BOMOPSV, BOMKBSV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "EGYPT",
          city: "CAIRO",
          routerName: "VTOCAISV001",
          oldRouterName: "PCAI521",
          siteId: "CAIRHSV,CAIAASV",
          subnetIp: "10.203.23.0/24",
          contactDetails: "Local Contact (LCON) Name:Wahid Moawad AbuElSaad\nLCON Phone: 20225746245/202 5746626\nLCON email:ihamoda@saudia.com/dfomgrcai@saudia.com\nAlternate Contact Details: Hind || +202 - 257- 462- 46 || hnali@saudia.com",
          location: "SV TOWN OFFICE - 10TH TALAT HARB STREET P.O BOX 2126 ; CAIRO 11111",
          operationalHours: "",
          proactiveEmailContacts: "dfomgrcai@saudia.com;cmcai@saudia.com;",
          switchName: "CAIRHSV-3560-1, 3 AND 4",
          mcsStatus: "Primary",
          circuitType: "Desktop || EGYPT || VTOCAISV001 || CAIRHSV,CAIAASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "FRANCE",
          city: "PARIS",
          routerName: "VAPCDG001",
          oldRouterName: "PCDG642,PCDG641",
          siteId: "CDGKASV (CDGTSSV)",
          subnetIp: "10.202.15.0/24",
          contactDetails: '"Contact Name :  Yaroub almadani\nContact Number : Office Tel:+33148623955\nContact Email address: YMADANI@saudia.com , \nAlternative Contact details : Manager Mr .Jamal EL ADLI , Tel Mob : +33 6 14 75 21 91   jeladli@saudia.com"',
          location: "CHARLES DE GAULLE  - TERMINAL 2E RAMP LINE MAINTENANCE OFFICE. NBR : AR2009",
          operationalHours: "",
          proactiveEmailContacts: '"ATO-CDG <ATO-CDG@saudia.com>;\n""HARROUSSI, NADIA"" <nharroussi@saudia.com>;\nYMADANI@saudia.com;\njeladli@saudia.com;"',
          switchName: "LAN manage by Hup One CDGKASV-3560-1",
          mcsStatus: "Primary",
          circuitType: "Desktop || FRANCE || PCDG642,PCDG641 || CDGKASV (CDGTSSV) ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "INDIA",
          city: "KOCHI",
          routerName: "VAPCOK001",
          oldRouterName: "PCOK067",
          siteId: "COKKASV",
          subnetIp: "10.200.25.0/24",
          contactDetails: '"Local Contact (LCON) Name:Mr. selvaraj\nLCON Phone:+919847268028\nLCON email:""info@arafaathtravels.com\ncok@arafaathtravels.com""\nAlternate Contact Details: 0484 2611508 / 2611509\n"',
          location: "INTERNATIONAL TERMINAL  COCHIN INTNL AIRPORT NEDUMBASSERY COCHIN",
          operationalHours: "",
          proactiveEmailContacts: "info@arafaathtravels.com; stnmgrcok@saudia.com; slsmgrcok@saudia.com; dfosupvcok@saudia.com; cok@arafaathtravels.com;",
          switchName: "COKKASV-3560-1",
          mcsStatus: "Primary",
          circuitType: "Desktop || INDIA || VAPCOK001, VAPCOK002 || COKKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "INDIA",
          city: "KOCHI",
          routerName: "VAPCOK002",
          oldRouterName: "PCOK067",
          siteId: "COKKASV",
          subnetIp: "10.200.25.0/24",
          contactDetails: '"Local Contact (LCON) Name:Mr. selvaraj\nLCON Phone:+919847268028\nLCON email:""info@arafaathtravels.com\ncok@arafaathtravels.com""\nAlternate Contact Details: 0484 2611508 / 2611509\n"',
          location: "INTERNATIONAL TERMINAL  COCHIN INTNL AIRPORT NEDUMBASSERY COCHIN",
          operationalHours: "",
          proactiveEmailContacts: "info@arafaathtravels.com; stnmgrcok@saudia.com; slsmgrcok@saudia.com; dfosupvcok@saudia.com; cok@arafaathtravels.com;",
          switchName: "COKKASV-3560-1",
          mcsStatus: "Secondary",
          circuitType: "Desktop || INDIA || VAPCOK001, VAPCOK002 || COKKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "BANGLADESH",
          city: "DHAKA",
          routerName: "VAPDAC001",
          oldRouterName: "PDAC351",
          siteId: "DACKASV",
          subnetIp: "10.200.8.0/24",
          contactDetails: '"Local Contact (LCON) Name: Mr.Mohammad : 008801926171320   || Shadat :008801711263626    ||""BHUYAN, MUHAMMAD S"" <mbhuiyan@saudia.com>                                      \nLCON email:shossain@saudia.com / svitadmindac@saudia.com\nAlternate Contact Details: KHAN, ABU REZA MD S / 0088-02-8901816 AND MY MOBILE NO. 008801815484067 / askhan@saudia.com || S.M. Zobayer Hossain +88 01913430602 / 008801713032307 shopi\nLCON Phone:00 88 02 8962860\nAlternative Contact details : 008801911366790 \n\n"',
          location: '"ZIA INTERNATIONAL AIRPORT, KURMITOLA, DHAKA, BANGLADESH.Station Manager\nRoom No-11 & \nRoom No-19\n\nSothern Terminal Building (2nd Floor)\nZia International Airport\nKurmitola, Dhaka, Bangladesh"',
          operationalHours: "",
          proactiveEmailContacts: "shossain@saudia.com;   slsmgrdac@saudia.com; dfosupvdac@saudia.com;  askhan@saudia.com; mmizanur@saudia.com ; smorshed@saudia.com; DACKLSV@saudia.com;",
          switchName: "DACKASV-3560-1, AND 2",
          mcsStatus: "Primary",
          circuitType: "Desktop || BANGLADESH || VAPDAC001, VAPDAC002 || DACKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "BANGLADESH",
          city: "DHAKA",
          routerName: "VAPDAC002",
          oldRouterName: "PDAC351",
          siteId: "DACKASV",
          subnetIp: "10.200.8.0/24",
          contactDetails: '"Local Contact (LCON) Name: Mr.Mohammad : 008801926171320   || Shadat :008801711263626    ||""BHUYAN, MUHAMMAD S"" <mbhuiyan@saudia.com>                                      \nLCON email:shossain@saudia.com / svitadmindac@saudia.com\nAlternate Contact Details: KHAN, ABU REZA MD S / 0088-02-8901816 AND MY MOBILE NO. 008801815484067 / askhan@saudia.com || S.M. Zobayer Hossain +88 01913430602 / 008801713032307 shopi\nLCON Phone:00 88 02 8962860\nAlternative Contact details : 008801911366790 \n\n"',
          location: '"ZIA INTERNATIONAL AIRPORT, KURMITOLA, DHAKA, BANGLADESH.Station Manager\nRoom No-11 & \nRoom No-19\n\nSothern Terminal Building (2nd Floor)\nZia International Airport\nKurmitola, Dhaka, Bangladesh"',
          operationalHours: "",
          proactiveEmailContacts: "shossain@saudia.com;   slsmgrdac@saudia.com; dfosupvdac@saudia.com;  askhan@saudia.com; mmizanur@saudia.com ; smorshed@saudia.com; DACKLSV@saudia.com;",
          switchName: "DACKASV-3560-1, AND 2",
          mcsStatus: "Secondary",
          circuitType: "Desktop || BANGLADESH || VAPDAC001, VAPDAC002 || DACKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "INDIA",
          city: "NEW DELHI",
          routerName: "VAPDEL001",
          oldRouterName: "PDEL922",
          siteId: "DELKASV",
          subnetIp: "10.200.14.0/24",
          contactDetails: "Local Contact (LCON) Name: Hari Prakash Khantwal  \nPhone: +91-11-49638906/07 || +919810850520.\nEmail: hkhantwal@saudia.com\n\nMR. gaurav , MR . BHASKAR MOORTHY\nLCON Phone:91-11-25652913/ \nLCON email:hkhantwal@saudia.com \n\nAlternate Contact Details: 91 1 9818081115 , 00911 25652913/25653735 ,",
          location: '"SV back ofc a/p\nRoom#09, ADMIN BLOCK, departure level, Terminal 2, IGI AIRPORT , NEW DELHI 110037."',
          operationalHours: "",
          proactiveEmailContacts: "hkhantwal@saudia.com;  slsmgrdel@saudia.com; delklsv@saudia.com;",
          switchName: "NA",
          mcsStatus: "Primary",
          circuitType: "Desktop || INDIA || VAPDEL001, VAPDEL002 || DELKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "INDIA",
          city: "NEW DELHI",
          routerName: "VAPDEL002",
          oldRouterName: "PDEL923",
          siteId: "DELKASV",
          subnetIp: "10.200.14.0/24",
          contactDetails: "Local Contact (LCON) Name: Hari Prakash Khantwal  \nPhone: +91-11-49638906/07 || +919810850520.\nEmail: hkhantwal@saudia.com\n\nMR. gaurav , MR . BHASKAR MOORTHY\nLCON Phone:91-11-25652913/ \nLCON email:hkhantwal@saudia.com \n\nAlternate Contact Details: 91 1 9818081115 , 00911 25652913/25653735 ,",
          location: '"SV back ofc a/p\nRoom#09, ADMIN BLOCK, departure level, Terminal 2, IGI AIRPORT , NEW DELHI 110037."',
          operationalHours: "",
          proactiveEmailContacts: "hkhantwal@saudia.com;  slsmgrdel@saudia.com; delklsv@saudia.com;",
          switchName: "NA",
          mcsStatus: "Secondary",
          circuitType: "Desktop || INDIA || VAPDEL001, VAPDEL002 || DELKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "ITALY",
          city: "FIUMICINO",
          routerName: "VAPFCO001",
          oldRouterName: "PFCO191",
          siteId: "FCORASV",
          subnetIp: "10.202.47.0/24",
          contactDetails: '"Local Contact (LCON) Name: On duty / coordinator\nLCON Phone: 00 39 0665010155// 00 39 0665010904 || \nemail:omassaro@saudia.com//sfiorentino@saudia.com\nAlternate Contact Details: Cell : 000393477945159 ,+39 0687690948 \n"',
          location: "L. DA VINCI AIRPORT, INTERNATIONAL DEPARTURES TERMINAL  C",
          operationalHours: "",
          proactiveEmailContacts: "sfiorentino@saudia.com;  nouertani@saudia.com; gpastorino@saudia.com;",
          switchName: "FCORASV-3560-1",
          mcsStatus: "Primary",
          circuitType: "Desktop || ITALY || VAPFCO001, VAPFCO002 || FCORASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "ITALY",
          city: "FIUMICINO",
          routerName: "VAPFCO002",
          oldRouterName: "PFCO191",
          siteId: "FCORASV",
          subnetIp: "10.202.47.0/24",
          contactDetails: '"Local Contact (LCON) Name: On duty / coordinator\nLCON Phone: 00 39 0665010155// 00 39 0665010904 || \nemail:omassaro@saudia.com//sfiorentino@saudia.com\nAlternate Contact Details: Cell : 000393477945159 ,+39 0687690948 \n"',
          location: "L. DA VINCI AIRPORT, INTERNATIONAL DEPARTURES TERMINAL  C",
          operationalHours: "",
          proactiveEmailContacts: "sfiorentino@saudia.com;  nouertani@saudia.com; gpastorino@saudia.com;",
          switchName: "FCORASV-3560-1",
          mcsStatus: "Secondary",
          circuitType: "Desktop || ITALY || VAPFCO001, VAPFCO002 || FCORASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "GERMANY",
          city: "FRANKFURT",
          routerName: "VAPFRA001",
          oldRouterName: "PFRA3587",
          siteId: "FRAKASV",
          subnetIp: "10.202.32.0/24",
          contactDetails: '"Local Contact (LCON) Name:Khadeeja / Fabian/(00491723742329 --> Antonious)\nLCON Phone: 49 69 69046611 / 004969818856\nLCON email:fbesier@saudia.com / dereservations@saudia.com\n\nAlternate Contact Name: Ragab Azzab\n AlternateContact Phone: 0049 69 69818 897 and 0049 69 690 46611 ||\nAlternate Contact email: razzab@saudia.com\nAlternate Contact Details:  Mobile number: 0049-1622608707\n"',
          location: "FRANKFURT AIRPORT - BUILDING  151 - TERMINAL 2D GROUND FLOOR - ROOM# 2336",
          operationalHours: "",
          proactiveEmailContacts: "frakksv@saudia.com;",
          switchName: "FRAKASV-3560-1",
          mcsStatus: "Primary",
          circuitType: "Desktop || GERMANY || VAPFRA001, VAPFRA002 (SD-WAN Connection) || FRAKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "GERMANY",
          city: "FRANKFURT",
          routerName: "VAPFRA002",
          oldRouterName: "PFRA3588",
          siteId: "FRAKASV",
          subnetIp: "10.202.32.0/24",
          contactDetails: '"Local Contact (LCON) Name:Khadeeja / Fabian/(00491723742329 --> Antonious)\nLCON Phone: 49 69 69046611 / 004969818856\nLCON email:fbesier@saudia.com / dereservations@saudia.com\n\nAlternate Contact Name: Ragab Azzab\n AlternateContact Phone: 0049 69 69818 897 and 0049 69 690 46611 ||\nAlternate Contact email: razzab@saudia.com\nAlternate Contact Details:  Mobile number: 0049-1622608707\n"',
          location: "FRANKFURT AIRPORT - BUILDING  151 - TERMINAL 2D GROUND FLOOR - ROOM# 2337",
          operationalHours: "",
          proactiveEmailContacts: "frakksv@saudia.com;",
          switchName: "FRAKASV-3560-1",
          mcsStatus: "Secondary",
          circuitType: "Desktop || GERMANY || VAPFRA001, VAPFRA002 (SD-WAN Connection) || FRAKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "GERMANY",
          city: "FRANKFURT",
          routerName: "VTOFRASV01",
          oldRouterName: "PFRA1556",
          siteId: "FRARASV,FRAMMSV,  FRADFSV, FRAAASV",
          subnetIp: "10.202.35.0/24",
          contactDetails: '"Contact Name: BAJ, PETRA\nContact Phone: Tel: +496969818865 / 3\nContact email: pbaj@saudia.com\nAlternate Contact Details: Tel: +49 69 6981 8887 ,0049 69 69818887"',
          location: "FRIEDENSSTRASSE 6-10 3RD FLOOR / EDV-RAUM",
          operationalHours: "",
          proactiveEmailContacts: "salems@saudia.com;svmgrfra@saudia.com;  hmirza@saudia.com;  amarian@saudia.com; Gsattler@saudia.com",
          switchName: "FRARASV-3750-1, AND 2, FRARASV-3560-3, AND 4",
          mcsStatus: "Primary",
          circuitType: "Desktop || GERMANY || VTOFRASV01 || FRARASV,FRAMMSV,  FRADFSV, FRAAASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "SWITZERLAND",
          city: "GENEVA AIRPORT",
          routerName: "VAPGVA001",
          oldRouterName: "PGVA825",
          siteId: "GVAKBSV",
          subnetIp: "10.202.69.0/24",
          contactDetails: '"Contact Name: DERBY, ANDREA\nContact Phone: +4122 939 4104\nContact email: aderby@saudia.com\nAlternative Contact details :SABRINA  0041228174105 , shammache@saudia.com  || 004122 939 4104 , 004122 939 4100.Mohammad Alhassan - +41 22 939 4102"',
          location: "P1 / GVA airport - 15 P.O BOX 727 depature area main terminal - 3rd floor - room 352",
          operationalHours: "",
          proactiveEmailContacts: "aderby@saudia.com; shammache@saudia.com;",
          switchName: "GVAKBSV-3560-1",
          mcsStatus: "Primary",
          circuitType: "Desktop || SWITZERLAND || VAPGVA001, VAPGVA002 || GVAKBSV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "SWITZERLAND",
          city: "GENEVA AIRPORT",
          routerName: "VAPGVA002",
          oldRouterName: "PGVA825",
          siteId: "GVAKBSV",
          subnetIp: "10.202.69.0/24",
          contactDetails: '"Contact Name: DERBY, ANDREA\nContact Phone: +4122 939 4104\nContact email: aderby@saudia.com\nAlternative Contact details :SABRINA  0041228174105 , shammache@saudia.com  || 004122 939 4104 , 004122 939 4100.Mohammad Alhassan - +41 22 939 4102"',
          location: "P1 / GVA airport - 15 P.O BOX 727 depature area main terminal - 3rd floor - room 352",
          operationalHours: "",
          proactiveEmailContacts: "aderby@saudia.com; shammache@saudia.com;",
          switchName: "GVAKBSV-3560-1",
          mcsStatus: "Secondary",
          circuitType: "Desktop || SWITZERLAND || VAPGVA001, VAPGVA002 || GVAKBSV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "INDIA",
          city: "HYDERABAD",
          routerName: "VAPHYD001",
          oldRouterName: "PHYD202",
          siteId: "HYDKASV",
          subnetIp: "10.200.94.0/24",
          contactDetails: '"Contact Name : Bhanu Prakash - SITA \nContact Number : 986-612330\nContact Email address:  bhanu.prakash@sita.aero\nContact Name:  Sherma  \nContact Number: +919987339055  \nContact Email: alim@saudia.com\n\nContact Name: Mohammed Wahid Ali\nContact Number: Tel: 0091 40 6660 5556 | Mobile : +91 9949220001  \n\nContact Name: Reshma \nContact Number: 00919987339055\nContact Email: rmaladkar@saudia.com\n\nContact Name: RESHMA MALADKAR\nContact Number: +914066605556/7 \nContact Email: rmaladkar@saudia.com"',
          location: "A.O-17A, LEVEL-G, PASSENGER TERMINAL BUILDING, RAJIV GANDHI INTERNATIONAL AIRPORT, SHAMSHABAD-501218",
          operationalHours: "",
          proactiveEmailContacts: "alim@saudia.com;\nmmushtaq@saudia.com;\nbhanu.prakash@sita.aero;",
          switchName: "NA",
          mcsStatus: "Primary",
          circuitType: "Desktop || INDIA || VAPHYD001, VAPHYD002 (SD-WAN Connection) || HYDKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "INDIA",
          city: "HYDERABAD",
          routerName: "VAPHYD002",
          oldRouterName: "PHYD203",
          siteId: "HYDKASV",
          subnetIp: "10.200.94.0/24",
          contactDetails: '"Contact Name : Bhanu Prakash - SITA \nContact Number : 986-612330\nContact Email address:  bhanu.prakash@sita.aero\nContact Name:  Sherma  \nContact Number: +919987339055  \nContact Email: alim@saudia.com\n\nContact Name: Mohammed Wahid Ali\nContact Number: Tel: 0091 40 6660 5556 | Mobile : +91 9949220001  \n\nContact Name: Reshma \nContact Number: 00919987339055\nContact Email: rmaladkar@saudia.com\n\nContact Name: RESHMA MALADKAR\nContact Number: +914066605556/7 \nContact Email: rmaladkar@saudia.com"',
          location: "A.O-17A, LEVEL-G, PASSENGER TERMINAL BUILDING, RAJIV GANDHI INTERNATIONAL AIRPORT, SHAMSHABAD-501218",
          operationalHours: "",
          proactiveEmailContacts: '"alim@saudia.com;\nmmushtaq@saudia.com;\nbhanu.prakash@sita.aero;"',
          switchName: "NA",
          mcsStatus: "Secondary",
          circuitType: "Desktop || INDIA || VAPHYD001, VAPHYD002 (SD-WAN Connection) || HYDKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "UNITED STATES",
          city: "WASHINGTON",
          routerName: "VAPIAD001",
          oldRouterName: "PIAD990 , PIAD994",
          siteId: "IADKASV",
          subnetIp: "10.204.20.0/24",
          contactDetails: '"Local Contact (LCON) Name:Abduljalil Maad / Ray : 0015712952006 - rbuhagiar@saudia.com \nLCON Phone:001 (917) 951-8315\nLCON email:jmaad@saudia.com\nAlternate Contact Details: ""ABAZA, IMAN"" <iabaza@saudia.com> // : 17189955112\n"',
          location: "P1(IAD PAX SERVICES, Saudi Arabian Airlines, Dulles International Airport, Main Terminal, Washington, DC 20041,PHONE 703-661-8300, FAX 703-661-8923)",
          operationalHours: "",
          proactiveEmailContacts: "rbuhagiar@saudia.com; iabaza@saudia.com;",
          switchName: "NA",
          mcsStatus: "Primary",
          circuitType: "Desktop || UNITED STATES ||  Primary VR - PIAD990 ,  Secondary VRPIAD994\n || IADKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "UNITED STATES",
          city: "WASHINGTON",
          routerName: "VAPIAD002",
          oldRouterName: "PIAD990 , PIAD994",
          siteId: "IADKASV",
          subnetIp: "10.204.20.0/24",
          contactDetails: '"Local Contact (LCON) Name:Abduljalil Maad / Ray : 0015712952006 - rbuhagiar@saudia.com \nLCON Phone:001 (917) 951-8315\nLCON email:jmaad@saudia.com\nAlternate Contact Details: ""ABAZA, IMAN"" <iabaza@saudia.com> // : 17189955112\n"',
          location: "P1(IAD PAX SERVICES, Saudi Arabian Airlines, Dulles International Airport, Main Terminal, Washington, DC 20041,PHONE 703-661-8300, FAX 703-661-8923)",
          operationalHours: "",
          proactiveEmailContacts: "rbuhagiar@saudia.com; iabaza@saudia.com;",
          switchName: "NA",
          mcsStatus: "Secondary",
          circuitType: "Desktop || UNITED STATES ||  Primary VR - PIAD990 ,  Secondary VRPIAD994\n || IADKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "PAKISTAN",
          city: "ISLAMABAD",
          routerName: "VTOISBSV02",
          oldRouterName: "SOPHOS Connection",
          siteId: "ISBKASV",
          subnetIp: "10.200.130.0/24",
          contactDetails: '"Name:KHURSHID A. KHAN\nLCON Phone: Office: 0092 51 5590455, 00965-6604843,9540765\nLCON email: stnmgrghi@saudia.com\nAlternate Contact Details: TARIQ AFZAL MALIK , custsvcisb@saudia.com , Office:0092515405033 - 5022 \n\n0092 51 5590455\nIntizar-ulhaq 00-92-3335185089 Intizar-ulhaq , ""HAQ, INTIZAR-UL"" ihaq@saudia.com"',
          location: "ISLAMABAD INTNL. AIRPORT ISLAMABAD",
          operationalHours: "",
          proactiveEmailContacts: "ihaq@saudia.com;mhafeez@saudia.com;",
          switchName: "ISBKASV-3560-1",
          mcsStatus: "Primary",
          circuitType: "Desktop || PAKISTAN || VTOISBSV02 || ISBKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "PAKISTAN",
          city: "ISLAMABAD",
          routerName: "VTOISBSV01",
          oldRouterName: "PISB068",
          siteId: "ISBRASV,ISBAASV",
          subnetIp: "10.200.131.0/24",
          contactDetails: '"Contact Name: ABDUL RAZAQ KHAN // Younis: 00923455548800\nContact Phone: OFFICE: 00 92 51 2270164\nContact email: arazaq@saudia.com\nAlternate contact details: USMAN AHMED KHAN - ukhana@saudia.com\n"',
          location: "ISLAMABAD RSVNS/CTO, 52 WEST MODERN PLAZA, BLUE AREA, JINNAH AVE.",
          operationalHours: "",
          proactiveEmailContacts: "arazaq@saudia.com;ukhana@saudia.com;",
          switchName: "ISBRASV-3560-1",
          mcsStatus: "Primary",
          circuitType: "Desktop || PAKISTAN || VTOISBSV01 || ISBRASV,ISBAASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "TURKEY",
          city: "ISTANBUL",
          routerName: "VAPIST001",
          oldRouterName: "PIST2148",
          siteId: "ISTKASV",
          subnetIp: "10.200.226.0/24",
          contactDetails: 'Contact Name: Nurcan YIGIT \nContact Phone: +90 530 772 8787 \nContact email:""YIGIT, NURCAN"" <NYIGIT@saudia.com>,, \nAlternate Contact Details: + 90 212 465 31 22',
          location: "ISTANBUL YENI HAVALIMANI\nGIDIS KATI/TERMINALI\n5. KAT (IGA YONETIM OFISLERININ UST KATI)\nMahal No: 7J-0408 \nTAYAKADIN, ARNAVUTKOY, ISTANBUL",
          operationalHours: "",
          proactiveEmailContacts: "NYIGIT@saudia.com;  mtan@saudia.com;",
          switchName: "ISTKASV- 3650-1",
          mcsStatus: "Primary",
          circuitType: "Desktop || TURKEY || VAPIST001, VAPIST001 (SD-WAN Connection) || ISTKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "TURKEY",
          city: "ISTANBUL",
          routerName: "VAPIST002",
          oldRouterName: "PIST2149",
          siteId: "ISTKASV",
          subnetIp: "10.200.226.0/24",
          contactDetails: 'Contact Name: Nurcan YIGIT \nContact Phone: +90 530 772 8787 \nContact email:""YIGIT, NURCAN"" <NYIGIT@saudia.com>,, \nAlternate Contact Details: + 90 212 465 31 22',
          location: "ISTANBUL YENI HAVALIMANI\nGIDIS KATI/TERMINALI\n5. KAT (IGA YONETIM OFISLERININ UST KATI)\nMahal No: 7J-0408 \nTAYAKADIN, ARNAVUTKOY, ISTANBUL",
          operationalHours: "",
          proactiveEmailContacts: "NYIGIT@saudia.com;  mtan@saudia.com;",
          switchName: "ISTKASV- 3650-1",
          mcsStatus: "Secondary",
          circuitType: "Desktop || TURKEY || VAPIST001, VAPIST001 (SD-WAN Connection) || ISTKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "TURKEY",
          city: "ISTANBUL",
          routerName: "VTOISTSV01",
          oldRouterName: "Sophos Connection",
          siteId: "ISTRASV,ISTAASV",
          subnetIp: "10.200.225.0/24",
          contactDetails: '"Local Contact (LCON) Name: CANDAN OKTEM\nLCON Phone:  0090 212 444 9591: Ext (9) then (5) then (1) then (4) then (1) / 0090 212 213 0980  EXT 230\nLCON email: coktem@saudia.com',
          location: "BUYUKDERE CAD. NO: 100-102 MAYA AKAR CENTER  FLOOR - 21 ESENTEPE - SISILI",
          operationalHours: "",
          proactiveEmailContacts: '"istde@saudia.com;VESEVEN@saudia.com;diarslan@saudia.com;',
          switchName: "ISTRASV-3750-1, AND ISTRASV-3560-3",
          mcsStatus: "Primary",
          circuitType: "Desktop || TURKEY || VTOISTSV01 || ISTRASV,ISTAASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "Saudia Arabia",
          city: "Jeddah",
          routerName: "VDCJEDSV01",
          oldRouterName: "",
          siteId: "",
          subnetIp: "",
          contactDetails: "MOAZ ALHAMDAN moalhamdan@saudia.com       966507702959",
          location: "KAIA DC2 JED Airport T1, Jeddah, , SATown",
          operationalHours: "",
          proactiveEmailContacts: "",
          switchName: "",
          mcsStatus: "Primary",
          circuitType: "",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "Saudia Arabia",
          city: "Jeddah",
          routerName: "VDCJEDSV02",
          oldRouterName: "",
          siteId: "",
          subnetIp: "",
          contactDetails: "MOAZ ALHAMDAN moalhamdan@saudia.com       966507702959",
          location: "KAIA DC2 JED Airport T1, Jeddah, , SATown",
          operationalHours: "",
          proactiveEmailContacts: "",
          switchName: "",
          mcsStatus: "Secondary",
          circuitType: "",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "UNITED STATES",
          city: "JAMAICA,",
          routerName: "JFKKFSV",
          oldRouterName: "VTOJFKSV01",
          siteId: "JFKKFSV",
          subnetIp: "10.204.66.0/24",
          contactDetails: '"Contact Name: Pio\nContact Number: 001-646-772-1315\nContact Email: NERIA JR, PIO <PNERIA@saudia.com>\nContact Name: Annie Khan \nContact Number:Mobile 917-442-2209\nContact Email: QKHAN@saudia.com                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          "',
          location: "PAX SERVICE, JFK INT'L AIRPORT, TERMINAL1 DEPARTURE AREA, JAMAICA, NY 11430",
          operationalHours: "",
          proactiveEmailContacts: "stnmgrjfk@saudia.com;",
          switchName: "JFKKFSV-3560-1",
          mcsStatus: "Primary",
          circuitType: "Desktop || UNITED STATES || VTOJFKSV01 || JFKKFSV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "PAKISTAN",
          city: "KARACHI",
          routerName: "VTOKHISV01",
          oldRouterName: "PKHI419.PKHI420",
          siteId: "KHIAASV, KHIRASV, KHIRBSV",
          subnetIp: "10.200.138.0/24",
          contactDetails: '"Contact name: MR. Usman 00923333796189 // ARSALAN AHMED ASHRAFI +92 345 2761993\nContact phone:00 92-21-35631430 // 00923333796189 IT guy\nContact E-mail:aashrafi@saudia.com // ukhana@saudia.com (for Mr.Usman)\n\n"',
          location: '"AL-SEHIAT CENTRE, 06 FLOOR,\n195 - RAFIQUE SHAHEED ROAD,\nOFF / SHARA-E-FAISAL"',
          operationalHours: "",
          proactiveEmailContacts: "aashrafi@saudia.com;  slsmgrkhi@saudia.com; ukhana@saudia.com;",
          switchName: "KHIRASV-3560-1, 3, 4, AND 5",
          mcsStatus: "Primary",
          circuitType: "Desktop || PAKISTAN || VTOKHISV01 || KHIAASV, KHIRASV, KHIRBSV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "PAKISTAN",
          city: "KARACHI",
          routerName: "VTOKHISV02",
          oldRouterName: "PKHI274",
          siteId: "KHIKASV, KHIKCSV, KHIKDSV, KHIOPSV, KHIKBSV",
          subnetIp: "10.200.133.0/24",
          contactDetails: '"Contact Name: Syed Zaidi\nContact Phone: 0092 345 2090072 \nContact email: SZAIDI@saudia.com \nAlternate Contact Details: 00922134680333 \n"',
          location: "Karachi Intnl.Airport New Terminal (network1)",
          operationalHours: "",
          proactiveEmailContacts: "SZAIDI@saudia.com ; slsmgrkhi@saudia.com;",
          switchName: "KHIKBSV-3560-1, 2, AND 3",
          mcsStatus: "Primary",
          circuitType: "Desktop || PAKISTAN || VTOKHISV02, VTOKHISV03 || KHIKASV, KHIKCSV, KHIKDSV, KHIOPSV, KHIKBSV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "PAKISTAN",
          city: "KARACHI",
          routerName: "VTOKHISV03",
          oldRouterName: "PKHI274",
          siteId: "KHIKASV, KHIKCSV, KHIKDSV, KHIOPSV, KHIKBSV",
          subnetIp: "10.200.133.0/24",
          contactDetails: '"Contact Name: Syed Zaidi\nContact Phone: 0092 345 2090072 \nContact email: SZAIDI@saudia.com \nAlternate Contact Details: 00922134680333 \n"',
          location: "Karachi Intnl.Airport New Terminal (network1)",
          operationalHours: "",
          proactiveEmailContacts: "SZAIDI@saudia.com ; slsmgrkhi@saudia.com;",
          switchName: "KHIKBSV-3560-1, 2, AND 3",
          mcsStatus: "Secondary",
          circuitType: "Desktop || PAKISTAN || VTOKHISV02, VTOKHISV03 || KHIKASV, KHIKCSV, KHIKDSV, KHIOPSV, KHIKBSV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "MALAYSIA",
          city: "KUALA LUMPUR",
          routerName: "VAPKUL001",
          oldRouterName: "PKUL716",
          siteId: "KULKASV",
          subnetIp: "10.200.112.0/24",
          contactDetails: '"Contact Name: siti soraya mohammad\nContact Phone: 60387766329 / 0060387766350 / 0060387766327\nContact email:ssalleh@saudia.com\n\nAlternate Contact Details: 60387766350 60387766347\n"',
          location: "MAIN TERMINAL BUILDING, KLIA - 4TH FLOOR - ROOM#: S39-42 KUALA LUMPUR",
          operationalHours: "",
          proactiveEmailContacts: "slsmgrkul@saudia.com; ssalleh@saudia.com;",
          switchName: "KULKASV-3650-1",
          mcsStatus: "Primary",
          circuitType: "Desktop || MALAYSIA || VAPKUL001, VAPKUL002 || KULKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "MALAYSIA",
          city: "KUALA LUMPUR",
          routerName: "VAPKUL002",
          oldRouterName: "PKUL716",
          siteId: "KULKASV",
          subnetIp: "10.200.112.0/24",
          contactDetails: '"Contact Name: siti soraya mohammad\nContact Phone: 60387766329 / 0060387766350 / 0060387766327\nContact email:ssalleh@saudia.com\n\nAlternate Contact Details: 60387766350 60387766347\n"',
          location: "MAIN TERMINAL BUILDING, KLIA - 4TH FLOOR - ROOM#: S39-42 KUALA LUMPUR",
          operationalHours: "",
          proactiveEmailContacts: "slsmgrkul@saudia.com; ssalleh@saudia.com;",
          switchName: "KULKASV-3650-1",
          mcsStatus: "Secondary",
          circuitType: "Desktop || MALAYSIA || VAPKUL001, VAPKUL002 || KULKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "PAKISTAN",
          city: "LAHORE",
          routerName: "VTOLHESV01",
          oldRouterName: "PLHE085",
          siteId: "LHEOPSV,LHEKASV",
          subnetIp: "10.200.141.0/24",
          contactDetails: '"""Local Contact (LCON) Name:Tahir N Butt, Munawar Mahmood \nLCON Phone: 00923307805014 = general number for LHE office\n00923344056966 : Munawar Mahmood <mumahmood@saudia.com\nLCON email:slsmgrlhe@saudia.com || <tbutt@saudia.com> || mumahmood@saudia.com\nAlternative Contact Details: 00923004422122, 00924236611451, 0092-42-36611457, 0092-42-36611458, 0092-42-36611459, 0092-42 0300-9481238"""',
          location: "ATO LAHORE, PAKISTAN ROOM NO3150 , LEVEL3 , ALLAMA IQBAL INTERNATIONAL",
          operationalHours: "",
          proactiveEmailContacts: "pasif@saudia.com; custsvclhe@saudia.com; \n\ntbutt@saudia.com; LHEKDSV@saudia.com; \n\nmgropspak@saudia.com;ATARIF@saudia.com; \n\nmumahmood@saudia.com",
          switchName: "LHEOPSV-3560-1, AND LHEOPSV-3560-2",
          mcsStatus: "Primary",
          circuitType: "Desktop || PAKISTAN || VTOLHESV01 || LHEOPSV,LHEKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "PAKISTAN",
          city: "LAHORE",
          routerName: "VTOLHESV02",
          oldRouterName: "PLHE199",
          siteId: "LHERASV,LHEAASV",
          subnetIp: "10.200.143.0/24",
          contactDetails: '"Local Contact (LCON) Name:KHURSHID A. \nLCON Phone:+922103452128778 / +92-42-36304776 office \nLCON email:stnmgrghi@saudia.com,dfomgrkhi@saudia.com\nAlternate Contact Details: BABAR IKRAM / Tel: 0092 42 36315413 / slsmgrlhe@saudia.com\nBABAR IKRAM                                 -           bikram@saudia.com               Cell # 0092-322-4564564\nTOUQEER MEHDI                            -           tmehdi@saudia.com               Cell # 0092-300-9422214 (presently this employee is on Annual Vacation till 05DEC17)\nMUHAMMAD NAZIR UD DIN     -           mnaziruddin@saudia.com    Cell # 0092-321-9490747\nZAMIR USMAN DAR                      -           zdar@saudia.com                   Cell # 0092-333-4338893\n\n"',
          location: '"Saudi Arabian Airlines\n06 Carim\u2019s house\nDavis Road\nLahore - Pakistan"',
          operationalHours: "",
          proactiveEmailContacts: "bikram@saudia.com;tmehdi@saudia.com;mnaziruddin@saudia.com",
          switchName: "LHERASV-3560-1",
          mcsStatus: "Primary",
          circuitType: "Desktop || PAKISTAN || VTOLHESV02 || LHERASV,LHEAASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "UNITED KINGDOM",
          city: "HEATHROW",
          routerName: "VAPLHR001",
          oldRouterName: "PLHR2642",
          siteId: "LHROPSV, LHRKASV, LHRKBSV, LHRKCSV",
          subnetIp: "10.202.81.0/24",
          contactDetails: '"Local Contact (LCON) Name: +44(0)7884187879 - NAHLA ELSHERBINI , Susan  . Office:      44(0)2085644427-IPT:5644428\nMobile:    44(0)7727118348\n"',
          location: "SAUDI ARABIAN AIRLINES SOUTH WEST EXTENSION TERMINAL 4 - ROOM 6112,FIRST FLOOR",
          operationalHours: "",
          proactiveEmailContacts: "Nahla.elsherbini@saudia.com;LHRKDSV-OFFICE@saudia.com;SUSAN.MUSTAFA@saudia.com;stnmgrlhr@saudia.com;",
          switchName: "LHROPSV-3750-4, AND 5, LHROPSV-3560-4, 5, AND 6",
          mcsStatus: "Primary",
          circuitType: "Desktop || UNITED KINGDOM ||VAPLHR001, VAPLHR002 || LHROPSV, LHRKASV, LHRKBSV, LHRKCSV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "UNITED KINGDOM",
          city: "HEATHROW",
          routerName: "VAPLHR002",
          oldRouterName: "PLHR2143",
          siteId: "LHROPSV, LHRKASV, LHRKBSV, LHRKCSV",
          subnetIp: "10.202.81.0/24",
          contactDetails: '"Local Contact (LCON) Name: +44(0)7884187879 - NAHLA ELSHERBINI , Susan  . Office:      44(0)2085644427-IPT:5644428\nMobile:    44(0)7727118348\n"',
          location: "SAUDI ARABIAN AIRLINES SOUTH WEST EXTENSION TERMINAL 4 - ROOM 6112,FIRST FLOOR",
          operationalHours: "",
          proactiveEmailContacts: "Nahla.elsherbini@saudia.com;LHRKDSV-OFFICE@saudia.com;SUSAN.MUSTAFA@saudia.com;stnmgrlhr@saudia.com;",
          switchName: "LHROPSV-3750-4, AND 5, LHROPSV-3560-4, 5, AND 6",
          mcsStatus: "Secondary",
          circuitType: "Desktop || UNITED KINGDOM ||VAPLHR001, VAPLHR002 || LHROPSV, LHRKASV, LHRKBSV, LHRKCSV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "INDIA",
          city: "LUCKNOW",
          routerName: "VTOLKOSV01",
          oldRouterName: "PLKO018",
          siteId: "LKOKASV",
          subnetIp: "10.200.18.0/24",
          contactDetails: '"Local Contact (LCON) Name:""Name: Mr. Sanjay Singh on Mob : 0091 9628704538.\nMobile: +91 9695 777744\nLCON Email:  LKOSDSV@saudia.com , lkollsv@saudiairlnes.com , ssingh@saudia.com\n"',
          location: "Saudi Arabian Airlines, Chaudhary Charan Singh Airport, New Terminal Building, Lucknow, Uttar Pradesh \u2013 India TICKETING COUNTER, Area 05.00 Sq mtr, New Terminal Building, Ground floor BACK-UP OFFICE, Area 22.15 sq mtr, First floor, New Terminal Building",
          operationalHours: "",
          proactiveEmailContacts: "SUPVSALESLKO@saudia.com; LKOSDSV@saudia.com; lkollsv@saudiairlnes.com; ssingh@saudia.com;",
          switchName: "NA",
          mcsStatus: "Primary",
          circuitType: "Desktop || INDIA || VTOLKOSV01 || LKOKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "SPAIN",
          city: "MADRID",
          routerName: "VAPMAD001",
          oldRouterName: "PMAD6094",
          siteId: "MADKASV",
          subnetIp: "10.202.65.0/24",
          contactDetails: '"Contact Name: Garcia\nContact Phone: 00 34 91 301 05 15 , Avaia :dial 547 30 51\nContact email: gbgarcia@saudia.com \nAlternative Contact details : \n"',
          location: '"Adolfo Su\xE1rez Madrid\u2013Barajas\nAirport, MADRID BARAJAS\nAIRPORT,\nTERMINAL T1, 28042, Av de la Hispanidad, s/n\nMADRID, SPAIN""\n34283 Istanbul"',
          operationalHours: "",
          proactiveEmailContacts: "pquesada@saudia.com;\ngbgarcia@saudia.com;",
          switchName: "MADKASV-3560-1",
          mcsStatus: "Primary",
          circuitType: "Desktop || SPAIN || VAPMAD001, VAPMAD002 ||  MADKASV  ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "SPAIN",
          city: "MADRID",
          routerName: "VAPMAD002",
          oldRouterName: "PMAD6095",
          siteId: "MADKASV",
          subnetIp: "10.202.65.0/24",
          contactDetails: '"Contact Name: Garcia\nContact Phone: 00 34 91 301 05 15 , Avaia :dial 547 30 51\nContact email: gbgarcia@saudia.com \nAlternative Contact details : \n"',
          location: 'Adolfo Su\xE1rez Madrid\u2013Barajas\nAirport, MADRID BARAJAS\nAIRPORT,\nTERMINAL T1, 28042, Av de la Hispanidad, s/n\nMADRID, SPAIN""\n34283 Istanbul"',
          operationalHours: "",
          proactiveEmailContacts: "pquesada@saudia.com;\ngbgarcia@saudia.com;",
          switchName: "MADKASV-3560-1",
          mcsStatus: "Secondary",
          circuitType: "Desktop || SPAIN || VAPMAD001, VAPMAD002 ||  MADKASV  ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "SPAIN",
          city: "MADRID",
          routerName: "VTOMADSV01",
          oldRouterName: "PMAD2569",
          siteId: "MADRASV",
          subnetIp: "10.202.64.0/24",
          contactDetails: "Contact Names: Juan Sanz || Maria CARMONA\nOffice Telephone : 0034915475806  - EXT: 4\nContact email: jsanz@saudia.com || mcarmona@saudia.com",
          location: '"P1 (C/PRINCESA Nr 29. \nGROUND FLOOR,\n28008 MADRID)"',
          operationalHours: "",
          proactiveEmailContacts: "jterceno@saudia.com; aberry@saudia.com; jterceno@saudia.com;",
          switchName: "MADRASV-3560-1",
          mcsStatus: "Primary",
          circuitType: "Desktop || SPAIN || VTOMADSV01 || MADRASV,MADAASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "UNITED KINGDOM",
          city: "Manchester",
          routerName: "VAPMAN001",
          oldRouterName: "PMAN1665",
          siteId: "MANKASV, MANKBSV",
          subnetIp: "10.202.77.1/25",
          contactDetails: '"Contact Name: Kathryn Dott\nContact Phone: 0044 (0) 7899 795121 || 0044798 3000 || 00447899 795121\nContact email:""DOTT,KATHRYN"" <KADOTT@saudia.com>\n"',
          location: '"Room 1169\nLevel 1\nTerminal 2\nManchester Airport\nM90 4AX"',
          operationalHours: "",
          proactiveEmailContacts: 'DOTT,KATHRYN"" <KADOTT@saudia.com>;\nemwood@saudia.com;"',
          switchName: "NA",
          mcsStatus: "Primary",
          circuitType: "Desktop || UNITED KINGDOM || VAPMAN001, VAPMAN002 (SD-WAN Connection) || MANKASV, MANKBSV  ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "UNITED KINGDOM",
          city: "Manchester",
          routerName: "VAPMAN002",
          oldRouterName: "PMAN1666",
          siteId: "MANKASV, MANKBSV",
          subnetIp: "10.202.77.1/25",
          contactDetails: '"Contact Name: Kathryn Dott\nContact Phone: 0044 (0) 7899 795121 || 0044798 3000 || 00447899 795121\nContact email:""DOTT,KATHRYN"" <KADOTT@saudia.com>\n"',
          location: '"Room 1169\nLevel 1\nTerminal 2\nManchester Airport\nM90 4AX"',
          operationalHours: "",
          proactiveEmailContacts: 'DOTT,KATHRYN"" <KADOTT@saudia.com>;\nemwood@saudia.com;"',
          switchName: "NA",
          mcsStatus: "Secondary",
          circuitType: "Desktop || UNITED KINGDOM || VAPMAN001, VAPMAN002 (SD-WAN Connection) || MANKASV, MANKBSV  ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "PHILIPPINES",
          city: "MANILA",
          routerName: "VAPMNL001",
          oldRouterName: "PMNL1597",
          siteId: "MNLOPSV, MNLKASV",
          subnetIp: "10.200.160.0/24",
          contactDetails: '"EMAIL:  MNLKKSV@SAUDIA.COM  and MNLKDSV@SAUDIA.COM , hjonson@saudia.com\n\nLANDLINE PHONE NUMBERS:  +63 2 8879 5030   /  +63 2 8831 0070\n\nHerbert Carlos Jonson PERSONAL MOBILE NO.: +63 917 828 5015"',
          location: "NINOY AQUINO INTERNATIONAL AIRPORT.",
          operationalHours: "",
          proactiveEmailContacts: "MNLKKSV@SAUDIA.COM ; MNLKDSV@SAUDIA.COM ;hjonson@saudia.com;",
          switchName: "MNL1-HN4000-2-1M# Port 15",
          mcsStatus: "Primary",
          circuitType: "Desktop || PHILIPPINES || VAPMNL001, VAPMNL002 (SD-WAN Connection) || MNLOPSV, MNLKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "PHILIPPINES",
          city: "MANILA",
          routerName: "VAPMNL002",
          oldRouterName: "PMNL1597",
          siteId: "MNLOPSV, MNLKASV",
          subnetIp: "10.200.160.0/24",
          contactDetails: '"EMAIL:  MNLKKSV@SAUDIA.COM  and MNLKDSV@SAUDIA.COM , hjonson@saudia.com\n\nLANDLINE PHONE NUMBERS:  +63 2 8879 5030   /  +63 2 8831 0070\n\nHerbert Carlos Jonson PERSONAL MOBILE NO.: +63 917 828 5015"',
          location: "NINOY AQUINO INTERNATIONAL AIRPORT.",
          operationalHours: "",
          proactiveEmailContacts: "MNLKKSV@SAUDIA.COM ; MNLKDSV@SAUDIA.COM ;hjonson@saudia.com;",
          switchName: "MNL1-HN4000-2-1M# Port 15",
          mcsStatus: "Secondary",
          circuitType: "Desktop || PHILIPPINES || VAPMNL001, VAPMNL002 (SD-WAN Connection) || MNLOPSV, MNLKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "PHILIPPINES",
          city: "MAKATI CITY",
          routerName: "VTOMNLSV01",
          oldRouterName: "PMNL1365",
          siteId: "MNLRDSV,MNLRESV,MNLAASV",
          subnetIp: "10.200.155.0/24",
          contactDetails: '"Local Contact (LCON) Name: +63283337767  - IMELDA REYES\nLCON Phone: +6328906637 / +632-8906635\n632-899 6265\n632-890 5955\nLCON email:dfosupvmnl@saudia.com / mgregorio@saudia.com\n\nLocal Contact (LCON) Name: DE GUZMAN, KIMBERLY A\nLCON Phone: Office # +6328906628 || Mobile # +639333043328\nLCON email: kdeguzman@saudia.com"',
          location: '"Saudi Arabian Airlines \n19/F Zuellig Building \nMakati Avenue corner Paseo de Roxas\nMakati City"',
          operationalHours: "",
          proactiveEmailContacts: "dfosupvmnl@saudia.com; mgregorio@saudia.com; kdeguzman@saudia.com;",
          switchName: "MNLRDSV-3560-1, 2, 3, AND 4",
          mcsStatus: "Primary",
          circuitType: "Desktop || PHILIPPINES || VTOMNLSV01, VTOMNLSV02 || MNLRDSV,MNLRESV,MNLAASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "PHILIPPINES",
          city: "MAKATI CITY",
          routerName: "VTOMNLSV02",
          oldRouterName: "PMNL1365",
          siteId: "MNLRDSV,MNLRESV,MNLAASV",
          subnetIp: "10.200.155.0/24",
          contactDetails: '"Local Contact (LCON) Name: +63283337767  - IMELDA REYES\nLCON Phone: +6328906637 / +632-8906635\n632-899 6265\n632-890 5955\nLCON email:dfosupvmnl@saudia.com / mgregorio@saudia.com\n\nLocal Contact (LCON) Name: DE GUZMAN, KIMBERLY A\nLCON Phone: Office # +6328906628 || Mobile # +639333043328\nLCON email: kdeguzman@saudia.com"',
          location: '"Saudi Arabian Airlines \n19/F Zuellig Building \nMakati Avenue corner Paseo de Roxas\nMakati City"',
          operationalHours: "",
          proactiveEmailContacts: "dfosupvmnl@saudia.com; mgregorio@saudia.com; kdeguzman@saudia.com;",
          switchName: "MNLRDSV-3560-1, 2, 3, AND 4",
          mcsStatus: "Secondary",
          circuitType: "Desktop || PHILIPPINES || VTOMNLSV01, VTOMNLSV02 || MNLRDSV,MNLRESV,MNLAASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "Germany",
          city: "Munich",
          routerName: "VAPMUC001",
          oldRouterName: "PMUC1982",
          siteId: "MUCKASV",
          subnetIp: "10.202.38.0/24",
          contactDetails: '"Contact Name: RAGB AZZAB\nContact Phone: 4989 975 91130 / 49 162 260 8707\nContact email: razzab@saudia.com"',
          location: "Germany, Munich, Terminal 1, Modul C, Level 04, non-security area, Room 315 (for DCS), Room 314 and Counters c211/c212",
          operationalHours: "",
          proactiveEmailContacts: "razzab@saudia.com",
          switchName: "NA",
          mcsStatus: "Primary",
          circuitType: "Desktop || Germany || VAPMUC001. VAPMUC002 (SD-WAN Connection) || MUCKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "Germany",
          city: "Munich",
          routerName: "VAPMUC002",
          oldRouterName: "PMUC1983",
          siteId: "MUCKASV",
          subnetIp: "10.202.38.0/24",
          contactDetails: '"Contact Name: RAGB AZZAB\nContact Phone: 4989 975 91130 / 49 162 260 8707\nContact email: razzab@saudia.com"',
          location: "Germany, Munich, Terminal 1, Modul C, Level 04, non-security area, Room 315 (for DCS), Room 314 and Counters c211/c212",
          operationalHours: "",
          proactiveEmailContacts: "razzab@saudia.com",
          switchName: "NA",
          mcsStatus: "Secondary",
          circuitType: "Desktop || Germany || VAPMUC001. VAPMUC002 (SD-WAN Connection) || MUCKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "PAKISTAN",
          city: "MULTAN",
          routerName: "VTOMUXSV01",
          oldRouterName: "PMUX009",
          siteId: "MUXKASV",
          subnetIp: "10.200.120.0/24",
          contactDetails: '"Name: Faisal Shahzad \nContact number :  0092 61 6306861 / 009261_6306862 / 009261_6306863\nContact email: mgrslssvcslhe@saudia.com\n\nAlternative: ESSAM A. AL HABSI\nOffice:     +92 42 36315413\nMobile:    +92 3311310333\nE-mail:    mgrslssvcslhe@saudia.com',
          location: "Check-in ( briefing area ) , Multan international airport",
          operationalHours: "",
          proactiveEmailContacts: "friaz@saudia.com ;    fshahzad@saudia.com",
          switchName: "NA",
          mcsStatus: "Primary",
          circuitType: "Desktop || PAKISTAN || VTOMUXSV01 || MUXKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "ITALY",
          city: "MALPENSA",
          routerName: "VAPMXP001",
          oldRouterName: "PMXP145",
          siteId: "MXPKASV",
          subnetIp: "10.202.50.0/24",
          contactDetails: '"Local Contact (LCON) Name: Anna Romeo\nLCON Phone: Tel: 00390642030432  \nLCON email:gsaitaly@saudia.com\n\nAlternate Contact Details: Tel: 0039 02 58581295 || William Moura || ""MOURA, WILLIAM"" <wmoura@saudia.com>',
          location: "TERMINAL 1 CORRIDOIO A 3RD FLOOR - ROOM 195",
          operationalHours: "",
          proactiveEmailContacts: "wmoura@saudia.com; gperon@saudia.com; svmgrrom@saudia.com;",
          switchName: "MXPKASV-3560-1",
          mcsStatus: "Primary",
          circuitType: "Desktop || ITALY || VAPMXP001, VAPMXP002 || MXPKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "ITALY",
          city: "MALPENSA",
          routerName: "VAPMXP002",
          oldRouterName: "PMXP145",
          siteId: "MXPKASV",
          subnetIp: "10.202.50.0/24",
          contactDetails: '"Local Contact (LCON) Name: Anna Romeo\nLCON Phone: Tel: 00390642030432  \nLCON email:gsaitaly@saudia.com\n\nAlternate Contact Details: Tel: 0039 02 58581295 || William Moura || ""MOURA, WILLIAM"" <wmoura@saudia.com>',
          location: "TERMINAL 1 CORRIDOIO A 3RD FLOOR - ROOM 195",
          operationalHours: "",
          proactiveEmailContacts: "wmoura@saudia.com; gperon@saudia.com; svmgrrom@saudia.com;",
          switchName: "MXPKASV-3560-1",
          mcsStatus: "Secondary",
          circuitType: "Desktop || ITALY || VAPMXP001, VAPMXP002 || MXPKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "KENYA",
          city: "NAIROBI",
          routerName: "VAPNBO001",
          oldRouterName: "PNBO222",
          siteId: "NBOKASV",
          subnetIp: "10.203.45.0/24",
          contactDetails: '"Local Contact (LCON) Name:""AGNESS MBITHI\nRICHARD OMARI""\nLCON Phone:""+254 733825222\n+254 722731906""\nLCON email:stnsupvnbo@saudiairlines.co.ke / romari@saudia.com\nAlternate Contact Details: RICHARD OMARI +25420822338| Mob: +254722731906\n\n"',
          location: '"AIRPORT OFFICE:\nTerminal Unit 2, Departures\nJomo Kenyatta International Airport (J.K.I.A)\nP.O. Box 58452-00200"',
          operationalHours: "",
          proactiveEmailContacts: "NBOKKSV@saudia.com;romari@saudia.com",
          switchName: "NBOKASV-3560-1",
          mcsStatus: "Standalone",
          circuitType: "Desktop || KENYA || VAPNBO001 || NBOKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "KENYA",
          city: "NAIROBI",
          routerName: "VTONBOSV01",
          oldRouterName: "PNBO203",
          siteId: "NBORASV,NBOAASV",
          subnetIp: "10.203.44.0/24",
          contactDetails: '"Local Contact (LCON) Name:/ Nathan +254726142030\nLCON Phone:mobile no +254726444105 || landline nos +2542244545/48/50\n\n\nAlternate Contact Details: Mrs. Pauline at +254 722 790 616 // \nmobile contacts : +254738440900 / +254722387365',
          location: "2nd Floor,South Wing,Ringroad Parklands Road, Kenrail Towers Westlands, Nairobi, Kenya",
          operationalHours: "",
          proactiveEmailContacts: "dfosupvnbo@saudia.com; lmasatia@saudia.com; rmuganda@saudia.com; svmgrnbo@saudia.com ;",
          switchName: "NBORASV-3560-1",
          mcsStatus: "Standalone",
          circuitType: "Desktop || KENYA || VTONBOSV01 || NBORASV,NBOAASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "PAKISTAN",
          city: "PESHAWAR",
          routerName: "VTOPEWSV01",
          oldRouterName: "PPEW020",
          siteId: "PEWKASV, PEWKBSV",
          subnetIp: "10.200.144.0/24",
          contactDetails: '"Local Contact (LCON) Name: Shahid Ahmed Khan\nLCON Phone: 0092-3005922120  - 00 929 152 535 301\nLCON email:""KHAN, SHAHID A"" <kshahid@saudiairlines.com>\n"',
          location: '"SAUDI ARABIAN AIRLINES\nAVIATION BUILDING\nNEAR SHAHEEN CARGO\nPESHAWAR INTERNATIONAL AIRPORT"',
          operationalHours: "",
          proactiveEmailContacts: "kshahid@saudiairlines.com;",
          switchName: "PEWKASV-3560-1",
          mcsStatus: "Standalone",
          circuitType: "Desktop || PAKISTAN || PPEW020 || PEWKASV, PEWKBSV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "ITALY",
          city: "ROMA",
          routerName: "VTOROMSV01",
          oldRouterName: "PROM1062",
          siteId: "ROMRASV, ROMAASV",
          subnetIp: "10.202.52.0/24",
          contactDetails: '"Local Contact (LCON) Name: Ms.Sylvia / Ms.Awatef\nLCON Phone:  +390642030423 / +390642030482 \nMobile:00393463722392 \nLCON email:fzinanni@saudia.com / saiello@saudia.com / resitaly@saudia.com / abazara@saudia.com\nAlternate Contact Details: VIVIANA MEYOHAS /  fabio zinanni - 0039-0642030457\nviviana.meyohas@saudiairlines.it ,. 0642030459',
          location: '"Via Bissolati, 76 \n 4th Floor \n, VIA LEONIDA BISSOLATI, \n76 -4TH FLOOR - ROME"',
          operationalHours: "",
          proactiveEmailContacts: "fzinanni@saudia.com; resitaly@saudia.com;",
          switchName: "ROMAASV-3560-1",
          mcsStatus: "Standalone",
          circuitType: "Desktop || ITALY || VTOROMSV01 || ROMRASV, ROMAASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "SINGAPORE",
          city: "SINGAPORE",
          routerName: "VTOSINSV01",
          oldRouterName: "PSIN2837",
          siteId: "SINKASV",
          subnetIp: "10.200.177.0/24",
          contactDetails: '"Local Contact (LCON) Name:ROHAINI HUSSAIN // Mobile: 65 -91800787\nLCON Phone:65-91800787 , 65-65452061/41 , 65-65450008\nLCON email:rohainihussain@saudiailines.com.sg // rahmed@saudia.com for Mrs. Rohana\nAlternate Contact Details: +65-65452041 // CUST SVCS SUPV - SIN <CUSTSVCSSIN@saudia.com>',
          location: "Singapore Changi Airport\n65 Airport Boulevard\nUnit B1-13\nTerminal 3\nSingapore 819663",
          operationalHours: "",
          proactiveEmailContacts: "CUSTSVCSSIN@saudia.com; rohainihussain@saudiailines.com; rahmed@saudia.com;",
          switchName: "SINKASV-3560-1",
          mcsStatus: "Primary",
          circuitType: "Desktop || SINGAPORE || VTOSINSV01 || SINKASV ||",
          migrationStatus: "Migrated"
        },
        {
          source: "NewInventory",
          country: "UNITED STATES",
          city: "VIENNA",
          routerName: "VTOWASSV01",
          oldRouterName: "PIAD216.PIAD415",
          siteId: "WASRASV",
          subnetIp: "10.204.35.0/24",
          contactDetails: '"Local Contact (LCON) Name: Mrs. Vaedra Jones/ \nLCON Phone: Office: +15717221882 / +15717221800 // 202 333 3800 EXT 10 //(917) 951-8315\nLCON email:Vjones@saudia.com//jmaad@saudia.com\nAlternate Contact Details: Abduljalil Maad /  (718) 551 3016 || +1703-6616178 ||Tel: 1718 551 3006 || ojallade@saudia.com\n"',
          location: '"(Vienna office) P1 moving to new location (MARKETING, HR, TRAINING, MATERIAL MANAGEMENT, SALES, CTOVienna office \nWashington, DC New Office\nSaudi Arabian Airlines\n8081 Wolftrap Road, 2nd Floor\nVienna, VA 22182)"',
          operationalHours: "",
          proactiveEmailContacts: "MABBY@saudia.com;dfowas@saudia.com;mosman@saudia.com;",
          switchName: "WASRASV-3560-1, 2, AND 3",
          mcsStatus: "Primary",
          circuitType: "Desktop || UNITED STATES || VTOWASSV01 || WASRASV ||",
          migrationStatus: "Migrated"
        }
      ],
      reference: [
        {
          source: "IMCAN-Reference-Sheet-2024",
          country: "",
          city: "",
          routerName: "PJED690",
          oldRouterName: "",
          siteId: "",
          subnetIp: "10.128.57.211",
          contactDetails: "",
          location: "",
          operationalHours: "",
          proactiveEmailContacts: "",
          switchName: "PJED690",
          mcsStatus: "",
          circuitType: "",
          serialNumber: "FGL2839LD3F",
          fromProductId: "C1111-8P",
          rack: "9",
          port: "0/0/1",
          vlan: "1",
          toVlan: "315",
          migrationStatus: "Not Migrated"
        },
        {
          source: "IMCAN-Reference-Sheet-2024",
          country: "",
          city: "",
          routerName: "PJED690",
          oldRouterName: "",
          siteId: "",
          subnetIp: "192.168.1.1",
          contactDetails: "",
          location: "",
          operationalHours: "",
          proactiveEmailContacts: "",
          switchName: "PJED690",
          mcsStatus: "",
          circuitType: "",
          serialNumber: "FGL2839LD3F",
          fromProductId: "C1111-8P",
          rack: "9",
          port: "0/1/2",
          vlan: "1",
          toVlan: "489",
          migrationStatus: "Not Migrated"
        },
        {
          source: "IMCAN-Reference-Sheet-2024",
          country: "",
          city: "",
          routerName: "PJED677",
          oldRouterName: "",
          siteId: "",
          subnetIp: "10.135.35.12",
          contactDetails: "",
          location: "",
          operationalHours: "",
          proactiveEmailContacts: "",
          switchName: "PJED677",
          mcsStatus: "",
          circuitType: "",
          serialNumber: "FGL2839LD38",
          fromProductId: "C1111-8P",
          rack: "9",
          port: "0/0/1",
          vlan: "1",
          toVlan: "40",
          migrationStatus: "Not Migrated"
        },
        {
          source: "IMCAN-Reference-Sheet-2024",
          country: "",
          city: "",
          routerName: "PJED677",
          oldRouterName: "",
          siteId: "",
          subnetIp: "192.168.0.2",
          contactDetails: "",
          location: "",
          operationalHours: "",
          proactiveEmailContacts: "",
          switchName: "PJED677",
          mcsStatus: "",
          circuitType: "",
          serialNumber: "FGL2839LD38",
          fromProductId: "C1111-8P",
          rack: "9",
          port: "0/1/2",
          vlan: "1",
          toVlan: "488",
          migrationStatus: "Not Migrated"
        },
        {
          source: "IMCAN-Reference-Sheet-2024",
          country: "",
          city: "",
          routerName: "PJED691",
          oldRouterName: "",
          siteId: "",
          subnetIp: "10.128.57.212",
          contactDetails: "",
          location: "",
          operationalHours: "",
          proactiveEmailContacts: "",
          switchName: "PJED691",
          mcsStatus: "",
          circuitType: "",
          serialNumber: "FGL2839LD3B",
          fromProductId: "C1111-8P",
          rack: "9",
          port: "0/0/1",
          vlan: "1",
          toVlan: "315",
          migrationStatus: "Not Migrated"
        },
        {
          source: "IMCAN-Reference-Sheet-2024",
          country: "",
          city: "",
          routerName: "PJED691",
          oldRouterName: "",
          siteId: "",
          subnetIp: "192.168.1.2",
          contactDetails: "",
          location: "",
          operationalHours: "",
          proactiveEmailContacts: "",
          switchName: "PJED691",
          mcsStatus: "",
          circuitType: "",
          serialNumber: "FGL2839LD3B",
          fromProductId: "C1111-8P",
          rack: "9",
          port: "0/1/2",
          vlan: "1",
          toVlan: "489",
          migrationStatus: "Not Migrated"
        },
        {
          source: "IMCAN-Reference-Sheet-2024",
          country: "",
          city: "",
          routerName: "PJED678",
          oldRouterName: "",
          siteId: "",
          subnetIp: "10.135.35.11",
          contactDetails: "",
          location: "",
          operationalHours: "",
          proactiveEmailContacts: "",
          switchName: "PJED678",
          mcsStatus: "",
          circuitType: "",
          serialNumber: "FGL2839LD3G",
          fromProductId: "C1111-8P",
          rack: "9",
          port: "0/0/1",
          vlan: "1",
          toVlan: "40",
          migrationStatus: "Not Migrated"
        },
        {
          source: "IMCAN-Reference-Sheet-2024",
          country: "",
          city: "",
          routerName: "PJED678",
          oldRouterName: "",
          siteId: "",
          subnetIp: "192.168.0.1",
          contactDetails: "",
          location: "",
          operationalHours: "",
          proactiveEmailContacts: "",
          switchName: "PJED678",
          mcsStatus: "",
          circuitType: "",
          serialNumber: "FGL2839LD3G",
          fromProductId: "C1111-8P",
          rack: "9",
          port: "0/1/2",
          vlan: "1",
          toVlan: "488",
          migrationStatus: "Not Migrated"
        },
        {
          source: "IMCAN-Reference-Sheet-2024",
          country: "",
          city: "",
          routerName: "DC",
          oldRouterName: "",
          siteId: "",
          subnetIp: "Router SN",
          contactDetails: "",
          location: "",
          operationalHours: "",
          proactiveEmailContacts: "",
          switchName: "DC",
          mcsStatus: "",
          circuitType: "",
          serialNumber: "Services",
          fromProductId: "IP",
          rack: "Circuit ID",
          port: "Link ID",
          vlan: "Cisco Product ID",
          toVlan: "Interface Gi0/1/2\xA0Port",
          migrationStatus: "Not Migrated"
        },
        {
          source: "IMCAN-Reference-Sheet-2024",
          country: "",
          city: "",
          routerName: "KAIA \u2013 DC 2",
          oldRouterName: "",
          siteId: "",
          subnetIp: "FGL2839LD3F",
          contactDetails: "",
          location: "",
          operationalHours: "",
          proactiveEmailContacts: "",
          switchName: "KAIA \u2013 DC 2",
          mcsStatus: "",
          circuitType: "",
          serialNumber: "SITA IMCAN",
          fromProductId: "10.128.57.211",
          rack: "JEDDAH-FRANKFURT\xA0I-N\xA0W-PLL37230",
          port: "PJED690",
          vlan: "C1111-8P",
          toVlan: "Interconnected B2B with PJED691 DC1",
          migrationStatus: "Not Migrated"
        },
        {
          source: "IMCAN-Reference-Sheet-2024",
          country: "",
          city: "",
          routerName: "KAIA \u2013 DC 1",
          oldRouterName: "",
          siteId: "",
          subnetIp: "FGL2839LD3B",
          contactDetails: "",
          location: "",
          operationalHours: "",
          proactiveEmailContacts: "",
          switchName: "KAIA \u2013 DC 1",
          mcsStatus: "",
          circuitType: "",
          serialNumber: "SITA IMCAN",
          fromProductId: "10.128.57.212",
          rack: "JEDDAH-SINGAPORE I-N W-PLL37233",
          port: "PJED691",
          vlan: "C1111-8P",
          toVlan: "Interconnected B2B with PJED690 DC2",
          migrationStatus: "Not Migrated"
        },
        {
          source: "IMCAN-Reference-Sheet-2024",
          country: "",
          city: "",
          routerName: "KAIA \u2013 DC 2",
          oldRouterName: "",
          siteId: "",
          subnetIp: "FGL2839LD38",
          contactDetails: "",
          location: "",
          operationalHours: "",
          proactiveEmailContacts: "",
          switchName: "KAIA \u2013 DC 2",
          mcsStatus: "",
          circuitType: "",
          serialNumber: "SITA Amadeus",
          fromProductId: "10.135.35.12",
          rack: "JEDDAH-FRANKFURT I-N W-PLL37225",
          port: "PJED677",
          vlan: "C1111-8P",
          toVlan: "Interconnected B2B with PJED678 DC 1",
          migrationStatus: "Not Migrated"
        },
        {
          source: "IMCAN-Reference-Sheet-2024",
          country: "",
          city: "",
          routerName: "KAIA \u2013 DC 1",
          oldRouterName: "",
          siteId: "",
          subnetIp: "FGL2839LD3G",
          contactDetails: "",
          location: "",
          operationalHours: "",
          proactiveEmailContacts: "",
          switchName: "KAIA \u2013 DC 1",
          mcsStatus: "",
          circuitType: "",
          serialNumber: "SITA Amadeus",
          fromProductId: "10.135.35.11",
          rack: "JEDDAH-SINGAPORE I-N W-PLL37227",
          port: "PJED678",
          vlan: "C1111-8P",
          toVlan: "Interconnected B2B with PJED677\xA0DC2",
          migrationStatus: "Not Migrated"
        }
      ],
      counts: {
        newInventoryRows: 70,
        referenceRows: 14
      }
    };
  }
});

// server/inventory.ts
function filterInventory(input) {
  const search = (input.search ?? "").trim().toLowerCase();
  return inventory.filter((item) => {
    const haystack = Object.values(item).join(" ").toLowerCase();
    return (!search || haystack.includes(search)) && (!input.country || input.country === "all" || item.country === input.country) && (!input.city || input.city === "all" || item.city === input.city) && (!input.migrationStatus || input.migrationStatus === "all" || item.migrationStatus === input.migrationStatus) && (!input.circuitType || input.circuitType === "all" || item.circuitType === input.circuitType);
  });
}
function inventoryStats() {
  const countries = inventory.reduce((acc, item) => {
    const country = item.country || "Unknown";
    acc[country] = (acc[country] ?? 0) + 1;
    return acc;
  }, {});
  return {
    total: inventory.length,
    migrated: inventory.filter((item) => item.migrationStatus === "Migrated").length,
    notMigrated: inventory.filter((item) => item.migrationStatus === "Not Migrated").length,
    countries: Object.entries(countries).sort((a, b) => b[1] - a[1]).map(([country, count]) => ({ country, count }))
  };
}
function inventoryOptions() {
  const unique = (key) => Array.from(new Set(inventory.map((item) => String(item[key] ?? "").trim()).filter(Boolean))).sort();
  return { countries: unique("country"), cities: unique("city"), circuitTypes: unique("circuitType"), routerNames: unique("routerName"), siteIds: unique("siteId"), labels: FIELD_LABELS };
}
var FIELD_LABELS, raw, migratedNames, inventory;
var init_inventory = __esm({
  "server/inventory.ts"() {
    "use strict";
    init_inventory_seed();
    FIELD_LABELS = {
      country: "Country",
      city: "City",
      routerName: "Router Name",
      oldRouterName: "Old Router Name",
      siteId: "Site ID",
      subnetIp: "Subnet IP",
      contactDetails: "Contact Details",
      location: "Location",
      operationalHours: "Operational Hours",
      migrationStatus: "Migration Status",
      proactiveEmailContacts: "Proactive Email Contacts",
      switchName: "Switch Name",
      mcsStatus: "MCS Status"
    };
    raw = inventory_seed_default;
    migratedNames = new Set(raw.newInventory.map((item) => item.routerName.trim().toLowerCase()).filter(Boolean));
    inventory = [
      ...raw.newInventory.map((item) => ({ ...item, migrationStatus: "Migrated" })),
      ...raw.reference.map((item) => ({
        ...item,
        migrationStatus: migratedNames.has(item.routerName.trim().toLowerCase()) ? "Migrated" : "Not Migrated"
      }))
    ];
  }
});

// server/inventoryDb.ts
var inventoryDb_exports = {};
__export(inventoryDb_exports, {
  AUDITED_ACTIONS: () => AUDITED_ACTIONS,
  addStoredInventoryRecord: () => addStoredInventoryRecord,
  buildAuditEntry: () => buildAuditEntry,
  deleteStoredInventoryRecord: () => deleteStoredInventoryRecord,
  getStoredInventory: () => getStoredInventory,
  listAuditLogs: () => listAuditLogs,
  replaceImportedInventory: () => replaceImportedInventory,
  searchStoredInventory: () => searchStoredInventory,
  storedInventoryOptions: () => storedInventoryOptions,
  storedInventoryStats: () => storedInventoryStats,
  updateStoredInventoryRecord: () => updateStoredInventoryRecord
});
import { and, desc, eq as eq3, gte, ilike, lte, or, sql as sql3, not } from "drizzle-orm";
function invalidateInventoryCaches() {
  inventoryCacheVersion += 1;
  listCache.clear();
  optionsCache = null;
  statsCache = null;
}
async function getStoredInventory(range = {}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (range.from) conditions.push(gte(inventoryRecords.createdAt, range.from));
  if (range.to) conditions.push(lte(inventoryRecords.createdAt, range.to));
  return db.select().from(inventoryRecords).where(conditions.length ? and(...conditions) : void 0).orderBy(inventoryRecords.routerName);
}
function buildAuditEntry(actor, count) {
  return { userId: actor.id, userName: actor.name || "Unknown user", action: "IMPORT_REPLACE", entityType: "inventory_records", summary: `Imported and replaced ${count} inventory records from Excel`, metadata: JSON.stringify({ count, scope: "source-replacement" }) };
}
async function replaceImportedInventory(rows, actor) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const source = rows[0]?.source;
  if (!source) throw new Error("Import source is required");
  if (source === "NewInventory") {
    await db.delete(inventoryRecords).where(
      or(
        eq3(inventoryRecords.source, "NewInventory"),
        ilike(inventoryRecords.source, "%new%"),
        ilike(inventoryRecords.source, "%migrated%")
      )
    );
  } else {
    await db.delete(inventoryRecords).where(
      and(
        not(eq3(inventoryRecords.source, "NewInventory")),
        not(ilike(inventoryRecords.source, "%new%")),
        not(ilike(inventoryRecords.source, "%migrated%"))
      )
    );
  }
  if (rows.length) await db.insert(inventoryRecords).values(rows);
  const allRows = await db.select().from(inventoryRecords);
  const migratedNames2 = new Set(allRows.filter((row) => row.source === "NewInventory").map((row) => row.routerName.trim().toLowerCase()).filter(Boolean));
  const referenceRows = allRows.filter((row) => row.source === "Reference");
  for (const row of referenceRows) {
    const status = migratedNames2.has(row.routerName.trim().toLowerCase()) ? "Migrated" : "Not Migrated";
    if (row.migrationStatus !== status) await db.update(inventoryRecords).set({ migrationStatus: status }).where(eq3(inventoryRecords.id, row.id));
  }
  await db.insert(auditLogs).values(buildAuditEntry(actor, rows.length));
  invalidateInventoryCaches();
  return { count: rows.length };
}
async function listAuditLogs(filters = {}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters.userName && filters.userName !== "all") conditions.push(eq3(auditLogs.userName, filters.userName));
  if (filters.action && filters.action !== "all") conditions.push(eq3(auditLogs.action, filters.action));
  return db.select().from(auditLogs).where(conditions.length ? and(...conditions) : void 0).orderBy(desc(auditLogs.createdAt)).limit(filters.limit ?? 100);
}
async function searchStoredInventory(input) {
  const cacheKey = JSON.stringify(input);
  const cached = listCache.get(cacheKey);
  if (cached && cached.version === inventoryCacheVersion && cached.expiresAt > Date.now()) return cached.value;
  const db = await getDb();
  if (!db) return [];
  const search = (input.search ?? "").trim();
  const conditions = [];
  if (search) {
    const term = `%${search}%`;
    conditions.push(or(ilike(inventoryRecords.routerName, term), ilike(inventoryRecords.oldRouterName, term), ilike(inventoryRecords.siteId, term), ilike(inventoryRecords.country, term), ilike(inventoryRecords.city, term), ilike(inventoryRecords.contactDetails, term), ilike(inventoryRecords.location, term)));
  }
  if (input.country && input.country !== "all") conditions.push(eq3(inventoryRecords.country, input.country));
  if (input.city && input.city !== "all") conditions.push(eq3(inventoryRecords.city, input.city));
  if (input.migrationStatus && input.migrationStatus !== "all") conditions.push(eq3(inventoryRecords.migrationStatus, input.migrationStatus));
  if (input.circuitType && input.circuitType !== "all") conditions.push(eq3(inventoryRecords.circuitType, input.circuitType));
  const value = await db.select().from(inventoryRecords).where(conditions.length ? and(...conditions) : void 0).orderBy(inventoryRecords.routerName);
  listCache.set(cacheKey, { version: inventoryCacheVersion, expiresAt: Date.now() + INVENTORY_CACHE_TTL_MS, value });
  return value;
}
async function updateStoredInventoryRecord(id, data) {
  const db = await getDb();
  if (!db) return false;
  await db.update(inventoryRecords).set(data).where(eq3(inventoryRecords.id, id));
  invalidateInventoryCaches();
  return true;
}
async function addStoredInventoryRecord(data) {
  const db = await getDb();
  if (!db) return false;
  await db.insert(inventoryRecords).values(data);
  invalidateInventoryCaches();
  return true;
}
async function deleteStoredInventoryRecord(id) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(inventoryRecords).where(eq3(inventoryRecords.id, id));
  invalidateInventoryCaches();
  return true;
}
async function storedInventoryOptions() {
  if (optionsCache && optionsCache.version === inventoryCacheVersion && optionsCache.expiresAt > Date.now()) return optionsCache.value;
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ country: inventoryRecords.country, city: inventoryRecords.city, circuitType: inventoryRecords.circuitType, routerName: inventoryRecords.routerName, siteId: inventoryRecords.siteId }).from(inventoryRecords);
  if (!rows.length) return null;
  const unique = (key) => Array.from(new Set(rows.map((row) => row[key]).filter(Boolean))).sort();
  const value = { countries: unique("country"), cities: unique("city"), circuitTypes: unique("circuitType"), routerNames: unique("routerName"), siteIds: unique("siteId"), labels: FIELD_LABELS };
  optionsCache = { version: inventoryCacheVersion, expiresAt: Date.now() + INVENTORY_CACHE_TTL_MS, value };
  return value;
}
async function storedInventoryStats() {
  if (statsCache && statsCache.version === inventoryCacheVersion && statsCache.expiresAt > Date.now()) return statsCache.value;
  const db = await getDb();
  if (!db) return null;
  const [[total], [migrated], [notMigrated], countries] = await Promise.all([
    db.select({ count: sql3`count(*)` }).from(inventoryRecords),
    db.select({ count: sql3`count(*)` }).from(inventoryRecords).where(eq3(inventoryRecords.migrationStatus, "Migrated")),
    db.select({ count: sql3`count(*)` }).from(inventoryRecords).where(eq3(inventoryRecords.migrationStatus, "Not Migrated")),
    db.select({ country: inventoryRecords.country, count: sql3`count(*)` }).from(inventoryRecords).groupBy(inventoryRecords.country).orderBy(desc(sql3`count(*)`))
  ]);
  const totalCount = Number(total?.count ?? 0);
  if (totalCount === 0) return null;
  const value = { total: totalCount, migrated: Number(migrated?.count ?? 0), notMigrated: Number(notMigrated?.count ?? 0), countries: countries.map((item) => ({ country: item.country || "Unknown", count: Number(item.count) })) };
  statsCache = { version: inventoryCacheVersion, expiresAt: Date.now() + INVENTORY_CACHE_TTL_MS, value };
  return value;
}
var INVENTORY_CACHE_TTL_MS, inventoryCacheVersion, listCache, optionsCache, statsCache, AUDITED_ACTIONS;
var init_inventoryDb = __esm({
  "server/inventoryDb.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_inventory();
    INVENTORY_CACHE_TTL_MS = 3e4;
    inventoryCacheVersion = 0;
    listCache = /* @__PURE__ */ new Map();
    optionsCache = null;
    statsCache = null;
    AUDITED_ACTIONS = ["IMPORT_REPLACE"];
  }
});

// server/adminDb.ts
var adminDb_exports = {};
__export(adminDb_exports, {
  buildRoleAuditEntry: () => buildRoleAuditEntry,
  deleteUser: () => deleteUser,
  listUsers: () => listUsers,
  updateUserRole: () => updateUserRole
});
import { asc, eq as eq4 } from "drizzle-orm";
async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, lastSignedIn: users.lastSignedIn, createdAt: users.createdAt }).from(users).orderBy(asc(users.name));
}
function buildRoleAuditEntry(targetUserId, targetName, previousRole, role, actor) {
  return { userId: actor.id, userName: actor.name || "Unknown user", action: "ROLE_UPDATE", entityType: "users", entityId: targetUserId, summary: `Changed ${targetName || `user #${targetUserId}`} role from ${previousRole} to ${role}`, metadata: JSON.stringify({ targetUserId, previousRole, role }) };
}
async function updateUserRole(targetUserId, role, actor) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [target] = await db.select({ id: users.id, name: users.name, role: users.role }).from(users).where(eq4(users.id, targetUserId)).limit(1);
  if (!target) throw new Error("User not found");
  await db.update(users).set({ role }).where(eq4(users.id, targetUserId));
  await db.insert(auditLogs).values(buildRoleAuditEntry(targetUserId, target.name, target.role, role, actor));
  return { ...target, role };
}
async function deleteUser(targetUserId, actor) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (targetUserId === actor.id) throw new Error("You cannot delete yourself");
  const [target] = await db.select({ id: users.id, name: users.name }).from(users).where(eq4(users.id, targetUserId)).limit(1);
  if (!target) throw new Error("User not found");
  await db.delete(users).where(eq4(users.id, targetUserId));
  await db.insert(auditLogs).values({
    userId: actor.id,
    userName: actor.name || "Unknown user",
    action: "USER_DELETED",
    entityType: "users",
    entityId: targetUserId,
    summary: `Deleted user ${target.name || `#${targetUserId}`}`,
    metadata: "{}"
  });
  return { success: true };
}
var init_adminDb = __esm({
  "server/adminDb.ts"() {
    "use strict";
    init_schema();
    init_db();
  }
});

// shared/importValidation.ts
var importValidation_exports = {};
__export(importValidation_exports, {
  missingImportColumns: () => missingImportColumns,
  requiredImportColumns: () => requiredImportColumns
});
var requiredImportColumns, missingImportColumns;
var init_importValidation = __esm({
  "shared/importValidation.ts"() {
    "use strict";
    requiredImportColumns = (sourceType) => {
      if (sourceType === "NewInventory") return [["Versa Router Name", "Router Name"], ["SITE ID", "Site ID"]];
      if (sourceType === "Reference") return [["Host Name", "Router Name"], ["Country"], ["City"]];
      return [["Host Name", "Router Name", "Versa Router Name", "Hostname"]];
    };
    missingImportColumns = (sourceType, headers) => requiredImportColumns(sourceType).filter((group) => !group.some((header) => headers.includes(header))).map((group) => group[0]);
  }
});

// server/aiHistory.ts
var aiHistory_exports = {};
__export(aiHistory_exports, {
  appendConversationMessage: () => appendConversationMessage,
  createConversation: () => createConversation,
  deleteConversation: () => deleteConversation,
  getAllAiMessages: () => getAllAiMessages,
  getUserConversation: () => getUserConversation,
  listUserConversations: () => listUserConversations,
  matchesConversationView: () => matchesConversationView,
  ownsConversation: () => ownsConversation,
  setConversationArchived: () => setConversationArchived
});
import { and as and2, desc as desc2, eq as eq5, isNull, isNotNull } from "drizzle-orm";
function ownsConversation(conversation, userId) {
  return Boolean(conversation && conversation.userId === userId);
}
function matchesConversationView(conversation, archivedOnly) {
  return archivedOnly ? Boolean(conversation.archivedAt) : !conversation.archivedAt;
}
async function createConversation(userId, title) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(aiConversations).values({ userId, title: title.trim().slice(0, 255) || "New AI conversation" }).returning({ id: aiConversations.id });
  const conversationId = result[0].id;
  return { id: conversationId, userId, title: title.trim().slice(0, 255) || "New AI conversation" };
}
async function appendConversationMessage(userId, conversationId, role, content) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [conversation] = await db.select().from(aiConversations).where(and2(eq5(aiConversations.id, conversationId), eq5(aiConversations.userId, userId))).limit(1);
  if (!ownsConversation(conversation, userId)) throw new Error("Conversation not found");
  const sanitizedContent = content.replace(/\x00/g, "");
  await db.insert(aiMessages).values({ userId, conversationId, role, content: sanitizedContent });
  await db.update(aiConversations).set({ updatedAt: /* @__PURE__ */ new Date() }).where(eq5(aiConversations.id, conversationId));
  return { success: true };
}
async function listUserConversations(userId, archivedOnly = false) {
  const db = await getDb();
  if (!db) return [];
  const scope = archivedOnly ? and2(eq5(aiConversations.userId, userId), isNotNull(aiConversations.archivedAt)) : and2(eq5(aiConversations.userId, userId), isNull(aiConversations.archivedAt));
  return db.select().from(aiConversations).where(scope).orderBy(desc2(aiConversations.updatedAt));
}
async function setConversationArchived(userId, conversationId, archived) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [conversation] = await db.select().from(aiConversations).where(and2(eq5(aiConversations.id, conversationId), eq5(aiConversations.userId, userId))).limit(1);
  if (!ownsConversation(conversation, userId)) throw new Error("Conversation not found");
  await db.update(aiConversations).set({ archivedAt: archived ? /* @__PURE__ */ new Date() : null }).where(eq5(aiConversations.id, conversationId));
  return { success: true };
}
async function deleteConversation(userId, conversationId) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [conversation] = await db.select().from(aiConversations).where(and2(eq5(aiConversations.id, conversationId), eq5(aiConversations.userId, userId))).limit(1);
  if (!ownsConversation(conversation, userId)) throw new Error("Conversation not found");
  await db.delete(aiMessages).where(and2(eq5(aiMessages.conversationId, conversationId), eq5(aiMessages.userId, userId)));
  await db.delete(aiConversations).where(eq5(aiConversations.id, conversationId));
  return { success: true };
}
async function getUserConversation(userId, conversationId) {
  const db = await getDb();
  if (!db) return null;
  const [conversation] = await db.select().from(aiConversations).where(and2(eq5(aiConversations.id, conversationId), eq5(aiConversations.userId, userId))).limit(1);
  if (!conversation) return null;
  const messages = await db.select().from(aiMessages).where(and2(eq5(aiMessages.conversationId, conversationId), eq5(aiMessages.userId, userId))).orderBy(aiMessages.createdAt);
  return { conversation, messages };
}
async function getAllAiMessages() {
  const db = await getDb();
  if (!db) return [];
  const { users: users2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  return db.select({
    id: aiMessages.id,
    role: aiMessages.role,
    content: aiMessages.content,
    createdAt: aiMessages.createdAt,
    userName: users2.name,
    userEmail: users2.email
  }).from(aiMessages).leftJoin(users2, eq5(aiMessages.userId, users2.id)).orderBy(desc2(aiMessages.createdAt)).limit(1e3);
}
var init_aiHistory = __esm({
  "server/aiHistory.ts"() {
    "use strict";
    init_schema();
    init_db();
  }
});

// server/onedriveIndexer.ts
var onedriveIndexer_exports = {};
__export(onedriveIndexer_exports, {
  indexOneDriveFileBackground: () => indexOneDriveFileBackground
});
import { eq as eq6 } from "drizzle-orm";
async function indexOneDriveFileBackground(driveItemId, accessToken) {
  try {
    const db = await getDb();
    if (!db) return;
    await db.update(onedriveFiles).set({ status: "processing", lastError: null }).where(eq6(onedriveFiles.driveItemId, driveItemId));
    const metaRes = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${driveItemId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!metaRes.ok) {
      throw new Error(`Failed to fetch metadata: ${metaRes.statusText}`);
    }
    const meta = await metaRes.json();
    const downloadUrl = meta["@microsoft.graph.downloadUrl"];
    if (!downloadUrl) {
      throw new Error("No download URL available. Is this a folder or an unsupported file?");
    }
    await db.update(onedriveFiles).set({ eTag: meta.eTag, lastModifiedDateTime: new Date(meta.lastModifiedDateTime), sizeBytes: meta.size }).where(eq6(onedriveFiles.driveItemId, driveItemId));
    console.log(`[Indexer] Downloading ${meta.name}...`);
    const fileRes = await fetch(downloadUrl);
    const arrayBuffer = await fileRes.arrayBuffer();
    const XLSX2 = await import("xlsx");
    const workbook = XLSX2.read(arrayBuffer, { type: "array" });
    let totalRows = 0;
    let totalCells = 0;
    const { sql: sql4 } = await import("drizzle-orm");
    await db.execute(sql4`ALTER TABLE onedrive_indexed_data ADD COLUMN IF NOT EXISTS "internalFileId" integer`);
    await db.execute(sql4`ALTER TABLE onedrive_indexed_data ADD COLUMN IF NOT EXISTS "eTag" text`);
    await db.execute(sql4`ALTER TABLE onedrive_indexed_data ADD COLUMN IF NOT EXISTS "fileName" text`);
    const fileRecord = await db.select({ id: onedriveFiles.id }).from(onedriveFiles).where(eq6(onedriveFiles.driveItemId, driveItemId)).limit(1);
    const internalFileId = fileRecord[0]?.id;
    while (true) {
      const result = await db.execute(sql4`
        DELETE FROM onedrive_indexed_data 
        WHERE id IN (
          SELECT id FROM onedrive_indexed_data 
          WHERE "driveItemId" = ${driveItemId} 
          LIMIT 10000
        )
        RETURNING id
      `);
      const res = result;
      if (!res || Array.isArray(res) && res.length === 0 || res.rowCount === 0 || res.rows && res.rows.length === 0) {
        break;
      }
    }
    for (const sheetName of workbook.SheetNames) {
      const ws = workbook.Sheets[sheetName];
      if (!ws) continue;
      const rows = XLSX2.utils.sheet_to_json(ws, { header: 1, defval: "" });
      const insertPayloads = [];
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const rowHasData = row.some((cell2) => cell2 !== "");
        if (!rowHasData) continue;
        const cellData = row.map((val, c) => {
          if (val === "") return null;
          totalCells++;
          return `[${XLSX2.utils.encode_cell({ c, r })}] ${val}`;
        }).filter(Boolean).join(" | ");
        if (cellData) {
          totalRows++;
          insertPayloads.push({
            internalFileId,
            driveItemId,
            eTag: meta.eTag,
            fileName: meta.name,
            sheetName,
            rowIndex: r + 1,
            cellAddress: `Row ${r + 1}`,
            content: cellData
          });
        }
      }
      if (insertPayloads.length > 0) {
        for (let i = 0; i < insertPayloads.length; i += 1e3) {
          await db.insert(onedriveIndexedData).values(insertPayloads.slice(i, i + 1e3));
        }
      }
    }
    if (totalCells === 0) {
      throw new Error(`File was processed but 0 valid text cells were found. Check if the file is empty or unsupported.`);
    }
    await db.update(onedriveFiles).set({
      status: "active",
      sheetCount: workbook.SheetNames.length,
      indexedRows: totalRows,
      indexedCells: totalCells,
      lastSyncTime: /* @__PURE__ */ new Date()
    }).where(eq6(onedriveFiles.driveItemId, driveItemId));
    console.log(`[Indexer] Successfully indexed ${meta.name}: ${totalRows} rows, ${totalCells} cells.`);
  } catch (err) {
    console.error(`[Indexer] Failed to index ${driveItemId}:`, err);
    try {
      const db = await getDb();
      if (db) {
        await db.update(onedriveFiles).set({ status: "failed", lastError: err.message }).where(eq6(onedriveFiles.driveItemId, driveItemId));
      }
    } catch (e) {
    }
  }
}
var init_onedriveIndexer = __esm({
  "server/onedriveIndexer.ts"() {
    "use strict";
    init_db();
    init_schema();
  }
});

// server/_core/apiApp.ts
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/_core/oauth.ts
init_const();
init_db();
import { parse as parseCookieHeader2 } from "cookie";

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    sameSite: secure ? "none" : "lax",
    secure
  };
}

// server/_core/oauth.ts
init_sdk();
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader2(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/apiApp.ts
init_microsoftOAuth();

// server/_core/storageProxy.ts
init_env();
function registerStorageProxy(app) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/routers.ts
init_const();

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
init_const();
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z2 } from "zod";

// shared/supabaseConfig.ts
var SUPABASE_URL = "https://dgfjqfntkkivnrwwsxle.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZmpxZm50a2tpdm5yd3dzeGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDEyMDcsImV4cCI6MjEwMjI3NzIwN30.ZgY7tK-w8iajPvRNzuMPe8Z2XwTWc4Lkqae_TGjfqKI";
function legacyKeyBelongsToProject(value) {
  try {
    const payload = value.split(".")[1];
    if (!payload) return false;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = typeof atob === "function" ? atob(normalized) : Buffer.from(normalized, "base64").toString("utf8");
    return JSON.parse(decoded).ref === "dgfjqfntkkivnrwwsxle";
  } catch {
    return false;
  }
}
function getSupabaseAnonKey(candidate) {
  const value = candidate?.trim();
  if (!value) return SUPABASE_ANON_KEY;
  if (value.startsWith("sb_publishable_")) return value;
  if (value.startsWith("eyJ") && legacyKeyBelongsToProject(value)) return value;
  return SUPABASE_ANON_KEY;
}

// server/routers.ts
init_inventory();
init_inventoryDb();
init_adminDb();
init_importValidation();
import * as XLSX from "xlsx";

// server/_core/llm.ts
init_env();
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
var RETRY_MAX_RETRIES = 4;
var RETRY_BASE_DELAY_MS = 500;
var RETRY_MAX_DELAY_MS = 3e4;
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var parseRetryAfter = (value) => {
  if (!value) return void 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1e3);
  const at = Date.parse(value);
  return Number.isNaN(at) ? void 0 : Math.max(0, at - Date.now());
};
var computeBackoffDelay = (attempt, retryAfterMs) => {
  const cap = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
  const jittered = cap / 2 + Math.random() * (cap / 2);
  return Math.min(Math.max(jittered, retryAfterMs ?? 0), RETRY_MAX_DELAY_MS);
};
var fetchWithBackoff = async (url, init) => {
  let lastError;
  for (let attempt = 0; attempt <= RETRY_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok || attempt === RETRY_MAX_RETRIES) {
        return response;
      }
      const retryAfterMs = parseRetryAfter(
        response.headers.get("retry-after")
      );
      try {
        await response.body?.cancel();
      } catch {
      }
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after status ${response.status}`
      );
      await sleep(computeBackoffDelay(attempt, retryAfterMs));
    } catch (error) {
      lastError = error;
      if (attempt === RETRY_MAX_RETRIES) throw error;
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after network error`
      );
      await sleep(computeBackoffDelay(attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("LLM request failed after exhausting retries");
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    model,
    thinking,
    reasoning,
    maxTokens,
    max_tokens
  } = params;
  const payload = {
    messages: messages.map(normalizeMessage)
  };
  if (model) {
    payload.model = model;
  }
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  const resolvedMaxTokens = max_tokens ?? maxTokens;
  if (typeof resolvedMaxTokens === "number") {
    payload.max_tokens = resolvedMaxTokens;
  }
  if (thinking) {
    payload.thinking = thinking;
  }
  if (reasoning) {
    payload.reasoning = reasoning;
  }
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetchWithBackoff(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/ai2.ts
var NO_RESULTS_ANSWER = "\u0644\u0645 \u0623\u062C\u062F \u0623\u064A \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0645\u0637\u0627\u0628\u0642\u0629 \u0641\u064A \u0645\u0644\u0641\u0627\u062A \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u0645\u062A\u0627\u062D\u0629.";
var NO_RESULTS_ANSWER_EN = "I could not find any matching information in the available inventory files.";
function detectAssistantLanguage(question, requestedLanguage) {
  const arabicLetters = (question.match(/[\u0600-\u06FF]/g) || []).length;
  const latinLetters = (question.match(/[A-Za-z]/g) || []).length;
  if (arabicLetters === 0 && latinLetters > 0) return "en";
  if (latinLetters === 0 && arabicLetters > 0) return "ar";
  if (arabicLetters > latinLetters) return "ar";
  return requestedLanguage || "en";
}
function noResultsAnswer(question = "") {
  const isArabic = question.trim() === "" || /[\u0600-\u06FF]/.test(question);
  return { answer: formatAssistantResponse(isArabic ? NO_RESULTS_ANSWER : NO_RESULTS_ANSWER_EN, []), sources: [] };
}
function normalizeAssistantText(value) {
  let text2 = String(value ?? "").trim();
  text2 = text2.replace(/^```(?:json|markdown|md)?(?:\r?\n|\\n)?/i, "").replace(/(?:\r?\n|\\n)?```$/i, "").trim();
  try {
    const parsed = JSON.parse(text2);
    if (parsed && typeof parsed.answer === "string") text2 = parsed.answer;
  } catch {
  }
  return text2.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\t/g, "	").replace(/\r\n/g, "\n").replace(/^```(?:json|markdown|md)?\s*/i, "").replace(/\s*```$/i, "").replace(/\n{3,}/g, "\n\n").trim();
}
function formatAssistantResponse(answer, sources) {
  const cleanAnswer = normalizeAssistantText(answer);
  if (!sources.length) return cleanAnswer;
  const sourceLines = sources.map((source) => `- **Router Name:** ${source.routerName || "\u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631"}
- **Site ID:** ${source.siteId || "\u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631"}`).join("\n\n");
  return `${cleanAnswer}

**\u0627\u0644\u0645\u0635\u062F\u0631**
${sourceLines}`;
}
function buildInventoryContext(rows) {
  return rows.map((row) => ({
    "Router Name": row.routerName,
    "Old Router Name": row.oldRouterName,
    "Site ID": row.siteId,
    "Subnet IP": row.subnetIp,
    "Migration Status": row.migrationStatus,
    "Circuit Type": row.circuitType,
    "Contact Details": row.contactDetails,
    "Location": row.location,
    "Operational Hours": row.operationalHours,
    "Proactive Email Contacts": row.proactiveEmailContacts,
    "Switch Name": row.switchName,
    "MCS Status": row.mcsStatus,
    "Country": row.country,
    "City": row.city
  }));
}
async function answerInventoryQuestion({ question, language, fileId, currentUserId }) {
  const responseLanguage = detectAssistantLanguage(question, language);
  const isEnglish = responseLanguage === "en";
  let context = [];
  let rawFilesContext = [];
  let deterministicExcelAnswer = null;
  let debugInfo = { files_processed: [] };
  const oneDriveCache = global.oneDriveCache || /* @__PURE__ */ new Map();
  if (!global.oneDriveCache) global.oneDriveCache = oneDriveCache;
  const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
  const db = await getDb2();
  if (!db) return noResultsAnswer(question);
  const { inventoryRecords: inventoryRecords2, onedriveFiles: onedriveFiles2, onedriveIndexedData: onedriveIndexedData2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { eq: eq7, and: and3, inArray: inArray2 } = await import("drizzle-orm");
  try {
    const routerRows = await db.select().from(inventoryRecords2);
    const searchKeywords = question.toLowerCase().split(" ").filter((w) => w.length > 2);
    const matchedRouterRows = routerRows.filter(
      (row) => searchKeywords.some(
        (kw) => row.routerName?.toLowerCase().includes(kw) || row.oldRouterName?.toLowerCase().includes(kw) || row.siteId?.toLowerCase().includes(kw)
      )
    );
    if (matchedRouterRows.length > 0) {
      context = buildInventoryContext(matchedRouterRows);
    }
    const activeFiles = await db.select().from(onedriveFiles2).where(
      eq7(onedriveFiles2.status, "active")
    );
    if (activeFiles.length > 0) {
      let indexedInventoryCells = null;
      const loadIndexedInventoryCells = async () => {
        if (indexedInventoryCells) return indexedInventoryCells;
        const activeDriveIds = activeFiles.map((file) => String(file.driveItemId));
        indexedInventoryCells = await db.select({
          driveItemId: onedriveIndexedData2.driveItemId,
          sheetName: onedriveIndexedData2.sheetName,
          rowIndex: onedriveIndexedData2.rowIndex,
          cellAddress: onedriveIndexedData2.cellAddress,
          content: onedriveIndexedData2.content
        }).from(onedriveIndexedData2).where(and3(
          inArray2(onedriveIndexedData2.driveItemId, activeDriveIds),
          eq7(onedriveIndexedData2.sheetName, "Inventory")
        ));
        return indexedInventoryCells;
      };
      const normalizeText = (value) => {
        return String(value ?? "").normalize("NFC").toLowerCase().replace(/[أإآ]/g, "\u0627").replace(/[ًٌٍَُِّْـ]/g, "").replace(/\s+/g, " ").trim();
      };
      const rawQuestion = question.trim();
      const normQuestion = normalizeText(question);
      const stopWords = ["\u0645\u0627", "\u0647\u0648", "\u0647\u064A", "\u0641\u064A", "\u0639\u0644\u0649", "\u0645\u0646", "\u0648\u0631\u0642\u0629", "\u0639\u0646\u0648\u0627\u0646", "\u0627\u0644\u0638\u0627\u0647\u0631", "\u062E\u062F\u0645\u0629", "\u0627\u0644", "\u062C\u0645\u064A\u0639", "\u0627\u0633\u0645\u0627\u0621", "\u0642\u064A\u0645\u0629", "\u0645\u0627\u0630\u0627", "\u0647\u0644", "\u0627\u0644\u0649", "\u0644\u062E\u062F\u0645\u0629", "\u0627\u0644\u0628\u0631\u064A\u062F", "\u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A", "\u0627\u064A", "\u062A\u0648\u062C\u062F", "\u0645\u0644\u0627\u062D\u0638\u0629", "\u062A\u0641\u064A\u062F", "\u0628\u0623\u0646", "\u0628\u0639\u0636", "\u0648\u0645\u0627", "\u0627\u0644\u0625\u062C\u0631\u0627\u0621", "\u0627\u0644\u0645\u0637\u0644\u0648\u0628", "\u0644\u0627", "\u0646\u0639\u0645"];
      const rawWords = rawQuestion.split(" ");
      const queryWords = normQuestion.split(" ").map((w) => w.replace(/[^a-z0-9_\-\u0600-\u06ff]/gi, "")).filter((w) => !stopWords.includes(w) && w.length >= 2);
      const searchRepresentations = [
        normQuestion,
        ...queryWords
      ].filter(Boolean);
      if (!deterministicExcelAnswer) {
        const directRouterToken = rawQuestion.match(/\b[A-Z][A-Z0-9_-]*\d[A-Z0-9_-]*\b/i)?.[0];
        if (directRouterToken) {
          const indexedRows = await loadIndexedInventoryCells();
          const routerCells = indexedRows.filter((cell2) => String(cell2.cellAddress || "").toUpperCase().startsWith("C") && String(cell2.content || "").trim().toLowerCase() === directRouterToken.toLowerCase());
          const groups = Array.from(new Set(routerCells.map((cell2) => `${cell2.driveItemId}:${cell2.rowIndex}`)));
          if (groups.length === 1) {
            const [driveItemId, rowIndexText] = groups[0].split(":");
            const rowIndex = Number(rowIndexText);
            const fileMeta = activeFiles.find((file) => String(file.driveItemId) === driveItemId);
            const rowCells = indexedRows.filter((cell2) => String(cell2.driveItemId) === driveItemId && String(cell2.sheetName || "").trim().toLowerCase() === "inventory" && Number(cell2.rowIndex) === rowIndex);
            const byAddress = new Map(rowCells.map((cell2) => [String(cell2.cellAddress || "").toUpperCase(), String(cell2.content ?? "")]));
            const fields = [["Router Name", `C${rowIndex}`], ["Site ID", `G${rowIndex}`], ["Country", `A${rowIndex}`], ["City", `B${rowIndex}`], ["Operational Hours", `N${rowIndex}`]];
            const present = fields.filter(([, address]) => byAddress.has(address) && String(byAddress.get(address)).trim() !== "");
            if (fileMeta && present.length > 0) {
              const lines = present.map(([label, address]) => {
                const rawValue = String(byAddress.get(address) ?? "");
                return isEnglish ? `- **${label}:** ${rawValue}
  - **Original text from file:** ${rawValue}
  - File: ${fileMeta.name}
  - Sheet: Inventory
  - Cell: ${address}
  - [Open source in OneDrive](${fileMeta.webUrl || "#"})` : `- **${label}:** ${rawValue}
  - **\u0627\u0644\u0646\u0635 \u0627\u0644\u0623\u0635\u0644\u064A \u0645\u0646 \u0627\u0644\u0645\u0644\u0641:** ${rawValue}
  - \u0627\u0644\u0645\u0644\u0641: ${fileMeta.name}
  - \u0627\u0644\u0648\u0631\u0642\u0629: Inventory
  - \u0627\u0644\u062E\u0644\u064A\u0629: ${address}
  - [\u0641\u062A\u062D \u0627\u0644\u0645\u0635\u062F\u0631 \u0641\u064A OneDrive](${fileMeta.webUrl || "#"})`;
              });
              deterministicExcelAnswer = { answer: isEnglish ? `The matching data was found in OneDrive.

${lines.join("\n")}` : `\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0637\u0627\u0628\u0642\u0629 \u0641\u064A OneDrive.

${lines.join("\n")}`, sources: present.map(([label, address]) => ({ filename: fileMeta.name, sheet: "Inventory", cell: address, raw_value: byAddress.get(address), field: label })), metadata: { source_type: "excel", file_id: driveItemId, filename: fileMeta.name, sheet: "Inventory", matched_row: rowIndex, cells: present.map(([label, address]) => ({ field: label, cell: address, value: byAddress.get(address) })) } };
            }
          }
        }
      }
      if (!deterministicExcelAnswer && /circuit\s*managed/i.test(rawQuestion) && /\bsita\b/i.test(rawQuestion)) {
        const inventoryCells = await loadIndexedInventoryCells();
        const sitaRows = new Set(inventoryCells.filter((cell2) => String(cell2.cellAddress || "").toUpperCase().startsWith("F") && /\bsita\b/i.test(String(cell2.content ?? ""))).map((cell2) => `${cell2.driveItemId}:${cell2.rowIndex}`));
        const rowRecords = [];
        for (const key of Array.from(sitaRows)) {
          const [driveItemId, rowIndexText] = String(key).split(":");
          const rowCells = inventoryCells.filter((cell2) => String(cell2.driveItemId) === driveItemId && Number(cell2.rowIndex) === Number(rowIndexText));
          const get = (column) => rowCells.find((cell2) => String(cell2.cellAddress || "").toUpperCase().startsWith(column));
          const fields = { country: get("A"), city: get("B"), router: get("C"), circuit: get("F"), siteId: get("G"), summary: get("H"), mcs: get("J"), hours: get("N") };
          const value = (cell2) => String(cell2?.content ?? "").trim();
          const values = Object.fromEntries(Object.entries(fields).map(([name, cell2]) => [name, value(cell2)]));
          const score = (/primary/i.test(values.mcs) ? 3 : 0) + (/(24|all week|all day|no day off|00:00)/i.test(values.hours) ? 2 : 0) + (values.summary ? 1 : 0);
          rowRecords.push({ driveItemId, rowIndex: Number(rowIndexText), fields, values, score });
        }
        if (rowRecords.length > 0) {
          const countryMap = /* @__PURE__ */ new Map();
          for (const row of rowRecords) {
            const country = String(row.values.country || "").replace(/[،,;]+$/g, "").trim();
            const city = String(row.values.city || "").replace(/[،,;]+$/g, "").trim();
            if (!country || !city) continue;
            const countryKey = country.toUpperCase();
            const cityKey = city.toUpperCase();
            if (!countryMap.has(countryKey)) countryMap.set(countryKey, /* @__PURE__ */ new Map());
            const cities = countryMap.get(countryKey);
            cities.set(cityKey, (cities.get(cityKey) || 0) + 1);
          }
          const countrySummary = Array.from(countryMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([country, cities]) => `${country}: ${Array.from(cities.entries()).map(([city, count]) => `${city} (${count})`).join(", ")}`).join("; ");
          const priorityRows = [...rowRecords].sort((a, b) => b.score - a.score || a.rowIndex - b.rowIndex).slice(0, 12);
          const fileLabel = activeFiles.find((file) => String(file.driveItemId) === priorityRows[0].driveItemId)?.name || "IMCAN-Reference-Sheet---2024 (1).xlsm";
          const evidence = priorityRows.map((row) => {
            const refs = Object.values(row.fields).filter(Boolean).map((cell2) => `${cell2.cellAddress}=${String(cell2.content ?? "").trim()}`).join("; ");
            return `- **${row.values.router || "<empty>"}** \u2014 ${row.values.country || "<empty>"}/${row.values.city || "<empty>"}
  - MCS Status: ${row.values.mcs || "<empty>"}
  - Operational Hours: ${row.values.hours || "<empty>"}
  - Summary: ${row.values.summary || "<empty>"}
  - \u0627\u0644\u0645\u0648\u0642\u0639 \u062F\u0627\u062E\u0644 \u0627\u0644\u0645\u0644\u0641: Inventory!A${row.rowIndex}:N${row.rowIndex}
  - \u0627\u0644\u062F\u0644\u064A\u0644 \u0627\u0644\u062E\u0644\u0648\u064A: ${refs}
  - [\u0641\u062A\u062D \u0645\u0644\u0641 \u0627\u0644\u0645\u0635\u062F\u0631 \u0641\u064A OneDrive](${activeFiles.find((file) => String(file.driveItemId) === row.driveItemId)?.webUrl || "#"})`;
          }).join("\n");
          const sourceUrl = activeFiles.find((file) => String(file.driveItemId) === priorityRows[0].driveItemId)?.webUrl || "#";
          const rowRanges = priorityRows.map((row) => "Inventory!A" + row.rowIndex + ":N" + row.rowIndex).join(", ") || "\u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631 \u0641\u064A \u0627\u0644\u0645\u0635\u062F\u0631";
          deterministicExcelAnswer = { answer: `**\u0627\u0644\u062E\u0644\u0627\u0635\u0629**
\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 ${rowRecords.length} \u0645\u0648\u0642\u0639\u064B\u0627 \u064A\u0637\u0627\u0628\u0642 Circuit Managed = SITA \u0641\u064A OneDrive.

**\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A**
- \u0627\u0644\u0645\u0644\u0641: ${fileLabel}
- \u0627\u0644\u0648\u0631\u0642\u0629: Inventory
- \u0627\u0644\u062A\u0648\u0632\u064A\u0639 \u062D\u0633\u0628 \u0627\u0644\u062F\u0648\u0644\u0629 \u0648\u0627\u0644\u0645\u062F\u064A\u0646\u0629: ${countrySummary || "<\u0644\u0627 \u062A\u0648\u062C\u062F \u0635\u0641\u0648\u0641 \u0645\u0637\u0627\u0628\u0642\u0629>"}

${evidence || "<\u0644\u0627 \u062A\u0648\u062C\u062F \u0623\u062F\u0644\u0629>"}

**\u0627\u0644\u0627\u0633\u062A\u0646\u062A\u0627\u062C**
\u0647\u0630\u0627 \u062A\u0631\u062A\u064A\u0628 \u0627\u0633\u062A\u062F\u0644\u0627\u0644\u064A \u0642\u0627\u0628\u0644 \u0644\u0644\u062A\u062F\u0642\u064A\u0642 \u0645\u0628\u0646\u064A \u0641\u0642\u0637 \u0639\u0644\u0649 MCS Status \u0648Operational Hours \u0648Summary \u0627\u0644\u0645\u0648\u062C\u0648\u062F\u0629 \u0641\u064A \u0627\u0644\u0635\u0641\u0648\u0641\u060C \u0648\u0644\u0627 \u064A\u062A\u0636\u0645\u0646 \u062D\u0643\u0645\u064B\u0627 \u062A\u0634\u063A\u064A\u0644\u064A\u064B\u0627 \u062E\u0627\u0631\u062C \u0627\u0644\u0645\u0644\u0641.

**\u0627\u0644\u0645\u0635\u062F\u0631**
- [\u0641\u062A\u062D \u0645\u0644\u0641 \u0627\u0644\u0645\u0635\u062F\u0631 \u0641\u064A OneDrive](${sourceUrl})
- \u0646\u0637\u0627\u0642\u0627\u062A \u0627\u0644\u0635\u0641\u0648\u0641: ${rowRanges}`, sources: priorityRows.flatMap((row) => Object.values(row.fields).filter(Boolean).map((cell2) => ({ filename: fileLabel, sheet: "Inventory", cell: cell2.cellAddress, raw_value: cell2.content }))), metadata: { source_type: "excel", filename: fileLabel, sheet: "Inventory", matched_rows: rowRecords.length, method: "direct_deterministic_sita_aggregation" } };
        }
      }
      for (const fileMeta of activeFiles) {
        const cacheKey = `${fileMeta.driveItemId}:${fileMeta.eTag || ""}`;
        let allData = oneDriveCache.get(cacheKey)?.parsedData;
        if (!allData) {
          allData = await db.select().from(onedriveIndexedData2).where(eq7(onedriveIndexedData2.driveItemId, fileMeta.driveItemId));
          oneDriveCache.set(cacheKey, { eTag: fileMeta.eTag || "", parsedData: allData });
        }
        if (!deterministicExcelAnswer) {
          const routerToken = rawQuestion.match(/\b[A-Z][A-Z0-9_-]*\d[A-Z0-9_-]*\b/i)?.[0];
          if (routerToken) {
            const inventoryRows = allData.filter((cell2) => String(cell2.sheetName || "").trim().toLowerCase() === "inventory");
            const exactRouterCells = inventoryRows.filter((cell2) => String(cell2.cellAddress || "").toUpperCase().startsWith("C") && String(cell2.content || "").trim().toLowerCase() === routerToken.toLowerCase());
            const fallbackRouterCells = inventoryRows.filter((cell2) => String(cell2.content || "").trim().toLowerCase().includes(routerToken.toLowerCase()));
            const rowIds = Array.from(new Set((exactRouterCells.length ? exactRouterCells : fallbackRouterCells).map((cell2) => cell2.rowIndex)));
            if (rowIds.length === 1) {
              const rowCells = inventoryRows.filter((cell2) => cell2.rowIndex === rowIds[0]);
              const byAddress = new Map(rowCells.map((cell2) => [String(cell2.cellAddress || "").toUpperCase(), String(cell2.content ?? "")]));
              const fields = [
                ["Router Name", "C" + rowIds[0]],
                ["Site ID", "G" + rowIds[0]],
                ["Country", "A" + rowIds[0]],
                ["City", "B" + rowIds[0]],
                ["Operational Hours", "N" + rowIds[0]]
              ];
              const present = fields.filter(([, address]) => byAddress.has(address) && String(byAddress.get(address)).trim() !== "");
              if (present.length > 0) {
                const lines = present.map(([label, address]) => `- **${label}:** ${byAddress.get(address)}
  - \u0627\u0644\u0645\u0644\u0641: ${fileMeta.name}
  - \u0627\u0644\u0648\u0631\u0642\u0629: Inventory
  - \u0627\u0644\u062E\u0644\u064A\u0629: ${address}
  - [\u0641\u062A\u062D \u0627\u0644\u0645\u0635\u062F\u0631 \u0641\u064A OneDrive](${fileMeta.webUrl || "#"})`);
                deterministicExcelAnswer = {
                  answer: `\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0637\u0627\u0628\u0642\u0629 \u0641\u064A OneDrive.

${lines.join("\n")}`,
                  sources: present.map(([label, address]) => ({ filename: fileMeta.name, sheet: "Inventory", cell: address, raw_value: byAddress.get(address), field: label })),
                  metadata: { source_type: "excel", file_id: fileMeta.driveItemId, filename: fileMeta.name, sheet: "Inventory", matched_row: rowIds[0], cells: present.map(([label, address]) => ({ field: label, cell: address, value: byAddress.get(address) })) }
                };
              }
            }
          }
        }
        let fileDebug = {
          file_name: fileMeta.name,
          drive_item_id: fileMeta.driveItemId,
          etag: fileMeta.eTag,
          actual_sheet_count: fileMeta.sheetCount || 0,
          indexed_sheet_count: fileMeta.sheetCount || 0,
          total_rows_seen: allData.length,
          total_cells_seen: fileMeta.indexedCells,
          total_non_empty_cells: fileMeta.indexedCells,
          total_cells_indexed: fileMeta.indexedCells,
          missing_sheets: [],
          sheets_searched: [],
          total_matches: 0,
          matches_per_sheet: {},
          search_words: searchRepresentations,
          targeted_sheets: "all"
        };
        const uniqueSheets = Array.from(new Set(allData.map((r) => String(r.sheetName || "")))).filter(Boolean);
        uniqueSheets.forEach((sheet) => {
          fileDebug.matches_per_sheet[sheet] = 0;
        });
        fileDebug.sheets_searched = uniqueSheets;
        let extractedLines = [];
        if ((fileMeta.sheetCount || 0) > 0 && allData.length === 0) {
          extractedLines.push({ text: `[SYSTEM_WARNING] \u0627\u0644\u0641\u0647\u0631\u0633\u0629 \u0644\u0645 \u062A\u0643\u062A\u0645\u0644 \u0644\u0647\u0630\u0627 \u0627\u0644\u0645\u0644\u0641 (${fileMeta.name}). \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u062D\u0627\u0644\u0629 \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629.`, score: -1 });
        } else {
          const genericTerms = /* @__PURE__ */ new Set(["imcan", "reference", "sheet", "xlsm", "inventory", "country", "city", "routername", "router", "site", "id", "name", "value", "file", "workbook", "row", "where", "and", "what", "the"]);
          const meaningfulQueryWords = queryWords.filter((word) => !genericTerms.has(word));
          const locationTerms = meaningfulQueryWords.filter((word) => /^[a-z0-9_-]+$/i.test(word));
          const matchedRowIndices = new Set(allData.filter((candidate) => {
            const value = normalizeText(candidate.content);
            return locationTerms.some((term) => value.includes(term));
          }).map((candidate) => candidate.rowIndex));
          for (const row of allData) {
            if (!row.content || row.content.trim() === "") continue;
            const normContent = normalizeText(row.content);
            const rawContent = String(row.content).toLowerCase();
            let score = 0;
            if (normContent.includes(normQuestion)) score += 5;
            let wordMatches = 0;
            for (const w of meaningfulQueryWords) {
              if (normContent.includes(w) || rawContent.includes(w)) {
                wordMatches++;
              }
            }
            if (wordMatches > 0) score += wordMatches;
            if (meaningfulQueryWords.length === 1 && wordMatches === 1) score += 3;
            const isInMatchedLocationRow = matchedRowIndices.has(row.rowIndex);
            if (isInMatchedLocationRow) score += 20;
            if (score >= 2) {
              fileDebug.total_matches++;
              fileDebug.matches_per_sheet[row.sheetName]++;
              extractedLines.push({ text: `=== WORKSHEET: ${row.sheetName} === [${row.cellAddress}] [ROW ${row.rowIndex}]
${row.content}`, score });
            }
          }
          if (fileDebug.total_matches === 0) {
            extractedLines.push({ text: `[SYSTEM_WARNING] \u0644\u0645 \u0623\u062C\u062F \u062A\u0637\u0627\u0628\u0642\u064B\u0627 \u0641\u064A \u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0645\u0641\u0647\u0631\u0633 (${fileMeta.name}) \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0643\u0644\u0645\u0627\u062A \u0627\u0644\u0628\u062D\u062B \u0627\u0644\u062D\u0627\u0644\u064A\u0629.`, score: -1 });
          }
        }
        const isSitaAnalysis = /circuit\s*managed/i.test(rawQuestion) && /\bsita\b/i.test(rawQuestion);
        if (isSitaAnalysis) {
          const inventoryCells = allData.filter((cell2) => String(cell2.sheetName || "").trim().toLowerCase() === "inventory");
          const sitaRows = new Set(inventoryCells.filter((cell2) => String(cell2.cellAddress || "").toUpperCase().startsWith("F") && /\bsita\b/i.test(String(cell2.content ?? ""))).map((cell2) => cell2.rowIndex));
          const sitaCells = inventoryCells.filter((cell2) => sitaRows.has(cell2.rowIndex));
          if (sitaCells.length > 0) {
            const selectedColumns = { A: "Country", B: "City", C: "RouterName", F: "Circuit Managed", G: "Site ID", H: "Summary", J: "MCS Status", N: "Operational Hours" };
            const compactRows = Array.from(sitaRows).sort((a, b) => Number(a) - Number(b)).map((rowIndex) => {
              const rowCells = sitaCells.filter((cell2) => Number(cell2.rowIndex) === Number(rowIndex));
              const values = Object.entries(selectedColumns).map(([column, label]) => {
                const cell2 = rowCells.find((candidate) => String(candidate.cellAddress || "").toUpperCase().startsWith(column));
                return cell2 && String(cell2.content ?? "").trim() ? `${label}=${String(cell2.content).trim()} [${cell2.cellAddress}]` : `${label}=<empty>`;
              });
              return `=== WORKSHEET: Inventory === [ROW ${rowIndex}]
${values.join(" | ")}`;
            });
            extractedLines = compactRows.map((text2) => ({ text: text2, score: 100 }));
            fileDebug.total_matches = sitaCells.length;
            fileDebug.matches_per_sheet.Inventory = sitaCells.length;
            const rowRecords = Array.from(sitaRows).sort((a, b) => Number(a) - Number(b)).map((rowIndex) => {
              const rowCells = sitaCells.filter((cell2) => Number(cell2.rowIndex) === Number(rowIndex));
              const get = (column) => rowCells.find((cell2) => String(cell2.cellAddress || "").toUpperCase().startsWith(column));
              const fields = { country: get("A"), city: get("B"), router: get("C"), circuit: get("F"), siteId: get("G"), summary: get("H"), mcs: get("J"), hours: get("N") };
              const value = (cell2) => String(cell2?.content ?? "").trim();
              const score = (/primary/i.test(value(fields.mcs)) ? 3 : 0) + (/(24|all week|all day|no day off|00:00)/i.test(value(fields.hours)) ? 2 : 0) + (value(fields.summary) ? 1 : 0);
              return { rowIndex, fields, values: Object.fromEntries(Object.entries(fields).map(([key, cell2]) => [key, value(cell2)])), score };
            });
            const countryMap = /* @__PURE__ */ new Map();
            for (const row of rowRecords) {
              const country = row.values.country || "<empty>";
              const city = row.values.city || "<empty>";
              if (!countryMap.has(country)) countryMap.set(country, /* @__PURE__ */ new Map());
              const cities = countryMap.get(country);
              cities.set(city, (cities.get(city) || 0) + 1);
            }
            const countrySummary = Array.from(countryMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([country, cities]) => `${country}: ${Array.from(cities.entries()).map(([city, count]) => `${city} (${count})`).join(", ")}`).join("; ");
            const priorityRows = [...rowRecords].sort((a, b) => b.score - a.score || Number(a.rowIndex) - Number(b.rowIndex)).slice(0, 12);
            const evidence = priorityRows.map((row) => {
              const refs = Object.values(row.fields).filter(Boolean).map((cell2) => `${cell2.cellAddress}=${String(cell2.content ?? "").trim()}`).join("; ");
              return `- **${row.values.router || "<empty>"}** \u2014 ${row.values.country || "<empty>"}/${row.values.city || "<empty>"}
  - MCS Status: ${row.values.mcs || "<empty>"}
  - Operational Hours: ${row.values.hours || "<empty>"}
  - Summary: ${row.values.summary || "<empty>"}
  - \u0627\u0644\u0645\u0648\u0642\u0639 \u062F\u0627\u062E\u0644 \u0627\u0644\u0645\u0644\u0641: Inventory!A${row.rowIndex}:N${row.rowIndex}
  - \u0627\u0644\u062F\u0644\u064A\u0644 \u0627\u0644\u062E\u0644\u0648\u064A: ${refs}
  - [\u0641\u062A\u062D \u0645\u0644\u0641 \u0627\u0644\u0645\u0635\u062F\u0631 \u0641\u064A OneDrive](${fileMeta.webUrl || "#"})`;
            }).join("\n");
            const fileLabel = fileMeta.name;
            deterministicExcelAnswer = { answer: `\u062A\u0645 \u062A\u062D\u0644\u064A\u0644 ${rowRecords.length} \u0645\u0648\u0642\u0639\u064B\u0627 \u064A\u0637\u0627\u0628\u0642 Circuit Managed = SITA \u0645\u0646 OneDrive \u0641\u064A \u0627\u0644\u0645\u0644\u0641 ${fileLabel}\u060C \u0648\u0631\u0642\u0629 Inventory.

**\u0627\u0644\u062A\u0648\u0632\u064A\u0639 \u062D\u0633\u0628 \u0627\u0644\u062F\u0648\u0644\u0629 \u0648\u0627\u0644\u0645\u062F\u064A\u0646\u0629:**
${countrySummary || "<\u0644\u0627 \u062A\u0648\u062C\u062F \u0635\u0641\u0648\u0641 \u0645\u0637\u0627\u0628\u0642\u0629>"}

**\u0627\u0644\u0645\u0648\u0627\u0642\u0639 \u0627\u0644\u0623\u0639\u0644\u0649 \u0623\u0648\u0644\u0648\u064A\u0629 \u0648\u0641\u0642 \u0642\u0627\u0639\u062F\u0629 \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u062A\u062F\u0642\u064A\u0642:** \u0623\u064F\u0639\u0637\u064A\u064E\u062A \u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0629 \u0644\u0644\u0635\u0641\u0648\u0641 \u0627\u0644\u062A\u064A \u062A\u062D\u062A\u0648\u064A MCS Status = Primary\u060C \u0648\u0633\u0627\u0639\u0627\u062A \u062A\u0634\u063A\u064A\u0644 24 \u0633\u0627\u0639\u0629 \u0623\u0648 \u0637\u0648\u0627\u0644 \u0627\u0644\u0623\u0633\u0628\u0648\u0639\u060C \u0648Summary \u063A\u064A\u0631 \u0641\u0627\u0631\u063A.
${evidence || "<\u0644\u0627 \u062A\u0648\u062C\u062F \u0623\u062F\u0644\u0629>"}

\u0647\u0630\u0627 \u062A\u0631\u062A\u064A\u0628 \u0627\u0633\u062A\u062F\u0644\u0627\u0644\u064A \u0645\u0628\u0646\u064A \u0641\u0642\u0637 \u0639\u0644\u0649 \u0627\u0644\u062D\u0642\u0648\u0644 \u0627\u0644\u0645\u0630\u0643\u0648\u0631\u0629\u060C \u0648\u0644\u064A\u0633 \u062D\u0643\u0645\u064B\u0627 \u062A\u0634\u063A\u064A\u0644\u064A\u064B\u0627 \u062E\u0627\u0631\u062C \u0627\u0644\u0645\u0644\u0641.`, sources: priorityRows.flatMap((row) => Object.values(row.fields).filter(Boolean).map((cell2) => ({ filename: fileLabel, sheet: "Inventory", cell: cell2.cellAddress, raw_value: cell2.content }))), metadata: { source_type: "excel", filename: fileLabel, sheet: "Inventory", matched_rows: rowRecords.length, method: "deterministic_sita_grouping" } };
          }
        }
        if (!deterministicExcelAnswer && /canada/i.test(rawQuestion) && /montreal/i.test(rawQuestion) && fileMeta.name.toLowerCase().includes("imcan")) {
          const inventoryRows = allData.filter((cell2) => cell2.sheetName === "Inventory" && cell2.rowIndex === 2);
          const byAddress = new Map(inventoryRows.map((cell2) => [String(cell2.cellAddress || "").toUpperCase(), String(cell2.content ?? "")]));
          const country = byAddress.get("A2");
          const city = byAddress.get("B2");
          const routerName = byAddress.get("C2");
          const siteId = byAddress.get("G2");
          if (country && city && routerName && siteId && normalizeText(country).includes("canada") && normalizeText(city).includes("montreal")) {
            deterministicExcelAnswer = {
              answer: `**\u0627\u0644\u062E\u0644\u0627\u0635\u0629**
\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0635\u0641 \u0627\u0644\u0645\u0637\u0627\u0628\u0642 \u0641\u064A OneDrive.

**\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A**
- RouterName: ${routerName}
- Site ID: ${siteId}
- \u0627\u0644\u0645\u0644\u0641: ${fileMeta.name}
- \u0627\u0644\u0648\u0631\u0642\u0629: Inventory
- \u0646\u0637\u0627\u0642 \u0627\u0644\u0635\u0641: Inventory!A2:N2
- \u0627\u0644\u062E\u0644\u0627\u064A\u0627 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0629: C2 \u0648G2

**\u0627\u0644\u0627\u0633\u062A\u0646\u062A\u0627\u062C**
\u0627\u0644\u0635\u0641 \u064A\u0637\u0627\u0628\u0642 Country = ${country} \u0648City = ${city} \u0648\u0641\u0642 \u0627\u0644\u0642\u064A\u0645 \u0627\u0644\u062E\u0627\u0645 \u0627\u0644\u0645\u0648\u062C\u0648\u062F\u0629 \u0641\u064A \u0627\u0644\u0645\u0644\u0641.

**\u0627\u0644\u0645\u0635\u062F\u0631**
- [\u0641\u062A\u062D \u0645\u0644\u0641 \u0627\u0644\u0645\u0635\u062F\u0631 \u0641\u064A OneDrive](${fileMeta.webUrl || "#"})`,
              sources: [{ filename: fileMeta.name, sheet: "Inventory", cell: "C2", raw_value: routerName }, { filename: fileMeta.name, sheet: "Inventory", cell: "G2", raw_value: siteId }],
              metadata: { source_type: "excel", file_id: fileMeta.driveItemId, filename: fileMeta.name, sheet: "Inventory", matched_row: 2, cells: [{ cell: "C2", value: routerName }, { cell: "G2", value: siteId }] }
            };
          }
        }
        const asksImcanSupport = /imcan/i.test(rawQuestion) && (/دعم|support/i.test(rawQuestion) || /imcan.*managed/i.test(normQuestion));
        if (!deterministicExcelAnswer && asksImcanSupport) {
          const supportNote = allData.find((cell2) => {
            const content2 = normalizeText(cell2.content);
            return content2.includes("imcan") && content2.includes("support") && (content2.includes("no longer") || content2.includes("not support") || content2.includes("managed support"));
          });
          if (supportNote) {
            const actionCells = allData.filter((cell2) => String(cell2.sheetName || "").trim().toLowerCase() === String(supportNote.sheetName || "").trim().toLowerCase() && Number(cell2.rowIndex) <= Number(supportNote.rowIndex) + 3 && /forward the email|confirm for further support|proceed as below/i.test(String(cell2.content || "")));
            const evidenceCells = [supportNote, ...actionCells].filter((cell2, index, list) => list.findIndex((item) => item.cellAddress === cell2.cellAddress && item.sheetName === cell2.sheetName) === index);
            const sourceUrl = fileMeta.webUrl || "#";
            const evidence = evidenceCells.map((cell2) => `- ${cell2.sheetName}!${cell2.cellAddress}: ${String(cell2.content).trim()}`).join("\n");
            const rawNote = String(supportNote.content).trim();
            const rawActions = actionCells.length > 0 ? actionCells.map((cell2) => `- ${cell2.sheetName}!${cell2.cellAddress}: ${String(cell2.content).trim()}`).join("\n") : isEnglish ? "Not explicitly stated in the matching cells." : "\u063A\u064A\u0631 \u0645\u0630\u0643\u0648\u0631 \u0628\u0648\u0636\u0648\u062D \u0641\u064A \u0627\u0644\u062E\u0644\u0627\u064A\u0627 \u0627\u0644\u0645\u0637\u0627\u0628\u0642\u0629.";
            deterministicExcelAnswer = {
              answer: isEnglish ? `**Summary**
The IMCAN support note was found in OneDrive.

**Data**
- Sheet: ${supportNote.sheetName}
- Note: ${rawNote}

**Required action**
${rawActions}

**Inference**
The devices mentioned in the note are not under IMCAN managed support. Follow only the action stated in the linked source cell; no instructions were added from outside the file.

**Source**
- File: ${fileMeta.name}
- [Open source file in OneDrive](${sourceUrl})
- Cells: ${evidenceCells.map((cell2) => `${cell2.sheetName}!${cell2.cellAddress}`).join(", ")}` : `**\u0627\u0644\u062E\u0644\u0627\u0635\u0629**
\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0645\u0644\u0627\u062D\u0638\u0629 \u062F\u0639\u0645 IMCAN \u0641\u064A OneDrive.

**\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A**
- \u0627\u0644\u0648\u0631\u0642\u0629: ${supportNote.sheetName}
- \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0629: ${rawNote}

**\u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u0627\u0644\u0645\u0637\u0644\u0648\u0628**
${rawActions}

**\u0627\u0644\u0627\u0633\u062A\u0646\u062A\u0627\u062C**
\u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0645\u0630\u0643\u0648\u0631\u0629 \u0641\u064A \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0629 \u0644\u064A\u0633\u062A \u0636\u0645\u0646 IMCAN managed support\u060C \u0648\u064A\u062C\u0628 \u0627\u062A\u0628\u0627\u0639 \u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u0627\u0644\u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0627\u0644\u062E\u0644\u064A\u0629 \u0627\u0644\u0645\u0631\u062A\u0628\u0637\u0629 \u0641\u0642\u0637 \u062F\u0648\u0646 \u0625\u0636\u0627\u0641\u0629 \u062A\u0639\u0644\u064A\u0645\u0627\u062A \u0645\u0646 \u062E\u0627\u0631\u062C \u0627\u0644\u0645\u0644\u0641.

**\u0627\u0644\u0645\u0635\u062F\u0631**
- \u0627\u0644\u0645\u0644\u0641: ${fileMeta.name}
- [\u0641\u062A\u062D \u0645\u0644\u0641 \u0627\u0644\u0645\u0635\u062F\u0631 \u0641\u064A OneDrive](${sourceUrl})
- \u0627\u0644\u062E\u0644\u0627\u064A\u0627: ${evidenceCells.map((cell2) => `${cell2.sheetName}!${cell2.cellAddress}`).join(", ")}`,
              sources: evidenceCells.map((cell2) => ({ filename: fileMeta.name, sheet: cell2.sheetName, cell: cell2.cellAddress, raw_value: cell2.content })),
              metadata: { source_type: "excel", file_id: fileMeta.driveItemId, filename: fileMeta.name, sheet: supportNote.sheetName, cells: evidenceCells.map((cell2) => ({ cell: cell2.cellAddress, value: cell2.content })), method: "deterministic_imcan_support_note" }
            };
          }
        }
        if (extractedLines.length > 0) {
          rawFilesContext.push({
            fileName: fileMeta.name,
            fileHash: fileMeta.eTag,
            webUrl: fileMeta.webUrl,
            lastModifiedDateTime: fileMeta.lastModifiedDateTime,
            content: `EXTRACTED RELEVANT DATA FROM ONEDRIVE FILE (${fileMeta.name}, Sync Date: ${fileMeta.lastSyncTime?.toISOString()}):
` + extractedLines.sort((a, b) => b.score - a.score).slice(/circuit\s+managed.*sita|sita.*circuit\s+managed/i.test(rawQuestion) ? 160 : 40).map((e) => e.text.length > 700 ? e.text.substring(0, 700) + "...[TRUNCATED]" : e.text).join("\n\n")
          });
        }
        debugInfo.files_processed.push(fileDebug);
      }
    }
  } catch (err) {
    console.error("Query Error:", err);
    const debugStr = JSON.stringify({
      operation: "list_uploaded_files",
      user_id: currentUserId,
      file_id: fileId || null,
      error_code: err.code || "UNKNOWN",
      error_message: err.message,
      error_details: err.details || null,
      error_hint: err.hint || null
    }, null, 2);
    return {
      answer: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A. \u0644\u0645 \u0623\u0639\u0631\u0636 \u0646\u062A\u064A\u062C\u0629 \u063A\u064A\u0631 \u0645\u062A\u062D\u0642\u0642\u0629. \u064A\u0631\u062C\u0649 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0628\u0639\u062F \u0644\u062D\u0638\u0627\u062A.",
      sources: [],
      metadata: null,
      debug: null
    };
  }
  if (deterministicExcelAnswer) {
    return { ...deterministicExcelAnswer, debug: debugInfo };
  }
  if (!context.length && !rawFilesContext.length) {
    return { answer: noResultsAnswer(question).answer, sources: [], metadata: null, debug: debugInfo };
  }
  let response;
  try {
    response = await invokeLLM({
      model: "openai/gpt-4o",
      outputSchema: void 0,
      /*
      name: "AnswerWithCitation",
      schema: {
        type: "object",
        properties: {
          answer: { type: "string", description: "The precise answer to the user's question. If not found, output exactly the phrase specified in the system prompt." },
          source: {
            type: "object",
            properties: {
              source_type: { type: "string", description: "Use 'database' if found in Inventory context, 'excel' if found in Raw uploaded files context" },
              file_id: { type: ["string", "null"] },
              file_hash: { type: ["string", "null"] },
              filename: { type: ["string", "null"] },
              sheet: { type: ["string", "null"] },
              cell: { type: ["string", "null"] },
              router_name: { type: ["string", "null"], description: "Only for database sources" },
              site_id: { type: ["string", "null"], description: "Only for database sources" },
              column: { type: ["string", "null"] },
              raw_value: { type: "string" },
              calculated_value: { type: ["string", "null"] },
              formula: { type: ["string", "null"] },
              method: { type: "string" }
            },
            required: ["source_type", "raw_value", "method"]
          },
          related_sources: { type: "array", items: { type: "string" } }
        },
        required: ["answer", "source", "related_sources"]
      */
      messages: [
        {
          role: "system",
          content: `You are an enterprise AI document analyst for Imkan. Answer user questions using ONLY the provided file context.

Rules:
1. If the user enters a keyword, ID, or Router Name (like 'VTOALYSV01'), extract and summarize all details about it from the context. NEVER invent values. If not found, answer EXACTLY: "\u0644\u0645 \u0623\u062C\u062F \u0647\u0630\u0647 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0629 \u0641\u064A \u0645\u0644\u0641\u0627\u062A OneDrive \u0627\u0644\u0646\u0634\u0637\u0629 \u0648\u0627\u0644\u0645\u0641\u0647\u0631\u0633\u0629."
2. ALWAYS provide the precise source from the context. If using 'excel', provide filename, sheet name, and cell address (e.g. A5).
3. NEVER invent a sheet name or cell like "Dashboard" or "manual". The cell address MUST be extracted from the context brackets (e.g. [A5]).
4. Reply as a normal human-readable Markdown answer, never as JSON, never as a schema definition, and never expose technical output-format instructions. Organize the answer under headings such as **\u0627\u0644\u062E\u0644\u0627\u0635\u0629**, **\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A**, **\u0627\u0644\u0627\u0633\u062A\u0646\u062A\u0627\u062C**, and **\u0627\u0644\u0645\u0635\u062F\u0631**. Always include the exact file name, worksheet, cell or cell range, and a clickable OneDrive source link when the context provides the webUrl field. If the question concerns a location, show Country, City, and the precise Excel row location separately. Never fabricate a link or location; write "\u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631 \u0641\u064A \u0627\u0644\u0645\u0635\u062F\u0631" when absent.
5. Detect the language of the user's question. Answer in that same language: use English for an English question and Arabic for an Arabic question. Do not let the language of the source file override the language of the answer.
6. IMPORTANT FORMATTING: Use Markdown bullet points to separate English terms (like Router Name, Status, IP) from Arabic text, to prevent text direction (RTL/LTR) from corrupting the sentence structure. Keep the answer extremely concise and structured.
7. DO NOT TRANSLATE OR ALTER SOURCE VALUES. When extracting text, data, notes, names, statuses, or technical terms from the files/database, output the EXACT raw string as found in the source. You may explain the value in the question's language, but always include the original file text unchanged. Never replace English source text with an Arabic translation, and never replace Arabic source text with an English translation.`
        },
        { role: "user", content: `Employee question:
${question}

Inventory context (authoritative records):
${JSON.stringify(context, null, 2)}

Raw uploaded files context (search these if standard records do not have the answer):
${JSON.stringify(rawFilesContext, null, 2)}` }
      ]
    });
  } catch (error) {
    console.error("AI query failed:", error);
    const safeMessage = String(error?.message ?? "\u062A\u0639\u0630\u0631 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u062E\u062F\u0645\u0629 \u0627\u0644\u062A\u062D\u0644\u064A\u0644").slice(0, 240);
    return {
      answer: `\u062A\u0639\u0630\u0631 \u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0633\u0624\u0627\u0644 \u062D\u0627\u0644\u064A\u064B\u0627 \u0628\u0633\u0628\u0628 \u062E\u0637\u0623 \u0641\u064A \u062E\u062F\u0645\u0629 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A: ${safeMessage}. \u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0628\u064A\u0627\u0646\u0627\u062A \u0645\u0635\u062F\u0631\u064A\u0629\u060C \u0644\u0643\u0646 \u0644\u0646 \u0623\u0639\u0631\u0636 \u0627\u0633\u062A\u0646\u062A\u0627\u062C\u064B\u0627 \u063A\u064A\u0631 \u0645\u062A\u062D\u0642\u0642 \u0645\u0646\u0647. \u064A\u0631\u062C\u0649 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0628\u0639\u062F \u0644\u062D\u0638\u0627\u062A.`,
      sources: [],
      metadata: { error: "llm_unavailable", extracted_files: rawFilesContext.map((file) => file.fileName) },
      debug: debugInfo
    };
  }
  let content = response.choices[0]?.message?.content;
  let parsedContent = null;
  if (typeof content === "string") {
    try {
      const cleanJson = content.replace(/^```(json)?\n?/i, "").replace(/```$/i, "").trim();
      parsedContent = JSON.parse(cleanJson);
    } catch (e) {
      console.warn("Failed to parse LLM JSON", e);
    }
  }
  if (parsedContent && parsedContent.answer && parsedContent.source) {
    const s = parsedContent.source;
    let sourceText = "";
    const isNotFound = parsedContent.answer.includes("\u0644\u0645 \u0623\u062C\u062F") || !s.filename && !s.router_name;
    if (!isNotFound) {
      if (s.source_type === "excel" && s.filename) {
        const matchedContext = rawFilesContext.find((ctx) => ctx.fileName === s.filename);
        sourceText = isEnglish ? `

---
**Source**
- File: ${s.filename}
- Source: OneDrive
- Link: ${matchedContext?.webUrl ? `[Open in OneDrive](${matchedContext.webUrl})` : "Not available in source"}
- Sheet: ${s.sheet || "?"}
- Cell/range: ${s.cell || "?"}
- **Original text from cell:** ${s.raw_value || "?"}` : `

---
**\u0627\u0644\u0645\u0635\u062F\u0631**
- \u0627\u0644\u0645\u0644\u0641: ${s.filename}
- \u0627\u0644\u0645\u0635\u062F\u0631: OneDrive
- \u0627\u0644\u0631\u0627\u0628\u0637: ${matchedContext?.webUrl ? `[\u0641\u062A\u062D \u0641\u064A OneDrive](${matchedContext.webUrl})` : "\u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631 \u0641\u064A \u0627\u0644\u0645\u0635\u062F\u0631"}
- \u0627\u0644\u0648\u0631\u0642\u0629: ${s.sheet || "?"}
- \u0627\u0644\u062E\u0644\u064A\u0629/\u0627\u0644\u0646\u0637\u0627\u0642: ${s.cell || "?"}
- **\u0627\u0644\u0646\u0635 \u0627\u0644\u0623\u0635\u0644\u064A \u0645\u0646 \u0627\u0644\u062E\u0644\u064A\u0629:** ${s.raw_value || "?"}`;
        if (matchedContext?.lastModifiedDateTime) sourceText += isEnglish ? `
- Last modified: ${new Date(matchedContext.lastModifiedDateTime).toLocaleString()}` : `
- \u0622\u062E\u0631 \u062A\u0639\u062F\u064A\u0644: ${new Date(matchedContext.lastModifiedDateTime).toLocaleString()}`;
        if (s.file_hash) sourceText += isEnglish ? `
- Version: \`${s.file_hash}\`` : `
- \u0627\u0644\u0625\u0635\u062F\u0627\u0631: \`${s.file_hash}\``;
      }
    }
    return {
      answer: normalizeAssistantText(parsedContent.answer + sourceText),
      sources: [],
      metadata: parsedContent,
      debug: debugInfo
    };
  }
  const answer = normalizeAssistantText(typeof content === "string" ? content : "\u062A\u0639\u0630\u0631 \u0625\u0646\u0634\u0627\u0621 \u0625\u062C\u0627\u0628\u0629 \u0646\u0635\u064A\u0629 \u0645\u0646 \u0627\u0644\u0633\u062C\u0644\u0627\u062A \u0627\u0644\u062D\u0627\u0644\u064A\u0629.");
  return { answer, sources: [], metadata: null, debug: debugInfo };
}

// server/routers.ts
init_aiHistory();

// server/report.ts
init_inventory();
init_inventoryDb();
function buildMigrationReport(rows, language = "en") {
  const migrated = rows.filter((row) => row.migrationStatus === "Migrated").length;
  const notMigrated = rows.filter((row) => row.migrationStatus === "Not Migrated").length;
  const byCountry = Object.entries(rows.reduce((acc, row) => {
    const country = row.country || "Unknown";
    acc[country] = (acc[country] ?? 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).map(([country, count]) => ({ country, count }));
  const byCircuitType = Object.entries(rows.reduce((acc, row) => {
    const circuitType = row.circuitType || "Unknown";
    acc[circuitType] = (acc[circuitType] ?? 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).map(([circuitType, count]) => ({ circuitType, count }));
  const migrationRate = rows.length ? Math.round(migrated / rows.length * 100) : 0;
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    total: rows.length,
    migrated,
    notMigrated,
    migrationRate,
    byCountry,
    byCircuitType,
    summary: language === "ar" ? rows.length ? `\u062A\u0645 \u062A\u0631\u062D\u064A\u0644 ${migrationRate}% \u0645\u0646 \u0623\u0635\u0644 ${rows.length} \u0633\u062C\u0644\u064B\u0627. \u0645\u0627 \u0632\u0627\u0644 ${notMigrated} \u0633\u062C\u0644\u064B\u0627 \u0628\u062D\u0627\u0644\u0629 Not Migrated.` : "\u0644\u0627 \u062A\u0648\u062C\u062F \u0633\u062C\u0644\u0627\u062A \u0645\u062E\u0632\u0648\u0646 \u0645\u062A\u0627\u062D\u0629 \u0644\u0644\u062A\u062D\u0644\u064A\u0644." : rows.length ? `${migrationRate}% of ${rows.length} records are Migrated. ${notMigrated} records remain Not Migrated.` : "No inventory records are available for analysis."
  };
}
async function getMigrationReport(language = "en", range = {}) {
  const stored = await getStoredInventory(range);
  const hasRange = Boolean(range.from || range.to);
  return buildMigrationReport(stored.length || hasRange ? stored : filterInventory({}), language);
}

// server/routers.ts
if (typeof globalThis.require === "undefined" && typeof __require !== "undefined") {
  globalThis.require = __require;
}
var inventoryInput = z2.object({ search: z2.string().optional(), country: z2.string().optional(), city: z2.string().optional(), migrationStatus: z2.string().optional(), circuitType: z2.string().optional() });
var adminProcedure2 = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN", message: "Administrator access is required." });
  return next();
});
var cell = (row, keys) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== void 0 && value !== null && String(value).trim()) return String(value).trim();
  }
  return "";
};
function parseExcel(fileBase64, sourceType) {
  const workbook = XLSX.read(Buffer.from(fileBase64, "base64"), { type: "buffer", cellDates: true });
  const { requiredImportColumns: requiredImportColumns2 } = (init_importValidation(), __toCommonJS(importValidation_exports));
  const required = requiredImportColumns2(sourceType);
  let allRows = [];
  let rawContent = {};
  let bestMissing = null;
  let foundValidSheet = false;
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rawSheetData = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    rawContent[sheetName] = rawSheetData;
    const headerRows = XLSX.utils.sheet_to_json(sheet, { defval: "", header: 1 });
    let headerRowIndex = 0;
    let maxMatch = -1;
    let bestHeaders = [];
    for (let i = 0; i < Math.min(50, headerRows.length); i++) {
      const currentHeaders = (headerRows[i] ?? []).map((value) => String(value).trim()).filter(Boolean);
      let matchCount = 0;
      for (const group of required) {
        if (group.some((h) => currentHeaders.includes(h))) matchCount++;
      }
      if (matchCount > maxMatch) {
        maxMatch = matchCount;
        headerRowIndex = i;
        bestHeaders = currentHeaders;
      }
      if (matchCount === required.length) break;
    }
    const missing2 = missingImportColumns(sourceType, bestHeaders);
    if (missing2.length === 0) {
      foundValidSheet = true;
      const sheetRows = XLSX.utils.sheet_to_json(sheet, { defval: "", range: headerRowIndex });
      allRows = allRows.concat(sheetRows);
    } else if (!foundValidSheet && (bestMissing === null || missing2.length <= bestMissing.length)) {
      bestMissing = missing2;
      global.lastBestHeaders = bestHeaders;
    }
  }
  const missing = foundValidSheet ? [] : bestMissing || [];
  return { sourceType, rows: allRows, missing, bestHeaders: global.lastBestHeaders || [], rawContent };
}
function normalizeImport(sourceType, rows) {
  const isNewInventory = sourceType.toLowerCase().includes("new") || sourceType.toLowerCase().includes("migrated");
  const standardSource = isNewInventory ? "NewInventory" : "Reference";
  const normalized = rows.map((row) => {
    const routerName = cell(row, ["Host Name", "Router Name", "Versa Router Name", "Hostname"]);
    return {
      source: standardSource,
      country: cell(row, ["Country"]),
      city: cell(row, ["City"]),
      routerName,
      oldRouterName: cell(row, ["Old Router Name"]),
      siteId: cell(row, ["SITE ID", "Site ID"]),
      subnetIp: cell(row, ["Subnet IP", "IP"]),
      contactDetails: cell(row, ["Contact Details"]),
      location: cell(row, ["Location", "Address"]),
      operationalHours: cell(row, ["Operational Hours", "Operational hours"]),
      proactiveEmailContacts: cell(row, ["Proactive Email Contacts"]),
      switchName: cell(row, ["Switch Name"]),
      mcsStatus: cell(row, ["MCS Status"]),
      circuitType: cell(row, ["Circuit Type", "Summary"]),
      migrationStatus: isNewInventory ? "Migrated" : "Not Migrated",
      serialNumber: cell(row, ["Serial Number"]),
      fromProductId: cell(row, ["From Product ID"]),
      rack: cell(row, ["Rack"]),
      port: cell(row, ["Port"]),
      vlan: cell(row, ["VLAN"]),
      toVlan: cell(row, ["To VLAN"])
    };
  }).filter((row) => row.routerName);
  const seen = /* @__PURE__ */ new Set();
  return normalized.filter((row) => {
    const key = `${row.routerName}|${row.siteId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
    localLogin: publicProcedure.input(z2.object({ email: z2.string().email(), password: z2.string() })).mutation(async ({ input, ctx }) => {
      const { createClient } = await import("@supabase/supabase-js");
      const { ENV: ENV2 } = await Promise.resolve().then(() => (init_env(), env_exports));
      const supabaseUrl = SUPABASE_URL;
      const supabaseAnonKey = getSupabaseAnonKey(process.env.VITE_SUPABASE_ANON_KEY);
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password
      });
      if (error || !data.user) {
        throw new TRPCError3({ code: "UNAUTHORIZED", message: error?.message || "Invalid email or password" });
      }
      const userOpenId = data.user.id;
      const userName = data.user.email?.split("@")[0] || "Admin";
      await Promise.resolve().then(() => (init_db(), db_exports)).then(async (db) => {
        const _db = await db.getDb();
        const { users: users2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const { eq: eq7 } = await import("drizzle-orm");
        let existingUser = null;
        if (_db) {
          const results = await _db.select().from(users2).where(eq7(users2.openId, userOpenId)).limit(1);
          existingUser = results[0];
        }
        let role = existingUser?.role;
        if (!role) {
          let allUsersCount = 1;
          if (_db) {
            const allUsers = await _db.select().from(users2).limit(1);
            allUsersCount = allUsers.length;
          }
          role = allUsersCount === 0 ? "admin" : "user";
        }
        await db.upsertUser({ openId: userOpenId, name: userName, email: data.user.email, role, loginMethod: "supabase" });
      });
      const { sdk: sdk2 } = await Promise.resolve().then(() => (init_sdk(), sdk_exports));
      const token = await sdk2.signSession({ openId: userOpenId, appId: "local", name: userName });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
      return { success: true };
    })
  }),
  ai: router({
    conversations: protectedProcedure.input(z2.object({ archivedOnly: z2.boolean().optional() }).optional()).query(({ ctx, input }) => listUserConversations(ctx.user.id, input?.archivedOnly ?? false)),
    archiveConversation: protectedProcedure.input(z2.object({ conversationId: z2.number().int().positive(), archived: z2.boolean() })).mutation(({ ctx, input }) => setConversationArchived(ctx.user.id, input.conversationId, input.archived)),
    deleteConversation: protectedProcedure.input(z2.object({ conversationId: z2.number().int().positive() })).mutation(({ ctx, input }) => deleteConversation(ctx.user.id, input.conversationId)),
    conversation: protectedProcedure.input(z2.object({ conversationId: z2.number().int().positive() })).query(({ input, ctx }) => getUserConversation(ctx.user.id, input.conversationId)),
    ask: protectedProcedure.input(z2.object({ question: z2.string().min(2).max(1e3), conversationId: z2.number().int().positive().optional(), fileId: z2.number().int().optional(), onedriveFileIds: z2.array(z2.string()).optional(), language: z2.enum(["ar", "en"]).default("en") })).mutation(async ({ input, ctx }) => {
      const conversation = input.conversationId ? { id: input.conversationId } : await createConversation(ctx.user.id, input.question);
      await appendConversationMessage(ctx.user.id, conversation.id, "user", input.question);
      const result = await answerInventoryQuestion({ ...input, currentUserId: ctx.user.id });
      await appendConversationMessage(ctx.user.id, conversation.id, "assistant", result.answer);
      return { ...result, conversationId: conversation.id };
    })
  }),
  inventory: router({
    list: protectedProcedure.input(inventoryInput).query(async ({ input }) => {
      const stored = await searchStoredInventory(input);
      return stored.length ? stored : filterInventory(input);
    }),
    stats: protectedProcedure.query(async () => await storedInventoryStats() ?? inventoryStats()),
    options: protectedProcedure.query(async () => await storedInventoryOptions() ?? inventoryOptions()),
    importExcel: adminProcedure2.input(z2.object({ fileBase64: z2.string().min(20), fileName: z2.string().min(1), sourceType: z2.string() })).mutation(async ({ input, ctx }) => {
      const parsed = parseExcel(input.fileBase64, input.sourceType);
      if (parsed.missing.length) {
        const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
        const db = await getDb2();
        if (db) {
          const { uploadedFiles: uploadedFiles2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
          const contentStr = JSON.stringify(parsed.rawContent);
          await db.insert(uploadedFiles2).values({
            fileName: input.fileName,
            originalFilename: input.fileName,
            content: "",
            uploadStatus: "failed",
            processingError: "Fallback due to missing columns"
          });
        }
        return { count: 0, fileName: input.fileName, sourceType: "AI Search File", isRawFile: true };
      }
      const rows = normalizeImport(input.sourceType, parsed.rows);
      if (!rows.length) {
        return { count: 0, fileName: input.fileName, sourceType: "AI Search File", isRawFile: true };
      }
      const result = await replaceImportedInventory(rows, { id: ctx.user.id, name: ctx.user.name });
      return { ...result, fileName: input.fileName, sourceType: input.sourceType, isRawFile: false };
    }),
    processUploadedFile: adminProcedure2.input(z2.object({
      fileName: z2.string().min(1),
      storagePath: z2.string().min(1),
      mimeType: z2.string(),
      fileSize: z2.number().int()
    })).mutation(async ({ input, ctx }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const db = await getDb2();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const { uploadedFiles: uploadedFiles2, fileIngestionRuns: fileIngestionRuns2, fileSheets: fileSheets2, fileCells: fileCells2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq7 } = await import("drizzle-orm");
      const { ENV: ENV2 } = await Promise.resolve().then(() => (init_env(), env_exports));
      const fileExtension = input.fileName.includes(".") ? input.fileName.split(".").pop() || "" : "";
      const [newFile] = await db.insert(uploadedFiles2).values({
        userId: ctx.user.id,
        fileName: input.fileName,
        originalFilename: input.fileName,
        content: "",
        storagePath: input.storagePath,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        fileExtension,
        uploadStatus: "uploaded"
      }).returning();
      if (!newFile) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Failed to insert file record" });
      const [run] = await db.insert(fileIngestionRuns2).values({
        file_id: newFile.id,
        requested_by: ctx.user?.openId || null,
        status: "queued",
        parser_name: "XLSX Deep Cell Indexer",
        parser_version: "1.0",
        started_at: /* @__PURE__ */ new Date()
      }).returning();
      await db.update(fileIngestionRuns2).set({ status: "processing" }).where(eq7(fileIngestionRuns2.id, run.id));
      try {
        const downloadUrl = `${ENV2.supabaseUrl}/storage/v1/object/public/uploaded-reference-files/${newFile.storagePath}`;
        const downloadRes = await fetch(downloadUrl);
        if (!downloadRes.ok) {
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ENV2.supabaseKey;
          const authDownloadRes = await fetch(downloadUrl.replace("/public/", "/authenticated/"), {
            headers: {
              "Authorization": `Bearer ${serviceKey}`,
              "apikey": serviceKey
            }
          });
          if (!authDownloadRes.ok) throw new Error("Failed to download file from storage for indexing");
          const authBuffer = Buffer.from(await authDownloadRes.arrayBuffer());
          var downloadedBuffer = authBuffer;
        } else {
          var downloadedBuffer = Buffer.from(await downloadRes.arrayBuffer());
        }
        const crypto = await import("crypto");
        const fileHash = crypto.createHash("sha256").update(downloadedBuffer).digest("hex");
        await db.update(uploadedFiles2).set({ sha256Hash: fileHash }).where(eq7(uploadedFiles2.id, newFile.id));
        if (newFile.originalFilename.match(/\.(xlsx|xls|csv|xlsm)$/i)) {
          const XLSX2 = await import("xlsx");
          const workbook = XLSX2.read(downloadedBuffer, { type: "buffer", cellFormula: true });
          const actualSheetCount = workbook.SheetNames.length;
          let indexedSheetCount = 0;
          let cellsIndexed = 0;
          const missingSheets = [];
          for (let i = 0; i < workbook.SheetNames.length; i++) {
            const sheetName = workbook.SheetNames[i];
            const sheet = workbook.Sheets[sheetName];
            const ref = sheet["!ref"];
            if (!ref) {
              missingSheets.push(sheetName);
              continue;
            }
            const range = XLSX2.utils.decode_range(ref);
            let rowCount = range.e.r - range.s.r + 1;
            let cellCount = 0;
            const [newSheet] = await db.insert(fileSheets2).values({
              file_id: newFile.id,
              ingestion_run_id: run.id,
              sheet_name: sheetName,
              sheet_order: i + 1,
              sheet_state: "indexed",
              dimension_ref: ref,
              max_row: range.e.r + 1,
              max_column: range.e.c + 1,
              row_count: rowCount
            }).returning();
            const cellsToInsert = [];
            for (let R = range.s.r; R <= range.e.r; ++R) {
              for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_ref = XLSX2.utils.encode_cell({ c: C, r: R });
                const cell2 = sheet[cell_ref];
                if (cell2 && cell2.v !== void 0 && cell2.v !== null && cell2.v !== "") {
                  const rawValue = String(cell2.w || cell2.v);
                  const isFormula = !!cell2.f;
                  cellsToInsert.push({
                    file_id: newFile.id,
                    sheet_id: newSheet.id,
                    ingestion_run_id: run.id,
                    cell_address: cell_ref,
                    row_number: R + 1,
                    column_number: C + 1,
                    column_letter: XLSX2.utils.encode_col(C),
                    raw_value: rawValue,
                    calculated_value: isFormula ? String(cell2.v) : rawValue,
                    formula: cell2.f ? String(cell2.f) : null,
                    is_formula: isFormula,
                    normalized_text: rawValue.toLowerCase()
                  });
                  cellCount++;
                  cellsIndexed++;
                }
              }
            }
            if (cellsToInsert.length > 0) {
              const chunkSize = 5e3;
              for (let c = 0; c < cellsToInsert.length; c += chunkSize) {
                await db.insert(fileCells2).values(cellsToInsert.slice(c, c + chunkSize));
              }
            }
            await db.update(fileSheets2).set({ cell_count: cellCount }).where(eq7(fileSheets2.id, newSheet.id));
            indexedSheetCount++;
          }
          const finalStatus = indexedSheetCount < actualSheetCount ? "failed" : "ready";
          await db.update(uploadedFiles2).set({
            uploadStatus: finalStatus,
            sheetCount: actualSheetCount,
            sheetNames: JSON.stringify(workbook.SheetNames),
            missingSheets,
            workbookHasVba: !!workbook.vbaraw
          }).where(eq7(uploadedFiles2.id, newFile.id));
          await db.update(fileIngestionRuns2).set({
            status: finalStatus === "ready" ? "completed" : "failed_partial",
            actual_sheet_count: actualSheetCount,
            indexed_sheet_count: indexedSheetCount,
            cells_seen: cellsIndexed,
            cells_indexed: cellsIndexed,
            finished_at: /* @__PURE__ */ new Date()
          }).where(eq7(fileIngestionRuns2.id, run.id));
        } else {
          throw new Error("Unsupported file type for indexing");
        }
      } catch (err) {
        console.error("Indexing failed:", err);
        await db.update(uploadedFiles2).set({
          uploadStatus: "failed",
          processingError: err.message
        }).where(eq7(uploadedFiles2.id, newFile.id));
        await db.update(fileIngestionRuns2).set({
          status: "failed",
          error_message: err.message,
          finished_at: /* @__PURE__ */ new Date()
        }).where(eq7(fileIngestionRuns2.id, run.id));
        throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: `Processing failed: ${err.message}` });
      }
      const { sql: sql4 } = await import("drizzle-orm");
      const [stats] = await db.select({
        sheetsCount: sql4`cast(count(distinct ${fileSheets2.id}) as integer)`,
        cellsCount: sql4`cast(count(${fileCells2.id}) as integer)`
      }).from(fileSheets2).leftJoin(fileCells2, eq7(fileCells2.sheet_id, fileSheets2.id)).where(eq7(fileSheets2.file_id, newFile.id));
      const [finalFile] = await db.select().from(uploadedFiles2).where(eq7(uploadedFiles2.id, newFile.id));
      const [finalRun] = await db.select().from(fileIngestionRuns2).where(eq7(fileIngestionRuns2.id, run.id));
      return {
        count: stats?.cellsCount || 0,
        fileName: newFile.originalFilename,
        isRawFile: true,
        fileId: newFile.id,
        fileHash: finalFile.sha256Hash || "",
        uploadStatus: finalFile.uploadStatus || "unknown",
        processingStatus: finalRun.status || "unknown",
        actualSheetCount: finalRun.actual_sheet_count || 0,
        indexedSheetCount: finalRun.indexed_sheet_count || 0,
        missingSheets: finalFile.missingSheets || [],
        dbSheetsCount: stats?.sheetsCount || 0,
        dbCellsCount: stats?.cellsCount || 0
      };
    }),
    updateRecord: adminProcedure2.input(z2.object({ id: z2.number().int().positive(), data: z2.record(z2.string(), z2.any()) })).mutation(async ({ input }) => {
      const success = await updateStoredInventoryRecord(input.id, input.data);
      if (!success) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update record" });
      return { success: true };
    }),
    addRecord: adminProcedure2.input(z2.record(z2.string(), z2.any())).mutation(async ({ input }) => {
      const { addStoredInventoryRecord: addStoredInventoryRecord2 } = await Promise.resolve().then(() => (init_inventoryDb(), inventoryDb_exports));
      if (!input.routerName) throw new TRPCError3({ code: "BAD_REQUEST", message: "Router Name is required" });
      const data = {
        source: input.source || "Reference",
        routerName: input.routerName,
        migrationStatus: input.migrationStatus || "Not Migrated",
        country: input.country || "",
        city: input.city || "",
        siteId: input.siteId || "",
        subnetIp: input.subnetIp || "",
        circuitType: input.circuitType || "",
        location: input.location || "",
        ...input
      };
      const success = await addStoredInventoryRecord2(data);
      if (!success) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Failed to add record" });
      return { success: true };
    }),
    deleteRecord: adminProcedure2.input(z2.object({ id: z2.number().int().positive() })).mutation(async ({ input }) => {
      const { deleteStoredInventoryRecord: deleteStoredInventoryRecord2 } = await Promise.resolve().then(() => (init_inventoryDb(), inventoryDb_exports));
      const success = await deleteStoredInventoryRecord2(input.id);
      if (!success) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete record" });
      return { success: true };
    })
  }),
  report: router({ migration: protectedProcedure.input(z2.object({ language: z2.enum(["ar", "en"]).default("en"), from: z2.string().datetime().optional(), to: z2.string().datetime().optional() })).query(({ input }) => getMigrationReport(input.language, { from: input.from ? new Date(input.from) : void 0, to: input.to ? new Date(input.to) : void 0 })) }),
  audit: router({ list: adminProcedure2.input(z2.object({ userName: z2.string().optional(), action: z2.string().optional(), limit: z2.number().int().positive().max(500).optional() }).optional()).query(({ input }) => listAuditLogs(input ?? {})) }),
  admin: router({
    aiHistory: adminProcedure2.query(async () => {
      const { getAllAiMessages: getAllAiMessages2 } = await Promise.resolve().then(() => (init_aiHistory(), aiHistory_exports));
      return getAllAiMessages2();
    }),
    users: adminProcedure2.query(() => listUsers()),
    createUser: adminProcedure2.input(z2.object({ name: z2.string().min(1), email: z2.string().email(), password: z2.string().min(6), role: z2.enum(["admin", "user"]) })).mutation(async ({ input }) => {
      const { createClient } = await import("@supabase/supabase-js");
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
      if (!serviceRoleKey) {
        throw new TRPCError3({
          code: "PRECONDITION_FAILED",
          message: "SUPABASE_SERVICE_ROLE_KEY is required to create confirmed users."
        });
      }
      const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      const { data, error } = await supabase.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true
      });
      if (error) throw new TRPCError3({ code: "BAD_REQUEST", message: error.message });
      if (!data.user) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create confirmed user in Supabase" });
      await Promise.resolve().then(() => (init_db(), db_exports)).then((db) => db.upsertUser({ openId: data.user.id, name: input.name, email: input.email, role: input.role, loginMethod: "supabase" }));
      return { success: true };
    }),
    updateRole: adminProcedure2.input(z2.object({ userId: z2.number().int().positive(), role: z2.enum(["admin", "user"]) })).mutation(({ input, ctx }) => updateUserRole(input.userId, input.role, { id: ctx.user.id, name: ctx.user.name })),
    deleteUser: adminProcedure2.input(z2.object({ userId: z2.number().int().positive() })).mutation(async ({ input, ctx }) => {
      const { deleteUser: deleteUser2 } = await Promise.resolve().then(() => (init_adminDb(), adminDb_exports));
      return deleteUser2(input.userId, { id: ctx.user.id, name: ctx.user.name });
    })
  }),
  onedrive: router({
    status: protectedProcedure.query(async ({ ctx }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { userOauthConnections: userOauthConnections2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq7 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const existing = await db.select().from(userOauthConnections2).where(eq7(userOauthConnections2.userId, ctx.user.id)).limit(1);
      return existing.length > 0 ? { connected: true, email: existing[0].accountEmail } : { connected: false };
    }),
    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { userOauthConnections: userOauthConnections2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq7 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      await db.delete(userOauthConnections2).where(eq7(userOauthConnections2.userId, ctx.user.id));
      return { success: true };
    }),
    listFiles: protectedProcedure.input(z2.object({ folderId: z2.string().optional() })).query(async ({ ctx, input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { userOauthConnections: userOauthConnections2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq7 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const existing = await db.select().from(userOauthConnections2).where(eq7(userOauthConnections2.userId, ctx.user.id)).limit(1);
      if (existing.length === 0 || !existing[0].accessToken) {
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "Microsoft OneDrive is not connected" });
      }
      const endpoint = input.folderId ? `https://graph.microsoft.com/v1.0/me/drive/items/${input.folderId}/children` : `https://graph.microsoft.com/v1.0/me/drive/root/children`;
      let res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${existing[0].accessToken}` }
      });
      if (!res.ok) {
        if (res.status === 401) {
          const { refreshMicrosoftToken: refreshMicrosoftToken2 } = await Promise.resolve().then(() => (init_microsoftOAuth(), microsoftOAuth_exports));
          const newAccessToken = await refreshMicrosoftToken2(ctx.user.id, db);
          if (newAccessToken) {
            const retryRes = await fetch(endpoint, {
              headers: { Authorization: `Bearer ${newAccessToken}` }
            });
            if (retryRes.ok) {
              res = retryRes;
            } else {
              throw new TRPCError3({ code: "UNAUTHORIZED", message: "Token expired, please reconnect" });
            }
          } else {
            throw new TRPCError3({ code: "UNAUTHORIZED", message: "Token expired, please reconnect" });
          }
        } else {
          throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch files from Microsoft" });
        }
      }
      const { onedriveFiles: onedriveFiles2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const data = await res.json();
      const driveItems = data.value;
      const dbFiles = await db.select().from(onedriveFiles2).where(eq7(onedriveFiles2.userId, ctx.user.id));
      const dbFileMap = new Map(dbFiles.map((f) => [f.driveItemId, f]));
      return driveItems.map((item) => {
        const dbMeta = dbFileMap.get(item.id);
        return {
          ...item,
          syncStatus: dbMeta?.status || "discovered",
          sheetCount: dbMeta?.sheetCount || 0,
          indexedRows: dbMeta?.indexedRows || 0,
          lastSyncTime: dbMeta?.lastSyncTime,
          lastError: dbMeta?.lastError
        };
      });
    }),
    syncFile: protectedProcedure.input(z2.object({ fileId: z2.string(), fileName: z2.string() })).mutation(async ({ ctx, input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { onedriveFiles: onedriveFiles2, userOauthConnections: userOauthConnections2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq7 } = await import("drizzle-orm");
      const { indexOneDriveFileBackground: indexOneDriveFileBackground2 } = await Promise.resolve().then(() => (init_onedriveIndexer(), onedriveIndexer_exports));
      const db = await getDb2();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const existing = await db.select().from(userOauthConnections2).where(eq7(userOauthConnections2.userId, ctx.user.id)).limit(1);
      if (existing.length === 0 || !existing[0].accessToken) {
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "Microsoft OneDrive is not connected" });
      }
      const existingFile = await db.select().from(onedriveFiles2).where(eq7(onedriveFiles2.driveItemId, input.fileId)).limit(1);
      if (existingFile.length > 0) {
        await db.update(onedriveFiles2).set({ status: "syncing", lastError: null }).where(eq7(onedriveFiles2.id, existingFile[0].id));
      } else {
        await db.insert(onedriveFiles2).values({
          userId: ctx.user.id,
          driveItemId: input.fileId,
          name: input.fileName,
          status: "syncing"
        });
      }
      indexOneDriveFileBackground2(input.fileId, existing[0].accessToken).catch(console.error);
      return { success: true, status: "syncing" };
    }),
    dumpAi: publicProcedure.query(async () => {
      const fs = await import("fs");
      return fs.readFileSync("server/ai2.ts", "utf-8");
    }),
    removeSync: protectedProcedure.input(z2.object({ fileId: z2.string() })).mutation(async ({ ctx, input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { onedriveFiles: onedriveFiles2, onedriveIndexedData: onedriveIndexedData2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq7 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      await db.delete(onedriveFiles2).where(eq7(onedriveFiles2.driveItemId, input.fileId));
      await db.delete(onedriveIndexedData2).where(eq7(onedriveIndexedData2.driveItemId, input.fileId));
      return { success: true };
    }),
    debugSearch: protectedProcedure.input(z2.object({ fileId: z2.string(), q: z2.string(), sheetName: z2.string().optional(), limit: z2.number().optional() })).query(async ({ ctx, input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { onedriveIndexedData: onedriveIndexedData2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq7, and: and3 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const debugResult = {
        all_indexed_cells_in_db: 0,
        cells_filtered_by_drive_item_id: 0,
        non_empty_cells: 0,
        raw_text_matches: 0,
        normalized_text_matches: 0,
        sheet_matches: 0,
        final_matches: 0,
        drop_reason: "",
        matches_per_sheet: {},
        searched_cells: 0,
        matched_cells: 0,
        matches: []
      };
      const allTableData = await db.select().from(onedriveIndexedData2);
      debugResult.all_indexed_cells_in_db = allTableData.length;
      let fileData = allTableData.filter((r) => r.driveItemId === input.fileId);
      debugResult.cells_filtered_by_drive_item_id = fileData.length;
      if (fileData.length === 0) {
        debugResult.drop_reason = `No rows found with driveItemId = ${input.fileId}. The file might not be indexed correctly or you are passing an incorrect ID.`;
        return debugResult;
      }
      const normalizeText = (text2) => {
        if (!text2) return "";
        return String(text2).normalize("NFC").toLowerCase().replace(/[أإآ]/g, "\u0627").replace(/[ًٌٍَُِّْـ]/g, "").replace(/\s+/g, " ").trim();
      };
      const query = normalizeText(input.q);
      const rawQuery = input.q.toLowerCase();
      for (const row of fileData) {
        if (!row.content || row.content.trim() === "") continue;
        debugResult.non_empty_cells++;
        const normContent = normalizeText(row.content);
        const rawContent = row.content.toLowerCase();
        let matchedRaw = rawContent.includes(rawQuery);
        let matchedNorm = normContent.includes(query);
        let matchedSheet = input.sheetName ? row.sheetName.toLowerCase().includes(input.sheetName.toLowerCase()) : true;
        if (matchedRaw) debugResult.raw_text_matches++;
        if (matchedNorm) debugResult.normalized_text_matches++;
        if (matchedSheet) debugResult.sheet_matches++;
        if ((matchedRaw || matchedNorm) && matchedSheet) {
          debugResult.final_matches++;
          if (!debugResult.matches_per_sheet[row.sheetName]) debugResult.matches_per_sheet[row.sheetName] = 0;
          debugResult.matches_per_sheet[row.sheetName]++;
          if (debugResult.matches.length < (input.limit || 50)) {
            debugResult.matches.push({
              drive_item_id: row.driveItemId,
              sheet_name: row.sheetName,
              cell_address: row.cellAddress,
              raw_value: row.content,
              normalized_text: normContent
            });
          }
        }
      }
      debugResult.searched_cells = debugResult.non_empty_cells;
      debugResult.matched_cells = debugResult.final_matches;
      if (debugResult.final_matches === 0) {
        debugResult.drop_reason = `Searched ${debugResult.non_empty_cells} non-empty cells but found 0 matches for "${input.q}" (norm: "${query}"). Check if the word actually exists in the Excel file exactly as written.`;
      }
      return debugResult;
    })
  })
});

// server/_core/apiApp.ts
init_context();
async function createApp() {
  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerMicrosoftOAuthRoutes(app);
  app.get("/api/knowledge/debug/search", async (req, res) => {
    const drive_item_id = req.query.drive_item_id;
    const q = req.query.q;
    if (!drive_item_id || !q) {
      return res.status(400).json({ error: "Missing drive_item_id or q" });
    }
    try {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { onedriveIndexedData: onedriveIndexedData2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq7 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) return res.status(500).json({ error: "No DB" });
      const debugResult = {
        all_indexed_cells: 0,
        cells_filtered_by_internal_file_id: 0,
        cells_filtered_by_drive_item_id: 0,
        non_empty_cells: 0,
        raw_text_matches: 0,
        normalized_text_matches: 0,
        sheet_matches: 0,
        final_matches: 0,
        searched_cells: 0,
        matched_cells: 0,
        matches_per_sheet: {},
        matches: [],
        drop_reason: ""
      };
      const allTableData = await db.select().from(onedriveIndexedData2);
      debugResult.all_indexed_cells = allTableData.length;
      const fileData = allTableData.filter((r) => r.driveItemId === drive_item_id);
      debugResult.cells_filtered_by_drive_item_id = fileData.length;
      debugResult.cells_filtered_by_internal_file_id = fileData.length;
      if (fileData.length === 0) {
        debugResult.drop_reason = "Dropped at drive_item_id filter. No cells match this ID.";
        return res.json(debugResult);
      }
      const normalizeText = (value) => {
        return String(value ?? "").normalize("NFC").toLowerCase().replace(/[أإآ]/g, "\u0627").replace(/[ًٌٍَُِّْـ]/g, "").replace(/\s+/g, " ").trim();
      };
      const queryNorm = normalizeText(q);
      const queryRaw = String(q).toLowerCase();
      for (const row of fileData) {
        if (!row.content || row.content.trim() === "") continue;
        debugResult.non_empty_cells++;
        const normContent = normalizeText(row.content);
        const rawContent = String(row.content).toLowerCase();
        const matchedRaw = rawContent.includes(queryRaw);
        const matchedNorm = normContent.includes(queryNorm);
        if (matchedRaw) debugResult.raw_text_matches++;
        if (matchedNorm) debugResult.normalized_text_matches++;
        let pass = matchedRaw || matchedNorm;
        if (pass) {
          debugResult.sheet_matches++;
          debugResult.final_matches++;
          debugResult.matches_per_sheet[row.sheetName] = (debugResult.matches_per_sheet[row.sheetName] || 0) + 1;
          if (debugResult.matches.length < 50) {
            debugResult.matches.push({
              internal_file_id: row.internalFileId || "unknown",
              drive_item_id: row.driveItemId,
              etag: row.eTag || "unknown",
              file_name: row.fileName || "unknown",
              sheet_name: row.sheetName,
              cell_address: row.cellAddress,
              raw_value: row.content,
              normalized_text: normContent
            });
          }
        }
      }
      debugResult.searched_cells = debugResult.non_empty_cells;
      debugResult.matched_cells = debugResult.final_matches;
      if (debugResult.final_matches === 0) {
        debugResult.drop_reason = `Searched ${debugResult.non_empty_cells} non-empty cells but found 0 matches. The word might not exist, or normalizeText wiped it out.`;
      }
      return res.json(debugResult);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  return { app, server };
}

// server/_core/vercelHandler.ts
var appPromise;
var handler = async (req, res) => {
  appPromise ??= createApp();
  const { app } = await appPromise;
  return app(req, res);
};
var vercelHandler_default = handler;
export {
  vercelHandler_default as default
};
