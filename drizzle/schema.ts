import { integer, pgTable, text, serial, timestamp, boolean, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const inventoryRecords = pgTable("inventory_records", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  userName: text("userName").notNull().default("System"),
  action: text("action").notNull(),
  entityType: text("entityType").notNull(),
  entityId: integer("entityId"),
  summary: text("summary").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type InventoryRecord = typeof inventoryRecords.$inferSelect;
export type InsertInventoryRecord = typeof inventoryRecords.$inferInsert;

export const aiConversations = pgTable("ai_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: text("title").notNull().default("New AI conversation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  archivedAt: timestamp("archivedAt"),
});

export const aiMessages = pgTable("ai_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId").notNull(),
  userId: integer("userId").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type AiConversation = typeof aiConversations.$inferSelect;
export type AiMessage = typeof aiMessages.$inferSelect;

export const userOauthConnections = pgTable("user_oauth_connections", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  provider: text("provider").notNull(), // 'microsoft'
  accountId: text("accountId"), // Microsoft user ID
  accountEmail: text("accountEmail"),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const uploadedFiles = pgTable("uploaded_files", {
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

export const onedriveFiles = pgTable("onedrive_files", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  driveItemId: text("driveItemId").notNull().unique(),
  name: text("name").notNull(),
  webUrl: text("webUrl"),
  parentPath: text("parentPath"),
  sizeBytes: integer("sizeBytes"),
  eTag: text("eTag"),
  lastModifiedDateTime: timestamp("lastModifiedDateTime"),
  status: text("status").notNull().default("discovered"), // discovered, selected, syncing, processing, active, failed, archived
  sheetCount: integer("sheetCount").default(0),
  indexedRows: integer("indexedRows").default(0),
  indexedCells: integer("indexedCells").default(0),
  lastSyncTime: timestamp("lastSyncTime"),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const onedriveIndexedData = pgTable("onedrive_indexed_data", {
  id: serial("id").primaryKey(),
  internalFileId: integer("internalFileId"),
  driveItemId: text("driveItemId").notNull(),
  eTag: text("eTag"),
  fileName: text("fileName"),
  sheetName: text("sheetName").notNull(),
  rowIndex: integer("rowIndex"),
  cellAddress: text("cellAddress"),
  content: text("content").notNull(),
});

export const fileIngestionRuns = pgTable("file_ingestion_runs", {
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
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const fileSheets = pgTable("file_sheets", {
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

export const fileCells = pgTable("file_cells", {
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

import { pgView } from "drizzle-orm/pg-core";

export const fileCellSources = pgView("file_cell_sources").as((qb) => {
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
    source_metadata: fileCells.source_metadata,
  })
  .from(fileCells)
  .innerJoin(fileSheets, sql`${fileCells.sheet_id} = ${fileSheets.id}`)
  .innerJoin(uploadedFiles, sql`${fileCells.file_id} = ${uploadedFiles.id}`);
});

