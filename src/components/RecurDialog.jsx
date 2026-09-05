import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WEEKDAY_OPTIONS, recurrenceDates } from "@/lib/quarterUtils";
import { cn } from "@/lib/utils";

export default function RecurDialog({ open, onOpenChange, quarter, onSave }) {
  const [title, setTitle] = useState("");
  const [weekdays, setWeekdays] = useState([]);
  const [rangeStart, setRangeStart] = useState(quarter?.start_date || "");
  const [rangeEnd, setRangeEnd] = useState(quarter?.end_date || "");

  useEffect(() => {
    if (open) {
      setTitle("");
      setWeekdays([]);
      setRangeStart(quarter?.start_date || "");
      setRangeEnd(quarter?.end_date || "");
    }
  }, [open, quarter]);

  const toggleDay = (v) =>
    setWeekdays((w) => (w.includes(v) ? w.filter((x) => x !== v) : [...w, v]));
  const preview = recurrenceDates(
    quarter?.start_date,
    quarter?.end_date,
    weekdays,
    rangeStart,
    rangeEnd,
  );

  const submit = () => {
    if (!title.trim() || weekdays.length === 0) return;
    onSave({ title: title.trim(), dates: preview });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recurring activity</DialogTitle>
          <DialogDescription>
            Repeats on selected weekdays within a date range inside this
            quarter. Each occurrence is independent — you can edit one without
            changing the others.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="rtitle">Title</Label>
            <Input
              id="rtitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Repeat on</Label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  className={cn(
                    "h-9 w-9 rounded-lg border text-sm font-medium transition-colors",
                    weekdays.includes(d.value)
                      ? "border-transparent bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted",
                  )}
                  title={d.label}
                >
                  {d.label[0]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rstart">From</Label>
              <Input
                id="rstart"
                type="date"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rend">Until</Label>
              <Input
                id="rend"
                type="date"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
              />
            </div>
          </div>
          {weekdays.length > 0 && (
            <p className="text-sm text-muted-foreground">
              This will create{" "}
              <b className="text-foreground">{preview.length}</b> occurrence
              {preview.length === 1 ? "" : "s"}.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={
              !title.trim() || weekdays.length === 0 || preview.length === 0
            }
          >
            Create {preview.length || ""} occurrence
            {preview.length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
