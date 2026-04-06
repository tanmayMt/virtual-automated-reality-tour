import React from 'react';
import { cloudinaryThumbnail } from '../utils/cloudinaryThumb.js';

/**
 * Bottom-centered room carousel over the panorama.
 *
 * @param {object} props
 * @param {Array<{ _id: string, name?: string, imageUrl?: string }>} props.rooms
 * @param {string | null} props.currentRoomId
 * @param {(roomId: string) => void} props.setCurrentRoomId
 */
export default function RoomSelectorBar({ rooms, currentRoomId, setCurrentRoomId }) {
  if (!Array.isArray(rooms) || rooms.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center">
      <div
        className="pointer-events-auto w-full max-w-5xl px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-14 sm:px-4 sm:pb-4"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 50%, transparent 100%)',
        }}
      >
        <div className="rounded-2xl border border-white/10 bg-black/50 px-3 py-3 shadow-2xl backdrop-blur-md sm:px-4 sm:py-3.5">
          <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
            Rooms
          </p>
          <div
            className="flex touch-pan-x gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [-webkit-overflow-scrolling:touch] sm:justify-center sm:gap-3"
            style={{ scrollbarWidth: 'thin' }}
          >
            {rooms.map((room) => {
              const id =
                room?._id != null ? String(room._id) : room?.id != null ? String(room.id) : '';
              if (!id) {
                return null;
              }
              const active = id === String(currentRoomId);
              const thumbSrc = cloudinaryThumbnail(room.imageUrl || '', 200, 120);

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCurrentRoomId(id)}
                  className={`group flex min-w-[5.25rem] max-w-[6.5rem] shrink-0 flex-col overflow-hidden rounded-xl border-2 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black/60 sm:min-w-[6rem] sm:max-w-none ${
                    active
                      ? 'border-white bg-white/15 shadow-[0_0_24px_rgba(255,255,255,0.2)]'
                      : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                  }`}
                >
                  <div
                    className={`relative aspect-[5/3] w-full overflow-hidden bg-neutral-900 ${
                      active ? '' : 'opacity-80 group-hover:opacity-100'
                    }`}
                  >
                    {thumbSrc ? (
                      <img
                        src={thumbSrc}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        draggable={false}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-1 text-center text-[10px] text-white/50">
                        {room.name || 'Room'}
                      </div>
                    )}
                  </div>
                  <span
                    className={`truncate px-1.5 py-1.5 text-center text-[10px] font-medium sm:text-xs ${
                      active ? 'text-white' : 'text-white/65 group-hover:text-white'
                    }`}
                  >
                    {room.name || 'Room'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
