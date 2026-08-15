import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRequire } from "module";
if (typeof globalThis.require === "undefined") {
  globalThis.require = createRequire(import.meta.url);
}
import * as XLSX from "xlsx";
import { filterInventory, inventoryOptions, inventoryStats } from "./inventory";
import { getStoredInventory, listAuditLogs, replaceImportedInventory, searchStoredInventory, storedInventoryOptions, storedInventoryStats, updateStoredInventoryRecord } from "./inventoryDb";
import { listUsers, updateUserRole } from "./adminDb";
import type { InsertInventoryRecord } from "../drizzle/schema";
import { missingImportColumns } from "../shared/importValidation";
import { answerInventoryQuestion } from "./ai2";
import { appendConversationMessage, createConversation, deleteConversation, getUserConversation, listUserConversations, setConversationArchived } from "./aiHistory";
import { getMigrationReport } from "./report";

const inventoryInput = z.object({ search: z.string().optional(), country: z.string().optional(), city: z.string().optional(), migrationStatus: z.string().optional(), circuitType: z.string().optional() });
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
  return next();
});
const cell = (row: Record<string, unknown>, keys: string[]) => { for (const key of keys) { const value = row[key]; if (value !== undefined && value !== null && String(value).trim()) return String(value).trim(); } return ""; };

function parseExcel(fileBase64: string, sourceType: string) {
  const workbook = XLSX.read(Buffer.from(fileBase64, "base64"), { type: "buffer", cellDates: true });
  const { requiredImportColumns } = require("../shared/importValidation");
  const required = requiredImportColumns(sourceType);
  
  let allRows: Record<string, unknown>[] = [];
  let rawContent: Record<string, any[]> = {};
  let bestMissing: string[] | null = null;
  let foundValidSheet = false;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rawSheetData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    rawContent[sheetName] = rawSheetData;

    const headerRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { defval: "", header: 1 });
    
    let headerRowIndex = 0;
    let maxMatch = -1;
    let bestHeaders: string[] = [];

    for (let i = 0; i < Math.min(50, headerRows.length); i++) {
      const currentHeaders = (headerRows[i] ?? []).map((value: unknown) => String(value).trim()).filter(Boolean);
      let matchCount = 0;
      for (const group of required) {
        if ((group as string[]).some(h => currentHeaders.includes(h))) matchCount++;
      }
      if (matchCount > maxMatch) {
        maxMatch = matchCount;
        headerRowIndex = i;
        bestHeaders = currentHeaders;
      }
      if (matchCount === required.length) break;
    }

    const missing = missingImportColumns(sourceType, bestHeaders);
    
    if (missing.length === 0) {
      foundValidSheet = true;
      const sheetRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", range: headerRowIndex });
      allRows = allRows.concat(sheetRows);
    } else if (!foundValidSheet && (bestMissing === null || missing.length <= bestMissing.length)) {
      bestMissing = missing;
      (global as any).lastBestHeaders = bestHeaders;
    }
  }

  const missing = foundValidSheet ? [] : (bestMissing || []);
  return { sourceType, rows: allRows, missing, bestHeaders: (global as any).lastBestHeaders || [], rawContent };
}

