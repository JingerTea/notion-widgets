"use client";

import React, { useState, useEffect, useRef } from "react";
import { format, addMinutes, differenceInDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { X, Moon, Sun, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocalStorage } from "usehooks-ts";

interface Timezone {
  name: string;
  zone: string;
  offset: string;
}

const allTimezones: Timezone[] = [
  { name: "New York", zone: "America/New_York", offset: "-05:00" },
  { name: "London", zone: "Europe/London", offset: "+00:00" },
  { name: "Tokyo", zone: "Asia/Tokyo", offset: "+09:00" },
  { name: "Beijing", zone: "Asia/Shanghai", offset: "+08:00" },
  { name: "Dar es Salaam", zone: "Africa/Dar_es_Salaam", offset: "+03:00" },
  { name: "India", zone: "Asia/Kolkata", offset: "+05:30" },
  { name: "Myanmar", zone: "Asia/Yangon", offset: "+06:30" },
  // Add more timezones as needed
];

const defaultTimezones: Timezone[] = [
  { name: "New York", zone: "America/New_York", offset: "-05:00" },
  { name: "India", zone: "Asia/Kolkata", offset: "+05:30" },
  { name: "Myanmar", zone: "Asia/Yangon", offset: "+06:30" },
];

interface TimeGearProps {
  onTimeChange: (minutes: number) => void;
}

const TimeGear: React.FC<TimeGearProps> = ({ onTimeChange }) => {
  const gearRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [offset, setOffset] = useState(0);
  const [timeChange, setTimeChange] = useState(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const newOffset = offset + dx;
    setOffset(newOffset);

    const quarterHourChange = Math.floor(-newOffset / 10) / 4; // Each 10px of movement represents 0.25 hours (15 minutes)
    if (quarterHourChange !== timeChange) {
      setTimeChange(quarterHourChange);
      onTimeChange(quarterHourChange * 60); // Convert to minutes
    }

    setStartX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetTimeChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTimeChange(0);
    setOffset(0);
    onTimeChange(0);
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, startX, offset, timeChange]);

  const formatTimeChange = (change: number) => {
    const days = Math.floor(Math.abs(change) / 24);
    const hours = Math.abs(change) % 24;
    if (days > 0) {
      return `${change < 0 ? "-" : ""}${days}d ${hours}h`;
    }
    return `${change < 0 ? "-" : ""}${hours}h`;
  };

  return (
    <div
      ref={gearRef}
      className="relative h-24 bg-muted rounded-lg overflow-hidden cursor-move"
      onMouseDown={handleMouseDown}
    >
      <div className="absolute top-1 left-1/2 -translate-x-1/2 flex items-center justify-center h-6 min-w-[60px]">
        {timeChange === 0 ? (
          <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
        ) : (
          <div className="bg-secondary-foreground text-secondary px-2 py-1 rounded-full text-sm flex items-center justify-center">
            <span className="min-w-[60px] text-center select-none">{formatTimeChange(timeChange)}</span>
            <button className="ml-2 text-muted-foreground hover:text-secondary" onClick={resetTimeChange}>
              <X size={12} />
            </button>
          </div>
        )}
      </div>
      <div className="absolute inset-0 flex items-center mt-8" style={{ transform: `translateX(${offset % 400}px)` }}>
        {Array.from({ length: 97 }, (_, i) => (
          <div key={i} className={`flex-shrink-0 ${i % 4 === 0 ? "h-8 w-0.5" : "h-4 w-px"} bg-primary mx-2.5`} />
        ))}
      </div>
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-muted to-transparent" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-muted to-transparent" />
    </div>
  );
};

