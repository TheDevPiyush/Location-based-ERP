"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchMe,
  fetchUniversities,
  fetchCourses,
  fetchBatches,
  fetchSubjects,
  fetchUsersAll,
  createUniversity,
  createCourse,
  createBatch,
  createSubject,
  createUser,
  createMultipleUsers,
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
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Spinner } from "@/app/components/ui/spinner";
import {
  Building2,
  GraduationCap,
  Users,
  BookOpen,
  Plus,
  Upload,
  Filter,
} from "lucide-react";

export default function ManagePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [universities, setUniversities] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [universityId, setUniversityId] = useState<string | undefined>();
  const [courseId, setCourseId] = useState<string | undefined>();
  const [batchId, setBatchId] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const meRes = await fetchMe();
        setMe(meRes);
        if (meRes?.role === "student") {
          router.replace("/dashboard");
          return;
        }
        const [unis, crs, bats, subs] = await Promise.all([
          fetchUniversities(),
          fetchCourses(),
          fetchBatches(),
          fetchSubjects(),
        ]);
        setUniversities(unis as any[]);
        setCourses(crs as any[]);
        setBatches(bats as any[]);
        setSubjects(subs as any[]);
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const filteredCourses = useMemo(
    () =>
      courses.filter((c) =>
        universityId ? c.universityId === universityId : true
      ),
    [courses, universityId]
  );
  const filteredBatches = useMemo(
    () => batches.filter((b) => (courseId ? b.courseId === courseId : true)),
    [batches, courseId]
  );
  const filteredSubjects = useMemo(
    () => subjects.filter((s) => (batchId ? s.batchId === batchId : true)),
    [subjects, batchId]
  );

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
          Campus Management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create and manage universities, courses, batches, subjects, and
          students.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Universities
            </p>
            <Building2 className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <p className="mt-2 text-2xl font-bold">{universities.length}</p>
        </div>
        <div className="stat-card stat-card--success">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Courses</p>
            <GraduationCap className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <p className="mt-2 text-2xl font-bold">{courses.length}</p>
        </div>
        <div className="stat-card stat-card--warning">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Batches</p>
            <Users className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <p className="mt-2 text-2xl font-bold">{batches.length}</p>
        </div>
        <div className="stat-card stat-card--destructive">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Subjects
            </p>
            <BookOpen className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <p className="mt-2 text-2xl font-bold">{subjects.length}</p>
        </div>
      </div>

      {/* Hierarchy Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-primary" />
            Filter by Hierarchy
          </CardTitle>
          <CardDescription>
            Narrow down to focus on specific parts of your campus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">University</Label>
              <Select
                value={universityId || "all"}
                onValueChange={(v) =>
                  setUniversityId(v === "all" ? undefined : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All universities</SelectItem>
                  {universities.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Course</Label>
              <Select
                value={courseId || "all"}
                onValueChange={(v) =>
                  setCourseId(v === "all" ? undefined : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All courses</SelectItem>
                  {filteredCourses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Batch</Label>
              <Select
                value={batchId || "all"}
                onValueChange={(v) =>
                  setBatchId(v === "all" ? undefined : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All batches</SelectItem>
                  {filteredBatches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name || b.code || `#${b.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Forms Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CreateUniversityForm
          onCreated={(u) => {
            setUniversities([u, ...universities]);
            toast({
              title: "Success",
              description: "University created",
              variant: "success" as any,
            });
          }}
          toast={toast}
        />
        <CreateCourseForm
          universities={universities}
          defaultUniversityId={universityId}
          onCreated={(c) => {
            setCourses([c, ...courses]);
            toast({
              title: "Success",
              description: "Course created",
              variant: "success" as any,
            });
          }}
          toast={toast}
        />
        <CreateBatchForm
          courses={filteredCourses.length ? filteredCourses : courses}
          defaultCourseId={courseId}
          onCreated={(b) => {
            setBatches([b, ...batches]);
            toast({
              title: "Success",
              description: "Batch created",
              variant: "success" as any,
            });
          }}
          toast={toast}
        />
        <CreateSubjectForm
          batches={filteredBatches.length ? filteredBatches : batches}
          defaultBatchId={batchId}
          onCreated={(s) => {
            setSubjects([s, ...subjects]);
            toast({
              title: "Success",
              description: "Subject created",
              variant: "success" as any,
            });
          }}
          toast={toast}
        />
      </div>

      {/* Student Management (admin only) */}
      {me?.role === "admin" && (
        <div className="space-y-6">
          <CreateStudentForm
            batches={filteredBatches.length ? filteredBatches : batches}
            defaultBatchId={batchId}
            toast={toast}
          />
          <CSVImportForm
            batches={filteredBatches.length ? filteredBatches : batches}
            defaultBatchId={batchId}
            toast={toast}
          />
        </div>
      )}
    </div>
  );
}

