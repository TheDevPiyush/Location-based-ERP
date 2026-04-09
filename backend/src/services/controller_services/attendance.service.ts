import { db } from "../../db";
import { batches, subjects, attendanceWindows, attendanceRecords, users, courses, CollegeBoundries } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { uploadToS3, deleteFromS3 } from "../aws/s3.service";
import { compareFace } from "../aws/rekognition.service";

function isInsidePolygon(point: [number, number], polygon: [number, number][]) {
    const [px, py] = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i]!;
        const [xj, yj] = polygon[j]!;
        if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)
            inside = !inside;
    }
    return inside;
}

function isExpired(startTime: Date, durationSec: number) {
    return Date.now() > startTime.getTime() + durationSec * 1000;
}

function localDateString(timeZone = process.env.APP_TIMEZONE || "Asia/Kolkata") {
    // "en-CA" gives YYYY-MM-DD format.
    return new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
}

function today() {
    return localDateString() as string;
}

// ─── Window ───────────────────────────────────────────────────────────────────

export async function getActiveWindow(batchId: string, subjectId: string) {
    const [batch] = await db.select().from(batches).where(eq(batches.id, batchId)).limit(1);
    if (!batch) throw { status: 404, message: "Batch not found" };

    const [subject] = await db.select().from(subjects).where(eq(subjects.id, subjectId)).limit(1);
    if (!subject) throw { status: 404, message: "Subject not found" };
    if (subject.batchId !== batchId) throw { status: 400, message: "Subject does not belong to the provided batch" };

    const [window] = await db
        .select()
        .from(attendanceWindows)
        .where(and(
            eq(attendanceWindows.targetBatchId, batchId),
            eq(attendanceWindows.targetSubjectId, subjectId),
            eq(attendanceWindows.isActive, true),
        ))
        .orderBy(attendanceWindows.createdAt)
        .limit(1);

    if (!window) throw { status: 404, message: "Attendance window not found" };

    if (isExpired(window.startTime as Date, window.duration as number)) {
        await db.update(attendanceWindows).set({ isActive: false }).where(eq(attendanceWindows.id, window.id));
        throw { status: 400, message: "Attendance window is closed" };
    }

    return window;
}

export async function upsertWindow(batchId: string, subjectId: string, isActive: boolean, duration: number, userId: string) {
    const [batch] = await db.select().from(batches).where(eq(batches.id, batchId)).limit(1);
    if (!batch) throw { status: 404, message: "Batch not found" };

    const [subject] = await db.select().from(subjects).where(eq(subjects.id, subjectId)).limit(1);
    if (!subject) throw { status: 404, message: "Subject not found" };
    if (subject.batchId !== batchId) throw { status: 400, message: "Subject does not belong to the provided batch" };

    const resolvedDuration = Math.max(30, duration || 30);
    const date = today();

    const [existing] = await db
        .select()
        .from(attendanceWindows)
        .where(and(
            eq(attendanceWindows.targetBatchId, batchId),
            eq(attendanceWindows.targetSubjectId, subjectId),
            eq(attendanceWindows.date, date),
        ))
        .limit(1);

    if (existing) {
        const payload: any = { isActive, lastInteractedBy: userId };
        if (isActive) {
            payload.startTime = new Date();
            payload.duration = resolvedDuration;
        }
        const [updated] = await db
            .update(attendanceWindows)
            .set(payload)
            .where(eq(attendanceWindows.id, existing.id))
            .returning();
        return { window: updated, created: false };
    }

    const [inserted] = await db
        .insert(attendanceWindows)
        .values({
            targetBatchId: batchId,
            targetSubjectId: subjectId,
            date,
            startTime: new Date(),
            duration: resolvedDuration,
            isActive,
            lastInteractedBy: userId,
        })
        .returning();

    return { window: inserted, created: true };
}

// ─── Record ───────────────────────────────────────────────────────────────────

