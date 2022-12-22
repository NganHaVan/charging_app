import { ICharger } from "../types/Charger";

export const checkIfChargerAvailable = ({
  startTime,
  endTime,
  charger,
}: {
  startTime: Date;
  endTime: Date;
  charger: ICharger;
}): boolean => {
  if (startTime.getTime() > endTime.getTime()) {
    return false;
  }

  if (startTime.getTime() < new Date().getTime()) {
    return false;
  }

  const bookingTimes = charger.unavailableTimes;
  return bookingTimes.every((bookingTime) => {
    if (
      bookingTime.startTime.getTime() < startTime.getTime() &&
      startTime.getTime() < bookingTime.endTime.getTime()
    ) {
      return false;
    }
    return true;
  });
};
