"use client";

import { useBooking } from "./BookingContext";
import { useState, useEffect } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  isAfter,
  isBefore,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { Service, User } from "@prisma/client";
import { useSession } from "next-auth/react";
import { Clock, MapPin } from "lucide-react";
import BookingDayCalendar, {
  type BookedAppointmentSummary,
} from "./BookingDayCalendar";
import { BRAND_CONFIG } from "@/config/brand";
import shellStyles from "./booking-shell.module.css";
import "@/app/admin/kalendar/_components/calendar.css";

function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Intersection of visible month with [today, today + maxBookingAdvanceDays]. */
function getBookableRangeInMonth(
  month: Date,
  maxBookingAdvanceDays: number,
): { start: Date; end: Date } | null {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const todayStart = startOfDay(new Date());
  const maxBookDate = startOfDay(addDays(new Date(), maxBookingAdvanceDays));
  if (isBefore(monthEnd, todayStart)) return null;
  const start =
    monthStart.getTime() < todayStart.getTime() ? todayStart : monthStart;
  const end =
    monthEnd.getTime() > maxBookDate.getTime() ? maxBookDate : monthEnd;
  if (isAfter(start, end)) return null;
  return { start, end };
}

export default function Step1Time({
  services = [],
  employees,
  slotDurationMinutes = 30,
  maxBookingAdvanceDays = 30,
  schedules: _schedules = [],
  irregularSchedules: _irregularSchedules = [],
}: {
  services?: Service[];
  employees: User[];
  slotDurationMinutes?: number;
  maxBookingAdvanceDays?: number;
  schedules?: any[];
  irregularSchedules?: any[];
}) {
  const {
    state,
    setEmployee,
    setTimeSlot,
    setDate,
    availabilityRefreshKey,
    bumpAvailabilityRefresh,
  } = useBooking();
  const { data: session, status: sessionStatus } = useSession();

  const [bookedAppointment, setBookedAppointment] =
    useState<BookedAppointmentSummary | null>(null);
  const [myBookingRefreshTick, setMyBookingRefreshTick] = useState(0);

  const [currentMonth, setCurrentMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [selectedDate, setSelectedDate] = useState(() =>
    startOfDay(new Date()),
  );
  const [availability, setAvailability] = useState<
    Record<string, { time: string; maxDuration: number }[]>
  >({});
  const [timeOffDates, setTimeOffDates] = useState<
    { date: string; reason: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sessionStatus !== "authenticated") {
      setBookedAppointment(null);
      return;
    }
    let cancelled = false;
    fetch("/api/booking/my-next", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { appointment: null }))
      .then((data) => {
        if (cancelled) return;
        const a = data?.appointment;
        if (a?.id && a?.startTime && a?.employeeName) {
          setBookedAppointment({
            id: a.id,
            startTime: a.startTime,
            serviceTitle: a.serviceTitle ?? null,
            employeeName: a.employeeName,
          });
        } else {
          setBookedAppointment(null);
        }
      })
      .catch(() => {
        if (!cancelled) setBookedAppointment(null);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionStatus, session?.user?.id, availabilityRefreshKey]);

  useEffect(() => {
    if (!state.selectedEmployee && employees.length > 0) {
      setEmployee(employees[0]);
    }
  }, [state.selectedEmployee, employees, setEmployee]);

  useEffect(() => {
    setDate(selectedDate);
  }, [selectedDate, setDate]);

  useEffect(() => {
    if (!state.selectedEmployee?.id) return;
    setSelectedDate(startOfDay(new Date()));
    setCurrentMonth(startOfMonth(new Date()));
  }, [state.selectedEmployee?.id]);

  useEffect(() => {
    if (!state.selectedEmployee) return;
    let isMounted = true;
    fetch(`/api/booking/time-off?employeeId=${state.selectedEmployee.id}`, {
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : { dates: [] }))
      .then((data) => {
        if (isMounted) setTimeOffDates(data.dates ?? []);
      })
      .catch(() => {
        if (isMounted) setTimeOffDates([]);
      });
    return () => {
      isMounted = false;
    };
  }, [state.selectedEmployee]);

  useEffect(() => {
    if (!state.selectedEmployee) return;

    let isMounted = true;

    async function load() {
      setIsLoading(true);
      try {
        const range = getBookableRangeInMonth(
          currentMonth,
          maxBookingAdvanceDays,
        );
        if (!range) {
          if (isMounted) {
            setAvailability({});
            setIsLoading(false);
          }
          return;
        }
        const startStr = formatYMD(range.start);
        const endStr = formatYMD(range.end);
        const availRes = await fetch(
          `/api/booking/availability?employeeId=${state.selectedEmployee!.id}&startDate=${startStr}&endDate=${endStr}&stepMinutes=${slotDurationMinutes}`,
          { cache: "no-store" },
        );

        if (availRes.ok) {
          const data = await availRes.json();
          if (isMounted) setAvailability(data.availability ?? {});
        }
      } catch (err) {
        console.error("Failed to fetch slots", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [
    currentMonth,
    state.selectedEmployee,
    slotDurationMinutes,
    maxBookingAdvanceDays,
  ]);

  /** After a successful booking, refresh slots without full page reload or blocking loading UI */
  useEffect(() => {
    if (availabilityRefreshKey === 0 || !state.selectedEmployee) return;

    let isMounted = true;

    async function silentRefetch() {
      try {
        const range = getBookableRangeInMonth(
          currentMonth,
          maxBookingAdvanceDays,
        );
        if (!range) {
          if (isMounted) setAvailability({});
          return;
        }
        const startStr = formatYMD(range.start);
        const endStr = formatYMD(range.end);
        const availRes = await fetch(
          `/api/booking/availability?employeeId=${state.selectedEmployee!.id}&startDate=${startStr}&endDate=${endStr}&stepMinutes=${slotDurationMinutes}`,
          { cache: "no-store" },
        );
        if (availRes.ok && isMounted) {
          const data = await availRes.json();
          setAvailability(data.availability ?? {});
        }
      } catch (err) {
        console.error("Failed to refresh slots", err);
      }
    }

    silentRefetch();
    return () => {
      isMounted = false;
    };
  }, [
    availabilityRefreshKey,
    currentMonth,
    state.selectedEmployee,
    slotDurationMinutes,
    maxBookingAdvanceDays,
  ]);

  const handleMonthChange = (nextMonth: Date) => {
    setCurrentMonth(nextMonth);
    const ms = startOfMonth(nextMonth);
    const me = endOfMonth(nextMonth);
    const todayStart = startOfDay(new Date());
    const maxBookDate = startOfDay(addDays(new Date(), maxBookingAdvanceDays));

    if (selectedDate < ms || selectedDate > me) {
      const from = ms.getTime() < todayStart.getTime() ? todayStart : ms;
      const to = me.getTime() > maxBookDate.getTime() ? maxBookDate : me;
      if (isAfter(from, to)) {
        setSelectedDate(startOfDay(to));
      } else {
        setSelectedDate(startOfDay(from));
      }
    }
  };

  const handleSlotSelect = (slot: { time: string; maxDuration: number }) => {
    const start = new Date(slot.time);
    setTimeSlot({ time: start.toISOString(), maxDuration: slot.maxDuration });
  };

  const primaryService = services[0];
  const displayDuration =
    services.length === 1 ? primaryService.duration : slotDurationMinutes;

  const employeePicker =
    employees.length > 0 ? (
      <div className={shellStyles.employeeSection}>
        <span className={shellStyles.employeeLabel}>Berber</span>
        <div className={shellStyles.employeePills}>
          {employees.map((emp) => {
            const isSelected = state.selectedEmployee?.id === emp.id;
            return (
              <button
                key={emp.id}
                type="button"
                className={`${shellStyles.employeePill} ${isSelected ? shellStyles.employeePillActive : ""}`}
                onClick={() => setEmployee(emp)}
              >
                {emp.name}
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  return (
    <div className="calendar-container">
      <div className={`${shellStyles.shell} booking-shell`}>
        <aside className={shellStyles.sidebar}>
          {employeePicker}

          <div className={shellStyles.metaRow}>
            <Clock size={18} strokeWidth={2} aria-hidden />
            <span>{displayDuration} min</span>
          </div>
          <div className={shellStyles.metaRow}>
            <MapPin size={18} strokeWidth={2} aria-hidden />
            <span>{BRAND_CONFIG.address}</span>
          </div>

          <div className={shellStyles.pricingBlock}>
            {services.length === 1 && primaryService && (
              <>
                <p className={shellStyles.pricingLabel}>Cena</p>
                <p className={shellStyles.priceMain}>
                  {primaryService.price.toFixed(0)} RSD
                </p>
              </>
            )}
            {services.length > 1 && (
              <>
                <p className={shellStyles.pricingLabel}>Usluge</p>
                <ul className={shellStyles.extrasList}>
                  {services.map((s) => (
                    <li key={s.id}>
                      {s.title}: od {s.price.toFixed(0)} RSD
                    </li>
                  ))}
                </ul>
              </>
            )}
            {services.length === 0 && (
              <>
                <p className={shellStyles.pricingLabel}>Usluge</p>
                <p
                  className={shellStyles.priceMain}
                  style={{ fontWeight: 500 }}
                >
                  Izbor usluge u sledećem koraku
                </p>
              </>
            )}
          </div>
        </aside>

        {state.selectedEmployee ? (
          <BookingDayCalendar
            currentMonth={currentMonth}
            onMonthChange={handleMonthChange}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            availabilityByDate={availability}
            timeOffDates={timeOffDates}
            maxBookingAdvanceDays={maxBookingAdvanceDays}
            onSlotSelect={handleSlotSelect}
            isLoading={isLoading}
            bookedAppointment={bookedAppointment}
            onBookedAppointmentCancelled={() => {
              setMyBookingRefreshTick((n) => n + 1);
              bumpAvailabilityRefresh();
            }}
          />
        ) : (
          <div className="booking-shell-empty">
            <p>Izaberite frizera da biste videli dostupne termine.</p>
          </div>
        )}
      </div>
    </div>
  );
}
