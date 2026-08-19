"use client";

import { useRef } from "react";

/** The year to assume when someone starts filling in a date. */
const thisYear = () => new Date().getFullYear();

/**
 * A date box that already knows what year it is.
 *
 * A native date input starts every segment blank, so entering a date meant
 * typing the year out in full every single time. Focusing an empty box now
 * seeds the current year — you type the day and the month and the year is
 * already right. Leaving without entering anything clears it again, so an
 * optional date stays optional.
 *
 * The seed is the 1st of January rather than today, so that picking today's
 * date from the calendar is always a real change and never mistaken for
 * "they didn't touch it".
 */
export default function DateInput({
  value, onChange, className, ...rest
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type">) {
  const seeded = useRef(false);
  const touched = useRef(false);

  return (
    <input
      {...rest}
      type="date"
      className={className}
      value={value}
      onFocus={(ev) => {
        if (!value) {
          seeded.current = true;
          touched.current = false;
          onChange(`${thisYear()}-01-01`);
        }
        rest.onFocus?.(ev);
      }}
      onKeyDown={(ev) => { touched.current = true; rest.onKeyDown?.(ev); }}
      onChange={(ev) => { touched.current = true; onChange(ev.target.value); }}
      onBlur={(ev) => {
        // Focused it, changed nothing, moved on — leave it empty.
        if (seeded.current && !touched.current) onChange("");
        seeded.current = false;
        rest.onBlur?.(ev);
      }}
    />
  );
}
