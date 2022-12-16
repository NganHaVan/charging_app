import Charger from "../models/Charger";
import Provider from "../models/Provider";
import { IProvider } from "../types/Provider";

export const addCharger1ToDb = async (provider: IProvider) => {
  const charger1 = new Charger({
    chargerName: "Charger 1",
    companyId: provider._id,
    location: "Building A, Helsinki, Finland",
    pricePerHour: 20.5,
  });
  const savedCharger1 = await charger1.save();
  await Provider.findByIdAndUpdate(
    provider._id,
    {
      $push: { chargers: savedCharger1._id },
    },
    { new: true, timestamps: { createdAt: true, updatedAt: true } }
  );
  return savedCharger1;
};

export const addCharger2ToDb = async (provider: IProvider) => {
  const charger2 = new Charger({
    chargerName: "Charger 2",
    companyId: provider._id,
    location: "Building B, Helsinki, Finland",
    pricePerHour: 50,
  });
  const savedCharger2 = await charger2.save();
  await Provider.findByIdAndUpdate(
    provider._id,
    {
      $push: { chargers: savedCharger2._id },
    },
    { new: true, timestamps: { createdAt: true, updatedAt: true } }
  );
  return savedCharger2;
};
