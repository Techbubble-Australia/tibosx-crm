/** AU-friendly international phone: digits, spaces, +, (), ., - ; 8–20 chars. */
export const PHONE_REGEX = /^\+?[\d\s().-]{8,20}$/;

export const PHONE_VALIDATION_MESSAGE = "Valid phone number is required";
