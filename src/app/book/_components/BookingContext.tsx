"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Service, User } from "@prisma/client";

export type BookingStep = 1 | 2 | 3;

interface TimeSlot {
  time: string; // ISO String
  maxDuration: number; // Mins
}

interface BookingState {
  step: BookingStep;
  selectedEmployee: User | null;
  selectedDate: Date | null;
  selectedTimeSlot: TimeSlot | null;
  selectedService: Service | null;
}

interface BookingContextType {
  state: BookingState;
  /** Incremented after a successful booking so the calendar can refetch availability without a full page reload. */
  availabilityRefreshKey: number;
  bumpAvailabilityRefresh: () => void;
  setStep: (step: BookingStep) => void;
  setEmployee: (employee: User | null) => void;
  setDate: (date: Date | null) => void;
  setTimeSlot: (timeSlot: TimeSlot | null) => void;
  setService: (service: Service | null) => void;
  resetBooking: () => void;
}

const initialState: BookingState = {
  step: 1,
  selectedEmployee: null, // Will be set forcefully by Step1
  selectedDate: null,
  selectedTimeSlot: null,
  selectedService: null,
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingState>(initialState);
  const [availabilityRefreshKey, setAvailabilityRefreshKey] = useState(0);

  const bumpAvailabilityRefresh = useCallback(() => {
    setAvailabilityRefreshKey((k) => k + 1);
  }, []);

  const setStep = (step: BookingStep) =>
    setState((prev) => ({ ...prev, step }));
  const setEmployee = (employee: User | null) =>
    setState((prev) => ({
      ...prev,
      selectedEmployee: employee,
      selectedTimeSlot: null,
    }));
  const setDate = (date: Date | null) =>
    setState((prev) => ({ ...prev, selectedDate: date }));
  const setTimeSlot = (timeSlot: TimeSlot | null) =>
    setState((prev) => ({
      ...prev,
      selectedTimeSlot: timeSlot,
      selectedService: null,
    }));
  const setService = (service: Service | null) =>
    setState((prev) => ({
      ...prev,
      selectedService: service,
    }));

  const resetBooking = () => setState(initialState);

  return (
    <BookingContext.Provider
      value={{
        state,
        availabilityRefreshKey,
        bumpAvailabilityRefresh,
        setStep,
        setEmployee,
        setDate,
        setTimeSlot,
        setService,
        resetBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}