export function normalizeImport(sourceType: string, rows: Record<string, unknown>[]) {
  const isNewInventory = sourceType.toLowerCase().includes("new") || sourceType.toLowerCase().includes("migrated");
  const standardSource = isNewInventory ? "NewInventory" : "Reference";

  const normalized = rows.map(row => {
    const routerName = cell(row, ["Host Name", "Router Name", "Versa Router Name", "Hostname"]);
    return {
      source: standardSource,
      country: cell(row, ["Country"]), city: cell(row, ["City"]), routerName,
      oldRouterName: cell(row, ["Old Router Name"]), siteId: cell(row, ["SITE ID", "Site ID"]), subnetIp: cell(row, ["Subnet IP", "IP"]),
      contactDetails: cell(row, ["Contact Details"]), location: cell(row, ["Location", "Address"]), operationalHours: cell(row, ["Operational Hours", "Operational hours"]),
      proactiveEmailContacts: cell(row, ["Proactive Email Contacts"]), switchName: cell(row, ["Switch Name"]), mcsStatus: cell(row, ["MCS Status"]), circuitType: cell(row, ["Circuit Type", "Summary"]),
      migrationStatus: isNewInventory ? "Migrated" as const : "Not Migrated" as const,
      serialNumber: cell(row, ["Serial Number"]), fromProductId: cell(row, ["From Product ID"]), rack: cell(row, ["Rack"]), port: cell(row, ["Port"]), vlan: cell(row, ["VLAN"]), toVlan: cell(row, ["To VLAN"]),
    } satisfies InsertInventoryRecord;
  }).filter(row => row.routerName);

  const seen = new Set();
  return normalized.filter(row => {
    const key = `${row.routerName}|${row.siteId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
    localLogin: publicProcedure.input(z.object({ email: z.string().email(), password: z.string() })).mutation(async ({ input, ctx }) => {
      const { createClient } = await import("@supabase/supabase-js");
      const { ENV } = await import("./_core/env");
      if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Supabase configuration is missing in .env file" });
      }
      const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password
      });

      if (error || !data.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: error?.message || "Invalid email or password" });
      }

      const userOpenId = data.user.id;
      const userName = data.user.email?.split("@")[0] || "Admin";
      
      await import("./db").then(async db => {
        const _db = await db.getDb();
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        let existingUser = null;
        if (_db) {
          const results = await _db.select().from(users).where(eq(users.openId, userOpenId)).limit(1);
          existingUser = results[0];
        }
        
        // If they already exist, we keep their role. If they don't, we make them admin if they are the FIRST user in the system, otherwise user.
        let role = existingUser?.role;
        if (!role) {
           let allUsersCount = 1;
           if (_db) {
             const allUsers = await _db.select().from(users).limit(1);
             allUsersCount = allUsers.length;
           }
           role = (allUsersCount === 0) ? "admin" : "user";
        }
        await db.upsertUser({ openId: userOpenId, name: userName, email: data.user.email, role: role as "admin"|"user", loginMethod: "supabase" });
      });
      const { sdk } = await import("./_core/sdk");
      const token = await sdk.signSession({ openId: userOpenId, appId: "local", name: userName });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
      return { success: true };
    }),
  }),
  ai: router({
    conversations: protectedProcedure.input(z.object({ archivedOnly: z.boolean().optional() }).optional()).query(({ ctx, input }) => listUserConversations(ctx.user.id, input?.archivedOnly ?? false)),
    archiveConversation: protectedProcedure.input(z.object({ conversationId: z.number().int().positive(), archived: z.boolean() })).mutation(({ ctx, input }) => setConversationArchived(ctx.user.id, input.conversationId, input.archived)),
    deleteConversation: protectedProcedure.input(z.object({ conversationId: z.number().int().positive() })).mutation(({ ctx, input }) => deleteConversation(ctx.user.id, input.conversationId)),
    conversation: protectedProcedure.input(z.object({ conversationId: z.number().int().positive() })).query(({ input, ctx }) => getUserConversation(ctx.user.id, input.conversationId)),
    ask: protectedProcedure.input(z.object({ question: z.string().min(2).max(1000), conversationId: z.number().int().positive().optional(), fileId: z.number().int().optional(), onedriveFileIds: z.array(z.string()).optional(), language: z.enum(["ar", "en"]).default("en") })).mutation(async ({ input, ctx }) => {
      const conversation = input.conversationId ? { id: input.conversationId } : await createConversation(ctx.user.id, input.question);
      await appendConversationMessage(ctx.user.id, conversation.id, "user", input.question);
      const result = await answerInventoryQuestion({ ...input, currentUserId: ctx.user.id });
      await appendConversationMessage(ctx.user.id, conversation.id, "assistant", result.answer);
      return { ...result, conversationId: conversation.id };
    }),
  }),
  inventory: router({
    list: protectedProcedure.input(inventoryInput).query(async ({ input }) => {
      const stored = await searchStoredInventory(input);
      return stored.length ? stored : filterInventory(input);
    }),
    stats: protectedProcedure.query(async () => (await storedInventoryStats()) ?? inventoryStats()),
    options: protectedProcedure.query(async () => (await storedInventoryOptions()) ?? inventoryOptions()),
    importExcel: adminProcedure.input(z.object({ fileBase64: z.string().min(20), fileName: z.string().min(1), sourceType: z.string() })).mutation(async ({ input, ctx }) => {
      const parsed = parseExcel(input.fileBase64, input.sourceType);
      
      if (parsed.missing.length) {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (db) {
          const { uploadedFiles } = await import("../drizzle/schema");
          const contentStr = JSON.stringify(parsed.rawContent);
          await db.insert(uploadedFiles).values({
            fileName: input.fileName,
            originalFilename: input.fileName,
            content: '',
            uploadStatus: 'failed',
            processingError: 'Fallback due to missing columns'
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
    processUploadedFile: adminProcedure.input(z.object({ 
      fileName: z.string().min(1),
      storagePath: z.string().min(1),
      mimeType: z.string(),
      fileSize: z.number().int()
    })).mutation(async ({ input, ctx }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const { uploadedFiles, fileIngestionRuns, fileSheets, fileCells } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const { ENV } = await import("./_core/env");
      
      // 1: Insert uploaded_files record securely from backend to bypass integer userId RLS mismatch
      const fileExtension = input.fileName.includes(".") ? input.fileName.split('.').pop() || "" : "";
      const [newFile] = await db.insert(uploadedFiles).values({
        userId: ctx.user.id,
        fileName: input.fileName,
        originalFilename: input.fileName,
        content: '',
        storagePath: input.storagePath,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        fileExtension: fileExtension,
        uploadStatus: 'uploaded'
      }).returning();
      
      if (!newFile) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to insert file record" });

      // 2: Create file_ingestion_runs record
      const [run] = await db.insert(fileIngestionRuns).values({
        file_id: newFile.id,
        requested_by: ctx.user?.openId || null,
        status: "queued",
        parser_name: "XLSX Deep Cell Indexer",
        parser_version: "1.0",
        started_at: new Date()
      }).returning();

      // 3: Processing
      await db.update(fileIngestionRuns).set({ status: "processing" }).where(eq(fileIngestionRuns.id, run.id));

      try {
        // 5: Read actual file from Supabase Storage using storagePath
        const downloadUrl = `${ENV.supabaseUrl}/storage/v1/object/public/uploaded-reference-files/${newFile.storagePath}`;
        const downloadRes = await fetch(downloadUrl);
        if (!downloadRes.ok) {
           // Fallback to authenticated download if public fails (requires Service Role Key in .env for private buckets)
           const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ENV.supabaseKey;
           const authDownloadRes = await fetch(downloadUrl.replace('/public/', '/authenticated/'), {
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
        await db.update(uploadedFiles).set({ sha256Hash: fileHash }).where(eq(uploadedFiles.id, newFile.id));

        if (newFile.originalFilename.match(/\.(xlsx|xls|csv|xlsm)$/i)) {
          const XLSX = await import("xlsx");
          const workbook = XLSX.read(downloadedBuffer, { type: "buffer", cellFormula: true });
          
          const actualSheetCount = workbook.SheetNames.length;
          let indexedSheetCount = 0;
          let cellsIndexed = 0;
          const missingSheets: string[] = [];

          // 6: Read dynamically all sheets
          for (let i = 0; i < workbook.SheetNames.length; i++) {
            const sheetName = workbook.SheetNames[i];
            const sheet = workbook.Sheets[sheetName];
            const ref = sheet['!ref'];
            
            if (!ref) {
              missingSheets.push(sheetName);
              continue; // Empty sheet
            }

            const range = XLSX.utils.decode_range(ref);
            let rowCount = (range.e.r - range.s.r) + 1;
            let cellCount = 0;
            
            // 7: Insert into file_sheets
            const [newSheet] = await db.insert(fileSheets).values({
              file_id: newFile.id,
              ingestion_run_id: run.id,
              sheet_name: sheetName,
              sheet_order: i + 1,
              sheet_state: "indexed",
              dimension_ref: ref,
              max_row: range.e.r + 1,
              max_column: range.e.c + 1,
              row_count: rowCount,
            }).returning();

            const cellsToInsert = [];

            // 8: Insert into file_cells
            for (let R = range.s.r; R <= range.e.r; ++R) {
               for (let C = range.s.c; C <= range.e.c; ++C) {
                 const cell_ref = XLSX.utils.encode_cell({c:C, r:R});
                 const cell = sheet[cell_ref];
                 if(cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
                   const rawValue = String(cell.w || cell.v);
                   const isFormula = !!cell.f;
                   
                   cellsToInsert.push({
                      file_id: newFile.id,
                      sheet_id: newSheet.id,
                      ingestion_run_id: run.id,
                      cell_address: cell_ref,
                      row_number: R + 1,
                      column_number: C + 1,
                      column_letter: XLSX.utils.encode_col(C),
                      raw_value: rawValue,
                      calculated_value: isFormula ? String(cell.v) : rawValue,
                      formula: cell.f ? String(cell.f) : null,
                      is_formula: isFormula,
                      normalized_text: rawValue.toLowerCase()
                   });
                   cellCount++;
                   cellsIndexed++;
                 }
               }
            }

            // Batch insert cells
            if (cellsToInsert.length > 0) {
              // Drizzle allows batch inserts, but we should chunk them to avoid memory issues
              const chunkSize = 5000;
              for (let c = 0; c < cellsToInsert.length; c += chunkSize) {
                await db.insert(fileCells).values(cellsToInsert.slice(c, c + chunkSize));
              }
            }
            
            await db.update(fileSheets).set({ cell_count: cellCount }).where(eq(fileSheets.id, newSheet.id));
            indexedSheetCount++;
          }

          // 10: Update upload status
          const finalStatus = indexedSheetCount < actualSheetCount ? 'failed' : 'ready';
          
          await db.update(uploadedFiles).set({
            uploadStatus: finalStatus,
            sheetCount: actualSheetCount,
            sheetNames: JSON.stringify(workbook.SheetNames),
            missingSheets: missingSheets,
            workbookHasVba: !!workbook.vbaraw
          }).where(eq(uploadedFiles.id, newFile.id));

          await db.update(fileIngestionRuns).set({
            status: finalStatus === 'ready' ? 'completed' : 'failed_partial',
            actual_sheet_count: actualSheetCount,
            indexed_sheet_count: indexedSheetCount,
            cells_seen: cellsIndexed,
            cells_indexed: cellsIndexed,
            finished_at: new Date()
          }).where(eq(fileIngestionRuns.id, run.id));

        } else {
          throw new Error("Unsupported file type for indexing");
        }

      } catch (err: any) {
        console.error("Indexing failed:", err);
        await db.update(uploadedFiles).set({
          uploadStatus: 'failed',
          processingError: err.message
        }).where(eq(uploadedFiles.id, newFile.id));
        
        await db.update(fileIngestionRuns).set({
          status: 'failed',
          error_message: err.message,
          finished_at: new Date()
        }).where(eq(fileIngestionRuns.id, run.id));
        
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Processing failed: ${err.message}` });
      }
      
      const { sql } = await import("drizzle-orm");
      const [stats] = await db.select({
         sheetsCount: sql<number>`cast(count(distinct ${fileSheets.id}) as integer)`,
         cellsCount: sql<number>`cast(count(${fileCells.id}) as integer)`
      }).from(fileSheets)
      .leftJoin(fileCells, eq(fileCells.sheet_id, fileSheets.id))
      .where(eq(fileSheets.file_id, newFile.id));

      const [finalFile] = await db.select().from(uploadedFiles).where(eq(uploadedFiles.id, newFile.id));
      const [finalRun] = await db.select().from(fileIngestionRuns).where(eq(fileIngestionRuns.id, run.id));

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
    updateRecord: adminProcedure.input(z.object({ id: z.number().int().positive(), data: z.record(z.string(), z.any()) })).mutation(async ({ input }) => {
      const success = await updateStoredInventoryRecord(input.id, input.data);
      if (!success) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update record" });
      return { success: true };
    }),
    addRecord: adminProcedure.input(z.record(z.string(), z.any())).mutation(async ({ input }) => {
      const { addStoredInventoryRecord } = await import("./inventoryDb");
      // Required fields at minimum
      if (!input.routerName) throw new TRPCError({ code: "BAD_REQUEST", message: "Router Name is required" });
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
      const success = await addStoredInventoryRecord(data as any);
      if (!success) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to add record" });
      return { success: true };
    }),
    deleteRecord: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const { deleteStoredInventoryRecord } = await import("./inventoryDb");
      const success = await deleteStoredInventoryRecord(input.id);
      if (!success) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete record" });
      return { success: true };
    }),
  }),
  report: router({ migration: protectedProcedure.input(z.object({ language: z.enum(["ar", "en"]).default("en"), from: z.string().datetime().optional(), to: z.string().datetime().optional() })).query(({ input }) => getMigrationReport(input.language, { from: input.from ? new Date(input.from) : undefined, to: input.to ? new Date(input.to) : undefined })) }),
  audit: router({ list: adminProcedure.input(z.object({ userName: z.string().optional(), action: z.string().optional(), limit: z.number().int().positive().max(500).optional() }).optional()).query(({ input }) => listAuditLogs(input ?? {})) }),
  admin: router({
    aiHistory: adminProcedure.query(async () => {
      const { getAllAiMessages } = await import("./aiHistory");
      return getAllAiMessages();
    }),
    users: adminProcedure.query(() => listUsers()),
    createUser: adminProcedure.input(z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(6), role: z.enum(["admin", "user"]) })).mutation(async ({ input }) => {
      const { createClient } = require("@supabase/supabase-js");
      const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
      const { data, error } = await supabase.auth.signUp({ email: input.email, password: input.password });
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      if (!data.user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user in Supabase" });
      await import("./db").then(db => db.upsertUser({ openId: data.user!.id, name: input.name, email: input.email, role: input.role, loginMethod: "supabase" }));
      return { success: true };
    }),
    updateRole: adminProcedure.input(z.object({ userId: z.number().int().positive(), role: z.enum(["admin", "user"]) })).mutation(({ input, ctx }) => updateUserRole(input.userId, input.role, { id: ctx.user.id, name: ctx.user.name })),
    deleteUser: adminProcedure.input(z.object({ userId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      const { deleteUser } = await import("./adminDb");
      return deleteUser(input.userId, { id: ctx.user.id, name: ctx.user.name });
    }),
  }),
  onedrive: router({
    status: protectedProcedure.query(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const { userOauthConnections } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const existing = await db.select().from(userOauthConnections).where(eq(userOauthConnections.userId, ctx.user.id)).limit(1);
      return existing.length > 0 ? { connected: true, email: existing[0].accountEmail } : { connected: false };
    }),
    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const { userOauthConnections } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      await db.delete(userOauthConnections).where(eq(userOauthConnections.userId, ctx.user.id));
      return { success: true };
    }),
    listFiles: protectedProcedure.input(z.object({ folderId: z.string().optional() })).query(async ({ ctx, input }) => {
      const { getDb } = await import("./db");
      const { userOauthConnections } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const existing = await db.select().from(userOauthConnections).where(eq(userOauthConnections.userId, ctx.user.id)).limit(1);
      
      if (existing.length === 0 || !existing[0].accessToken) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Microsoft OneDrive is not connected" });
      }
      
      const endpoint = input.folderId 
        ? `https://graph.microsoft.com/v1.0/me/drive/items/${input.folderId}/children`
        : `https://graph.microsoft.com/v1.0/me/drive/root/children`;
        
      let res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${existing[0].accessToken}` }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          const { refreshMicrosoftToken } = await import("./microsoftOAuth");
          const newAccessToken = await refreshMicrosoftToken(ctx.user.id, db);
          if (newAccessToken) {
             const retryRes = await fetch(endpoint, {
               headers: { Authorization: `Bearer ${newAccessToken}` }
             });
             if (retryRes.ok) {
                res = retryRes; // Swap response
             } else {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "Token expired, please reconnect" });
             }
          } else {
             throw new TRPCError({ code: "UNAUTHORIZED", message: "Token expired, please reconnect" });
          }
        } else {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch files from Microsoft" });
        }
      }
      
      const { onedriveFiles } = await import("../drizzle/schema");
      
      const data = await res.json();
      const driveItems = data.value;
      
      // Get statuses from our DB
      const dbFiles = await db.select().from(onedriveFiles).where(eq(onedriveFiles.userId, ctx.user.id));
      const dbFileMap = new Map(dbFiles.map(f => [f.driveItemId, f]));
      
      return driveItems.map((item: any) => {
        const dbMeta = dbFileMap.get(item.id);
        return {
          ...item,
          syncStatus: dbMeta?.status || "discovered",
          sheetCount: dbMeta?.sheetCount || 0,
          indexedRows: dbMeta?.indexedRows || 0,
          lastSyncTime: dbMeta?.lastSyncTime,
          lastError: dbMeta?.lastError,
        };
      });
    }),
    syncFile: protectedProcedure.input(z.object({ fileId: z.string(), fileName: z.string() })).mutation(async ({ ctx, input }) => {
      const { getDb } = await import("./db");
      const { onedriveFiles, userOauthConnections } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const { indexOneDriveFileBackground } = await import("./onedriveIndexer");
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const existing = await db.select().from(userOauthConnections).where(eq(userOauthConnections.userId, ctx.user.id)).limit(1);
      if (existing.length === 0 || !existing[0].accessToken) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Microsoft OneDrive is not connected" });
      }
      
      // Upsert into DB with status "syncing"
      const existingFile = await db.select().from(onedriveFiles).where(eq(onedriveFiles.driveItemId, input.fileId)).limit(1);
      if (existingFile.length > 0) {
        await db.update(onedriveFiles).set({ status: "syncing", lastError: null }).where(eq(onedriveFiles.id, existingFile[0].id));
      } else {
        await db.insert(onedriveFiles).values({
          userId: ctx.user.id,
          driveItemId: input.fileId,
          name: input.fileName,
          status: "syncing"
        });
      }
      
      // Start background task
      indexOneDriveFileBackground(input.fileId, existing[0].accessToken).catch(console.error);
      
      return { success: true, status: "syncing" };
    }),
    dumpAi: publicProcedure.query(async () => {
      const fs = await import("fs");
      return fs.readFileSync("server/ai2.ts", "utf-8");
    }),
    removeSync: protectedProcedure.input(z.object({ fileId: z.string() })).mutation(async ({ ctx, input }) => {
      const { getDb } = await import("./db");
      const { onedriveFiles, onedriveIndexedData } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      await db.delete(onedriveFiles).where(eq(onedriveFiles.driveItemId, input.fileId));
      await db.delete(onedriveIndexedData).where(eq(onedriveIndexedData.driveItemId, input.fileId));
      
      return { success: true };
    }),
    debugSearch: protectedProcedure.input(z.object({ fileId: z.string(), q: z.string(), sheetName: z.string().optional(), limit: z.number().optional() })).query(async ({ ctx, input }) => {
      const { getDb } = await import("./db");
      const { onedriveIndexedData } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const debugResult = {
        all_indexed_cells_in_db: 0,
        cells_filtered_by_drive_item_id: 0,
        non_empty_cells: 0,
        raw_text_matches: 0,
        normalized_text_matches: 0,
        sheet_matches: 0,
        final_matches: 0,
        drop_reason: "",
        matches_per_sheet: {} as Record<string, number>,
        searched_cells: 0,
        matched_cells: 0,
        matches: [] as any[]
      };

      const allTableData = await db.select().from(onedriveIndexedData);
      debugResult.all_indexed_cells_in_db = allTableData.length;

      let fileData = allTableData.filter(r => r.driveItemId === input.fileId);
      debugResult.cells_filtered_by_drive_item_id = fileData.length;
      
      if (fileData.length === 0) {
        debugResult.drop_reason = `No rows found with driveItemId = ${input.fileId}. The file might not be indexed correctly or you are passing an incorrect ID.`;
        return debugResult;
      }

      const normalizeText = (text: string) => {
        if (!text) return "";
        return String(text)
          .normalize("NFC")
          .toLowerCase()
          .replace(/[أإآ]/g, 'ا')
          .replace(/[ًٌٍَُِّْـ]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
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

export type AppRouter = typeof appRouter;
