"use client";

import { Service, User } from "@prisma/client";
import Step1Time from "./Step1Time";
import BookingModal from "./BookingModal";

export default function BookingFlow({ 
    services, 
    employees, 
    slotDurationMinutes = 30,
    maxBookingAdvanceDays = 30,
    schedules = [],
    irregularSchedules = [],
}: { 
    services: Service[]; 
    employees: User[]; 
    slotDurationMinutes?: number;
    maxBookingAdvanceDays?: number;
    schedules?: any[];
    irregularSchedules?: any[];
}) {
    return (
        <div
            className="book-flow-outer"
            style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                maxWidth: "1400px",
                width: "100%",
                margin: "0 auto",
                padding: "1.5rem clamp(0.5rem, 3vw, 1rem)",
            }}
        >
            {/* Unified Flow Content */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                    animation: "fadeIn 0.3s ease-in-out",
                }}
            >
                <Step1Time 
                    services={services}
                    employees={employees} 
                    slotDurationMinutes={slotDurationMinutes} 
                    maxBookingAdvanceDays={maxBookingAdvanceDays}
                    schedules={schedules}
                    irregularSchedules={irregularSchedules}
                />
            </div>

            {/* Consolidated Booking Modal */}
            <BookingModal services={services} />

            <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}
