import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";

export default function ActivityDialog({
  open,
  onOpenChange,
  activity,
  defaultDate,
  onSave,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(defaultDate);

  useEffect(() => {
    if (open) {
      setTitle(activity?.title || "");
      setDescription(activity?.description || "");
      setDate(activity?.date || defaultDate);
    }
  }, [open, activity, defaultDate]);

  const submit = () => {
    if (!title.trim() || !date) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      date,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {activity ? "Edit activity" : "New activity"}
          </DialogTitle>

          <DialogDescription>
            Plan an activity for a specific day.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="atitle">Title</Label>
            <Input
              id="atitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adesc">Description (optional)</Label>
            <Textarea
              id="adesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adate">Date</Label>
            <Input
              id="adate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button onClick={submit} disabled={!title.trim() || !date}>
            {activity ? "Save" : "Add activity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
