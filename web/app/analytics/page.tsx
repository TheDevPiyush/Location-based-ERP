"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  fetchMe,
  fetchBatches,
  fetchSubjects,
  fetchStudentsByBatch,
  fetchAttendanceAnalytics,
  fetchMonthlyPercentage,
} from "@/lib/api";
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
import { Input } from "@/app/components/ui/input";
import { Spinner } from "@/app/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { useToast } from "@/app/components/ui/use-toast";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Filter,
  RefreshCw,
} from "lucide-react";

type Batch = { id: string; name: string };
type Subject = { id: string; name: string; batchId: string };
type Student = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
};

const CHART_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 76%, 36%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(262, 83%, 58%)",
];

export default function AnalyticsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // Filters
  const [selectedBatch, setSelectedBatch] = useState<string | undefined>();
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>();
  const [selectedStudent, setSelectedStudent] = useState<string | undefined>();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  // Data
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [monthlyPercentage, setMonthlyPercentage] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [, subs, bats] = await Promise.all([
          fetchMe(),
          fetchSubjects(),
          fetchBatches(),
        ]);
        setSubjects(subs as any);
        setBatches(bats as any);

        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        setEndDate(today.toISOString().split("T")[0]);
        setStartDate(thirtyDaysAgo.toISOString().split("T")[0]);
        setSelectedMonth(today.toISOString().slice(0, 7));
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // Fetch students when batch changes
  useEffect(() => {
    (async () => {
      if (!selectedBatch) {
        setStudents([]);
        return;
      }
      try {
        const studs = await fetchStudentsByBatch(selectedBatch);
        setStudents(studs as any);
      } catch {
        setStudents([]);
      }
    })();
  }, [selectedBatch]);

  const filteredSubjects = useMemo(
    () =>
      subjects.filter((s) => (selectedBatch ? s.batchId === selectedBatch : true)),
    [subjects, selectedBatch]
  );

  const loadAnalytics = async () => {
    if (!startDate || !endDate) return;
    setAnalyticsLoading(true);
    try {
      const params: any = { start_date: startDate, end_date: endDate };
      if (selectedBatch) params.batch_id = selectedBatch;
      if (selectedSubject) params.subject_id = selectedSubject;
      if (selectedStudent) params.student_id = selectedStudent;
      if (selectedMonth) params.month = selectedMonth;

      const data = await fetchAttendanceAnalytics(params);
      setDailyData(data.daily_attendance || []);
      setSummary(data.summary || null);
      setMonthlyPercentage(data.monthly_percentage || null);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to load analytics",
        variant: "destructive",
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadMonthlyData = async () => {
    if (!selectedMonth) return;
    setMonthlyLoading(true);
    try {
      const params: any = { month: selectedMonth };
      if (selectedBatch) params.batch_id = selectedBatch;
      if (selectedSubject) params.subject_id = selectedSubject;
      if (selectedStudent) params.student_id = selectedStudent;

      const data = await fetchMonthlyPercentage(params);
      setMonthlyData(data.data || []);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to load monthly data",
        variant: "destructive",
      });
    } finally {
      setMonthlyLoading(false);
    }
  };

  // Auto-load on filter change
  useEffect(() => {
    if (startDate && endDate) loadAnalytics();
  }, [
    startDate,
    endDate,
    selectedBatch,
    selectedSubject,
    selectedStudent,
    selectedMonth,
  ]);

  useEffect(() => {
    if (selectedMonth) loadMonthlyData();
  }, [selectedMonth, selectedBatch, selectedSubject, selectedStudent]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const chartData = dailyData.map((day) => ({
    date: new Date(day.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    present: day.present,
    absent: day.absent,
    total: day.total,
  }));

  const pieData = summary
    ? [
        { name: "Present", value: summary.total_present },
        { name: "Absent", value: summary.total_absent },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Attendance Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Detailed attendance statistics with daily breakdowns and monthly
          reports.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-primary" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div className="space-y-1.5">
              <Label className="text-xs">Batch</Label>
              <Select
                value={selectedBatch || "all"}
                onValueChange={(v) => {
                  setSelectedBatch(v === "all" ? undefined : v);
                  setSelectedSubject(undefined);
                  setSelectedStudent(undefined);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All batches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All batches</SelectItem>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Subject</Label>
              <Select
                value={selectedSubject || "all"}
                onValueChange={(v) =>
                  setSelectedSubject(v === "all" ? undefined : v)
                }
                disabled={!selectedBatch}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {filteredSubjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Student</Label>
              <Select
                value={selectedStudent || "all"}
                onValueChange={(v) =>
                  setSelectedStudent(v === "all" ? undefined : v)
                }
                disabled={!selectedBatch}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All students</SelectItem>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name || s.email || `Student #${s.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Month</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4">
            <Button
              size="sm"
              onClick={loadAnalytics}
              disabled={analyticsLoading}
              className="gap-2"
            >
              {analyticsLoading ? (
                <Spinner size="sm" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Refresh Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="stat-card stat-card--success">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Total Present
              </p>
              <Users className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {summary.total_present}
            </p>
          </div>
          <div className="stat-card stat-card--destructive">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Total Absent
              </p>
              <Users className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {summary.total_absent}
            </p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Total Classes
              </p>
              <Calendar className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <p className="mt-2 text-3xl font-bold">
              {summary.total_classes || 0}
            </p>
          </div>
          <div className="stat-card stat-card--warning">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Overall Rate
              </p>
              <TrendingUp className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <p className="mt-2 text-3xl font-bold text-primary">
              {summary.overall_percentage}%
            </p>
          </div>
        </div>
      )}

      {/* Monthly Overview */}
      {monthlyPercentage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Monthly Overview &mdash; {monthlyPercentage.month}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Total Classes
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {monthlyPercentage.total_classes}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Present
                </p>
                <p className="mt-1 text-2xl font-bold text-green-600">
                  {monthlyPercentage.present_count}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Absent
                </p>
                <p className="mt-1 text-2xl font-bold text-red-600">
                  {monthlyPercentage.absent_count}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Rate
                </p>
                <p className="mt-1 text-2xl font-bold text-primary">
                  {monthlyPercentage.percentage}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-primary" />
                Daily Attendance
              </CardTitle>
              <CardDescription>Present vs Absent by day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.5rem",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="present"
                    fill="hsl(142, 76%, 36%)"
                    name="Present"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="absent"
                    fill="hsl(0, 84%, 60%)"
                    name="Absent"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {pieData.length > 0 && pieData.some((d) => d.value > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overall Distribution</CardTitle>
              <CardDescription>Present vs Absent ratio</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) =>
                      `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                    strokeWidth={2}
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {chartData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                Attendance Trend
              </CardTitle>
              <CardDescription>
                Daily attendance pattern over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.5rem",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="present"
                    stroke="hsl(142, 76%, 36%)"
                    name="Present"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="absent"
                    stroke="hsl(0, 84%, 60%)"
                    name="Absent"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Daily Table */}
      {dailyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Breakdown</CardTitle>
            <CardDescription>
              Attendance details for each day in the selected range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead>Absent</TableHead>
                    <TableHead>Total Classes</TableHead>
                    <TableHead>Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyData.map((day) => {
                    const total =
                      day.total_classes || day.present + day.absent;
                    const pct =
                      total > 0
                        ? ((day.present / total) * 100).toFixed(1)
                        : "0.0";
                    return (
                      <TableRow key={day.date}>
                        <TableCell>
                          {new Date(day.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            {day.present}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200"
                          >
                            {day.absent}
                          </Badge>
                        </TableCell>
                        <TableCell>{total}</TableCell>
                        <TableCell>
                          <span
                            className={`text-sm font-semibold ${
                              Number(pct) >= 75
                                ? "text-green-600"
                                : Number(pct) >= 50
                                  ? "text-amber-600"
                                  : "text-red-600"
                            }`}
                          >
                            {pct}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Percentage Table */}
      {monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Monthly Report &mdash; Per Student
            </CardTitle>
            <CardDescription>
              Detailed breakdown by batch, subject, and student for{" "}
              {selectedMonth}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead>Classes</TableHead>
                      <TableHead>Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyData.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {item.batch.name}
                        </TableCell>
                        <TableCell>{item.subject.name}</TableCell>
                        <TableCell>
                          {item?.student?.name ||
                            item?.student?.email ||
                            `#${item.student?.id}`}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            {item.statistics.present}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200"
                          >
                            {item.statistics.absent}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.statistics.total_classes}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              item.statistics.percentage >= 75
                                ? "bg-green-100 text-green-800"
                                : item.statistics.percentage >= 50
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                            }
                          >
                            {item.statistics.percentage}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {dailyData.length === 0 && !analyticsLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              No attendance data found for the selected filters. Try adjusting
              your date range or filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