export async function markAttendanceRecord(opts: {
    windowId: string;
    file: Express.Multer.File;
    userId: string;
    userRole: string;
    latitude?: number | null;
    longitude?: number | null;
}) {
    const { windowId, file, userId, userRole, latitude, longitude } = opts;

    const [window] = await db.select().from(attendanceWindows).where(eq(attendanceWindows.id, windowId)).limit(1);
    if (!window) throw { status: 404, message: "Attendance window not found" };
    if (!window.isActive) throw { status: 400, message: "Attendance window is not active" };

    if (isExpired(window.startTime as Date, window.duration as number)) {
        await db.update(attendanceWindows).set({ isActive: false }).where(eq(attendanceWindows.id, window.id));
        throw { status: 400, message: "Attendance window is closed" };
    }

    // Upload photo → compare face → delete temp photo
    const imageResult = await uploadToS3(file, "attendance-temp");

    let match: any;
    try {
        match = await compareFace(process.env.AWS_S3_BUCKET!, imageResult.key);
    } finally {
        await deleteFromS3(imageResult.key).catch((e) => console.warn("Failed to delete temp photo:", e));
    }

    if (!match) throw { status: 403, message: "Face not recognised. Make sure you are registered, not wearing glasses, and close to the camera." };

    if (userRole === "student" && match.externalImageId !== userId) {
        throw { status: 403, message: "Face does not match your registered profile" };
    }

    const targetUserId = userRole === "student" ? userId : match.userId;
    if (!targetUserId) throw { status: 404, message: "Could not resolve matched user" };

    const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
    if (!targetUser) throw { status: 404, message: "Matched user not found" };
    if (!targetUser.faceRegistered) throw { status: 403, message: "Face not registered for this user. Contact admin." };
    if (targetUser.batchId !== window.targetBatchId) throw { status: 400, message: "User does not belong to the window's batch" };

    // Location check using live app coordinates + DB boundaries
    if (latitude == null || longitude == null) {
        throw { status: 400, message: "Live location is required to mark attendance" };
    }
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        throw { status: 400, message: "Invalid location coordinates" };
    }

    const [targetBatch] = await db
        .select()
        .from(batches)
        .where(eq(batches.id, window.targetBatchId!))
        .limit(1);
    if (!targetBatch?.courseId) {
        throw { status: 400, message: "Could not resolve batch/course for boundary validation" };
    }

    const [targetCourse] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, targetBatch.courseId))
        .limit(1);
    if (!targetCourse?.universityId) {
        throw { status: 400, message: "Could not resolve university for boundary validation" };
    }

    const boundaries = await db
        .select()
        .from(CollegeBoundries)
        .where(and(
            eq(CollegeBoundries.universityId, targetCourse.universityId),
            eq(CollegeBoundries.isActive, true),
        ));

    if (!boundaries.length) {
        throw { status: 400, message: "No active college boundaries configured for this university" };
    }

    const point: [number, number] = [longitude, latitude];
    const insideAnyBoundary = boundaries.some((b) => {
        const polygon = b.polygonCords as [number, number][] | null;
        if (!polygon || polygon.length < 3) return false;
        return isInsidePolygon(point, polygon);
    });
    if (!insideAnyBoundary) {
        throw { status: 400, message: "You are outside all configured college boundaries" };
    }

    // Upsert record
    const date = today();

    const [existing] = await db
        .select()
        .from(attendanceRecords)
        .where(and(
            eq(attendanceRecords.userId, targetUserId),
            eq(attendanceRecords.attendanceWindowId, windowId),
            eq(attendanceRecords.date, date),
        ))
        .limit(1);

    if (existing) {
        const [updated] = await db
            .update(attendanceRecords)
            .set({ status: "P", markedBy: userId })
            .where(eq(attendanceRecords.id, existing.id))
            .returning();
        return { record: updated, created: false, similarity: match.similarity };
    }

    const [inserted] = await db
        .insert(attendanceRecords)
        .values({ userId: targetUserId, attendanceWindowId: windowId, date, status: "P", markedBy: userId })
        .returning();

    return { record: inserted, created: true, similarity: match.similarity };
}