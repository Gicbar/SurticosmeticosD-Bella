// src/app/dashboard/components/DateRangePicker.tsx
"use client";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

type DateRangePickerProps = {
  dateRange: { start: Date; end: Date };
  setDateRange: (range: { start: Date; end: Date }) => void;
};

export default function DateRangePicker({ dateRange, setDateRange }: DateRangePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[300px] justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRange.start.toDateString()} - {dateRange.end.toDateString()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="range"
          selected={{ from: dateRange.start, to: dateRange.end }}
          onSelect={(range) => range?.from && range?.to && setDateRange({ start: range.from, end: range.to })}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
