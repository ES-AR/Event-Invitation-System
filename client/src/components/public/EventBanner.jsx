// client/src/components/public/EventBanner.jsx
import React from "react";

export default function EventBanner({ event }) {
  if (!event) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 items-start justify-start p-6">
      {event.bannerUrl && (
        <img
          src={event.bannerUrl}
          alt="Event Banner"
          className="w-full h-48 rounded-lg object-cover shadow-md"
        />
      )}

      <h1 className="text-2xl font-bold text-black">{event.title}</h1>

      {event.description && (
        <p className="text-gray-700 text-sm">{event.description}</p>
      )}

      {event.location && (
        <p className="text-gray-500 text-xs">
          📍 <span className="font-medium">{event.location}</span>
        </p>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p>
          Main slots: {event.maxMainSlots} | Overflow slots: {event.maxOverflowSlots}
        </p>
        <p>
          Status: {event.isRegistrationOpen ? "Open" : "Closed"}
        </p>
      </div>
    </div>
  );
}
