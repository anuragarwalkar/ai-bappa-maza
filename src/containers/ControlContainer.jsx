import React, { useState } from 'react';
import { useRemoteController } from '../hooks/useRemoteController';
import { useSpiritualParticles } from '../hooks/useSpiritualParticles';
import { ParticlesBackground } from '../components/ParticlesBackground';

import { ControlHeader } from '../components/control/ControlHeader';
import { ControlLiveStream } from '../components/control/ControlLiveStream';
import { ControlActions } from '../components/control/ControlActions';
import { ControlStatusCard } from '../components/control/ControlStatusCard';
import { RestartConfirmModal } from '../components/RestartConfirmModal';

import '../styles/control.css';

/**
 * Mobile Remote Control Page Container (/control)
 */
export function ControlContainer() {
  const { canvasRef: particlesCanvasRef } = useSpiritualParticles();
  const [isRestartModalOpen, setIsRestartModalOpen] = useState(false);

  const {
    connectionStatus,
    state,
    liveFrame,
    latencyMs,
    isRestarting,
    restartMessage,
    triggerBlessing,
    toggleDetection,
    toggleCamera,
    replayAudio,
    toggleSound,
    toggleFgMusic,
    restartServer
  } = useRemoteController();

  const handleOpenRestartModal = () => {
    setIsRestartModalOpen(true);
  };

  const handleCloseRestartModal = () => {
    if (!isRestarting) {
      setIsRestartModalOpen(false);
    }
  };

  const handleConfirmRestart = async () => {
    await restartServer();
    // Modal will stay while isRestarting or close once finished
    setTimeout(() => {
      setIsRestartModalOpen(false);
    }, 1500);
  };

  return (
    <>
      {/* Background Spiritual Ambient Particles */}
      <ParticlesBackground canvasRef={particlesCanvasRef} />

      <div className="control-page-layout">
        {/* Mobile Header */}
        <ControlHeader connectionStatus={connectionStatus} />

        {/* Global Floating Toast for Restart / System Feedback */}
        {restartMessage && (
          <div className={`control-toast-banner toast-${restartMessage.type}`}>
            <span className="toast-icon">
              {restartMessage.type === 'success' ? '✅' : restartMessage.type === 'error' ? '❌' : '🔄'}
            </span>
            <span className="toast-text">{restartMessage.text}</span>
          </div>
        )}

        <div className="control-content-stack">
          {/* 1. Live Video Stream View */}
          <ControlLiveStream
            liveFrame={liveFrame}
            isCameraLive={state.isCameraLive}
            isDetectionEnabled={state.isDetectionEnabled}
            handsCount={state.handsCount}
            fps={state.fps}
            latencyMs={latencyMs}
            connectionStatus={connectionStatus}
          />

          {/* 2. Primary & Quick Action Controls */}
          <ControlActions
            onManualTrigger={triggerBlessing}
            onToggleDetection={toggleDetection}
            isDetectionEnabled={state.isDetectionEnabled}
            onToggleCamera={toggleCamera}
            isCameraLive={state.isCameraLive}
            onReplayAudio={replayAudio}
            hasLastBlessing={state.hasLastBlessing}
            onToggleSound={toggleSound}
            isSoundMuted={state.isSoundMuted}
            onToggleFgMusic={toggleFgMusic}
            isFgMusicEnabled={state.isFgMusicEnabled}
            onRequestRestart={handleOpenRestartModal}
            isRestarting={isRestarting}
            isProcessing={state.isProcessing}
            isPlayingAudio={state.isPlayingAudio}
            isCooldownActive={state.isCooldownActive}
            cooldownRemaining={state.cooldownRemaining}
            connectionStatus={connectionStatus}
          />

          {/* 3. Live Bappa Blessing Status & Feed */}
          <ControlStatusCard
            blessingStatus={state.blessingStatus}
            blessingText={state.blessingText}
            isProcessing={state.isProcessing}
            isPlayingAudio={state.isPlayingAudio}
            handsCount={state.handsCount}
            fps={state.fps}
            gestureInstruction={state.gestureInstruction}
          />
        </div>
      </div>

      {/* Restart Server Confirmation Modal */}
      <RestartConfirmModal
        isOpen={isRestartModalOpen}
        onClose={handleCloseRestartModal}
        onConfirm={handleConfirmRestart}
        isRestarting={isRestarting}
      />
    </>
  );
}
