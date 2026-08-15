import React from 'react';
import { useSpiritualParticles } from '../hooks/useSpiritualParticles';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useBlessing } from '../hooks/useBlessing';
import { useMediaPipeHands } from '../hooks/useMediaPipeHands';

import { ParticlesBackground } from '../components/ParticlesBackground';
import { Header } from '../components/Header';
import { CameraCard } from '../components/CameraCard';
import { ControlsRow } from '../components/ControlsRow';
import { BappaHero } from '../components/BappaHero';
import { BlessingCard } from '../components/BlessingCard';
import { DiagnosticsPanel } from '../components/DiagnosticsPanel';
import { InstructionSteps } from '../components/InstructionSteps';

/**
 * Main Container Component — Orchestrates all state, hooks, audio engine, gesture detection, and UI
 */
export function AppContainer() {
  // 1. Spiritual background particles & flower petals
  const { canvasRef: particlesCanvasRef, spawnFlowerPetalsRain } = useSpiritualParticles();

  // 2. Audio engine (Temple bell, foreground playlist loop, ambient chime)
  const {
    isSoundMuted,
    toggleSound,
    playTempleBell,
    pauseForegroundMusic,
    resumeForegroundMusic,
    startDevotionalAmbience,
    stopDevotionalAmbience
  } = useAudioEngine();

  // 3. Gesture Detection Toggle State
  const [isDetectionEnabled, setIsDetectionEnabled] = React.useState(true);
  const toggleDetection = React.useCallback(() => {
    setIsDetectionEnabled(prev => !prev);
  }, []);

  // 4. MediaPipe camera and gesture hook refs placeholder
  const videoElementRef = React.useRef(null);

  // 5. Blessing hook (API request, snapshot, TTS voice playback, waveform & cooldown)
  const {
    audioRef,
    isProcessing,
    isPlayingAudio,
    blessingText,
    blessingStatus,
    isCooldownActive,
    cooldownRemaining,
    processingMsg,
    hasLastBlessing,
    triggerDivineBlessing,
    replayAudio
  } = useBlessing({
    videoRef: videoElementRef,
    onStartBlessingAudio: () => pauseForegroundMusic(0.5),
    onEndBlessingAudio: () => resumeForegroundMusic(),
    onPlayBell: playTempleBell,
    onStartAmbience: startDevotionalAmbience,
    onStopAmbience: stopDevotionalAmbience,
    onSpawnPetals: spawnFlowerPetalsRain
  });

  // 6. MediaPipe Hands setup and gesture detection
  const {
    videoRef: mpVideoRef,
    canvasRef: mpCanvasRef,
    cameraStatus,
    isCameraLive,
    handsCount,
    gestureInstruction,
    holdProgress,
    fps,
    diagnostics,
    startCamera
  } = useMediaPipeHands({
    onTriggerBlessing: triggerDivineBlessing,
    isCooldownActive,
    isBlessingActive: isProcessing || isPlayingAudio,
    isDetectionEnabled
  });

  // Attach mpVideoRef to videoElementRef for snapshot capture
  const handleSetVideoRef = (node) => {
    mpVideoRef.current = node;
    videoElementRef.current = node;
  };

  return (
    <>
      {/* Fixed Spiritual Particles & Petals Canvas */}
      <ParticlesBackground canvasRef={particlesCanvasRef} />

      <div className="container">
        {/* Header */}
        <Header />

        {/* Main Grid */}
        <div className="app-grid">
          {/* Left Column: Compact Camera Feed, Controls & Sensor Diagnostics */}
          <div className="glass-card camera-column">
            <CameraCard
              videoRef={handleSetVideoRef}
              canvasRef={mpCanvasRef}
              cameraStatus={cameraStatus}
              isCameraLive={isCameraLive}
              handsCount={handsCount}
              gestureInstruction={gestureInstruction}
              holdProgress={holdProgress}
              isDetectionEnabled={isDetectionEnabled}
            />

            <ControlsRow
              onManualTrigger={triggerDivineBlessing}
              onToggleDetection={toggleDetection}
              isDetectionEnabled={isDetectionEnabled}
              onToggleSound={toggleSound}
              isSoundMuted={isSoundMuted}
              onToggleCam={startCamera}
              onReplayAudio={replayAudio}
              hasLastBlessing={hasLastBlessing}
              isCooldownActive={isCooldownActive}
              cooldownRemaining={cooldownRemaining}
              isProcessing={isProcessing}
              isPlayingAudio={isPlayingAudio}
            />

            <DiagnosticsPanel fps={fps} diagnostics={diagnostics} />
          </div>

          {/* Right Column: Grand Divine Darshan & Blessings */}
          <div className="blessing-column">
            <BappaHero isProcessing={isProcessing} />

            <BlessingCard
              isProcessing={isProcessing}
              isPlayingAudio={isPlayingAudio}
              blessingText={blessingText}
              blessingStatus={blessingStatus}
              processingMsg={processingMsg}
            />
          </div>
        </div>

        {/* Instruction steps */}
        <InstructionSteps />
      </div>

      {/* Hidden Audio Element for Blessing playback */}
      <audio ref={audioRef} id="blessing-audio" preload="auto" />
    </>
  );
}
