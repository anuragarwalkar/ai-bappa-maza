import React, { useState, useCallback, useRef } from 'react';
import { useSpiritualParticles } from '../hooks/useSpiritualParticles';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useBlessing } from '../hooks/useBlessing';
import { useMediaPipeHands } from '../hooks/useMediaPipeHands';
import { usePcRemoteBroadcaster } from '../hooks/usePcRemoteBroadcaster';
import { useServerRestart } from '../hooks/useServerRestart';

import { ParticlesBackground } from '../components/ParticlesBackground';
import { Header } from '../components/Header';
import { CameraCard } from '../components/CameraCard';
import { ControlsRow } from '../components/ControlsRow';
import { BappaHero } from '../components/BappaHero';
import { BlessingCard } from '../components/BlessingCard';
import { DiagnosticsPanel } from '../components/DiagnosticsPanel';
import { InstructionSteps } from '../components/InstructionSteps';
import { QrModal } from '../components/QrModal';
import { RestartConfirmModal } from '../components/RestartConfirmModal';
import { Footer } from '../components/Footer';

/**
 * Main Container Component — Orchestrates all state, hooks, audio engine, gesture detection, and UI
 */
export function AppContainer() {
  // 1. Spiritual background particles & flower petals
  const { canvasRef: particlesCanvasRef, spawnFlowerPetalsRain } = useSpiritualParticles();

  // 2. Audio engine (Temple bell, foreground playlist loop, ambient chime)
  const {
    isSoundMuted,
    isFgMusicEnabled,
    setSoundMuted,
    toggleSound,
    setForegroundMusicEnabled,
    toggleForegroundMusic,
    playTempleBell,
    pauseForegroundMusic,
    resumeForegroundMusic,
    startDevotionalAmbience,
    stopDevotionalAmbience
  } = useAudioEngine();

  // 3. Gesture Detection Toggle State
  const [isDetectionEnabled, setIsDetectionEnabled] = useState(true);
  const toggleDetection = useCallback(() => {
    setIsDetectionEnabled(prev => !prev);
  }, []);
  const setDetection = useCallback((enabled) => {
    setIsDetectionEnabled(Boolean(enabled));
  }, []);

  // 4. MediaPipe camera and gesture hook refs placeholder
  const videoElementRef = useRef(null);

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

  // Sync blessing audio mute state with isSoundMuted
  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isSoundMuted;
    }
  }, [isSoundMuted, audioRef]);

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
    startCamera,
    stopCamera,
    toggleCamera,
    setCameraEnabled
  } = useMediaPipeHands({
    onTriggerBlessing: triggerDivineBlessing,
    isCooldownActive,
    isBlessingActive: isProcessing || isPlayingAudio,
    isDetectionEnabled
  });

  // Attach mpVideoRef to videoElementRef for snapshot capture
  const handleSetVideoRef = useCallback((node) => {
    mpVideoRef.current = node;
    videoElementRef.current = node;
  }, [mpVideoRef]);

  // 7. QR modal state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // 8. Server Restart hook
  const {
    isRestartModalOpen,
    isRestarting,
    restartMessage,
    openRestartModal,
    closeRestartModal,
    restartServer
  } = useServerRestart();

  // 9. Remote Control Broadcaster (Streams PC canvas/video frames & syncs state)
  const { controllerCount } = usePcRemoteBroadcaster({
    canvasRef: mpCanvasRef,
    videoRef: videoElementRef,
    isCameraLive,
    isDetectionEnabled,
    isProcessing,
    isPlayingAudio,
    isCooldownActive,
    cooldownRemaining,
    handsCount,
    fps,
    blessingText,
    blessingStatus,
    hasLastBlessing,
    isSoundMuted,
    isFgMusicEnabled,
    onTriggerBlessing: triggerDivineBlessing,
    onToggleDetection: toggleDetection,
    onSetDetection: setDetection,
    onToggleCamera: toggleCamera,
    onSetCamera: setCameraEnabled,
    onReplayAudio: replayAudio,
    onToggleSound: toggleSound,
    onSetSound: setSoundMuted,
    onToggleFgMusic: toggleForegroundMusic,
    onSetFgMusic: setForegroundMusicEnabled
  });

  return (
    <>
      {/* Fixed Spiritual Particles & Petals Canvas */}
      <ParticlesBackground canvasRef={particlesCanvasRef} />

      <div className="container">
        {/* Header with Mobile Remote & Restart Server Buttons */}
        <Header
          onOpenRemoteModal={() => setIsQrModalOpen(true)}
          controllerCount={controllerCount}
          onOpenRestartModal={openRestartModal}
          isRestarting={isRestarting}
        />

        {/* Global Toast for Restart / System Feedback */}
        {restartMessage && (
          <div className={`control-toast-banner toast-${restartMessage.type}`} style={{ marginBottom: '1rem' }}>
            <span className="toast-icon">
              {restartMessage.type === 'success' ? '✅' : restartMessage.type === 'error' ? '❌' : '🔄'}
            </span>
            <span className="toast-text">{restartMessage.text}</span>
          </div>
        )}

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
              onToggleFgMusic={toggleForegroundMusic}
              isFgMusicEnabled={isFgMusicEnabled}
              onToggleCam={toggleCamera}
              isCameraLive={isCameraLive}
              onReplayAudio={replayAudio}
              hasLastBlessing={hasLastBlessing}
              onRequestRestart={openRestartModal}
              isRestarting={isRestarting}
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

        {/* Creator Attribution Footer */}
        <Footer />
      </div>

      {/* QR Code Connection Modal */}
      <QrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />

      {/* Restart Confirmation Modal */}
      <RestartConfirmModal
        isOpen={isRestartModalOpen}
        onClose={closeRestartModal}
        onConfirm={restartServer}
        isRestarting={isRestarting}
      />

      {/* Hidden Audio Element for Blessing playback */}
      <audio ref={audioRef} id="blessing-audio" preload="auto" />
    </>
  );
}
