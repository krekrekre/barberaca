"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { srLatn } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, Globe, Loader2 } from "lucide-react";
import { MONTH_NAMES } from "@/components/WeeklyCalendarTable";
import { cancelOwnAppointment } from "../actions";

/** Monday-first short labels (Calendly-style weekday row). */
const BOOKING_WEEKDAY_HEADERS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

export type TimeOffItem = { date: string; reason: string };

export type BookedAppointmentSummary = {
  id: string;
  startTime: string;
  serviceTitle: string | null;
  employeeName: string;
};

type Props = {
  currentMonth: Date;
  onMonthChange: (next: Date) => void;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  availabilityByDate: Record<string, { time: string; maxDuration: number }[]>;
  timeOffDates: TimeOffItem[];
  maxBookingAdvanceDays: number;
  onSlotSelect: (slot: { time: string; maxDuration: number }) => void;
  isLoading: boolean;
  /** Logged-in user's next upcoming appointment from the server, if any. */
  bookedAppointment?: BookedAppointmentSummary | null;
  /** Called after a successful cancel so the parent can refetch. */
  onBookedAppointmentCancelled?: () => void;
};

function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function BookingDayCalendar({
  currentMonth,
  onMonthChange,
  selectedDate,
  onSelectDate,
  availabilityByDate,
  timeOffDates,
  maxBookingAdvanceDays,
  onSlotSelect,
  isLoading,
  bookedAppointment = null,
  onBookedAppointmentCancelled,
}: Props) {
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!cancelDialogOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) setCancelDialogOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancelDialogOpen, isPending]);

  const openCancelDialog = () => {
    setCancelError(null);
    setCancelDialogOpen(true);
  };

  const executeCancelBooking = () => {
    if (!bookedAppointment?.id || isPending) return;
    setCancelError(null);
    startTransition(async () => {
      try {
        await cancelOwnAppointment(bookedAppointment.id);
        setCancelDialogOpen(false);
        onBookedAppointmentCancelled?.();
      } catch (e) {
        setCancelError(
          e instanceof Error ? e.message : "Otkazivanje nije uspelo.",
        );
      }
    });
  };
  const todayStart = startOfDay(new Date());
  const maxBookDate = startOfDay(addDays(todayStart, maxBookingAdvanceDays));

  const timeOffSet = useMemo(() => {
    const s = new Set<string>();
    for (const t of timeOffDates) {
      if (t.date?.slice(0, 10)) s.add(t.date.slice(0, 10));
    }
    return s;
  }, [timeOffDates]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  /** Cannot navigate before the month that contains today */
  const isPrevMonthDisabled =
    monthStart.getTime() <= startOfMonth(todayStart).getTime();
  const nextMonthStart = startOfMonth(addMonths(currentMonth, 1));
  const isNextMonthDisabled = isAfter(nextMonthStart, maxBookDate);

  const calendarCells = useMemo(() => {
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const leading = (monthStart.getDay() + 6) % 7;
    const cells: (Date | null)[] = Array.from({ length: leading }, () => null);
    for (const d of days) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [monthStart, monthEnd]);

  const selectedYmd = formatYMD(selectedDate);

  const slotsForSelectedDay = useMemo(() => {
    const raw = availabilityByDate[selectedYmd] ?? [];
    const sorted = [...raw].sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
    );
    const now = Date.now();
    return sorted.filter((s) => {
      const t = new Date(s.time).getTime();
      if (!isSameDay(selectedDate, todayStart)) return true;
      return t > now - 5 * 60 * 1000;
    });
  }, [availabilityByDate, selectedYmd, selectedDate, todayStart]);

  const isDaySelectable = (d: Date | null) => {
    if (!d) return false;
    const dayStart = startOfDay(d);
    if (isBefore(dayStart, todayStart)) return false;
    if (isAfter(dayStart, maxBookDate)) return false;
    return true;
  };

  const dayMeta = (d: Date | null) => {
    if (!d) return { disabled: true, off: false, hasSlots: false };
    const ymd = formatYMD(d);
    const disabled = !isDaySelectable(d);
    const off = timeOffSet.has(ymd);
    const slots = availabilityByDate[ymd];
    const hasSlots = !!(slots && slots.length > 0);
    return { disabled, off, hasSlots };
  };

  const timeZoneName =
    typeof Intl !== "undefined"
      ? (new Intl.DateTimeFormat("sr-Latn", {
          timeZone: "Europe/Belgrade",
          timeZoneName: "long",
        })
          .formatToParts(new Date())
          .find((p) => p.type === "timeZoneName")?.value ?? "CET")
      : "CET";

  return (
    <div className="booking-day-calendar">
      <div className="booking-day-layout">
        <div className="booking-day-calendar-panel">
          <h2 className="booking-day-section-title">Izaberite datum i vreme</h2>
          <div className="booking-day-nav">
            <button
              type="button"
              className="booking-day-nav-btn"
              aria-label="Prethodni mesec"
              disabled={isPrevMonthDisabled}
              onClick={() => onMonthChange(addMonths(currentMonth, -1))}
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>
            <span className="booking-day-month-label">
              {MONTH_NAMES[currentMonth.getMonth()]}{" "}
              {currentMonth.getFullYear()}.
            </span>
            <button
              type="button"
              className="booking-day-nav-btn booking-day-nav-btn--next"
              aria-label="Sledeći mesec"
              disabled={isNextMonthDisabled}
              onClick={() => onMonthChange(addMonths(currentMonth, 1))}
            >
              <ChevronRight size={22} strokeWidth={2.5} />
            </button>
          </div>

          <div className="booking-day-table-wrap">
            <table className="booking-day-table">
              <thead>
                <tr>
                  {BOOKING_WEEKDAY_HEADERS.map((name) => (
                    <th key={name} className="booking-day-weekday">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from(
                  { length: Math.ceil(calendarCells.length / 7) },
                  (_, row) => (
                    <tr key={row}>
                      {calendarCells
                        .slice(row * 7, row * 7 + 7)
                        .map((d, col) => {
                          const key = d ? d.toISOString() : `pad-${row}-${col}`;
                          const meta = dayMeta(d);
                          const selected = d
                            ? isSameDay(d, selectedDate)
                            : false;
                          const inMonth = d
                            ? isSameMonth(d, currentMonth)
                            : false;

                          const noAppointments =
                            !meta.disabled &&
                            !meta.off &&
                            !isLoading &&
                            !meta.hasSlots;
                          return (
                            <td key={key} className="booking-day-cell">
                              {d && inMonth ? (
                                <button
                                  type="button"
                                  className={[
                                    "booking-day-btn",
                                    selected ? "is-selected" : "",
                                    !meta.disabled && !meta.off && meta.hasSlots
                                      ? "has-slots"
                                      : "",
                                    meta.off ? "is-off" : "",
                                    noAppointments ? "is-empty-day" : "",
                                  ]
                                    .filter(Boolean)
                                    .join(" ")}
                                  data-selected={selected ? "true" : "false"}
                                  disabled={
                                    meta.disabled ||
                                    meta.off ||
                                    noAppointments
                                  }
                                  onClick={() => onSelectDate(startOfDay(d))}
                                >
                                  <span>{d.getDate()}</span>
                                </button>
                              ) : (
                                <div className="booking-day-empty" />
                              )}
                            </td>
                          );
                        })}
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          <div className="booking-day-timezone">
            <span className="booking-day-timezone-label">Vremenska zona</span>
            <div className="booking-day-timezone-row">
              <Globe size={18} strokeWidth={1.75} aria-hidden />
              <span>
                {timeZoneName} ({format(new Date(), "HH:mm")})
              </span>
            </div>
          </div>

          {bookedAppointment ? (
            <div className="booking-day-my-booking">
              <span className="booking-day-timezone-label">
                Vaš zakazani termin
              </span>
              <div className="booking-day-my-booking-card">
                <CalendarDays
                  size={18}
                  strokeWidth={1.75}
                  aria-hidden
                  className="booking-day-my-booking-icon"
                />
                <div className="booking-day-my-booking-main">
                  <p className="booking-day-my-booking-date">
                    {format(
                      new Date(bookedAppointment.startTime),
                      "EEEE, d. MMMM yyyy.",
                      { locale: srLatn },
                    )}
                  </p>
                  <p className="booking-day-my-booking-time">
                    {format(new Date(bookedAppointment.startTime), "HH:mm")}
                  </p>
                  <p className="booking-day-my-booking-meta">
                    {bookedAppointment.serviceTitle ?? "Usluga"} ·{" "}
                    {bookedAppointment.employeeName}
                  </p>
                </div>
                <button
                  type="button"
                  className="booking-day-my-booking-cancel"
                  onClick={openCancelDialog}
                >
                  Otkaži termin
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="booking-day-appointments-panel">
          <h3 className="booking-day-slots-heading">
            {format(selectedDate, "EEEE, d. MMMM yyyy.", { locale: srLatn })}
          </h3>

          <div className="booking-day-appointments-body">
            {isLoading ? (
              <p style={{ color: "var(--text-secondary)", margin: 0 }}>
                Učitavanje...
              </p>
            ) : (
              <>
                {timeOffSet.has(selectedYmd) ? (
                  <p style={{ color: "var(--text-secondary)", margin: 0 }}>
                    Neradni dan — nema slobodnih termina.
                  </p>
                ) : slotsForSelectedDay.length === 0 ? (
                  <p style={{ color: "var(--text-secondary)", margin: 0 }}>
                    Nema slobodnih termina za ovaj dan.
                  </p>
                ) : (
                  <div className="booking-slots-grid">
                    {slotsForSelectedDay.map((slot) => {
                      const start = new Date(slot.time);
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          className="booking-slot-btn"
                          onClick={() => onSlotSelect(slot)}
                        >
                          {format(start, "HH:mm")}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {cancelDialogOpen && bookedAppointment ? (
        <div className="booking-cancel-dialog-root">
          <button
            type="button"
            className="booking-cancel-dialog-backdrop"
            aria-label="Zatvori"
            disabled={isPending}
            onClick={() => !isPending && setCancelDialogOpen(false)}
          />
          <div
            className="booking-cancel-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-cancel-dialog-title"
          >
            <h2
              id="booking-cancel-dialog-title"
              className="booking-cancel-dialog-title"
            >
              Otkazivanje termina
            </h2>
            <p className="booking-cancel-dialog-lead">
              Da li ste sigurni da želite da otkažete sledeći termin?
            </p>
            <div className="booking-cancel-dialog-summary">
              <p className="booking-cancel-dialog-summary-line">
                {format(
                  new Date(bookedAppointment.startTime),
                  "EEEE, d. MMMM yyyy.",
                  { locale: srLatn },
                )}
              </p>
              <p className="booking-cancel-dialog-summary-time">
                {format(new Date(bookedAppointment.startTime), "HH:mm")}
              </p>
              <p className="booking-cancel-dialog-summary-meta">
                {bookedAppointment.serviceTitle ?? "Usluga"} ·{" "}
                {bookedAppointment.employeeName}
              </p>
            </div>
            {cancelError ? (
              <p className="booking-cancel-dialog-error" role="alert">
                {cancelError}
              </p>
            ) : null}
            <div className="booking-cancel-dialog-actions">
              <button
                type="button"
                className="booking-cancel-dialog-btn booking-cancel-dialog-btn--secondary"
                disabled={isPending}
                onClick={() => setCancelDialogOpen(false)}
              >
                Odustani
              </button>
              <button
                type="button"
                className="booking-cancel-dialog-btn booking-cancel-dialog-btn--danger"
                disabled={isPending}
                onClick={executeCancelBooking}
              >
                {isPending ? (
                  <>
                    <Loader2
                      size={16}
                      className="booking-day-my-booking-cancel-spin"
                      aria-hidden
                    />
                    Otkazivanje…
                  </>
                ) : (
                  "Da, otkaži termin"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
