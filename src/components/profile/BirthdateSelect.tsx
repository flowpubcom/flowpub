"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";

// Fecha de nacimiento con tres dropdowns (día · mes · año). El año va de mayor a
// menor para que no haya que "picarle mil veces" hacia atrás. Emite ISO
// AAAA-MM-DD solo cuando los tres están completos; si no, cadena vacía.

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function daysInMonth(year: string, month: string, fallbackYear: number) {
  if (!month) return 31;
  return new Date(Number(year || fallbackYear), Number(month), 0).getDate();
}

export function BirthdateSelect({
  value,
  onChange,
  selectCls,
}: {
  value: string;
  onChange: (iso: string) => void;
  selectCls: string;
}) {
  const { lang } = useI18n();
  const parts = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split("-") : ["", "", ""];
  const [year, setYear] = useState(parts[0]);
  const [month, setMonth] = useState(parts[1] ? String(Number(parts[1])) : "");
  const [day, setDay] = useState(parts[2] ? String(Number(parts[2])) : "");

  const months = lang === "es" ? MONTHS_ES : MONTHS_EN;
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const a: number[] = [];
    for (let y = currentYear; y >= 1900; y--) a.push(y);
    return a;
  }, [currentYear]);
  const dmax = daysInMonth(year, month, currentYear);
  const days = useMemo(() => {
    const a: number[] = [];
    for (let d = 1; d <= dmax; d++) a.push(d);
    return a;
  }, [dmax]);

  const emit = (d: string, m: string, y: string) => {
    if (d && m && y) {
      const dd = String(Math.min(Number(d), daysInMonth(y, m, currentYear))).padStart(2, "0");
      const mm = String(Number(m)).padStart(2, "0");
      onChange(`${y}-${mm}-${dd}`);
    } else {
      onChange("");
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <select
        value={day}
        aria-label={lang === "es" ? "Día" : "Day"}
        className={selectCls}
        onChange={(e) => {
          setDay(e.target.value);
          emit(e.target.value, month, year);
        }}
      >
        <option value="">{lang === "es" ? "Día" : "Day"}</option>
        {days.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <select
        value={month}
        aria-label={lang === "es" ? "Mes" : "Month"}
        className={selectCls}
        onChange={(e) => {
          setMonth(e.target.value);
          emit(day, e.target.value, year);
        }}
      >
        <option value="">{lang === "es" ? "Mes" : "Month"}</option>
        {months.map((name, i) => (
          <option key={name} value={i + 1}>
            {name}
          </option>
        ))}
      </select>

      <select
        value={year}
        aria-label={lang === "es" ? "Año" : "Year"}
        className={selectCls}
        onChange={(e) => {
          setYear(e.target.value);
          emit(day, month, e.target.value);
        }}
      >
        <option value="">{lang === "es" ? "Año" : "Year"}</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
