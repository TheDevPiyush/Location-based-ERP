"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchMe,
  fetchBatches,
  fetchSubjects,
  fetchStudentsByBatch,
  getWindow,
  upsertWindow,
} from "@/lib/api";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Spinner } from "@/app/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  CalendarClock,
  Play,
  Square,
  RefreshCw,
  Users,
  Timer,
} from "lucide-react";

type Batch = { id: string; name: string };
type Subject = { id: string; name: string; batchId: string };
type Student = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
};

export default function AttendancePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [me, setMe] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Window control state
  const [batchId, setBatchId] = useState<string | undefined>();
  const [subjectId, setSubjectId] = useState<string | undefined>();
  const [durationSec, setDurationSec] = useState<number>(60);
  const [windowInfo, setWindowInfo] = useState<any>(null);
  const [windowLoading, setWindowLoading] = useState(false);
  const [remainingSec, setRemainingSec] = useState(0);
  const countdownRefreshTriggered = useRef(false);

  // Student list
  const [studentsInBatch, setStudentsInBatch] = useState<Student[]>([]);
  const [studentLoading, setStudentLoading] = useState(false);

  const filteredSubjects = useMemo(
    () => subjects.filter((s) => (batchId ? s.batchId === batchId : true)),
    [subjects, batchId]
  );

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [meRes, subs, bats] = await Promise.all([
          fetchMe(),
          fetchSubjects(),
          fetchBatches(),
        ]);
        setMe(meRes);
        setSubjects(subs as any);
        setBatches(bats as any);
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // Fetch window when batch/subject change
  const refreshWindow = async (b?: string, s?: string) => {
    if (!b || !s) return;
    try {
      const w = await getWindow(b, s);
      setWindowInfo(w);
    } catch {
      setWindowInfo(null);
    }
  };

  useEffect(() => {
    refreshWindow(batchId, subjectId);
  }, [batchId, subjectId]);

  // Countdown logic (API returns Drizzle camelCase: isActive, startTime)
  useEffect(() => {
    const computeRemaining = () => {
      if (!windowInfo?.isActive) return 0;
      const dur = Number(windowInfo?.duration ?? 0);
      const start = windowInfo?.startTime
        ? new Date(windowInfo.startTime).getTime()
        : NaN;
      if (!dur || Number.isNaN(start)) return 0;
      return Math.max(0, dur - Math.floor((Date.now() - start) / 1000));
    };
    setRemainingSec(computeRemaining());
    if (!windowInfo?.isActive) return;
    const timer = setInterval(() => setRemainingSec(computeRemaining()), 1000);
    return () => clearInterval(timer);
  }, [
    windowInfo?.id,
    windowInfo?.isActive,
    windowInfo?.duration,
    windowInfo?.startTime,
  ]);

  useEffect(() => {
    if (!windowInfo?.isActive) {
      countdownRefreshTriggered.current = false;
      return;
    }
    if (remainingSec === 0 && !countdownRefreshTriggered.current) {
      countdownRefreshTriggered.current = true;
      refreshWindow(batchId, subjectId);
    } else if (remainingSec > 0) {
      countdownRefreshTriggered.current = false;
    }
  }, [remainingSec, windowInfo?.isActive, batchId, subjectId]);

  // Fetch students when batch changes
  useEffect(() => {
    (async () => {
      if (!batchId) {
        setStudentsInBatch([]);
        return;
      }
      try {
        setStudentLoading(true);
        const studs = await fetchStudentsByBatch(batchId);
        setStudentsInBatch(studs as any);
      } catch {
        setStudentsInBatch([]);
      } finally {
        setStudentLoading(false);
      }
    })();
  }, [batchId]);

  const formatMMSS = (total: number) => {
    const m = String(Math.floor(total / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const openWindow = async () => {
    if (!batchId || !subjectId) return;
    setWindowLoading(true);
    try {
      const res = await upsertWindow({
        target_batch: batchId,
        target_subject: subjectId,
        is_active: true,
        duration: durationSec,
      });
      setWindowInfo(res);
      toast({
        title: "Window Opened",
        description: "Students can now mark their attendance.",
        variant: "success" as any,
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to open window",
        variant: "destructive",
      });
    } finally {
      setWindowLoading(false);
    }
  };

  const closeWindow = async () => {
    if (!batchId || !subjectId) return;
    setWindowLoading(true);
    try {
      const res = await upsertWindow({
        target_batch: batchId,
        target_subject: subjectId,
        is_active: false,
      });
      setWindowInfo(res);
      toast({
        title: "Window Closed",
        description: "Attendance window has been closed.",
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to close window",
        variant: "destructive",
      });
    } finally {
      setWindowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Attendance Management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Open and manage attendance windows for your classes. Students will mark
          their attendance through the mobile app.
        </p>
      </div>

      {/* Window Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarClock className="h-5 w-5 text-primary" />
                Attendance Window
              </CardTitle>
              <CardDescription>
                Select a batch and subject to manage the attendance window.
              </CardDescription>
            </div>
            {windowInfo?.isActive && (
              <Badge className="bg-green-100 text-green-800">
                <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500 inline-block" />
                Live
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Batch</Label>
              <Select
                value={batchId}
                onValueChange={(v) => {
                  setBatchId(v || undefined);
                  setSubjectId(undefined);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name || `Batch ${b.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select
                value={subjectId}
                onValueChange={(v) => setSubjectId(v || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select
                value={String(durationSec)}
                onValueChange={(v) => setDurationSec(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="120">2 minutes</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                  <SelectItem value="600">10 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={openWindow}
              disabled={windowLoading || !batchId || !subjectId}
              className="gap-2"
            >
              {windowLoading ? (
                <Spinner size="sm" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Open Window
            </Button>
            <Button
              variant="outline"
              onClick={closeWindow}
              disabled={windowLoading || !batchId || !subjectId}
              className="gap-2"
            >
              <Square className="h-4 w-4" />
              Close Window
            </Button>
            <Button
              variant="ghost"
              onClick={() => refreshWindow(batchId, subjectId)}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Window Status */}
          {windowInfo ? (
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-3 w-3 rounded-full ${windowInfo.isActive ? "bg-green-500" : "bg-gray-400"}`}
                  />
                  <div>
                    <p className="text-sm font-medium">
                      Window #{windowInfo.id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {windowInfo.isActive
                        ? "Students can mark attendance now"
                        : "Window is closed"}
                    </p>
                  </div>
                </div>
                {windowInfo.isActive && (
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-primary" />
                    <span className="text-lg font-bold tabular-nums text-primary">
                      {formatMMSS(remainingSec)}
                    </span>
                  </div>
                )}
              </div>
              {windowInfo.isActive && windowInfo.duration && (
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-1000"
                    style={{
                      width: `${Math.min(100, ((windowInfo.duration - remainingSec) / windowInfo.duration) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          ) : batchId && subjectId ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No active window. Click &ldquo;Open Window&rdquo; when you&apos;re
              ready to start.
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Students in Selected Batch */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Students in Batch
              </CardTitle>
              <CardDescription>
                {batchId
                  ? `Viewing students enrolled in the selected batch`
                  : "Select a batch to see enrolled students"}
              </CardDescription>
            </div>
            {!studentLoading && batchId && (
              <Badge variant="secondary">
                {studentsInBatch.length} student
                {studentsInBatch.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {studentLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : !batchId ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Select a batch above to view its students.
            </div>
          ) : studentsInBatch.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No students found in this batch.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsInBatch.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">
                        {s.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {s.name || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.email || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
