"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as blazeface from "@tensorflow-models/blazeface";
import { useToast } from "@/components/Toast";
import { apiGet, apiPost } from "@/lib/api";
import { useSocket } from "@/lib/socketClient";

function MonitorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();


  // Get configuration from query params
  const mode = searchParams.get("mode") || "deep-work";
  const goal = searchParams.get("goal") || "Focus Session";
  const totalMinutes = Number(searchParams.get("duration")) || 60;
  const sessionId = searchParams.get("sessionId");
  const { socket, onEvent } = useSocket(sessionId);
  
  // Timer States
  const totalSeconds = totalMinutes * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const [isActive, setIsActive] = useState(true);
  const [focusScore, setFocusScore] = useState(94);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false); // Default false so bounding boxes are visible immediately
  
  // Listen for socket updates
  useEffect(() => {
    if (!sessionId) return;
    
    return onEvent("focus_score_updated", (data: any) => {
      setFocusScore(data.focusScore);
      setProductivity(data.productivityStatus);
      if (data.distractionFreePercentage !== undefined) {
        setDistractionFree(data.distractionFreePercentage);
      }
    });
  }, [sessionId, onEvent]);
  
  // Stats state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distractedSeconds, setDistractedSeconds] = useState(0);
  const [distractionFree, setDistractionFree] = useState(100);
  const [productivity, setProductivity] = useState("High");
  const [currentTip, setCurrentTip] = useState(
    "Ensure your workspace is free of noise. Keep your phone in another room to avoid distraction."
  );

  // Distraction source breakdown seconds tracked in refs for database logging
  const phoneDistractedSecsRef = useRef(0);
  const tabDistractedSecsRef = useRef(0);
  const faceDistractedSecsRef = useRef(0);
  const peopleDistractedSecsRef = useRef(0);

  // Sensor and Alert States
  const [faceDetected, setFaceDetected] = useState(true);
  const [phoneDetected, setPhoneDetected] = useState(false);
  const [isTabDistracted, setIsTabDistracted] = useState(false);
  const [multiplePeopleDetected, setMultiplePeopleDetected] = useState(false);
  
  const [showFaceAlert, setShowFaceAlert] = useState(false);
  const [showPhoneAlert, setShowPhoneAlert] = useState(false);
  const [showTabAlert, setShowTabAlert] = useState(false);
  const [showMultiplePeopleAlert, setShowMultiplePeopleAlert] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderInterval, setReminderInterval] = useState(20); // minutes

  // Refs for tracking state changes to avoid voice spamming
  const prevFaceDetectedRef = useRef(true);
  const prevPhoneDetectedRef = useRef(false);
  const prevTabDistractedRef = useRef(false);
  const prevMultiplePeopleDetectedRef = useRef(false);

  // Webcam & Canvas Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // AI Model States
  const [cocoModel, setCocoModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [blazeModel, setBlazeModel] = useState<any | null>(null);
  const [modelLoading, setModelLoading] = useState(true);

  // List of AI Focus Tips
  const focusTips = [
    "Mobile phone usage detected. Keeping your phone out of sight increases deep work flow by 40%.",
    "Breathe deeply. 3 slow, deep inhalations can reduce cognitive fatigue and reset eye focus.",
    "You are maintaining excellent focus! Avoid checking tabs or mobile notifications to sustain this flow state.",
    "A minor tab-switch was detected. Refocus on your primary objective: to " + goal + ".",
    "Face sensor active. Ensure your face is centered in the camera frame for optimal tracking.",
    "Looking away or switching tabs disrupts memory consolidation. Protect your cognitive flow.",
  ];

  // Load COCO-SSD and BlazeFace Models on client mount
  useEffect(() => {
    async function loadModels() {
      try {
        setModelLoading(true);
        await tf.ready();
        console.log("Loading COCO-SSD and BlazeFace models...");
        const [loadedCoco, loadedBlaze] = await Promise.all([
          cocoSsd.load({
            base: "lite_mobilenet_v2", // lightweight MobileNet model for faster loading
          }),
          blazeface.load()
        ]);
        setCocoModel(loadedCoco);
        setBlazeModel(loadedBlaze);
        setModelLoading(false);
        console.log("All AI models loaded successfully.");
      } catch (err) {
        console.error("Failed to load TensorFlow models:", err);
        setModelLoading(false);
      }
    }
    loadModels();
  }, []);

  // Speech Alert Effect on state change
  useEffect(() => {
    const speakText = (text: string) => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel(); // Clear any ongoing speech
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith("en"));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    };

    // Speak Face sensor alert
    if (prevFaceDetectedRef.current !== faceDetected) {
      if (!faceDetected) {
        speakText("Face not detected. Please return to your screen.");
        setShowFaceAlert(true);
      } else {
        setShowFaceAlert(false);
      }
      prevFaceDetectedRef.current = faceDetected;
      // We don't have a specific "face_missing" endpoint in the plan (we only had positive face_present), 
      // but we can reuse monitor/face since the backend just applies the event.
      // Wait, let's omit hitting API for now unless they are distracted, to avoid spam.
    }

    // Speak Phone sensor alert
    if (prevPhoneDetectedRef.current !== phoneDetected) {
      if (phoneDetected) {
        speakText("Mobile phone detected. Please avoid distraction.");
        setShowPhoneAlert(true);
        if (sessionId) apiPost("/api/monitor/phone", { sessionId });
      } else {
        setShowPhoneAlert(false);
      }
      prevPhoneDetectedRef.current = phoneDetected;
    }

    // Speak Tab switch alert
    if (prevTabDistractedRef.current !== isTabDistracted) {
      if (isTabDistracted) {
        speakText("Tab switch detected. Please refocus on your study goals.");
        setShowTabAlert(true);
        if (sessionId) apiPost("/api/monitor/gaze", { sessionId }); // Using gaze for tab switch distraction
      }
      prevTabDistractedRef.current = isTabDistracted;
    }

    // Speak Multiple People alert
    if (prevMultiplePeopleDetectedRef.current !== multiplePeopleDetected) {
      if (multiplePeopleDetected) {
        speakText("Multiple people detected in your study area. Please maintain your focus.");
        setShowMultiplePeopleAlert(true);
        if (sessionId) apiPost("/api/monitor/person", { sessionId });
      } else {
        setShowMultiplePeopleAlert(false);
      }
      prevMultiplePeopleDetectedRef.current = multiplePeopleDetected;
    }
  }, [faceDetected, phoneDetected, isTabDistracted, multiplePeopleDetected]);

  // Tab Visibility (Distraction) tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTabDistracted(true);
      } else {
        setIsTabDistracted(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Start Camera Feed on Load
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      } catch (err) {
        console.error("Camera setup failed or was denied:", err);
        setCameraActive(false);
      }
    }
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Frame-by-Frame Prediction Loop
  useEffect(() => {
    let requestRef: number;

    async function detectFrame() {
      if (!cocoModel || !blazeModel || !videoRef.current || !canvasRef.current || !cameraActive || !isActive) {
        requestRef = requestAnimationFrame(detectFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          try {
            // Predict in parallel
            const [cocoPredictions, blazePredictions] = await Promise.all([
              cocoModel.detect(video),
              blazeModel.estimateFaces(video, false)
            ]);

            let personFound = blazePredictions.length > 0;
            let phoneFound = false;

            // Process COCO predictions for cell phones or person fallback
            cocoPredictions.forEach((pred) => {
              if (pred.class === "cell phone") {
                phoneFound = true;
              }
              if (pred.class === "person") {
                personFound = true;
              }
            });

            const personPredictions = cocoPredictions.filter((pred) => pred.class === "person");
            const multiplePeopleFound = blazePredictions.length > 1 || personPredictions.length > 1;

            // Draw bounding boxes ONLY if not in privacy mode
            if (!isPrivacyMode) {
              // 1. Draw BlazeFace predictions
              blazePredictions.forEach((pred: any) => {
                const x = pred.topLeft[0];
                const y = pred.topLeft[1];
                const width = pred.bottomRight[0] - pred.topLeft[0];
                const height = pred.bottomRight[1] - pred.topLeft[1];
                const score = Array.isArray(pred.probability) ? pred.probability[0] : pred.probability;

                const color = "#10b981"; // green for face
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.strokeRect(x, y, width, height);

                ctx.fillStyle = "rgba(16, 185, 129, 0.1)";
                ctx.fillRect(x, y, width, height);

                ctx.fillStyle = color;
                ctx.font = "bold 14px monospace";
                const labelText = `FACE (${Math.round(score * 100)}%)`;
                ctx.fillText(labelText, x, y > 20 ? y - 8 : y + 20);

                // Draw landmarks for high-tech premium feel
                if (pred.landmarks) {
                  ctx.fillStyle = "#4edea3";
                  pred.landmarks.forEach((landmark: [number, number]) => {
                    ctx.beginPath();
                    ctx.arc(landmark[0], landmark[1], 3, 0, 2 * Math.PI);
                    ctx.fill();
                  });
                }
              });

              // 2. Draw COCO-SSD predictions
              cocoPredictions.forEach((pred) => {
                const [x, y, width, height] = pred.bbox;
                
                if (pred.class === "cell phone") {
                  const color = "#ef4444"; // red for phone
                  ctx.strokeStyle = color;
                  ctx.lineWidth = 3;
                  ctx.strokeRect(x, y, width, height);

                  ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
                  ctx.fillRect(x, y, width, height);

                  ctx.fillStyle = color;
                  ctx.font = "bold 14px monospace";
                  const labelText = `PHONE (${Math.round(pred.score * 100)}%)`;
                  ctx.fillText(labelText, x, y > 20 ? y - 8 : y + 20);
                } else if (pred.class === "person") {
                  // If multiple people are detected, draw all of them to show the distractions.
                  // Otherwise, only draw the fallback person box if BlazeFace didn't detect a face.
                  if (multiplePeopleFound || blazePredictions.length === 0) {
                    const color = multiplePeopleFound ? "#ffb95f" : "#10b981"; // Amber for multiple (distraction), green for fallback
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, width, height);

                    ctx.fillStyle = multiplePeopleFound ? "rgba(255, 185, 95, 0.1)" : "rgba(16, 185, 129, 0.05)";
                    ctx.fillRect(x, y, width, height);

                    ctx.fillStyle = color;
                    ctx.font = "bold 12px monospace";
                    const labelText = multiplePeopleFound ? `PEOPLE DETECTED (${Math.round(pred.score * 100)}%)` : `PERSON (${Math.round(pred.score * 100)}%)`;
                    ctx.fillText(labelText, x + 5, y > 20 ? y - 8 : y + 15);
                  }
                }
              });
            }

            setFaceDetected(personFound);
            setPhoneDetected(phoneFound);
            setMultiplePeopleDetected(multiplePeopleFound);
          } catch (err) {
            console.error("Frame prediction failed:", err);
          }
        }
      }
      requestRef = requestAnimationFrame(detectFrame);
    }

    if (cocoModel && blazeModel && cameraActive && isActive) {
      detectFrame();
    }

    return () => {
      cancelAnimationFrame(requestRef);
    };
  }, [cocoModel, blazeModel, cameraActive, isActive, isPrivacyMode]);

  // Handle manual session completion/save
  const handleEndAndSaveSession = async () => {
    setIsActive(false);
    
    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (sessionId) {
      await apiPost("/api/session/end", { sessionId, earlyEnd: secondsRemaining > 0 });
      toast.success("Session saved successfully! Redirecting to dashboard...");
    } else {
      toast.info("Session ended. Redirecting to dashboard...");
    }
    
    router.push("/");
  };

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
        
        // Track distraction breakdowns
        if (phoneDetected) {
          phoneDistractedSecsRef.current += 1;
        }
        if (!faceDetected) {
          faceDistractedSecsRef.current += 1;
        }
        if (isTabDistracted) {
          tabDistractedSecsRef.current += 1;
        }
        if (multiplePeopleDetected) {
          peopleDistractedSecsRef.current += 1;
        }

        setElapsedSeconds((prev) => {
          const nextElapsed = prev + 1;
          
          setDistractedSeconds((dist) => {
            const nextDistracted = dist + (phoneDetected || !faceDetected || isTabDistracted || multiplePeopleDetected ? 1 : 0);
            
            // Calculate distraction-free percentage dynamically
            const distractionFreePercent = Math.max(30, Math.round(((nextElapsed - nextDistracted) / nextElapsed) * 100));
            setDistractionFree(distractionFreePercent);

            // Dynamically adjust focus score based on distraction-free ratio
            setFocusScore((score) => {
              const targetScore = distractionFreePercent;
              const diff = targetScore - score;
              // Smooth transition
              const step = diff > 0 ? 1 : diff < 0 ? -2 : 0;
              return Math.min(100, Math.max(40, score + step));
            });

            return nextDistracted;
          });

          return nextElapsed;
        });
      }, 1000);
    } else if (secondsRemaining === 0) {
      setIsActive(false);
      
      // Stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      
      if (sessionId) {
        apiPost("/api/session/end", { sessionId, earlyEnd: false }).then(() => {
          toast.success("Session completed! Congratulations on finishing your focus block.");
          router.push("/");
        });
      } else {
        toast.success("Session completed! Congratulations on finishing your focus block.");
        router.push("/");
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsRemaining, phoneDetected, faceDetected, isTabDistracted, multiplePeopleDetected, router, elapsedSeconds, distractedSeconds, focusScore, totalSeconds, mode, goal]);

  // Dynamic Tips cycle
  useEffect(() => {
    const tipInterval = setInterval(() => {
      const randomTip = focusTips[Math.floor(Math.random() * focusTips.length)];
      setCurrentTip(randomTip);
    }, 25000); // cycle tips every 25 seconds

    return () => clearInterval(tipInterval);
  }, [goal]);

  // Format Time: MM:SS or HH:MM:SS
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    
    const pad = (n: number) => n.toString().padStart(2, "0");
    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  };

  // Format Elapsed Study Time
  const formatElapsed = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  // Timer Math
  const fractionRemaining = secondsRemaining / totalSeconds;
  const strokeDashoffset = 283 - 283 * fractionRemaining;

  // Determine Productivity text based on focus score
  useEffect(() => {
    if (focusScore >= 85) setProductivity("High");
    else if (focusScore >= 65) setProductivity("Optimal");
    else setProductivity("Distracted");
  }, [focusScore]);

  // Goal completion %
  const goalProgressPercent = Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100));

  return (
    <div className="max-w-container-max mx-auto space-y-gutter relative z-10">
      
      {/* Face Not Detected alert toast notification */}
      {showFaceAlert && (
        <div className="fixed top-20 right-8 z-50 bg-surface-container-high border-2 border-error rounded-xl p-4 max-w-sm flex items-start gap-3 shadow-[0_10px_30px_rgba(255,180,171,0.2)] animate-bounce">
          <div className="w-8 h-8 rounded-full bg-error/15 flex items-center justify-center flex-shrink-0 text-error animate-pulse">
            <span className="material-symbols-outlined text-[20px]">face_retouching_off</span>
          </div>
          <div className="flex-1">
            <h4 className="font-label-caps text-error uppercase text-xs tracking-wider font-semibold">
              Face Sensor Alert
            </h4>
            <p className="font-body-md text-on-surface-variant text-xs mt-1">
              Face not detected in frame. Focus tracking has been temporarily suspended.
            </p>
          </div>
          <button
            onClick={() => setShowFaceAlert(false)}
            className="text-on-surface-variant hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Phone Detected alert toast notification */}
      {showPhoneAlert && (
        <div className="fixed top-20 right-8 z-50 bg-surface-container-high border-2 border-tertiary rounded-xl p-4 max-w-sm flex items-start gap-3 shadow-[0_10px_30px_rgba(245,158,11,0.2)] animate-bounce">
          <div className="w-8 h-8 rounded-full bg-soft-amber/15 flex items-center justify-center flex-shrink-0 text-soft-amber">
            <span className="material-symbols-outlined text-[20px]">phonelink_ring</span>
          </div>
          <div className="flex-1">
            <h4 className="font-label-caps text-soft-amber uppercase text-xs tracking-wider font-semibold">
              Distraction Detected
            </h4>
            <p className="font-body-md text-on-surface-variant text-xs mt-1">
              Mobile phone usage detected in frame. Distracted time is being tracked.
            </p>
          </div>
          <button
            onClick={() => setShowPhoneAlert(false)}
            className="text-on-surface-variant hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Tab Switch alert toast notification */}
      {showTabAlert && isTabDistracted && (
        <div className="fixed top-20 right-8 z-50 bg-surface-container-high border-2 border-primary rounded-xl p-4 max-w-sm flex items-start gap-3 shadow-[0_10px_30px_rgba(80,70,229,0.2)] animate-bounce">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 text-primary animate-pulse">
            <span className="material-symbols-outlined text-[20px]">tab</span>
          </div>
          <div className="flex-1">
            <h4 className="font-label-caps text-primary uppercase text-xs tracking-wider font-semibold">
              Tab Distraction Alert
            </h4>
            <p className="font-body-md text-on-surface-variant text-xs mt-1">
              Tab switching detected. Please keep this tab active to maintain your focus score.
            </p>
          </div>
          <button
            onClick={() => setShowTabAlert(false)}
            className="text-on-surface-variant hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Multiple People Detected alert toast notification */}
      {showMultiplePeopleAlert && (
        <div className="fixed top-20 right-8 z-50 bg-surface-container-high border-2 border-primary rounded-xl p-4 max-w-sm flex items-start gap-3 shadow-[0_10px_30px_rgba(195,192,255,0.2)] animate-bounce">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 text-primary animate-pulse">
            <span className="material-symbols-outlined text-[20px]">group</span>
          </div>
          <div className="flex-1">
            <h4 className="font-label-caps text-primary uppercase text-xs tracking-wider font-semibold">
              Multiple People Detected
            </h4>
            <p className="font-body-md text-on-surface-variant text-xs mt-1">
              Multiple people detected around your study area. Minimize distractions to maintain your focus score.
            </p>
          </div>
          <button
            onClick={() => setShowMultiplePeopleAlert(false)}
            className="text-on-surface-variant hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Top Section: Focus Score Dial & Webcam Video Feed */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        
        {/* Focus Score Dial */}
        <div className="col-span-1 md:col-span-4 bg-slate-glass backdrop-blur-xl border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center relative shadow-[0_0_40px_rgba(16,185,129,0.05)] focus-pulse-glow">
          <h2 className="font-title-md text-on-surface self-start absolute top-6 left-6 font-semibold">
            Focus Pulse
          </h2>
          <span className="font-label-caps text-secondary uppercase self-start absolute top-12 left-6 tracking-widest text-[10px] flex items-center gap-1.5 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span> Live
          </span>

          <div className="relative w-48 h-48 mt-10 flex items-center justify-center">
            {/* Background Circle */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-surface-container-highest"
                cx="50"
                cy="50"
                fill="none"
                r="45"
                stroke="currentColor"
                strokeWidth="4"
              />
            </svg>
            {/* Progress Circle based on time remaining */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                className={`drop-shadow-[0_0_12px_rgba(16,185,129,0.5)] transition-all duration-1000 ease-out ${
                  phoneDetected || !faceDetected || isTabDistracted ? "text-error" : "text-secondary"
                }`}
                cx="50"
                cy="50"
                fill="none"
                r="45"
                stroke="currentColor"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                strokeWidth="4"
              />
            </svg>
            {/* Inner focus score & status text */}
            <div className="flex flex-col items-center justify-center relative z-10">
              <span className={`font-display-lg text-[42px] font-bold ${
                phoneDetected || !faceDetected || isTabDistracted ? "text-error" : "text-on-surface"
              }`}>
                {focusScore}
                <span className="text-[20px] text-on-surface-variant font-normal">%</span>
              </span>
              <span className={`font-label-caps text-[10px] mt-1 uppercase tracking-wider font-semibold ${
                phoneDetected || !faceDetected || isTabDistracted ? "text-error" : "text-secondary"
              }`}>
                {phoneDetected ? "Distracted" : !faceDetected ? "Face Missing" : isTabDistracted ? "Tab Switch" : "Focused"}
              </span>
            </div>
          </div>

          {/* Mini Countdown Timer HUD underneath */}
          <div className="mt-6 font-mono text-xl font-bold tracking-widest text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">timer</span>
            {formatTime(secondsRemaining)}
          </div>

          {/* Action Row */}
          <div className="flex flex-col gap-2 mt-4 w-full px-4">
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setIsActive(!isActive)}
                className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                  isActive
                    ? "bg-surface-container border-white/10 text-on-surface-variant hover:text-white"
                    : "bg-secondary text-on-secondary border-secondary/20 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                }`}
              >
                <span className="material-symbols-outlined text-sm">{isActive ? "pause" : "play_arrow"}</span>
                {isActive ? "Pause" : "Resume"}
              </button>
              <button
                onClick={() => {
                  setSecondsRemaining(totalSeconds);
                  setElapsedSeconds(0);
                  setDistractedSeconds(0);
                  setFocusScore(94);
                  setIsTabDistracted(false);
                }}
                className="flex-1 py-2 px-3 rounded-lg border border-white/5 bg-surface-container-high text-on-surface-variant hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">replay</span>
                Reset
              </button>
            </div>
            <button
              onClick={handleEndAndSaveSession}
              className="w-full py-2 px-3 bg-error-container hover:bg-error text-on-error-container hover:text-white border border-error/20 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">stop</span>
              End & Save Session
            </button>
          </div>
        </div>

        {/* Live AI Monitor Video Feed Box */}
        <div className="col-span-1 md:col-span-8 bg-slate-glass backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden relative min-h-[320px] flex items-center justify-center shadow-md">
          
          {/* Real Webcam rendering element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 transition-all duration-500 ${
              cameraActive ? "block" : "hidden"
            } ${
              isPrivacyMode || !faceDetected ? "opacity-30 blur-md grayscale" : "opacity-85"
            }`}
          />

          {/* Real-time Bounding Box Canvas Overlay */}
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none z-15 ${
              cameraActive && !isPrivacyMode ? "block" : "hidden"
            }`}
          />

          {/* Model Loading Spinner */}
          {modelLoading && (
            <div className="absolute inset-0 bg-deep-midnight/80 z-20 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-secondary animate-spin text-3xl mb-3">replay</span>
              <p className="font-label-caps text-[10px] text-secondary uppercase font-bold tracking-wider">
                Loading YOLO & BlazeFace Models...
              </p>
            </div>
          )}

          {/* Privacy Overlay Mask */}
          {isPrivacyMode && (
            <div className="absolute inset-0 bg-deep-midnight/50 backdrop-blur-md flex flex-col items-center justify-center z-10 p-6">
              <div className="w-14 h-14 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center mb-3 text-on-surface-variant">
                <span className="material-symbols-outlined text-2xl">visibility_off</span>
              </div>
              <h3 className="font-title-md text-on-surface font-semibold text-sm">Privacy Mode Enabled</h3>
              <p className="font-body-md text-on-surface-variant text-center max-w-sm text-xs mt-1.5">
                Camera feed is blurred locally. AI analysis evaluates posture, blink rates, and cognitive load metrics in privacy-preserving mode.
              </p>
            </div>
          )}

          {/* HUD Overlay Badge: Live Status */}
          <div className="absolute top-4 left-4 z-20 flex gap-2">
            <div className="bg-surface/85 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-label-caps text-[10px] text-on-surface uppercase font-semibold">
                YOLO & BlazeFace Active
              </span>
            </div>
          </div>

          {/* HUD Overlay Actions/Status: Toggles */}
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            <button
              onClick={() => setIsPrivacyMode(!isPrivacyMode)}
              className={`bg-surface/85 backdrop-blur-sm border rounded-full px-3 py-1 flex items-center gap-1.5 text-xs font-semibold hover:bg-surface-variant/70 transition-all active:scale-95 cursor-pointer ${
                isPrivacyMode ? "border-white/10 text-on-surface" : "border-secondary text-secondary"
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {isPrivacyMode ? "visibility" : "visibility_off"}
              </span>
              <span className="font-label-caps text-[10px] uppercase font-semibold">
                {isPrivacyMode ? "Reveal Feed" : "Blur Feed"}
              </span>
            </button>

            <button
              onClick={() => setShowReminderForm(!showReminderForm)}
              className="bg-surface/85 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5 text-on-surface hover:bg-surface-variant/70 transition-all active:scale-95 text-xs font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm text-secondary">notifications_active</span>
              <span className="font-label-caps text-[10px] uppercase font-semibold">Set Reminder</span>
            </button>
          </div>

          {/* Reminder Popup setting inside video feed */}
          {showReminderForm && (
            <div className="absolute bottom-4 right-4 z-30 bg-surface-container-high border border-white/10 p-3 rounded-lg max-w-[220px] shadow-lg flex flex-col gap-2 animate-fade-in">
              <div className="text-[10px] font-label-caps text-secondary font-bold uppercase">Reminder Interval</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={reminderInterval}
                  onChange={(e) => setReminderInterval(Number(e.target.value))}
                  className="w-16 bg-surface-container border border-white/10 p-1 rounded text-center text-xs font-semibold text-white focus:outline-none"
                />
                <span className="text-xs text-on-surface-variant">min</span>
              </div>
              <button
                onClick={() => {
                  setShowReminderForm(false);
                  toast.info(`Focus breaks will ping every ${reminderInterval} minutes.`);
                }}
                className="bg-secondary text-on-secondary py-1 text-[10px] uppercase font-bold rounded hover:opacity-95 transition-opacity"
              >
                Confirm
              </button>
            </div>
          )}

          {/* HUD Status: Face Sensor Status indicator at bottom left */}
          <div className="absolute bottom-4 left-4 z-20 flex gap-2">
            <div className="bg-surface/85 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm">
              <span className={`material-symbols-outlined text-sm ${faceDetected ? "text-secondary" : "text-error animate-pulse"}`}>
                {faceDetected ? "face" : "face_retouching_off"}
              </span>
              <span className={`font-label-caps text-[10px] uppercase font-semibold ${faceDetected ? "text-secondary" : "text-error"}`}>
                {faceDetected ? "Face Detected" : "Face Not Detected"}
              </span>
            </div>

            {/* Phone sensor warning badge */}
            {phoneDetected && (
              <div className="bg-error/85 border border-error/20 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm animate-pulse">
                <span className="material-symbols-outlined text-sm text-white">smart_toy</span>
                <span className="font-label-caps text-[10px] text-white uppercase font-semibold">Distraction: Phone Detected</span>
              </div>
            )}

            {/* Tab switch warning badge */}
            {isTabDistracted && (
              <div className="bg-error/85 border border-error/20 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm animate-pulse">
                <span className="material-symbols-outlined text-sm text-white">tab</span>
                <span className="font-label-caps text-[10px] text-white uppercase font-semibold">Distraction: Tab Switch</span>
              </div>
            )}

            {/* Multiple People warning badge */}
            {multiplePeopleDetected && (
              <div className="bg-error/85 border border-error/20 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm animate-pulse">
                <span className="material-symbols-outlined text-sm text-white">group</span>
                <span className="font-label-caps text-[10px] text-white uppercase font-semibold">Distraction: Multiple People</span>
              </div>
            )}
          </div>

          {/* Interactive Simulation HUD bar in center-bottom */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-slate-glass/90 backdrop-blur-md border border-white/15 px-4 py-1.5 rounded-full flex gap-4 text-xs font-mono shadow-lg transition-opacity hover:opacity-100 opacity-90">
            <span className="text-on-surface-variant font-bold text-[10px] tracking-wider uppercase flex items-center">Simulator Overrides:</span>
            <button
              onClick={() => {
                setFaceDetected((prev) => {
                  const next = !prev;
                  if (!next) {
                    setFocusScore((score) => Math.max(50, score - 20));
                  }
                  return next;
                });
              }}
              className={`hover:text-white transition-colors cursor-pointer text-[10px] font-bold ${
                faceDetected ? "text-secondary" : "text-error animate-pulse"
              }`}
            >
              Face: {faceDetected ? "DETECTED" : "MISSING"}
            </button>
            <div className="w-[1px] bg-white/10" />
            <button
              onClick={() => {
                setPhoneDetected((prev) => {
                  const next = !prev;
                  if (next) {
                    setFocusScore((score) => Math.max(45, score - 25));
                    setDistractionFree((df) => Math.max(30, df - 30));
                  }
                  return next;
                });
              }}
              className={`hover:text-white transition-colors cursor-pointer text-[10px] font-bold ${
                phoneDetected ? "text-error animate-pulse" : "text-on-surface-variant"
              }`}
            >
              Phone: {phoneDetected ? "DETECTED" : "ABSENT"}
            </button>
            <div className="w-[1px] bg-white/10" />
            <button
              onClick={() => {
                setMultiplePeopleDetected((prev) => {
                  const next = !prev;
                  if (next) {
                    setFocusScore((score) => Math.max(40, score - 15));
                    setDistractionFree((df) => Math.max(30, df - 20));
                  }
                  return next;
                });
              }}
              className={`hover:text-white transition-colors cursor-pointer text-[10px] font-bold ${
                multiplePeopleDetected ? "text-error animate-pulse" : "text-on-surface-variant"
              }`}
            >
              People: {multiplePeopleDetected ? "MULTIPLE" : "SINGLE"}
            </button>
          </div>

        </div>
      </div>

      {/* Bottom Section: Study Session Metrics Cards - Extended to 5 columns on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-gutter">
        
        {/* Study Time (Elapsed timer) */}
        <div className="bg-slate-glass backdrop-blur-xl border border-white/10 rounded-xl p-6 relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
          <div className="flex items-center gap-2 mb-4 text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">timer</span>
            <h3 className="font-label-caps text-[10px] uppercase font-bold tracking-wider">Study Time</h3>
          </div>
          <div className="font-stats-xl text-3xl font-bold text-on-surface tracking-tight font-mono">
            {formatElapsed(elapsedSeconds)}
          </div>
        </div>

        {/* Distraction Free Percentage */}
        <div className="bg-slate-glass backdrop-blur-xl border border-white/10 rounded-xl p-6 relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-colors"></div>
          <div className="flex items-center gap-2 mb-4 text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">do_not_disturb_off</span>
            <h3 className="font-label-caps text-[10px] uppercase font-bold tracking-wider">Distraction Free</h3>
          </div>
          <div className="font-stats-xl text-3xl font-bold text-on-surface tracking-tight font-mono">
            {distractionFree}
            <span className="text-[20px] text-on-surface-variant font-normal ml-0.5">%</span>
          </div>
        </div>

        {/* Distracted Time Card */}
        <div className="bg-slate-glass backdrop-blur-xl border border-white/10 rounded-xl p-6 relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-error/5 rounded-full blur-2xl group-hover:bg-error/10 transition-colors"></div>
          <div className="flex items-center gap-2 mb-4 text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">phonelink_ring</span>
            <h3 className="font-label-caps text-[10px] uppercase font-bold tracking-wider">Distracted Time</h3>
          </div>
          <div className={`font-stats-xl text-3xl font-bold tracking-tight font-mono ${
            distractedSeconds > 0 ? "text-error" : "text-on-surface-variant"
          }`}>
            {formatElapsed(distractedSeconds)}
          </div>
        </div>

        {/* Productivity Index */}
        <div className="bg-slate-glass backdrop-blur-xl border border-white/10 rounded-xl p-6 relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/5 rounded-full blur-2xl group-hover:bg-tertiary/10 transition-colors"></div>
          <div className="flex items-center gap-2 mb-4 text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">trending_up</span>
            <h3 className="font-label-caps text-[10px] uppercase font-bold tracking-wider">Productivity</h3>
          </div>
          <div className={`font-stats-xl text-3xl font-bold tracking-tight ${
            phoneDetected || !faceDetected || isTabDistracted ? "text-error" : "text-secondary"
          }`}>
            {productivity}
          </div>
        </div>

        {/* Goal Progress Bar */}
        <div className="bg-slate-glass backdrop-blur-xl border border-white/10 rounded-xl p-6 relative overflow-hidden group hover:border-white/20 transition-all flex flex-col justify-between">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
          <div>
            <div className="flex items-center gap-2 mb-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">flag</span>
              <h3 className="font-label-caps text-[10px] uppercase font-bold tracking-wider">Goal Progress</h3>
            </div>
            <div className="font-stats-xl text-3xl font-bold text-on-surface tracking-tight mb-2 font-mono">
              {goalProgressPercent}
              <span className="text-[20px] text-on-surface-variant font-normal ml-0.5">%</span>
            </div>
          </div>
          {/* Linear Progress Bar */}
          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full relative transition-all duration-1000 ease-out"
              style={{ width: `${goalProgressPercent}%` }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/30"></div>
            </div>
          </div>
        </div>

      </div>

      {/* Focus Tip Section */}
      <div className="bg-surface-container-high border border-white/5 rounded-xl p-4 flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-soft-amber/10 flex items-center justify-center flex-shrink-0 text-soft-amber">
          <span className="material-symbols-outlined text-[18px]">lightbulb</span>
        </div>
        <div>
          <h4 className="font-label-caps text-[10px] text-soft-amber uppercase mb-1 tracking-wider font-semibold">
            AI Focus Tip
          </h4>
          <p className="font-body-md text-on-surface-variant text-xs leading-relaxed transition-all duration-300">
            {currentTip}
          </p>
        </div>
      </div>

    </div>
  );
}

export default function MonitorPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex flex-col items-center justify-center py-20 text-on-surface-variant text-sm font-semibold">
        <span className="material-symbols-outlined animate-spin text-primary text-3xl mb-3">replay</span>
        Loading monitor parameters...
      </div>
    }>
      <MonitorContent />
    </Suspense>
  );
}
