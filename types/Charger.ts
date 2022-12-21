export interface ICharger {
  _id: string;
  chargerName: string;
  pricePerHour: number;
  location: string;
  companyId: string;
  unavailableTimes: string[];
}
