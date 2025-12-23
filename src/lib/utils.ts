import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { startOfDay, endOfDay, addMonths, subMonths } from "date-fns";

export function cn(...inputs: ClassValue[]) {
     return twMerge(clsx(inputs));
}

/**
 * Ensures a value is a Date object.
 * Handles both Date objects and ISO string representations.
 * Useful for:
 * - Temporal activity params (serialized as ISO strings)
 * - Database results (postgres-js may return strings)
 */
export const toDate = (value: Date | string): Date =>
     value instanceof Date ? value : new Date(value);

/**
 * Safely converts an optional date value.
 */
export const toDateOrUndefined = (
     value: Date | string | null | undefined
): Date | undefined => (value ? toDate(value) : undefined);

/**
 * Custom quarter definitions:
 * - Q1: February, March, April (months 2, 3, 4)
 * - Q2: May, June, July (months 5, 6, 7)
 * - Q3: August, September, October (months 8, 9, 10)
 * - Q4: November, December, January (months 11, 12, 1)
 *
 * For Q4, the year assignment is special:
 * - If month is November or December, use current year
 * - If month is January, use previous year (e.g., Jan 2024 → Q4 2023)
 */

export interface CustomQuarterInfo {
     quarter: number; // 1-4
     year: number;
     label: string; // e.g., "2024-Q1"
     startDate: Date;
     endDate: Date;
}

/**
 * Gets the custom quarter number (1-4) for a given date.
 */
function getCustomQuarterNumber(date: Date): number {
     const month = date.getMonth() + 1; // getMonth() returns 0-11, we want 1-12

     if (month >= 2 && month <= 4) return 1; // Feb, Mar, Apr
     if (month >= 5 && month <= 7) return 2; // May, Jun, Jul
     if (month >= 8 && month <= 10) return 3; // Aug, Sep, Oct
     return 4; // Nov, Dec, Jan
}

/**
 * Gets the year for the custom quarter containing the given date.
 * For Q4, January uses the previous year.
 */
function getCustomQuarterYear(date: Date, quarter: number): number {
     const year = date.getFullYear();
     const month = date.getMonth() + 1;

     // For Q4, if the month is January, use previous year
     if (quarter === 4 && month === 1) {
          return year - 1;
     }

     return year;
}

/**
 * Gets the start date of the custom quarter containing the given date.
 */
export function getCustomQuarterStart(date: Date): Date {
     const quarter = getCustomQuarterNumber(date);
     const year = getCustomQuarterYear(date, quarter);

     let startMonth: number;
     if (quarter === 1) startMonth = 1; // February (0-indexed: 1)
     else if (quarter === 2) startMonth = 4; // May (0-indexed: 4)
     else if (quarter === 3) startMonth = 7; // August (0-indexed: 7)
     else startMonth = 10; // November (0-indexed: 10)

     return startOfDay(new Date(year, startMonth, 1));
}

/**
 * Gets the end date of the custom quarter containing the given date.
 */
export function getCustomQuarterEnd(date: Date): Date {
     const quarter = getCustomQuarterNumber(date);
     const month = date.getMonth() + 1;
     const dateYear = date.getFullYear();

     let endMonth: number;
     let endDay: number;
     let endYear: number;

     if (quarter === 1) {
          endMonth = 3; // April (0-indexed: 3)
          endDay = 30;
          endYear = dateYear;
     } else if (quarter === 2) {
          endMonth = 6; // July (0-indexed: 6)
          endDay = 31;
          endYear = dateYear;
     } else if (quarter === 3) {
          endMonth = 9; // October (0-indexed: 9)
          endDay = 31;
          endYear = dateYear;
     } else {
          // Q4: November, December, January
          // If we're in November or December, end is Jan 31 of next year
          // If we're in January, end is Jan 31 of current year
          endMonth = 0; // January (0-indexed: 0)
          endDay = 31;
          if (month === 11 || month === 12) {
               endYear = dateYear + 1; // Next year
          } else {
               // January
               endYear = dateYear; // Current year
          }
     }

     return endOfDay(new Date(endYear, endMonth, endDay));
}

/**
 * Gets complete information about the custom quarter containing the given date.
 */
export function getCustomQuarterInfo(date: Date): CustomQuarterInfo {
     const quarter = getCustomQuarterNumber(date);
     const year = getCustomQuarterYear(date, quarter);
     const startDate = getCustomQuarterStart(date);
     const endDate = getCustomQuarterEnd(date);
     const label = `${year}-Q${quarter}`;

     return {
          quarter,
          year,
          label,
          startDate,
          endDate,
     };
}

