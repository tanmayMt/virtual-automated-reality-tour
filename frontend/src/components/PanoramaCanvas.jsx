import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pannellum } from 'pannellum-react';

function normalizeTargetId(raw) {
  if (raw == null || raw === '') {
    return '';
  }
  if (typeof raw === 'object' && raw !== null && '$oid' in raw) {
    return String(raw.$oid);
  }
  return String(raw);
}

/**
 * Full-screen 360° viewer with navigation + feature hotspots.
 *
 * @param {object} props
 * @param {object | null} props.currentRoom
 * @param {(roomId: string) => void} props.setCurrentRoomId
 */
export default function PanoramaCanvas({ currentRoom, setCurrentRoomId }) {
  const setRoomRef = useRef(setCurrentRoomId);
  setRoomRef.current = setCurrentRoomId;

  const [featureModal, setFeatureModal] = useState(null);

  const handleNavClick = useCallback((_event, args) => {
    const id = normalizeTargetId(args?.targetRoomId);
    if (!id) {
      return;
    }
    setFeatureModal(null);
    setRoomRef.current(id);
  }, []);

  const featureTooltip = useCallback((hotSpotDiv, args) => {
    hotSpotDiv.classList.add('tour-feature-anchor');
    const inner = document.createElement('div');
    inner.className = 'tour-feature-popover';
    const titleEl = document.createElement('div');
    titleEl.className = 'tour-feature-popover-title';
    titleEl.textContent = args?.text || 'Feature';
    inner.appendChild(titleEl);
    const desc = (args?.description || '').trim();
    if (desc) {
      const p = document.createElement('p');
      p.className = 'tour-feature-popover-desc';
      p.textContent = desc;
      inner.appendChild(p);
    }
    hotSpotDiv.appendChild(inner);
  }, []);

  const handleFeatureClick = useCallback((_event, args) => {
    setFeatureModal({
      text: args?.text || 'Feature',
      description: (args?.description || '').trim(),
    });
  }, []);

  const hotspots = currentRoom?.hotspots;

  const hotspotElements = useMemo(() => {
    if (!Array.isArray(hotspots) || hotspots.length === 0) {
      return null;
    }

    return hotspots.map((h, idx) => {
      const key = h._id || `hs-${idx}-${h.yaw}-${h.pitch}`;

      if (h.type === 'navigation') {
        const targetId = normalizeTargetId(h.targetRoomId);
        if (!targetId) {
          return null;
        }
        return (
          <Pannellum.Hotspot
            key={key}
            type="custom"
            pitch={h.pitch}
            yaw={h.yaw}
            cssClass="tour-nav-arrow"
            handleClick={handleNavClick}
            handleClickArg={{ targetRoomId: targetId }}
          />
        );
      }

      if (h.type === 'feature') {
        return (
          <Pannellum.Hotspot
            key={key}
            type="custom"
            pitch={h.pitch}
            yaw={h.yaw}
            cssClass="tour-feature-info"
            tooltip={featureTooltip}
            tooltipArg={{ text: h.text || '', description: h.description || '' }}
            handleClick={handleFeatureClick}
            handleClickArg={{ text: h.text || '', description: h.description || '' }}
          />
        );
      }

      return null;
    });
  }, [hotspots, handleNavClick, handleFeatureClick, featureTooltip]);

  const room = currentRoom;
  const imageUrl =
    room && typeof room.imageUrl === 'string' && room.imageUrl.trim() !== '' ? room.imageUrl.trim() : '';
  const roomKey = room?._id != null ? String(room._id) : room?.id != null ? String(room.id) : '';

  const [sceneVisible, setSceneVisible] = useState(true);
  const prevKeyRef = useRef(null);

  /** pannellum-react crashes in componentDidUpdate if children is null (accesses .length). */
  const hotspotChildren = hotspotElements != null ? hotspotElements : [];

  useEffect(() => {
    setFeatureModal(null);
  }, [roomKey, imageUrl]);

  useEffect(() => {
    if (!roomKey && !imageUrl) {
      return;
    }
    const key = `${roomKey}|${imageUrl || ''}`;
    if (prevKeyRef.current === null) {
      prevKeyRef.current = key;
      setSceneVisible(true);
      return;
    }
    if (prevKeyRef.current === key) {
      return;
    }
    prevKeyRef.current = key;
    setSceneVisible(false);
    const show = () => setSceneVisible(true);
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(show);
    });
    return () => window.cancelAnimationFrame(id);
  }, [roomKey, imageUrl]);

  if (!room || !imageUrl) {
    return (
      <div className="flex h-full min-h-[100vh] w-full items-center justify-center bg-black px-4 text-center text-sm text-white">
        No Room Data
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[100vh] w-full bg-black">
      <div
        className={`h-full min-h-[100vh] w-full transition-[opacity,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          sceneVisible ? 'opacity-100 blur-0' : 'opacity-0 blur-lg'
        }`}
      >
        <Pannellum
          width="100%"
          height="100vh"
          image={imageUrl}
          pitch={0}
          yaw={0}
          hfov={110}
          autoLoad
          showControls
          showFullscreenCtrl
          mouseZoom
          draggable
        >
          {hotspotChildren}
        </Pannellum>
      </div>

      {featureModal ? (
        <div
          className="pointer-events-auto absolute inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md"
          role="presentation"
          onClick={() => setFeatureModal(null)}
          onKeyDown={(e) => e.key === 'Escape' && setFeatureModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feature-modal-title"
            className="relative w-full max-w-md rounded-2xl border border-white/15 bg-black/70 p-6 shadow-2xl backdrop-blur-xl"
            style={{ WebkitBackdropFilter: 'blur(24px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setFeatureModal(null)}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg leading-none text-white transition hover:bg-white/20"
            >
              ×
            </button>
            <p
              id="feature-modal-title"
              className="pr-10 text-lg font-semibold leading-snug text-white"
            >
              {featureModal.text}
            </p>
            {featureModal.description ? (
              <p className="mt-4 text-sm leading-relaxed text-white/80">{featureModal.description}</p>
            ) : (
              <p className="mt-4 text-sm italic text-white/45">No additional details.</p>
            )}
            <button
              type="button"
              onClick={() => setFeatureModal(null)}
              className="mt-6 w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-white/90"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