function CreateUniversityForm({
  onCreated,
  toast,
}: {
  onCreated: (u: any) => void;
  toast: any;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await createUniversity({
        name,
        code: code || null,
        address: address || null,
      });
      onCreated(u);
      setName("");
      setCode("");
      setAddress("");
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to create university",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4 text-primary" />
          Add University
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input
                placeholder="University name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Code</Label>
              <Input
                placeholder="Unique code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Address (optional)</Label>
            <Input
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <Button size="sm" disabled={loading} type="submit" className="gap-2">
            {loading ? <Spinner size="sm" /> : <Plus className="h-3.5 w-3.5" />}
            Create University
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CreateCourseForm({
  universities,
  defaultUniversityId,
  onCreated,
  toast,
}: {
  universities: any[];
  defaultUniversityId?: string;
  onCreated: (c: any) => void;
  toast: any;
}) {
  const [university, setUniversity] = useState<string | undefined>(
    defaultUniversityId
  );
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUniversity(defaultUniversityId);
  }, [defaultUniversityId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!university) {
      toast({
        title: "Error",
        description: "Select a university",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const c = await createCourse({ university, code: code || null });
      onCreated(c);
      setCode("");
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to create course",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GraduationCap className="h-4 w-4 text-primary" />
          Add Course
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">University</Label>
            <Select
              value={university}
              onValueChange={(v) => setUniversity(v || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select university" />
              </SelectTrigger>
              <SelectContent>
                {universities.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Course Code</Label>
            <Input
              placeholder="e.g., BCA, MCA"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <Button size="sm" disabled={loading} type="submit" className="gap-2">
            {loading ? <Spinner size="sm" /> : <Plus className="h-3.5 w-3.5" />}
            Create Course
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CreateBatchForm({
  courses,
  defaultCourseId,
  onCreated,
  toast,
}: {
  courses: any[];
  defaultCourseId?: string;
  onCreated: (b: any) => void;
  toast: any;
}) {
  const [course, setCourse] = useState<string | undefined>(defaultCourseId);
  const [code, setCode] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCourse(defaultCourseId);
  }, [defaultCourseId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) {
      toast({
        title: "Error",
        description: "Select a course",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const b = await createBatch({
        course,
        code: code || null,
        start_year: startYear ? Number(startYear) : null,
        end_year: endYear ? Number(endYear) : null,
      });
      onCreated(b);
      setCode("");
      setStartYear("");
      setEndYear("");
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to create batch",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-primary" />
          Add Batch
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Course</Label>
            <Select
              value={course}
              onValueChange={(v) => setCourse(v || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Batch Code</Label>
            <Input
              placeholder="e.g., B1, A"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Start Year</Label>
              <Input
                type="number"
                placeholder="2024"
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">End Year</Label>
              <Input
                type="number"
                placeholder="2028"
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
                required
              />
            </div>
          </div>
          <Button size="sm" disabled={loading} type="submit" className="gap-2">
            {loading ? <Spinner size="sm" /> : <Plus className="h-3.5 w-3.5" />}
            Create Batch
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CreateSubjectForm({
  batches,
  defaultBatchId,
  onCreated,
  toast,
}: {
  batches: any[];
  defaultBatchId?: string;
  onCreated: (s: any) => void;
  toast: any;
}) {
  const [batch, setBatch] = useState<string | undefined>(defaultBatchId);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setBatch(defaultBatchId);
  }, [defaultBatchId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch) {
      toast({
        title: "Error",
        description: "Select a batch",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const s = await createSubject({ batch, code });
      onCreated(s);
      setCode("");
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to create subject",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4 text-primary" />
          Add Subject
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Batch</Label>
            <Select
              value={batch}
              onValueChange={(v) => setBatch(v || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name || b.code || `#${b.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Subject Code</Label>
            <Input
              placeholder="e.g., MATH101"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <Button size="sm" disabled={loading} type="submit" className="gap-2">
            {loading ? <Spinner size="sm" /> : <Plus className="h-3.5 w-3.5" />}
            Create Subject
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CreateStudentForm({
  batches,
  defaultBatchId,
  toast,
}: {
  batches: any[];
  defaultBatchId?: string;
  toast: any;
}) {
  const [batch, setBatch] = useState<string | undefined>(defaultBatchId);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setBatch(defaultBatchId);
  }, [defaultBatchId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch) {
      toast({
        title: "Error",
        description: "Select a batch",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await createUser({
        name: name || null,
        email,
        password,
        role: "student",
        batch,
      });
      setName("");
      setEmail("");
      setPassword("");
      toast({
        title: "Success",
        description: "Student created successfully",
        variant: "success" as any,
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to create student",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-primary" />
          Add Student
        </CardTitle>
        <CardDescription>
          Create a new student account and assign to a batch.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Batch</Label>
              <Select
                value={batch}
                onValueChange={(v) => setBatch(v || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name || b.code || `#${b.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Name (optional)</Label>
              <Input
                placeholder="Student name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Password</Label>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <Button size="sm" disabled={loading} type="submit" className="gap-2">
            {loading ? <Spinner size="sm" /> : <Plus className="h-3.5 w-3.5" />}
            Create Student
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CSVImportForm({
  batches,
  defaultBatchId,
  toast,
}: {
  batches: any[];
  defaultBatchId?: string;
  toast: any;
}) {
  const [batch, setBatch] = useState<string | undefined>(defaultBatchId);
  const [csvData, setCsvData] = useState<
    Array<{ name: string; email: string; password: string }>
  >([]);
  const [showPreview, setShowPreview] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setBatch(defaultBatchId);
  }, [defaultBatchId]);

  const parseCSV = (
    text: string
  ): Array<{ name: string; email: string; password: string }> => {
    const lines = text.trim().split("\n");
    if (lines.length < 2)
      throw new Error("CSV must have at least a header and one data row");

    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else current += char;
      }
      result.push(current.trim());
      return result;
    };

    const header = parseCSVLine(lines[0]).map((h) =>
      h.replace(/^"|"$/g, "").trim().toLowerCase()
    );
    const nameIdx = header.findIndex((h) => h === "name");
    const emailIdx = header.findIndex((h) => h === "email");
    const passwordIdx = header.findIndex((h) => h === "password");

    if (nameIdx === -1 || emailIdx === -1 || passwordIdx === -1) {
      throw new Error("CSV must have 'name', 'email', and 'password' columns");
    }

    const data: Array<{ name: string; email: string; password: string }> = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]).map((v) =>
        v.replace(/^"|"$/g, "").trim()
      );
      if (values.length < Math.max(nameIdx, emailIdx, passwordIdx) + 1)
        continue;
      const email = values[emailIdx] || "";
      const password = values[passwordIdx] || "";
      if (!email || !password) continue;
      data.push({ name: values[nameIdx] || "", email, password });
    }
    return data;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast({
          title: "Error",
          description: "No valid data in CSV",
          variant: "destructive",
        });
        return;
      }
      setCsvData(parsed);
      setShowPreview(true);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to parse CSV",
        variant: "destructive",
      });
    }
    e.target.value = "";
  };

  const handleCreate = async () => {
    if (!batch) {
      toast({
        title: "Error",
        description: "Select a batch",
        variant: "destructive",
      });
      return;
    }
    setProcessing(true);
    try {
      await createMultipleUsers(csvData);
      setShowPreview(false);
      setCsvData([]);
      toast({
        title: "Success",
        description: `${csvData.length} students created from CSV`,
        variant: "success" as any,
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to create students",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="h-4 w-4 text-primary" />
          Import Students from CSV
        </CardTitle>
        <CardDescription>
          Upload a CSV with name, email, and password columns to bulk-create
          students.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Batch</Label>
            <Select
              value={batch}
              onValueChange={(v) => setBatch(v || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name || b.code || `#${b.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">CSV File</Label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
              <Upload className="h-4 w-4" />
              Choose CSV file
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {showPreview && csvData.length > 0 && (
          <div className="space-y-4">
            <div className="rounded-lg border">
              <div className="max-h-60 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Password</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm">
                          {row.name || (
                            <span className="italic text-muted-foreground">
                              (empty)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{row.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {"*".repeat(Math.min(row.password.length, 8))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!batch || processing}
                className="gap-2"
              >
                {processing ? (
                  <Spinner size="sm" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Create {csvData.length} Student{csvData.length !== 1 ? "s" : ""}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowPreview(false);
                  setCsvData([]);
                }}
                disabled={processing}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