const TimezoneItem: React.FC<{ timezone: Timezone; baseTime: Date; timeOffset: number; onRemove: () => void }> = ({
  timezone,
  baseTime,
  timeOffset,
  onRemove,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const adjustedTime = addMinutes(baseTime, timeOffset);
  const zonedTime = toZonedTime(adjustedTime, timezone.zone);
  const timeString = format(zonedTime, "h:mm");
  const period = format(zonedTime, "a");
  const dateString = format(zonedTime, "EEEE, MMMM d");
  const isDaytime = parseInt(format(zonedTime, "H")) >= 6 && parseInt(format(zonedTime, "H")) < 18;

  const dayDifference = differenceInDays(zonedTime, baseTime);
  let relativeDay = "";
  if (dayDifference === 0) relativeDay = "Today";
  else if (dayDifference === 1) relativeDay = "Tomorrow";
  else if (dayDifference === -1) relativeDay = "Yesterday";
  else if (dayDifference > 1) relativeDay = `In ${dayDifference} days`;
  else relativeDay = `${Math.abs(dayDifference)} days ago`;

  return (
    <div
      className="flex justify-between items-center px-4 py-5 relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div>
        <div className="font-semibold text-primary">{timezone.name}</div>
        <div className="text-sm text-muted-foreground">{timezone.offset}</div>
      </div>
      <div className="text-right">
        <div className="text-2xl text-primary">
          {timeString}
          <sup className="text-sm ml-1">{period}</sup>
        </div>
        <div className="text-sm text-muted-foreground flex items-center justify-end">
          {dateString} {isDaytime ? <Sun size={12} className="ml-1" /> : <Moon size={12} className="ml-1" />}
        </div>
        <div className="text-xs text-muted-foreground">{relativeDay}</div>
      </div>
      {isHovered && (
        <button className="absolute top-2 right-2 text-muted-foreground hover:text-foreground" onClick={onRemove}>
          <X size={16} />
        </button>
      )}
    </div>
  );
};

const TimezoneSearch: React.FC<{ onSelect: (timezone: Timezone) => void; onClose: () => void }> = ({
  onSelect,
  onClose,
}) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Timezone[]>([]);

  useEffect(() => {
    if (search) {
      const filtered = allTimezones.filter(
        (tz) =>
          tz.name.toLowerCase().includes(search.toLowerCase()) || tz.zone.toLowerCase().includes(search.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [search]);

  return (
    <div className="p-4 bg-background">
      <div className="flex items-center mb-4">
        <Input
          type="text"
          placeholder="Search for a city or timezone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-grow mr-2 bg-input text-primary border-border"
        />
        <Button variant="ghost" onClick={onClose} className="p-2">
          <X size={20} />
        </Button>
      </div>
      <ScrollArea className="h-[330px]">
        {results.map((tz, index) => (
          <div key={index} className="p-2 hover:bg-muted cursor-pointer" onClick={() => onSelect(tz)}>
            <div className="text-primary">{tz.name}</div>
            <div className="text-sm text-muted-foreground">{tz.zone}</div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

export default function TimezoneConverter() {
  const [baseTime, setBaseTime] = useState(new Date());
  const [timeOffset, setTimeOffset] = useState(0);
  const [selectedTimezones, setSelectedTimezones] = useState<Timezone[]>(defaultTimezones);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedTimezones = localStorage.getItem("selectedTimezones");
    if (storedTimezones) {
      setSelectedTimezones(JSON.parse(storedTimezones));
    }
    setIsLoading(false);

    const timer = setInterval(() => setBaseTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("selectedTimezones", JSON.stringify(selectedTimezones));
    }
  }, [selectedTimezones, isLoading]);

  const adjustTime = (minutes: number) => {
    setTimeOffset(minutes);
  };

  const addTimezone = (timezone: Timezone) => {
    setSelectedTimezones((prev) => {
      if (prev.some((tz) => tz.zone === timezone.zone)) {
        // Timezone already exists, don't add it
        return prev;
      }
      return [...prev, timezone];
    });
    setIsSearchVisible(false);
  };

  const closeSearch = () => {
    setIsSearchVisible(false);
  };

  const removeTimezone = (index: number) => {
    setSelectedTimezones((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-md mx-auto bg-background rounded-lg border overflow-hidden">
      {!isSearchVisible ? (
        <>
          <div className="p-4 bg-muted">
            <TimeGear onTimeChange={adjustTime} />
          </div>
          <ScrollArea className="flex flex-col min-h-[330px] max-h-[530px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-[330px]">
                <div className="text-center text-muted-foreground">Loading...</div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {selectedTimezones.map((tz, index) => (
                  <TimezoneItem
                    key={index}
                    timezone={tz}
                    baseTime={baseTime}
                    timeOffset={timeOffset}
                    onRemove={() => removeTimezone(index)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </>
      ) : (
        <div className="p-4">
          <TimezoneSearch onSelect={addTimezone} onClose={closeSearch} />
        </div>
      )}
      <div className="p-4">
        {!isSearchVisible && (
          <Button variant="secondary" className="w-full py-4" onClick={() => setIsSearchVisible(true)}>
            <Plus size={16} className="mr-2" /> Add Timezone
          </Button>
        )}
      </div>
    </div>
  );
}
