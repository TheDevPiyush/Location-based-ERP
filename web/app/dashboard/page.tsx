"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchMe,
  fetchBatches,
  fetchSubjects,
  fetchStudentsByBatch,
  getWindow,
  upsertWindow,
  fetchAttendanceAnalytics,
} from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Users,
  BookOpen,
  GraduationCap,
  CalendarClock,
  ArrowRight,
  BarChart3,
  Radio,
} from "lucide-react";

type Batch = { id: string; name: string };
type Subject = { id: string; name: string; batchId: string };

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [me, setMe] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState<any>(null);

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

        const today = new Date().toISOString().split("T")[0];
        try {
          const stats = await fetchAttendanceAnalytics({
            start_date: today,
            end_date: today,
          });
          setTodayStats(stats);
        } catch {
          /* analytics may fail if no data */
        }
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const displayName = me?.name || me?.email || "Admin";
  const todayPresent = todayStats?.summary?.total_present ?? 0;
  const todayClasses = todayStats?.summary?.total_classes ?? 0;
  const todayPercentage = todayStats?.summary?.overall_percentage ?? 0;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome back, {displayName.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s an overview of today&apos;s attendance and campus activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Total Batches
            </p>
            <GraduationCap className="h-5 w-5 text-muted-foreground/60" />
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {batches.length}
          </p>
        </div>

        <div className="stat-card stat-card--success">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Total Subjects
            </p>
            <BookOpen className="h-5 w-5 text-muted-foreground/60" />
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {subjects.length}
          </p>
        </div>

        <div className="stat-card stat-card--warning">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Today&apos;s Present
            </p>
            <Users className="h-5 w-5 text-muted-foreground/60" />
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {todayPresent}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            across {todayClasses} class{todayClasses !== 1 ? "es" : ""}
          </p>
        </div>

        <div className="stat-card stat-card--destructive">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Today&apos;s Rate
            </p>
            <BarChart3 className="h-5 w-5 text-muted-foreground/60" />
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {todayPercentage}%
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            attendance rate
          </p>
        </div>
      </div>

      {/* Quick Actions + Attendance Window */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/attendance">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  Open Attendance Window
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/analytics">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  View Analytics
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/manage">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Manage Campus
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Attendance Window Control */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  Attendance Window
                </CardTitle>
                <CardDescription>
                  Quickly open a window for a class session
                </CardDescription>
              </div>
              <Radio className="h-5 w-5 text-muted-foreground/50" />
            </div>
          </CardHeader>
          <CardContent>
            <AttendanceWindowQuick
              subjects={subjects}
              batches={batches}
              toast={toast}
            />
          </CardContent>
        </Card>
      </div>

      {/* Today's Attendance Breakdown */}
      {todayStats?.daily_attendance?.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Today&apos;s Attendance Breakdown
              </CardTitle>
              <Link href="/analytics">
                <Button variant="ghost" size="sm">
                  View Full Analytics
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Present
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Absent
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {todayStats.daily_attendance.map((day: any) => {
                    const total = day.total_classes || day.present + day.absent;
                    const pct =
                      total > 0
                        ? ((day.present / total) * 100).toFixed(1)
                        : "0.0";
                    return (
                      <tr
                        key={day.date}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-3">
                          {new Date(day.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-3">
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700"
                          >
                            {day.present}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700"
                          >
                            {day.absent}
                          </Badge>
                        </td>
                        <td className="py-3 font-medium">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AttendanceWindowQuick({
  subjects,
  batches,
  toast,
}: {
  subjects: Subject[];
  batches: Batch[];
  toast: any;
}) {
  const [batchId, setBatchId] = useState<string | undefined>();
  const [subjectId, setSubjectId] = useState<string | undefined>();
  const [durationSec, setDurationSec] = useState<number>(60);
  const [windowInfo, setWindowInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [remainingSec, setRemainingSec] = useState(0);
  const countdownRefreshTriggered = useRef(false);

  const filteredSubjects = useMemo(
    () => subjects.filter((s) => (batchId ? s.batchId === batchId : true)),
    [subjects, batchId]
  );

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

  const formatMMSS = (total: number) => {
    const m = String(Math.floor(total / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const openWindow = async () => {
    if (!batchId || !subjectId) return;
    setLoading(true);
    try {
      const res = await upsertWindow({
        target_batch: batchId,
        target_subject: subjectId,
        is_active: true,
        duration: durationSec,
      });
      setWindowInfo(res);
      toast({
        title: "Success",
        description: "Attendance window opened",
        variant: "success" as any,
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to open window",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const closeWindow = async () => {
    if (!batchId || !subjectId) return;
    setLoading(true);
    try {
      const res = await upsertWindow({
        target_batch: batchId,
        target_subject: subjectId,
        is_active: false,
      });
      setWindowInfo(res);
      toast({
        title: "Success",
        description: "Attendance window closed",
        variant: "success" as any,
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to close window",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Batch</Label>
          <Select
            value={batchId}
            onValueChange={(v) => setBatchId(v || undefined)}
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
        <div className="space-y-1.5">
          <Label className="text-xs">Subject</Label>
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
        <div className="space-y-1.5">
          <Label className="text-xs">Duration</Label>
          <Select
            value={String(durationSec)}
            onValueChange={(v) => setDurationSec(Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 sec</SelectItem>
              <SelectItem value="60">1 min</SelectItem>
              <SelectItem value="120">2 min</SelectItem>
              <SelectItem value="300">5 min</SelectItem>
              <SelectItem value="600">10 min</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={openWindow}
          disabled={loading || !batchId || !subjectId}
        >
          {loading ? <Spinner size="sm" className="mr-2" /> : null}
          Open Window
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={closeWindow}
          disabled={loading || !batchId || !subjectId}
        >
          Close Window
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => refreshWindow(batchId, subjectId)}
        >
          Refresh
        </Button>
      </div>

      {windowInfo && (
        <div className="rounded-lg border bg-secondary/50 p-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${windowInfo.isActive ? "bg-green-500" : "bg-gray-400"}`}
              />
              <span className="font-medium">
                {windowInfo.isActive ? "Active" : "Closed"}
              </span>
            </div>
            {windowInfo.isActive && (
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {formatMMSS(remainingSec)}
              </span>
            )}
          </div>
          {windowInfo.isActive && windowInfo.duration && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{
                  width: `${Math.min(100, ((windowInfo.duration - remainingSec) / windowInfo.duration) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
