"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { verifyToken } from "@/app/jwt/token"
import { Calendar, momentLocalizer } from "react-big-calendar"
import moment from "moment"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

moment.locale("en-GB")
const localizer = momentLocalizer(moment)

interface CalendarEvent {
  id: number
  title: string
  start: Date
  end: Date
}

const events = [
  {
    id: 1,
    title: "Oil Change - John Doe",
    start: new Date(2023, 5, 15, 10, 0),
    end: new Date(2023, 5, 15, 11, 0),
  },
  {
    id: 2,
    title: "Tire Rotation - Jane Smith",
    start: new Date(2023, 5, 16, 14, 0),
    end: new Date(2023, 5, 16, 15, 0),
  },
  // Add more appointments as needed
]

export default function AppointmentsPage() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Service Appointments</h1>
      <div className="mb-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add New Appointment</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Appointment</DialogTitle>
              <DialogDescription>
                Enter the details for the new service appointment.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customer" className="text-right">
                  Customer
                </Label>
                <Input id="customer" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="service" className="text-right">
                  Service
                </Label>
                <Input id="service" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date
                </Label>
                <Input id="date" type="date" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">
                  Time
                </Label>
                <Input id="time" type="time" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Appointment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        onSelectEvent={handleSelectEvent}
      />
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedEvent.title}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>Start: {moment(selectedEvent.start).format("LLLL")}</div>
              <div>End: {moment(selectedEvent.end).format("LLLL")}</div>
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedEvent(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

