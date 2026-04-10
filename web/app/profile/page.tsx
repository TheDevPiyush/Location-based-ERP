"use client";

import { useEffect, useRef, useState } from "react";
import { fetchMe, setCurrentUser, updateProfile } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { useToast } from "@/app/components/ui/use-toast";
import { Spinner } from "@/app/components/ui/spinner";
import { Badge } from "@/app/components/ui/badge";
import { Camera, User } from "lucide-react";

export default function ProfilePage() {
  const [me, setMe] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchMe();
        setMe(data);
        setName(data?.name || "");
        setEmail(data?.email || "");
      } catch {
        /* handled by layout */
      }
    })();
  }, []);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateProfile({ name, email });
      setMe(updated);
      setCurrentUser(updated);
      toast({
        title: "Success",
        description: "Profile updated successfully",
        variant: "success" as any,
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await updateProfile({ profile_picture: file });
      setMe(updated);
      setCurrentUser(updated);
      toast({
        title: "Success",
        description: "Profile picture updated",
        variant: "success" as any,
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to upload picture",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const initials = (name || email || "A")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  const profilePicture = me?.profile_picture || me?.image_url;

  if (!me) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage your admin profile information.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center pt-8 pb-6">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-secondary text-2xl font-semibold transition-all hover:border-primary/50 disabled:opacity-50"
            >
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-muted-foreground">{initials}</span>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                <Camera className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Spinner size="md" className="border-white/40 border-t-white" />
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              {me?.name || "Admin"}
            </h3>
            <p className="text-sm text-muted-foreground">{me?.email}</p>
            <div className="mt-3 flex gap-2">
              <Badge variant="secondary" className="capitalize">
                {me?.role || "admin"}
              </Badge>
              {me?.batch?.name && (
                <Badge variant="outline">{me.batch.name}</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Account Details</CardTitle>
            <CardDescription>
              Update your profile information below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSave} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={me?.role || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Batch</Label>
                  <Input
                    value={me?.batch?.name || "N/A"}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <span className="text-xs text-muted-foreground">
                  Last updated:{" "}
                  {me?.updated_at
                    ? new Date(me.updated_at).toLocaleString()
                    : "N/A"}
                </span>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
