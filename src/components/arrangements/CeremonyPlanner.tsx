"use client";

import { useState } from "react";
import { Calendar, Clock, MapPin, User, Music, BookOpen, FileText } from "lucide-react";

interface CeremonyDetails {
  date?: string;
  time?: string;
  location?: string;
  officiant?: string;
  musicSelections: string[];
  readings: string[];
  specialRequests?: string;
}

interface CeremonyPlannerProps {
  initialDetails?: Partial<CeremonyDetails>;
  onChange: (details: CeremonyDetails) => void;
}

const musicOptions = [
  "Amazing Grace",
  "Ave Maria",
  "How Great Thou Art",
  "The Lord's Prayer",
  "Wind Beneath My Wings",
  "Go Rest High on That Mountain",
  "I Can Only Imagine",
  "In the Garden",
];

const readingOptions = [
  "Psalm 23",
  "1 Corinthians 13",
  "John 14:1-6",
  "Romans 8:38-39",
  "Do Not Stand at My Grave and Weep",
  "The Dash",
  "Footprints in the Sand",
  "When Tomorrow Starts Without Me",
];

export default function CeremonyPlanner({
  initialDetails,
  onChange,
}: CeremonyPlannerProps) {
  const [details, setDetails] = useState<CeremonyDetails>({
    date: initialDetails?.date || "",
    time: initialDetails?.time || "",
    location: initialDetails?.location || "",
    officiant: initialDetails?.officiant || "",
    musicSelections: initialDetails?.musicSelections || [],
    readings: initialDetails?.readings || [],
    specialRequests: initialDetails?.specialRequests || "",
  });

  const updateDetail = <K extends keyof CeremonyDetails>(
    key: K,
    value: CeremonyDetails[K]
  ) => {
    const updated = { ...details, [key]: value };
    setDetails(updated);
    onChange(updated);
  };

  const toggleSelection = (
    array: string[],
    item: string,
    key: "musicSelections" | "readings"
  ) => {
    const updated = array.includes(item)
      ? array.filter((i) => i !== item)
      : [...array, item];
    updateDetail(key, updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Ceremony Planning
        </h2>
        <p className="text-sm text-gray-600">
          Plan the details for the memorial service or ceremony
        </p>
      </div>

      {/* Basic Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4" />
            Service Date
          </label>
          <input
            type="date"
            value={details.date}
            onChange={(e) => updateDetail("date", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
          />
        </div>

        {/* Time */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4" />
            Service Time
          </label>
          <input
            type="time"
            value={details.time}
            onChange={(e) => updateDetail("time", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
          />
        </div>

        {/* Location */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4" />
            Location
          </label>
          <input
            type="text"
            value={details.location}
            onChange={(e) => updateDetail("location", e.target.value)}
            placeholder="Chapel, church, or other location"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
          />
        </div>

        {/* Officiant */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4" />
            Officiant
          </label>
          <input
            type="text"
            value={details.officiant}
            onChange={(e) => updateDetail("officiant", e.target.value)}
            placeholder="Minister, priest, celebrant"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent"
          />
        </div>
      </div>

      {/* Music Selections */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
          <Music className="w-4 h-4" />
          Music Selections
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {musicOptions.map((music) => (
            <button
              key={music}
              onClick={() =>
                toggleSelection(details.musicSelections, music, "musicSelections")
              }
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${
                details.musicSelections.includes(music)
                  ? "bg-[--navy] text-white border-[--navy]"
                  : "bg-white text-gray-700 border-gray-300 hover:border-[--sage]"
              }`}
            >
              {music}
            </button>
          ))}
        </div>
      </div>

      {/* Readings */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
          <BookOpen className="w-4 h-4" />
          Scripture & Readings
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {readingOptions.map((reading) => (
            <button
              key={reading}
              onClick={() =>
                toggleSelection(details.readings, reading, "readings")
              }
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${
                details.readings.includes(reading)
                  ? "bg-[--navy] text-white border-[--navy]"
                  : "bg-white text-gray-700 border-gray-300 hover:border-[--sage]"
              }`}
            >
              {reading}
            </button>
          ))}
        </div>
      </div>

      {/* Special Requests */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <FileText className="w-4 h-4" />
          Special Requests & Notes
        </label>
        <textarea
          value={details.specialRequests}
          onChange={(e) => updateDetail("specialRequests", e.target.value)}
          placeholder="Any special requests, cultural considerations, or additional details..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--navy] focus:border-transparent resize-none"
        />
      </div>
    </div>
  );
}