/**
 * Gets a custom quarter offset from the quarter containing the given date.
 * @param date The reference date
 * @param offset 0 = current quarter, -1 = previous quarter, 1 = next quarter, etc.
 */
export function getCustomQuarterByOffset(
     date: Date,
     offset: number
): CustomQuarterInfo {
     if (offset === 0) {
          return getCustomQuarterInfo(date);
     }

     // Calculate the target quarter by moving months
     // Each quarter is 3 months, so we move by offset * 3 months
     const monthsToMove = offset * 3;
     const targetDate =
          monthsToMove > 0
               ? addMonths(date, monthsToMove)
               : subMonths(date, Math.abs(monthsToMove));

     return getCustomQuarterInfo(targetDate);
}

// ============================================
// Monthly Utilities
// ============================================

export interface MonthInfo {
     month: number; // 1-12
     year: number;
     label: string; // e.g., "December 2025"
     shortLabel: string; // e.g., "Dec 2025"
     startDate: Date;
     endDate: Date;
}

const MONTH_NAMES = [
     "January",
     "February",
     "March",
     "April",
     "May",
     "June",
     "July",
     "August",
     "September",
     "October",
     "November",
     "December",
];

const MONTH_SHORT_NAMES = [
     "Jan",
     "Feb",
     "Mar",
     "Apr",
     "May",
     "Jun",
     "Jul",
     "Aug",
     "Sep",
     "Oct",
     "Nov",
     "Dec",
];

/**
 * Gets information about a specific month.
 */
export function getMonthInfo(date: Date): MonthInfo {
     const month = date.getMonth() + 1; // 1-12
     const year = date.getFullYear();
     const startDate = startOfDay(new Date(year, month - 1, 1));

     // End of month: go to first day of next month, then subtract 1 day
     const nextMonth = month === 12 ? 0 : month;
     const nextYear = month === 12 ? year + 1 : year;
     const endDate = endOfDay(new Date(nextYear, nextMonth, 0));

     return {
          month,
          year,
          label: `${MONTH_NAMES[month - 1]} ${year}`,
          shortLabel: `${MONTH_SHORT_NAMES[month - 1]} ${year}`,
          startDate,
          endDate,
     };
}

/**
 * Gets a month offset from the given date.
 * @param date The reference date
 * @param offset 0 = current month, -1 = previous month, 1 = next month, etc.
 */
export function getMonthByOffset(date: Date, offset: number): MonthInfo {
     if (offset === 0) {
          return getMonthInfo(date);
     }

     const targetDate =
          offset > 0
               ? addMonths(date, offset)
               : subMonths(date, Math.abs(offset));

     return getMonthInfo(targetDate);
}

// ============================================
// Yearly Utilities
// ============================================

export interface YearInfo {
     year: number;
     label: string; // e.g., "2025"
     startDate: Date;
     endDate: Date;
}

/**
 * Gets information about a specific year.
 */
export function getYearInfo(date: Date): YearInfo {
     const year = date.getFullYear();
     const startDate = startOfDay(new Date(year, 0, 1)); // Jan 1
     const endDate = endOfDay(new Date(year, 11, 31)); // Dec 31

     return {
          year,
          label: `${year}`,
          startDate,
          endDate,
     };
}

/**
 * Gets a year offset from the given date.
 * @param date The reference date
 * @param offset 0 = current year, -1 = previous year, 1 = next year, etc.
 */
export function getYearByOffset(date: Date, offset: number): YearInfo {
     const targetDate = new Date(date);
     targetDate.setFullYear(date.getFullYear() + offset);
     return getYearInfo(targetDate);
}

// ============================================
// Server Action Utilities
// ============================================

/**
 * Standard result type for server actions.
 * Use this for consistent error handling across all actions.
 */
export type ActionResult<T = void> =
     | { success: true; data: T }
     | { success: false; error: string };

/**
 * Extracts error message from unknown error type.
 * Handles Error instances, strings, and objects with message property.
 */
export function getErrorMessage(error: unknown): string {
     if (error instanceof Error) {
          return error.message;
     }
     if (typeof error === "string") {
          return error;
     }
     if (error && typeof error === "object" && "message" in error) {
          return String((error as { message: unknown }).message);
     }
     return "An unknown error occurred";
}

/**
 * Serializes an object for client-side consumption.
 * Converts Date objects to ISO strings for Next.js serialization.
 *
 * @param data - The data to serialize
 * @returns A serialized copy safe for passing to client components
 *
 * @example
 * // With explicit type for serialized output
 * const contacts = serializeForClient<SerializedContact[]>(contactsRaw);
 */
export function serializeForClient<T>(data: unknown): T {
     return JSON.parse(JSON.stringify(data)) as T;
}
