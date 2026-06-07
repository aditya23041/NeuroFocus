"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { apiPost } from "@/lib/api";

type FocusMode = "pomodoro" | "deep-work" | "custom";

export default function SetupPage() {
  const router = useRouter();
  const { error } = useToast();

  // State Management
  const [focusMode, setFocusMode] = useState<FocusMode>("deep-work");
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState(60);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<"Offline" | "Calibrating..." | "Active">("Offline");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sync duration with focus mode selection
  const handleSelectMode = (mode: FocusMode) => {
    setFocusMode(mode);
    if (mode === "pomodoro") {
      setDuration(25);
    } else if (mode === "deep-work") {
      setDuration(90);
    }
  };

  // Start / Stop Webcam Feed
  const toggleCamera = async () => {
    if (isCameraOn) {
      // Turn off camera
      stopCamera();
    } else {
      // Turn on camera
      setCameraStatus("Calibrating...");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
        setCameraStatus("Active");
      } catch (err) {
        console.error("Failed to access camera:", err);
        error("Camera access denied or unavailable. Please enable permissions.");
        setCameraStatus("Offline");
      }
    }
  };


  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
    setCameraStatus("Offline");
  };

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleStartSession = async () => {
    // Stop camera stream before navigating
    stopCamera();
    
    // Save session config
    await apiPost("/api/session-config", {
      mode: focusMode,
      objective: goal || "Focus Session",
      sessionDuration: duration,
    });
    
    // Start session
    const res = await apiPost<{ sessionId: string }>("/api/session/start", {
      mode: focusMode,
      objective: goal || "Focus Session",
      duration: duration,
    });
    
    let sessionId = "";
    if (res.success && res.data) {
      sessionId = res.data.sessionId;
    }
    
    // Navigate with query params
    const query = new URLSearchParams({
      mode: focusMode,
      goal: goal || "Focus Session",
      duration: duration.toString(),
      ...(sessionId ? { sessionId } : {}),
    }).toString();
    
    router.push(`/monitor?${query}`);
  };

  return (
    <div className="max-w-container-max mx-auto space-y-stack-lg relative z-10">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

      <header>
        <h2 className="font-display-lg text-[32px] font-bold text-on-surface leading-tight">
          New Session
        </h2>
        <p className="font-title-md text-on-surface-variant mt-2 font-normal text-sm">
          Configure your cognitive parameters for optimal focus.
        </p>
      </header>

      <div className="grid grid-cols-12 gap-gutter">
        {/* Left Column: Settings (Focus Mode, Goal, Duration) */}
        <div className="col-span-12 lg:col-span-8 space-y-stack-lg">
          
          {/* Focus Modes Card */}
          <section className="glass-card rounded-xl p-gutter">
            <h3 className="font-label-caps text-secondary mb-stack-md uppercase text-xs tracking-wider font-semibold">
              Select Focus Mode
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Pomodoro */}
              <button
                type="button"
                onClick={() => handleSelectMode("pomodoro")}
                className={`relative p-4 rounded-lg border text-left group transition-all duration-200 cursor-pointer ${
                  focusMode === "pomodoro"
                    ? "border-tertiary bg-surface-container/80 shadow-[0_0_15px_rgba(255,185,95,0.15)]"
                    : "border-white/10 bg-surface-container hover:bg-surface-variant/50"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="material-symbols-outlined text-tertiary text-2xl">timer</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      focusMode === "pomodoro" ? "border-tertiary" : "border-outline group-hover:border-tertiary"
                    }`}
                  >
                    {focusMode === "pomodoro" && <div className="w-2.5 h-2.5 bg-tertiary rounded-full"></div>}
                  </div>
                </div>
                <h4 className="font-title-md text-on-surface text-base font-semibold">Pomodoro</h4>
                <p className="font-body-md text-on-surface-variant text-xs mt-1">25m work, 5m rest</p>
              </button>

              {/* Deep Work */}
              <button
                type="button"
                onClick={() => handleSelectMode("deep-work")}
                className={`relative p-4 rounded-lg border text-left group transition-all duration-200 cursor-pointer ${
                  focusMode === "deep-work"
                    ? "border-secondary bg-surface-container/80 glow-active"
                    : "border-white/10 bg-surface-container hover:bg-surface-variant/50"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="material-symbols-outlined text-secondary text-2xl">psychology</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      focusMode === "deep-work" ? "border-secondary" : "border-outline group-hover:border-secondary"
                    }`}
                  >
                    {focusMode === "deep-work" && <div className="w-2.5 h-2.5 bg-secondary rounded-full"></div>}
                  </div>
                </div>
                <h4 className="font-title-md text-on-surface text-base font-semibold">Deep Work</h4>
                <p className="font-body-md text-on-surface-variant text-xs mt-1">90m sustained focus</p>
              </button>

              {/* Custom */}
              <button
                type="button"
                onClick={() => handleSelectMode("custom")}
                className={`relative p-4 rounded-lg border text-left group transition-all duration-200 cursor-pointer ${
                  focusMode === "custom"
                    ? "border-primary bg-surface-container/80 shadow-[0_0_15px_rgba(80,70,229,0.15)]"
                    : "border-white/10 bg-surface-container hover:bg-surface-variant/50"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="material-symbols-outlined text-primary text-2xl">tune</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      focusMode === "custom" ? "border-primary" : "border-outline group-hover:border-primary"
                    }`}
                  >
                    {focusMode === "custom" && <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>}
                  </div>
                </div>
                <h4 className="font-title-md text-on-surface text-base font-semibold">Custom</h4>
                <p className="font-body-md text-on-surface-variant text-xs mt-1">Manual parameters</p>
              </button>
            </div>
          </section>

          {/* Goal & Duration */}
          <section className="glass-card rounded-xl p-gutter space-y-6">
            <h3 className="font-label-caps text-secondary uppercase text-xs tracking-wider font-semibold">
              Set Objective
            </h3>
            
            {/* Primary Goal Input */}
            <div className="relative">
              <label
                htmlFor="objective"
                className="absolute -top-2.5 left-3 bg-surface-container-low px-1.5 font-label-caps text-[10px] text-on-surface-variant tracking-wider font-semibold uppercase"
              >
                Primary Goal
              </label>
              <input
                id="objective"
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-surface-container-low border border-white/10 rounded-lg p-4 font-body-md text-sm text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none transition-all placeholder:text-surface-bright"
                placeholder="e.g., Complete Chapter 4 Analysis"
              />
            </div>

            {/* Duration Slider */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="font-label-caps text-xs text-on-surface-variant font-semibold uppercase tracking-wider">
                  Session Duration
                </label>
                <span className="font-stats-xl text-primary text-2xl font-bold">
                  {duration}
                  <span className="text-title-md text-on-surface-variant text-xs ml-0.5 font-normal">m</span>
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="180"
                step="5"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full h-1.5 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-secondary"
              />
              <div className="flex justify-between text-xs font-mono text-on-surface-variant mt-2">
                <span>15m</span>
                <span>3h</span>
              </div>
            </div>
          </section>

        </div>

        {/* Right Column: AI Calibration / Camera Preview */}
        <div className="col-span-12 lg:col-span-4 flex flex-col">
          <section className="glass-card rounded-xl p-gutter flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-label-caps text-secondary uppercase text-xs tracking-wider font-semibold">
                  AI Calibration
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded font-label-caps text-[10px] flex items-center gap-1.5 uppercase tracking-wider font-semibold ${
                    cameraStatus === "Active"
                      ? "text-secondary bg-secondary/10"
                      : cameraStatus === "Calibrating..."
                      ? "text-soft-amber bg-soft-amber/10"
                      : "text-on-surface-variant bg-surface-container-high"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      cameraStatus === "Active"
                        ? "bg-secondary animate-pulse"
                        : cameraStatus === "Calibrating..."
                        ? "bg-soft-amber animate-pulse"
                        : "bg-outline"
                    }`}
                  />
                  {cameraStatus}
                </span>
              </div>

              {/* Camera Preview Box */}
              <div className="w-full aspect-video bg-surface-container-high rounded-lg border border-white/10 flex flex-col items-center justify-center relative overflow-hidden mb-6 group shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${
                    isCameraOn ? "block" : "hidden"
                  }`}
                />
                {!isCameraOn && (
                  <>
                    <span className="material-symbols-outlined text-outline mb-2 text-3xl">videocam_off</span>
                    <p className="font-body-md text-on-surface-variant text-center px-4 text-xs">
                      Camera access required for cognitive load tracking
                    </p>
                  </>
                )}
                {/* Scan Overlay Effect (only visible during setup/scanning) */}
                {cameraStatus === "Calibrating..." && (
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/15 to-transparent animate-[bounce_2s_infinite]" />
                )}
              </div>

              {/* Guide Checklist */}
              <div className="space-y-4">
                <h4 className="font-title-md text-on-surface text-sm font-semibold">Setup Instructions</h4>
                <ul className="space-y-3 font-body-md text-on-surface-variant text-xs">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-sm font-bold">check_circle</span>
                    Ensure face is evenly lit.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-sm font-bold">check_circle</span>
                    Position camera at eye level.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-sm font-bold">check_circle</span>
                    Remove heavy reflections (e.g., glasses glare).
                  </li>
                </ul>
              </div>
            </div>

            {/* Test Camera Trigger */}
            <button
              type="button"
              onClick={toggleCamera}
              className={`w-full mt-6 py-3 rounded-lg border text-on-surface font-title-md text-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                isCameraOn
                  ? "bg-surface-container-lowest border-white/10 hover:bg-surface-container"
                  : "bg-surface-container hover:bg-surface-variant/30 border-white/10 hover:border-white/20"
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {isCameraOn ? "videocam_off" : "videocam"}
              </span>
              {isCameraOn ? "Stop Camera" : "Test Camera"}
            </button>
          </section>
        </div>
      </div>

      {/* Global Actions */}
      <div className="mt-stack-lg flex justify-end border-t border-white/10 pt-stack-md">
        <button
          id="setup-start-btn"
          type="button"
          onClick={handleStartSession}
          className="bg-primary-container text-on-primary-container font-headline-lg text-lg px-8 py-4 rounded-lg hover:bg-inverse-primary hover:shadow-primary/20 transition-all shadow-lg active:scale-95 duration-200 flex items-center gap-3 cursor-pointer"
        >
          Start Session
          <span className="material-symbols-outlined">play_arrow</span>
        </button>
      </div>
    </div>
  );
}
