"use client";

import { useState, useEffect, useRef } from "react";
import * as api from "@/lib/api";
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
import { Spinner } from "@/app/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import {
  FileText,
  Music,
  Video,
  Upload,
  Link2,
  Pin,
  Send,
  Plus,
  Trash2,
  Megaphone,
} from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  description?: string;
  announcement_type: "text" | "audio" | "video";
  text_content?: string;
  audio_url?: string;
  video_url?: string;
  created_by: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  is_published: boolean;
  is_pinned: boolean;
  published_at: string;
  expires_at?: string | null;
  created_at: string;
}

export default function AnnouncementsPage() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploading, setUploading] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    announcement_type: "text" as "text" | "audio" | "video",
    text_content: "",
    audio_url: "",
    video_url: "",
    is_published: true,
    is_pinned: false,
  });

  useEffect(() => {
    fetchAnnouncements();
    const user = api.getCurrentUserStored<any>();
    setIsAdmin(user?.is_staff || false);
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await api.getAnnouncements();
      setAnnouncements(Array.isArray(data) ? data : data.results || []);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load announcements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    });
  };

  const handleFileUpload = async (file: File, type: "audio" | "video") => {
    const valid =
      type === "audio" ? /^audio\//.test(file.type) : /^video\//.test(file.type);
    if (!valid) {
      toast({
        title: "Error",
        description: `Please select a valid ${type} file`,
        variant: "destructive",
      });
      return;
    }
    try {
      setUploading(true);
      const { url } = await api.uploadAnnouncementMedia(file);
      setFormData((prev) => ({
        ...prev,
        [type === "audio" ? "audio_url" : "video_url"]: url,
      }));
      toast({
        title: "Success",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded`,
        variant: "success" as any,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Upload failed",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }
    try {
      const type = formData.announcement_type;
      await api.createAnnouncement({
        title: formData.title,
        description: formData.description,
        announcement_type: type,
        text_content: type === "text" ? formData.text_content : undefined,
        audio_url: type === "audio" ? formData.audio_url : undefined,
        video_url: type === "video" ? formData.video_url : undefined,
        is_published: formData.is_published,
        is_pinned: formData.is_pinned,
      });
      toast({
        title: "Success",
        description: "Announcement created",
        variant: "success" as any,
      });
      setFormData({
        title: "",
        description: "",
        announcement_type: "text",
        text_content: "",
        audio_url: "",
        video_url: "",
        is_published: true,
        is_pinned: false,
      });
      setShowForm(false);
      fetchAnnouncements();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      await api.deleteAnnouncement(id);
      toast({
        title: "Success",
        description: "Announcement deleted",
        variant: "success" as any,
      });
      fetchAnnouncements();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Delete failed",
        variant: "destructive",
      });
    }
  };

  const typeOptions: {
    value: "text" | "audio" | "video";
    icon: typeof FileText;
    label: string;
  }[] = [
    { value: "text", icon: FileText, label: "Text" },
    { value: "audio", icon: Music, label: "Audio" },
    { value: "video", icon: Video, label: "Video" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Announcements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and broadcast announcements to your campus.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Announcement
          </Button>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                placeholder="Announcement title"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Optional description"
                rows={2}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <div className="flex gap-2">
                {typeOptions.map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, announcement_type: value })
                    }
                    className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                      formData.announcement_type === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {formData.announcement_type === "text" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Content</Label>
                <textarea
                  name="text_content"
                  value={formData.text_content}
                  onChange={handleFormChange}
                  placeholder="Write your announcement..."
                  rows={4}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            )}

            {formData.announcement_type === "audio" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Audio</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => audioInputRef.current?.click()}
                    disabled={uploading}
                    className="gap-2"
                  >
                    {uploading ? <Spinner size="sm" /> : <Upload className="h-4 w-4" />}
                    Upload
                  </Button>
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(f, "audio");
                      e.target.value = "";
                    }}
                  />
                  <div className="flex flex-1 items-center gap-2">
                    <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <Input
                      type="url"
                      name="audio_url"
                      value={formData.audio_url}
                      onChange={handleFormChange}
                      placeholder="Or paste URL"
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.announcement_type === "video" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Video</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploading}
                    className="gap-2"
                  >
                    {uploading ? <Spinner size="sm" /> : <Upload className="h-4 w-4" />}
                    Upload
                  </Button>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(f, "video");
                      e.target.value = "";
                    }}
                  />
                  <div className="flex flex-1 items-center gap-2">
                    <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <Input
                      type="url"
                      name="video_url"
                      value={formData.video_url}
                      onChange={handleFormChange}
                      placeholder="Or paste URL"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 pt-1">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={handleFormChange}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm">Publish now</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  name="is_pinned"
                  checked={formData.is_pinned}
                  onChange={handleFormChange}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <Pin className="h-3.5 w-3.5" />
                <span className="text-sm">Pin</span>
              </label>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={uploading} className="gap-2">
                {uploading ? <Spinner size="sm" /> : <Send className="h-4 w-4" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {/* Empty State */}
      {!loading && announcements.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Megaphone className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              No announcements yet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((a) => (
          <Card
            key={a.id}
            className={`border-l-4 ${a.is_pinned ? "border-l-amber-500" : "border-l-primary"}`}
          >
            <CardContent className="py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">
                      {a.title}
                    </h3>
                    {a.is_pinned && (
                      <Badge className="bg-amber-100 text-amber-800 gap-1">
                        <Pin className="h-3 w-3" />
                        Pinned
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={
                        a.announcement_type === "text"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : a.announcement_type === "audio"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                      }
                    >
                      {a.announcement_type === "text" && (
                        <FileText className="mr-1 h-3 w-3" />
                      )}
                      {a.announcement_type === "audio" && (
                        <Music className="mr-1 h-3 w-3" />
                      )}
                      {a.announcement_type === "video" && (
                        <Video className="mr-1 h-3 w-3" />
                      )}
                      {a.announcement_type}
                    </Badge>
                  </div>
                  {a.description && (
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {a.description}
                    </p>
                  )}
                </div>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(a.id)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Content */}
              {a.announcement_type === "text" && a.text_content && (
                <div className="mt-3 rounded-lg bg-secondary p-3 text-sm whitespace-pre-wrap">
                  {a.text_content}
                </div>
              )}
              {a.announcement_type === "audio" && a.audio_url && (
                <div className="mt-3">
                  <audio controls className="w-full">
                    <source src={a.audio_url} type="audio/mpeg" />
                  </audio>
                </div>
              )}
              {a.announcement_type === "video" && a.video_url && (
                <div className="mt-3 overflow-hidden rounded-lg bg-black">
                  <video controls className="w-full max-h-80">
                    <source src={a.video_url} type="video/mp4" />
                  </video>
                </div>
              )}

              <div className="mt-3 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                {a.created_by?.name || "Admin"} &middot;{" "}
                {new Date(a.published_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
