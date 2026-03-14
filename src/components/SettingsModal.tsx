"use client";

import React, { useRef, useState, useEffect } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { useTask } from "@/context/TaskContext";
import { useAuth } from "@/context/AuthContext";
import { useAI, AIPlatform } from "@/context/AIContext";
import { Bell, Download, Upload, Trash2, LogOut, ShieldAlert, Database, Bot, Sparkles } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, writeBatch, getDoc, updateDoc } from "firebase/firestore";
import { useConfirm } from "./ui/ConfirmDialog";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { tasks, templates, replaceAllTasks } = useTask();
  const { user, logout } = useAuth();
  const { aiEnabled, setAiEnabled, aiPlatform, setAiPlatform } = useAI();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPublic, setIsPublic] = React.useState(true);

  React.useEffect(() => {
    if (isOpen && user) {
      getDoc(doc(db, "users", user.uid)).then(snap => {
        if (snap.exists()) {
          setIsPublic(snap.data().isPublic ?? true);
        }
      });
    }
  }, [isOpen, user]);

  const togglePublicProfile = async (enabled: boolean) => {
    setIsPublic(enabled);
    if (user) {
      await updateDoc(doc(db, "users", user.uid), { isPublic: enabled });
    }
  };

  const handleBackup = () => {
    const data = {
      tasks,
      templates,
      version: 1,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rt-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.tasks || data.templates) {
          const confirmed = await confirm({
            title: "Restore backup data?",
            description: "This will overwrite all your current cloud data with the data from this backup file. This action cannot be undone.",
            confirmText: "Restore Data",
            cancelText: "Cancel",
            type: "warning"
          });

          if (confirmed) {
            if (Array.isArray(data.tasks)) {
              await replaceAllTasks(data.tasks);
            }

            if (data.templates && typeof data.templates === 'object') {
              const batch = writeBatch(db);
              Object.entries(data.templates).forEach(([name, tList]) => {
                const ref = doc(db, "users", user.uid, "templates", name);
                batch.set(ref, { tasks: tList });
              });
              await batch.commit();
            }
            onClose();
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClearData = async () => {
    if (!user) return;

    const confirmed = await confirm({
      title: "Clear ALL cloud data?",
      description: "This will permanently delete all your tasks and templates from the cloud. This action cannot be undone and your data will be lost forever.",
      confirmText: "Delete Everything",
      cancelText: "Keep My Data",
      type: "danger"
    });

    if (confirmed) {
      try {
        const batch = writeBatch(db);
        tasks.forEach(t => {
          batch.delete(doc(db, "users", user.uid, "tasks", t.id));
        });
        Object.keys(templates).forEach(name => {
          batch.delete(doc(db, "users", user.uid, "templates", name));
        });
        await batch.commit();
        onClose();
      } catch (error) {
        console.error(error);
      }
    }
  }

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [areNotificationsEnabled, setAreNotificationsEnabled] = useState(false);

  useEffect(() => {
    // Check permission
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
    // Check app-level preference
    try {
      const storedPref = localStorage.getItem("rt_notifications_enabled");
      setAreNotificationsEnabled(storedPref === "true");
    } catch (e) {
      setAreNotificationsEnabled(false);
    }
  }, []);

  const handleToggleNotifications = (enabled: boolean) => {
    if (enabled) {
      // User wants to ENABLE
      if ("Notification" in window) {
        Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission);
          if (permission === "granted") {
            setAreNotificationsEnabled(true);
            try {
              localStorage.setItem("rt_notifications_enabled", "true");
            } catch (e) { }
            new Notification("RT - Routine Tracker", { body: "Notifications enabled!" });
          }
        });
      }
    } else {
      // User wants to DISABLE
      setAreNotificationsEnabled(false);
      try {
        localStorage.setItem("rt_notifications_enabled", "false");
      } catch (e) { }
    }
  };

  const SettingSection = ({ icon: Icon, title, description, children }: any) => (
    <div className="group space-y-4 p-6 rounded-3xl bg-muted/50 border border-border transition-all hover:bg-muted">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-lg font-bold text-foreground tracking-tight">{title}</h4>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {children}
      </div>
    </div>
  )

  // Toggle Switch Component
  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: (val: boolean) => void }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${enabled ? "bg-purple-600" : "bg-muted-foreground/30"
        }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${enabled ? "translate-x-6" : "translate-x-1"
          }`}
      />
    </button>
  );

  // Platform Button
  const PlatformButton = ({ platform, label, icon }: { platform: AIPlatform; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => setAiPlatform(platform)}
      disabled={!aiEnabled}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${aiPlatform === platform && aiEnabled
        ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
        : aiEnabled
          ? "bg-muted hover:bg-muted-foreground/20 text-foreground"
          : "bg-muted/50 text-muted-foreground cursor-not-allowed opacity-50"
        }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="App Settings">
      <div className="space-y-6 py-2">
        {/* AI Settings */}
        <SettingSection
          icon={Bot}
          title="AI Assistant"
          description="Enable or disable the AI assistant and choose your preferred AI platform."
        >
          <div className="w-full space-y-4">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Enable AI Assistant</span>
              <ToggleSwitch enabled={aiEnabled} onChange={setAiEnabled} />
            </div>

            {/* Platform Selection */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI Platform</span>
              <div className="flex gap-2">
                <PlatformButton
                  platform="gemini"
                  label="Gemini"
                  icon={<Sparkles className="h-4 w-4" />}
                />
                <PlatformButton
                  platform="groq"
                  label="Groq (Llama)"
                  icon={<Bot className="h-4 w-4" />}
                />
              </div>
            </div>
          </div>
        </SettingSection>

        <SettingSection
          icon={Bell}
          title="Notifications"
          description="Get reminded about your tasks before they start. Never miss a routine again."
        >
          <SettingSection
            icon={Bell}
            title="Notifications"
            description="Get reminded about your tasks before they start. Never miss a routine again."
          >
            <div className="w-full flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Enable Task Reminders</span>
              <ToggleSwitch
                enabled={notificationPermission === "granted" && areNotificationsEnabled}
                onChange={handleToggleNotifications}
              />
            </div>
            {notificationPermission === "denied" && (
              <p className="text-xs text-red-400 mt-2">
                ⚠️ Notification permission is blocked in your browser settings. Please enable it manually to receive reminders.
              </p>
            )}
          </SettingSection>
        </SettingSection>

        <SettingSection
          icon={Database}
          title="Data Management"
          description="Manage your routine data. Export for backup or restore from a previous save."
        >
          <Button
            className="rounded-2xl bg-muted hover:bg-muted-foreground/20 text-foreground border-0 px-6 gap-2"
            onClick={handleBackup}
          >
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button
            className="rounded-2xl bg-muted hover:bg-muted-foreground/20 text-foreground border-0 px-6 gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" /> Import
          </Button>
          <input
            type="file"
            accept=".json"
            className="hidden"
            ref={fileInputRef}
            onChange={handleRestore}
          />
        </SettingSection>

        <SettingSection
          icon={ShieldAlert}
          title="Account & Safety"
          description="Manage your account session and sensitive data. Actions here may be permanent."
        >
          {/* Public Profile Toggle */}
          <div className="w-full flex items-center justify-between p-2 rounded-xl bg-purple-500/5 mb-2">
            <div>
              <span className="text-sm font-bold text-foreground block">Public Profile</span>
              <span className="text-xs text-muted-foreground">Show in leaderboard</span>
            </div>
            <ToggleSwitch enabled={isPublic} onChange={togglePublicProfile} />
          </div>

          <Button
            className="rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border-0 px-6 gap-2 font-bold"
            onClick={handleClearData}
          >
            <Trash2 className="h-4 w-4" /> Clear Cloud Data
          </Button>
          <Button
            className="rounded-2xl bg-muted hover:bg-muted-foreground/20 text-foreground border-0 px-6 gap-2"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </SettingSection>

        <div className="text-center pt-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">
            Routine Tracker v1.3.0 • Pro Edition
          </p>
        </div>
      </div>
      {ConfirmDialogComponent}
    </Modal>
  );
};

export { SettingsModal };

