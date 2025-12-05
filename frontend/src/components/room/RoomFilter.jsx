import React, { useEffect, useRef, useState } from "react";
import "./RoomFilter.css";

function FancySelect({ label, value, onChange, options = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const current = options.find(o => o.value === value);

  return (
    <div ref={ref} className="rf-seg" role="combobox" aria-expanded={open} data-open={open}>
      <div
        className="rf-head"
        onClick={() => setOpen(v => !v)}
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen(v => !v)}
      >
        <span className="rf-label">{label}</span>
        <span className="rf-value">{current ? current.label : "—"}</span>
        <span className={`rf-caret ${open ? "open" : ""}`} aria-hidden />
      </div>

      {open && (
        <ul className="rf-menu" role="listbox">
          {options.map(o => (
            <li
              key={o.value}
              className={`rf-option ${o.value === value ? "selected" : ""}`}
              role="option"
              aria-selected={o.value === value}
              onClick={() => { onChange(o.value); setOpen(false); }}  // ✅ áp dụng ngay
            >
              {o.label}
              {o.value === value ? <span className="rf-check">✓</span> : null}
            </li>
          ))}
        </ul>
      )}
      <div className="rf-divider" />
    </div>
  );
}

export default function RoomFilter({
  filters,
  setFilter,           // (key, value) => void
  onClear,             // nút phải = Clear
  isTenant,
  districtOptions = [],
}) {
  const distanceOpts = [
    { value: "ascending",  label: "Ascending" },
    { value: "descending", label: "Descending" },
  ];
  const priceOpts = [
    { value: "lowest",  label: "Lowest" },
    { value: "highest", label: "Highest" },
  ];
  const districtOpts = [
    { value: "all", label: "All" },
    ...districtOptions.map(d => ({ value: String(d), label: `District ${d}` })),
  ];
  const bookmarkedOpts = [
    { value: "all", label: "All" },
    { value: "yes", label: "Yes" },
    { value: "no",  label: "No" },
  ];

  return (
    <div className="rf-wrap">
      <div className="rf-pill">
        <FancySelect
          label="Located near you"
          value={filters.sortDistance}
          onChange={(v) => setFilter("sortDistance", v)}
          options={distanceOpts}
        />
        <FancySelect
          label="Price per month"
          value={filters.sortPrice}
          onChange={(v) => setFilter("sortPrice", v)}
          options={priceOpts}
        />
        <FancySelect
          label="District No"
          value={filters.district}
          onChange={(v) => setFilter("district", v)}
          options={districtOpts}
        />
        {isTenant && (
          <FancySelect
            label="Bookmarked"
            value={filters.bookmarked}
            onChange={(v) => setFilter("bookmarked", v)}
            options={bookmarkedOpts}
          />
        )}

        {/* ✅ nút phải = Clear */}
        <button className="rf-apply" onClick={onClear} type="button">
          Clear
        </button>
      </div>
    </div>
  );
}
