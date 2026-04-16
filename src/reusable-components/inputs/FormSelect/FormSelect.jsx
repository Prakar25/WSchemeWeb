import { forwardRef } from "react";
import clsx from "clsx";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { Description, Field, Label, Select } from "@headlessui/react";

const lightSelectClasses =
  "block w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 " +
  "focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-[#d85a30] " +
  "data-disabled:opacity-60 data-disabled:cursor-not-allowed data-disabled:bg-gray-50 " +
  "data-invalid:border-red-500 data-invalid:text-gray-900 " +
  "*:text-black";

const lightCompactSelectClasses =
  "block w-full appearance-none rounded-md border border-gray-300 bg-white px-2 py-1.5 pr-8 text-xs text-gray-900 " +
  "focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-[#d85a30] " +
  "data-disabled:opacity-60 data-disabled:cursor-not-allowed data-disabled:bg-gray-50 " +
  "data-invalid:border-red-500 *:text-black";

const darkSelectClasses =
  "block w-full appearance-none rounded-lg border-none bg-white/5 px-3 py-1.5 pr-10 text-sm/6 text-white " +
  "focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-white/25 " +
  "data-disabled:opacity-50 data-disabled:cursor-not-allowed " +
  "data-invalid:border-red-400/80 " +
  "*:text-black";

const chevronLight = "pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 fill-gray-500";
const chevronDark = "pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 fill-white/60";
const chevronCompact = "pointer-events-none absolute top-1/2 right-1.5 size-3.5 -translate-y-1/2 fill-gray-500";

/**
 * Headless UI native select + chevron. Use for controlled/uncontrolled selects and react-hook-form register().
 */
export const FormSelectInput = forwardRef(function FormSelectInput(
  {
    variant = "light",
    size = "default",
    className,
    invalid,
    disabled,
    children,
    ...rest
  },
  ref
) {
  const isCompact = size === "compact";
  const base =
    variant === "dark"
      ? darkSelectClasses
      : isCompact
        ? lightCompactSelectClasses
        : lightSelectClasses;
  const chevronClass = isCompact ? chevronCompact : variant === "dark" ? chevronDark : chevronLight;

  return (
    <div className="relative w-full">
      <Select
        ref={ref}
        invalid={invalid}
        disabled={disabled}
        className={clsx(base, className)}
        {...rest}
      >
        {children}
      </Select>
      <ChevronDownIcon className={chevronClass} aria-hidden="true" />
    </div>
  );
});

const defaultLabelLight = "text-sm font-medium text-gray-700";
const defaultLabelDark = "text-sm/6 font-medium text-white";
const defaultDescLight = "text-sm text-gray-500";
const defaultDescDark = "text-sm/6 text-white/50";

/**
 * Field + Label + Description + styled Select (Headless UI). Matches site-wide dropdown styling.
 */
const FormSelect = forwardRef(function FormSelect(
  {
    label,
    description,
    variant = "light",
    size = "default",
    labelClassName,
    descriptionClassName,
    fieldClassName,
    disabled,
    invalid,
    className,
    children,
    id,
    ...rest
  },
  ref
) {
  const lbl = labelClassName ?? (variant === "dark" ? defaultLabelDark : defaultLabelLight);
  const desc = descriptionClassName ?? (variant === "dark" ? defaultDescDark : defaultDescLight);

  return (
    <Field disabled={disabled} className={fieldClassName}>
      {label != null && label !== false && (
        <Label className={lbl} {...(id ? { id: `${id}-label` } : {})}>
          {label}
        </Label>
      )}
      {description ? <Description className={clsx("mt-1", desc)}>{description}</Description> : null}
      <div className={clsx(label || description ? "mt-2" : "", "w-full")}>
        <FormSelectInput
          ref={ref}
          variant={variant}
          size={size}
          invalid={invalid}
          disabled={disabled}
          className={className}
          {...(id ? { id } : {})}
          {...rest}
        >
          {children}
        </FormSelectInput>
      </div>
    </Field>
  );
});

export default FormSelect;
