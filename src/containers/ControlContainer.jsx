import React from 'react';
import { useRemoteController } from '../hooks/useRemoteController';
import { useSpiritualParticles } from '../hooks/useSpiritualParticles';
import { ParticlesBackground } from '../components/ParticlesBackground';

import { ControlHeader } from '../components/control/ControlHeader';
import { ControlLiveStream } from '../components/control/ControlLiveStream';
import { ControlActions } from '../components/control/ControlActions';
import { ControlStatusCard } from '../components/control/ControlStatusCard';

import '../styles/control.css';

/**
 * Mobile Remote Control Page Container (/control)
 */
export function ControlContainer() {
  const { canvasRef: particlesCanvasRef } = useSpiritualParticles();

  const {
    connectionStatus,
    state,
    liveFrame,
    latencyMs,
    triggerBlessing,
    toggleDetection,
    toggleCamera,
    replayAudio,
    toggleSound,
    toggleFgMusic
  } = useRemoteController();

  return (
    <>
      {/* Background Spiritual Ambient Particles */}
      <ParticlesBackground canvasRef={particlesCanvasRef} />

      <div className="control-page-layout">
        {/* Mobile Header */}
        <ControlHeader connectionStatus={connectionStatus} />

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
    </>
  );
}
