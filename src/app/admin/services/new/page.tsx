"use client";

import { createService } from "../actions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../../admin.module.css";

export default function NewServicePage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    try {
      const result = await createService(formData);
      if (result?.error) {
        alert(result.error);
      } else {
        router.push("/admin/services");
        return;
      }
    } catch (err) {
      alert("Greška pri kreiranju usluge");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dodaj Novu Uslugu</h1>
        <p className={styles.pageDescription}>Kreirajte novu uslugu u ponudi.</p>
      </div>

      <div className={styles.card} style={{ maxWidth: "600px" }}>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Naziv
            </label>
            <input
              name="title"
              required
              type="text"
              style={{
                width: "100%",
                padding: "0.85rem 1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-light)",
                background: "var(--surface-hover)",
                color: "var(--text-primary)",
                transition: "var(--transition)",
                outline: "none",
                fontSize: "0.95rem",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border-light)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Opis (opciono)
            </label>
            <textarea
              name="description"
              rows={3}
              style={{
                width: "100%",
                padding: "0.85rem 1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-light)",
                background: "var(--surface-hover)",
                color: "var(--text-primary)",
                resize: "vertical",
                transition: "var(--transition)",
                outline: "none",
                fontSize: "0.95rem",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border-light)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Trajanje (minuti)
              </label>
              <input
                name="duration"
                required
                type="number"
                min="5"
                step="5"
                defaultValue="30"
                style={{
                  width: "100%",
                  padding: "0.85rem 1rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-light)",
                  background: "var(--surface-hover)",
                  color: "var(--text-primary)",
                  transition: "var(--transition)",
                  outline: "none",
                  fontSize: "0.95rem",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-light)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Cena (RSD)
              </label>
              <input
                name="price"
                required
                type="number"
                min="0"
                step="1"
                defaultValue="0"
                style={{
                  width: "100%",
                  padding: "0.85rem 1rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-light)",
                  background: "var(--surface-hover)",
                  color: "var(--text-primary)",
                  transition: "var(--transition)",
                  outline: "none",
                  fontSize: "0.95rem",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-light)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              {isPending ? "Čuvanje..." : "Kreiraj Uslugu"}
            </button>
            <Link
              href="/admin/services"
              className="btn btn-outline"
              style={{ textAlign: "center", flex: 1 }}
            >
              Otkaži
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
