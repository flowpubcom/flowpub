"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";

// Selector de origen en cascada: País → Estado/Provincia → Municipio/Ciudad, en
// tres filas que se van habilitando. Guarda NOMBRES en los campos existentes
// (city/state/country), así no cambia el modelo de datos. Los nombres de país se
// localizan con Intl.DisplayNames; el dataset (country-state-city) se carga solo
// en cliente y a demanda (code-split) para no pesar en la carga inicial.

type CSC = typeof import("country-state-city");

export interface OriginValue {
  country: string;
  state: string;
  city: string;
}

export function OriginSelect({
  country,
  state,
  city,
  onChange,
  selectCls,
}: OriginValue & {
  onChange: (v: OriginValue) => void;
  selectCls: string;
}) {
  const { lang } = useI18n();
  const [csc, setCsc] = useState<CSC | null>(null);
  const [countryIso, setCountryIso] = useState("");
  const [stateIso, setStateIso] = useState("");
  const [cityName, setCityName] = useState(city ?? "");
  const [hydrated, setHydrated] = useState(false);

  const displayNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([lang], { type: "region" });
    } catch {
      return null;
    }
  }, [lang]);
  const localCountry = (iso: string, fallback: string) => {
    try {
      return displayNames?.of(iso) || fallback;
    } catch {
      return fallback;
    }
  };

  useEffect(() => {
    let alive = true;
    void import("country-state-city").then((m) => {
      if (alive) setCsc(m);
    });
    return () => {
      alive = false;
    };
  }, []);

  const countries = useMemo(() => {
    if (!csc) return [] as { iso: string; name: string }[];
    return csc.Country.getAllCountries()
      .map((c) => ({ iso: c.isoCode, name: localCountry(c.isoCode, c.name) }))
      .sort((a, b) => a.name.localeCompare(b.name, lang));
  }, [csc, lang]);

  const states = useMemo(
    () => (csc && countryIso ? csc.State.getStatesOfCountry(countryIso) : []),
    [csc, countryIso],
  );
  const cities = useMemo(
    () =>
      csc && countryIso && stateIso
        ? csc.City.getCitiesOfState(countryIso, stateIso)
        : [],
    [csc, countryIso, stateIso],
  );

  // Rehidratar una vez desde los nombres guardados (matcheo por nombre).
  useEffect(() => {
    if (!csc || hydrated) return;
    setHydrated(true);
    if (!country) return;
    const found = csc.Country.getAllCountries().find((c) => {
      const names = [localCountry(c.isoCode, c.name), c.name].map((n) =>
        n?.toLowerCase(),
      );
      return names.includes(country.toLowerCase());
    });
    if (!found) return;
    setCountryIso(found.isoCode);
    if (state) {
      const st = csc.State.getStatesOfCountry(found.isoCode).find(
        (s) => s.name.toLowerCase() === state.toLowerCase(),
      );
      if (st) setStateIso(st.isoCode);
    }
  }, [csc, hydrated]);

  const countryName = (iso: string) =>
    countries.find((c) => c.iso === iso)?.name ?? "";
  const stateName = (iso: string) =>
    states.find((s) => s.isoCode === iso)?.name ?? "";

  const ph = lang === "es" ? "Selecciona…" : "Select…";

  return (
    <div className="flex flex-col gap-2.5">
      <select
        value={countryIso}
        aria-label={lang === "es" ? "País" : "Country"}
        className={selectCls}
        disabled={!csc}
        onChange={(e) => {
          const iso = e.target.value;
          setCountryIso(iso);
          setStateIso("");
          setCityName("");
          onChange({ country: countryName(iso), state: "", city: "" });
        }}
      >
        <option value="">{csc ? (lang === "es" ? "País" : "Country") : "…"}</option>
        {countries.map((c) => (
          <option key={c.iso} value={c.iso}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={stateIso}
        aria-label={lang === "es" ? "Estado o provincia" : "State or province"}
        className={selectCls}
        disabled={!countryIso || states.length === 0}
        onChange={(e) => {
          const iso = e.target.value;
          setStateIso(iso);
          setCityName("");
          onChange({ country: countryName(countryIso), state: stateName(iso), city: "" });
        }}
      >
        <option value="">
          {lang === "es" ? "Estado / provincia" : "State / province"}
        </option>
        {states.map((s) => (
          <option key={s.isoCode} value={s.isoCode}>
            {s.name}
          </option>
        ))}
      </select>

      <select
        value={cityName}
        aria-label={lang === "es" ? "Municipio o ciudad" : "City or municipality"}
        className={selectCls}
        disabled={!stateIso || cities.length === 0}
        onChange={(e) => {
          const name = e.target.value;
          setCityName(name);
          onChange({
            country: countryName(countryIso),
            state: stateName(stateIso),
            city: name,
          });
        }}
      >
        <option value="">
          {ph} {lang === "es" ? "(municipio)" : "(city)"}
        </option>
        {cities.map((c, i) => (
          <option key={`${c.name}-${i}`} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
