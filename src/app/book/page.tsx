import { BookingProvider } from "./_components/BookingContext";
import BookingFlow from "./_components/BookingFlow";
import Link from "next/link";
import { getCachedServices, getCachedEmployees, getCachedSettings, getCachedSchedules, getCachedIrregularSchedules } from "@/lib/data-fetching";
import { BRAND_CONFIG } from "@/config/brand";

export const dynamic = 'force-dynamic';

export default async function BookPage() {
    const [services, employees, settings, schedules, irregularSchedules] = await Promise.all([
        getCachedServices(),
        getCachedEmployees(),
        getCachedSettings(),
        getCachedSchedules(),
        getCachedIrregularSchedules(),
    ]);

    const slotDurationMinutes = settings?.appointmentDuration ?? 30;

    return (
        <div
            className="book-page-root"
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-primary)",
            }}
        >
            <header
                style={{
                    height: "70px",
                    borderBottom: "1px solid var(--border)",
                    background: "var(--surface)",
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1rem 1.5rem", display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
                    <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.85rem" }}>
                        <img
                            src={BRAND_CONFIG.logoPath}
                            alt={BRAND_CONFIG.name}
                            style={{ height: "38px", width: "auto", objectFit: "contain" }}
                        />
                        <h1
                            style={{
                                fontSize: "clamp(1.15rem, 4vw, 1.45rem)",
                                color: "var(--text-primary)",
                                margin: 0,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                textAlign: "left",
                                fontWeight: 600,
                                fontFamily: "var(--font-sans)",
                                letterSpacing: "-0.02em",
                            }}
                        >
                            {BRAND_CONFIG.name} · zakazivanje
                        </h1>
                    </Link>
                </div>
            </header>

            <main
                className="book-page-main"
                style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
            >
                <BookingProvider>
                    <BookingFlow 
                        services={services} 
                        employees={employees} 
                        slotDurationMinutes={slotDurationMinutes}
                        maxBookingAdvanceDays={settings?.maxBookingAdvanceDays ?? 30}
                        schedules={JSON.parse(JSON.stringify(schedules))}
                        irregularSchedules={JSON.parse(JSON.stringify(irregularSchedules))}
                    />
                </BookingProvider>
            </main>
        </div>
    );
}
