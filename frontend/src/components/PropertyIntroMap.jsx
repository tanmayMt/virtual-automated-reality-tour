import React, { useEffect, useRef, useState } from 'react';

const SCRIPT_ID = 'google-maps-api-script';

function loadGoogleMapsScript(apiKey) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('No window'));
  }
  if (window.google?.maps?.Map) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      const deadline = Date.now() + 20000;
      const wait = () => {
        if (window.google?.maps?.Map) {
          resolve();
          return;
        }
        if (Date.now() > deadline) {
          reject(new Error('Google Maps load timeout'));
          return;
        }
        window.requestAnimationFrame(wait);
      };
      wait();
      return;
    }
    const s = document.createElement('script');
    s.id = SCRIPT_ID;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(s);
  });
}

/**
 * Satellite-style hero map. Uses Maps JavaScript API when `VITE_GOOGLE_MAPS_API_KEY` is set;
 * otherwise falls back to an iframe embed with motion + marker styling.
 */
export default function PropertyIntroMap({ lat, lng, title, address }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const canUseJsApi = Boolean(apiKey && hasCoords);
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [surface, setSurface] = useState(() => (canUseJsApi ? 'js' : 'iframe'));

  useEffect(() => {
    if (!canUseJsApi) {
      setSurface('iframe');
      return undefined;
    }

    let cancelled = false;
    let zoomTimeouts = [];

    (async () => {
      try {
        await loadGoogleMapsScript(apiKey);
        if (cancelled || !containerRef.current) {
          return;
        }
        const map = new window.google.maps.Map(containerRef.current, {
          center: { lat, lng },
          zoom: 10,
          mapTypeId: window.google.maps.MapTypeId.SATELLITE,
          disableDefaultUI: true,
          gestureHandling: 'none',
          draggable: false,
          scrollwheel: false,
          keyboardShortcuts: false,
        });
        mapInstanceRef.current = map;
        new window.google.maps.Marker({
          position: { lat, lng },
          map,
          title: title || address || 'Property',
        });

        let z = 10;
        const tick = () => {
          if (cancelled || !mapInstanceRef.current) {
            return;
          }
          z = Math.min(z + 0.3, 18);
          mapInstanceRef.current.setZoom(z);
          if (z < 18) {
            zoomTimeouts.push(window.setTimeout(tick, 100));
          }
        };
        zoomTimeouts.push(window.setTimeout(tick, 250));
        setSurface('js');
      } catch (err) {
        console.error('PropertyIntroMap: Google JS API failed, using iframe embed', err);
        if (!cancelled) {
          setSurface('iframe');
        }
      }
    })();

    return () => {
      cancelled = true;
      zoomTimeouts.forEach((t) => window.clearTimeout(t));
      mapInstanceRef.current = null;
    };
  }, [canUseJsApi, apiKey, lat, lng, title, address]);

  const embedQuery = hasCoords ? `${lat},${lng}` : encodeURIComponent(address || '');

  const [iframeZoom, setIframeZoom] = useState(10);

  useEffect(() => {
    if (surface !== 'iframe' || !hasCoords) {
      return undefined;
    }
    let z = 10;
    const id = window.setInterval(() => {
      z = Math.min(z + 1, 18);
      setIframeZoom(z);
      if (z >= 18) {
        window.clearInterval(id);
      }
    }, 380);
    return () => window.clearInterval(id);
  }, [surface, hasCoords]);

  if (surface === 'iframe' || !canUseJsApi) {
    const src = `https://www.google.com/maps?q=${embedQuery}&z=${hasCoords ? iframeZoom : 16}&output=embed`;
    return (
      <div className="relative h-full w-full overflow-hidden bg-neutral-900">
        <div className="absolute inset-0 scale-[1.08] animate-[introMapDrift_22s_ease-in-out_infinite_alternate]">
          <iframe
            title="Property location"
            src={src}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(0,0,0,0.2)_50%,rgba(0,0,0,0.55)_100%)]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.9)]" />
        <div className="pointer-events-none absolute left-1/2 top-[calc(50%+14px)] z-10 max-w-[90%] -translate-x-1/2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white/95 drop-shadow-md">
          {title || 'Property'}
        </div>
        <style>{`
          @keyframes introMapDrift {
            0% { transform: scale(1.06) translate3d(-1.2%, -0.8%, 0); }
            100% { transform: scale(1.14) translate3d(1.2%, 1%, 0); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-neutral-900">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.9)]" />
    </div>
  );
}
