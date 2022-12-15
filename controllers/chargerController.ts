import { NextFunction, Request, Response } from "express";
import { RequestCustom } from "../types/RequestCustom";
import Charger from "../models/Charger";
import Provider from "../models/Provider";
import { createError } from "../utils/error";
import { ICharger } from "../types/Charger";

export const getAllChargers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const chargers = await Charger.find().exec();
    if (chargers) {
      res.status(200).json(chargers);
    } else {
      next(createError(404, "Cannot fetch chargers"));
    }
  } catch (error) {
    next(error);
  }
};

export const getChargerById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const charger = await Charger.findById(req.params.id);
    if (charger) {
      // FIXME: Add function to handle unavailableTimes
      res.status(200).json(charger._doc);
    } else {
      next(createError(404, "Provider cannot be found"));
    }
  } catch (error) {
    next(error);
  }
};

export const updateCharger = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const updatedCharger = await Charger.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, timestamps: { updatedAt: true, createdAt: false } }
    );
    res.status(200).json(updatedCharger);
  } catch (error) {
    next(error);
  }
};

export const deleteCharger = async (
  expReq: Request,
  res: Response,
  next: NextFunction
) => {
  const req = expReq as RequestCustom;
  try {
    await Charger.findByIdAndDelete(req.params.id);
    await Provider.findByIdAndUpdate(req.user._id, {
      $pull: { chargers: req.params.id },
    });
    res.status(200).json({ message: "The charger has been deleted" });
  } catch (error) {
    next(error);
  }
};

export const createCharger = async (
  expReq: Request,
  res: Response,
  next: NextFunction
) => {
  const req = expReq as RequestCustom;
  try {
    const { chargerName, location, pricePerHour } = req.body as ICharger;
    const existedCharger = await Charger.findOne({ chargerName }).exec();
    if (existedCharger) {
      next(createError(400, "This charger already existed"));
    } else {
      const newCharger = new Charger({
        chargerName,
        location,
        pricePerHour,
        companyId: req.user._id,
      });
      const savedCharger = await newCharger.save();
      await Provider.findByIdAndUpdate(
        req.user._id,
        {
          $push: {
            chargers: savedCharger._id,
          },
        },
        { timestamps: { updatedAt: false, createdAt: false } }
      );

      res.send(200).json(savedCharger._doc);
    }
  } catch (error) {
    next(error);
  }
};
