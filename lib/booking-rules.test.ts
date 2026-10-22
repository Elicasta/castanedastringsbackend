import {describe,it,expect} from "vitest";
import {canConfirmBooking,validBookingRange,timesOverlap} from "./booking-rules";
describe("confirmed booking safety",()=>{
 it("requires quote acceptance and verified payment",()=>{
  expect(canConfirmBooking("draft","paid","signed")).toBe(false);
  expect(canConfirmBooking("pending","paid","signed")).toBe(false);
  expect(canConfirmBooking("accepted","payment_pending","signed")).toBe(false);
  expect(canConfirmBooking("accepted","paid","draft")).toBe(false);
  expect(canConfirmBooking("accepted","paid","signed")).toBe(true);
  expect(canConfirmBooking("accepted","paid",null)).toBe(true);
 });
 it("rejects backwards, zero-duration and malformed times",()=>{
  expect(validBookingRange("13:00","14:00")).toBe(true);
  expect(validBookingRange("13:00","13:00")).toBe(false);
  expect(validBookingRange("15:00","14:00")).toBe(false);
  expect(validBookingRange("25:00","26:00")).toBe(false);
 });
 it("allows adjacent performances but not overlapping ones",()=>{
  expect(timesOverlap("10:00","12:00","12:00","14:00")).toBe(false);
  expect(timesOverlap("10:00","12:00","11:59","13:00")).toBe(true);
  expect(timesOverlap("11:00","12:00","09:00","11:00")).toBe(false);
 });
});
