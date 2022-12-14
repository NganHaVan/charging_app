import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User";
import { hashPassword } from "../utils/passwordUtils";
import { createError } from "../utils/error";
import Payment from "../models/Payment";

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, username, phoneNumber, password } = req.body;

    const user = await User.findOne({ phoneNumber: req.body.phoneNumber });
    if (user) {
      return next(createError(400, "This phone number already exists"));
    }

    const hash = hashPassword(password);

    const newUser = new User({
      email,
      phoneNumber,
      username,
      isAdmin: false,
      password: hash,
    });

    const savedUser = await newUser.save({
      timestamps: { createdAt: true, updatedAt: true },
    });
    res.status(200).json(savedUser);
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findOne({ phoneNumber: req.body.phoneNumber });
    if (!user) return next(createError(404, "User not found!"));

    const isPasswordCorrect = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!isPasswordCorrect)
      return next(createError(400, "Wrong password or phone number!"));

    const token = jwt.sign(
      { _id: user._id, isAdmin: user.isAdmin },
      process.env.JWT ?? "secret_key"
    );

    const { password, isAdmin, ...otherDetails } = user._doc;
    res
      .cookie("access_token", token, {
        httpOnly: true,
      })
      .status(200)
      .json({ details: { ...otherDetails }, isAdmin });
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      const { password, ...userDetails } = user._doc;
      res.status(200).json(userDetails);
    } else {
      next(createError(404, "User is not found"));
    }
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.body.phoneNumber) {
      const foundUser = await User.findOne({
        phoneNumber: req.body.phoneNumber,
      }).exec();
      if (foundUser) {
        return next(
          createError(
            400,
            "Cannot update new phone number because it is already existed"
          )
        );
      }
    }

    if (req.body.password) {
      req.body = { ...req.body, password: hashPassword(req.body.password) };
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, timestamps: { updatedAt: true, createdAt: false } }
    );
    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "The user has been deleted" });
  } catch (error) {
    next(error);
  }
};

export const getHistoryPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const foundPayments = await Payment.find({ userId: req.params.id })
      .populate("chargerId", "_id chargerName location pricePerHour")
      .populate("chargerId.companyId");
    res.status(200).json(foundPayments);
  } catch (error) {
    next(error);
  }
};
