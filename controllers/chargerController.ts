import e, { NextFunction, Request, Response } from "express";
import { RequestCustom } from "../types/RequestCustom";
import Charger from "../models/Charger";
import Provider from "../models/Provider";
import { createError } from "../utils/error";
import { ICharger } from "../types/Charger";
import { checkIfChargerAvailable } from "../utils/dateTimeUtils";
import User from "../models/User";
import bookingPayment from "../database/transaction/bookingPayment";
import Payment from "../models/Payment";

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
      // FIXME: Remove charger unavailable times which are in the past
      // if (charger.unavailableTimes.length > 0) {
      //   charger.unavailableTimes.filter((time) => {
      //     if (time.startTime.getTime() > new Date().getTime()) {
      //       return time.endTime.getTime() > new Date().getTime();
      //     } else {
      //       return time.startTime.getTime() > new Date().getTime();
      //     }
      //   });
      // }
      // const updatedCharger = Charger.findByIdAndUpdate(req.params.id);
      res.status(200).json(charger._doc);
    } else {
      next(createError(404, "Provider cannot be found"));
    }
  } catch (error) {
    next(error);
  }
};

export const updateCharger = async (
  expReq: Request,
  res: Response,
  next: NextFunction
) => {
  const req = expReq as RequestCustom;
  try {
    const isOwner = await isChargerOwner(req.params.id, req.user._id);
    if (isOwner) {
      if (req.body.chargerName) {
        const foundCharger = await Charger.find({
          chargerName: req.body.chargerName,
          companyId: req.user._id,
        }).exec();
        if (foundCharger) {
          return next(
            createError(
              400,
              "Cannot update because this charger name already existed"
            )
          );
        }
      }
      const updatedCharger = await Charger.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, timestamps: { updatedAt: true, createdAt: false } }
      );
      res.status(200).json(updatedCharger);
    } else {
      next(
        createError(403, "You are not the owner to update the charger info")
      );
    }
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
    const isOwner = await isChargerOwner(req.params.id, req.user._id);
    if (isOwner) {
      await Charger.findByIdAndDelete(req.params.id);
      await Provider.findByIdAndUpdate(req.user._id, {
        $pull: { chargers: req.params.id },
      });
      res.status(200).json({ message: "The charger has been deleted" });
    } else {
      next(createError(403, "You are not the owner to delete the charger"));
    }
  } catch (error) {
    next(error);
  }
};

export const bookCharger = async (
  expReq: Request,
  res: Response,
  next: NextFunction
) => {
  const req = expReq as RequestCustom;
  const { startTime, endTime } = req.body;
  const { id } = req.params;
  try {
    const charger = await Charger.findById(id);
    if (charger) {
      if (
        checkIfChargerAvailable({
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          charger,
        })
      ) {
        /* const updatedCharger = await Charger.findByIdAndUpdate(
          id,
          {
            $push: {
              unavailableTimes: {
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(startTime).toISOString(),
              },
            },
          },
          { timestamps: { updatedAt: false, createdAt: false }, new: true }
        );
        if (updatedCharger) {
          updatedCharger.unavailableTimes.sort((a, b) => {
            if (a.startTime < b.startTime) {
              return -1;
            } else {
              return 1;
            }
          });
          const updatedUser = await User.findByIdAndUpdate(req.user._id, {
            $push: {
              bookingHours: {
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(startTime).toISOString(),
                chargeId: id,
                status: "unpaid",
              },
            },
          });
          if (updatedUser) {
            updatedUser.bookingHours.sort(
              (a, b) => a.startTime.getTime() - b.startTime.getTime()
            );
            res.status(200).json(updatedCharger);
          } else {
            return next(
              createError(
                500,
                "Something happen in user update while booking a charger"
              )
            );
          }
        } else {
          return next(
            createError(
              500,
              "Something happen update charger info while booking a charger"
            )
          );
        } */

        const updatedUser = await User.findByIdAndUpdate(
          req.user._id,
          {
            $push: {
              bookingHours: {
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(startTime).toISOString(),
                chargerId: id,
                status: "unpaid",
              },
            },
          },
          { new: true }
        )
          .sort({ "bookingHours.startTime": "ascending" })
          .populate("bookingHours.chargerId")
          .exec();
        if (updatedUser) {
          const { password, ...userDetail } = updatedUser._doc;
          if (userDetail.bookingHours.length > 0) {
            userDetail.bookingHours = userDetail.bookingHours.map((a) => {
              const { startTime, endTime, status } = a;
              // @ts-ignore
              const { unavailableTimes, ...chargerDetail } = a.chargerId._doc;

              return { startTime, chargerId: chargerDetail, endTime, status };
            });
          }
          res.status(200).json({
            status: "Success",
            message: "The charger is booked successfully",
            detail: userDetail,
          });
        } else {
          return next(
            createError(
              500,
              "Something happen in user update while booking a charger"
            )
          );
        }
      } else {
        return next(createError(400, "Your booking time is unavailable"));
      }
    } else {
      return next(
        createError(404, `Charger with id ${id} cannot be found to book`)
      );
    }
  } catch (error) {
    next(error);
  }
};

export const payCharger = async (
  expReq: Request,
  res: Response,
  next: NextFunction
) => {
  const req = expReq as RequestCustom;
  const { id: chargerId } = req.params;
  const { cardNumber, cvc, exp_month, exp_year, currency, startTime, endTime } =
    req.body;

  try {
    await bookingPayment({
      startTime,
      endTime,
      cardInfo: { cardNumber, cvc, exp_month, exp_year },
      chargerId,
      userId: req.user._id,
      currency,
    });
    const paymentDetail = await Payment.findOne({
      chargerId,
      userId: req.user._id,
      startTime,
      endTime,
    })
      .populate("chargerId", "_id chargerName location pricePerHour companyId")
      .populate("userId", "_id username email phoneNumber isAdmin bookingHours")
      .exec();
    res.status(200).json({
      status: "Success",
      message: "The charger booking has been paid successfully",
      detail: paymentDetail,
    });
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
    const existedCharger = await Charger.findOne({
      chargerName,
      companyId: req.user._id,
    }).exec();
    if (existedCharger) {
      return next(createError(400, "This charger already existed"));
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
        { timestamps: { updatedAt: false, createdAt: true } }
      );

      res.status(200).json(savedCharger);
    }
  } catch (error) {
    next(error);
  }
};

const isChargerOwner = async (
  chargerId: string,
  providerId: string
): Promise<boolean> => {
  try {
    const foundCharger = await Charger.findById(chargerId).exec();
    if (foundCharger) {
      return foundCharger.companyId.toString() === providerId;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};
