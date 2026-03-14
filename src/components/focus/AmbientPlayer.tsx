"use client";

import React, { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, CloudRain, Wind, Coffee, Music, Waves, Flame, Headphones, Moon, Play, Pause, Settings2 } from "lucide-react";
import { cn } from "@/components/ui/Button";

// Enhanced sounds library with more options
const SOUNDS = [
    { id: "rain", label: "Rain", icon: CloudRain, src: "https://assets.mixkit.co/active_storage/sfx/2498/2498-preview.mp3", color: "from-blue-500 to-cyan-500" },
    { id: "forest", label: "Forest", icon: Wind, src: "https://assets.mixkit.co/active_storage/sfx/2485/2485-preview.mp3", color: "from-green-500 to-emerald-500" },
    { id: "cafe", label: "Café", icon: Coffee, src: "https://assets.mixkit.co/active_storage/sfx/2475/2475-preview.mp3", color: "from-amber-500 to-orange-500" },
    { id: "lofi", label: "Lo-Fi", icon: Music, src: "https://assets.mixkit.co/active_storage/sfx/274/274-preview.mp3", color: "from-purple-500 to-pink-500" },
    { id: "ocean", label: "Ocean", icon: Waves, src: "https://assets.mixkit.co/active_storage/sfx/2497/2497-preview.mp3", color: "from-sky-500 to-blue-500" },
    { id: "fire", label: "Fireplace", icon: Flame, src: "https://assets.mixkit.co/active_storage/sfx/2493/2493-preview.mp3", color: "from-orange-500 to-red-500" },
    { id: "white", label: "White Noise", icon: Headphones, src: "https://assets.mixkit.co/active_storage/sfx/2512/2512-preview.mp3", color: "from-gray-400 to-gray-500" },
    { id: "night", label: "Night", icon: Moon, src: "https://assets.mixkit.co/active_storage/sfx/2488/2488-preview.mp3", color: "from-indigo-500 to-purple-500" },
];

export function AmbientPlayer() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSound, setCurrentSound] = useState(SOUNDS[0]);
    const [secondarySound, setSecondarySound] = useState<typeof SOUNDS[0] | null>(null);
    const [primaryVolume, setPrimaryVolume] = useState(0.5);
    const [secondaryVolume, setSecondaryVolume] = useState(0.3);
    const [showMixer, setShowMixer] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const secondaryAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = primaryVolume;
        }
    }, [primaryVolume]);

    useEffect(() => {
        if (secondaryAudioRef.current) {
            secondaryAudioRef.current.volume = secondaryVolume;
        }
    }, [secondaryVolume]);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            secondaryAudioRef.current?.pause();
        } else {
            audioRef.current.play().catch(e => console.error("Audio play failed:", e));
            if (secondarySound) {
                secondaryAudioRef.current?.play().catch(e => console.error("Secondary audio play failed:", e));
            }
        }
        setIsPlaying(!isPlaying);
    };

    const changeSound = (sound: typeof SOUNDS[0], isSecondary = false) => {
        if (isSecondary) {
            // Toggle secondary sound
            if (secondarySound?.id === sound.id) {
                setSecondarySound(null);
                secondaryAudioRef.current?.pause();
            } else {
                setSecondarySound(sound);
                if (isPlaying) {
                    setTimeout(() => {
                        secondaryAudioRef.current?.play();
                    }, 100);
                }
            }
        } else {
            const wasPlaying = isPlaying;
            setCurrentSound(sound);
            setIsPlaying(false);

            setTimeout(() => {
                if (wasPlaying && audioRef.current) {
                    audioRef.current.play();
                    setIsPlaying(true);
                }
            }, 0);
        }
    };

    return (
        <div className="w-full max-w-sm rounded-[2rem] bg-white/[0.03] border border-white/10 p-5 backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Music className="w-4 h-4 text-purple-400" />
                    Ambient Mixer
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowMixer(!showMixer)}
                        className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                            showMixer ? "bg-purple-500/20 text-purple-400" : "bg-white/10 text-muted-foreground hover:bg-white/20"
                        )}
                    >
                        <Settings2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={togglePlay}
                        className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center transition-all",
                            isPlaying
                                ? `bg-gradient-to-r ${currentSound.color} text-white shadow-lg shadow-purple-500/25`
                                : "bg-white/10 text-muted-foreground hover:bg-white/20"
                        )}
                    >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                </div>
            </div>

            {/* Now Playing */}
            {isPlaying && (
                <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${currentSound.color} flex items-center justify-center`}>
                            <currentSound.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-foreground">
                                {currentSound.label}
                                {secondarySound && ` + ${secondarySound.label}`}
                            </p>
                            <div className="flex items-center gap-1">
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className={`w-1 h-3 rounded-full bg-purple-500 animate-pulse`} style={{ animationDelay: `${i * 0.15}s` }} />
                                    ))}
                                </div>
                                <span className="text-xs text-muted-foreground ml-1">Playing</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sound Grid */}
            <div className="grid grid-cols-4 gap-2 mb-4">
                {SOUNDS.map((sound) => {
                    const Icon = sound.icon;
                    const isPrimary = currentSound.id === sound.id;
                    const isSecondaryActive = secondarySound?.id === sound.id;

                    return (
                        <button
                            key={sound.id}
                            onClick={() => changeSound(sound, showMixer && currentSound.id !== sound.id)}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all border relative",
                                isPrimary
                                    ? `bg-gradient-to-br ${sound.color}/20 border-purple-500/50 text-white`
                                    : isSecondaryActive
                                        ? "bg-pink-500/20 border-pink-500/50 text-pink-200"
                                        : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", (isPrimary || isSecondaryActive) && "text-purple-400")} />
                            <span className="text-[10px] font-medium">{sound.label}</span>

                            {/* Secondary indicator */}
                            {isSecondaryActive && (
                                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-pink-500 flex items-center justify-center text-[8px] font-bold text-white">
                                    2
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Mixer Mode Indicator */}
            {showMixer && (
                <div className="mb-4 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
                    <p className="text-xs text-purple-400">
                        🎚️ Mixer Mode: Click to add a second sound
                    </p>
                </div>
            )}

            {/* Volume Controls */}
            <div className="space-y-3">
                {/* Primary Volume */}
                <div className="flex items-center gap-3 bg-black/20 rounded-xl p-2 px-3">
                    <Volume2 className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={primaryVolume}
                        onChange={(e) => setPrimaryVolume(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500"
                    />
                    <span className="text-xs text-muted-foreground w-8">{Math.round(primaryVolume * 100)}%</span>
                </div>

                {/* Secondary Volume (if active) */}
                {secondarySound && (
                    <div className="flex items-center gap-3 bg-pink-500/10 rounded-xl p-2 px-3">
                        <secondarySound.icon className="w-4 h-4 text-pink-400 shrink-0" />
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={secondaryVolume}
                            onChange={(e) => setSecondaryVolume(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-pink-500"
                        />
                        <span className="text-xs text-muted-foreground w-8">{Math.round(secondaryVolume * 100)}%</span>
                    </div>
                )}
            </div>

            {/* Audio Elements */}
            <audio
                ref={audioRef}
                src={currentSound.src}
                loop
                className="hidden"
            />
            {secondarySound && (
                <audio
                    ref={secondaryAudioRef}
                    src={secondarySound.src}
                    loop
                    className="hidden"
                />
            )}
        </div>
    );
}
