import Provider from "../models/Provider";
import e, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { createError, StatusError } from "../utils/error";
import { hashPassword } from "../utils/passwordUtils";
import bcrypt from "bcryptjs";

export const getAllProviders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const hotels = await Provider.find();
    res.status(200).json(hotels);
  } catch (error) {
    next(error);
  }
};

export const getProviderById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (provider) {
      const { password, ...details } = provider?._doc;
      res.status(200).json(details);
    } else {
      next(createError(404, "Provider cannot be found"));
    }
  } catch (error) {
    next(error);
  }
};

export const registerProvider = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const hash = hashPassword(req.body.password);

    const newProvider = new Provider({
      companyName: req.body.companyName,
      address: req.body.address ?? "",
      city: req.body.city ?? "",
      country: req.body.country ?? "",
      password: hash,
      isAdmin: true,
    });

    const foundProvider = await Provider.findOne({
      companyName: req.body.companyName,
    }).exec();
    if (foundProvider) {
      return next(createError(400, "This provider already exists"));
    } else {
      const savedProvider = await newProvider.save({
        timestamps: { createdAt: true, updatedAt: true },
      });

      const { password, ...otherDetails } = savedProvider._doc;

      res.status(200).json(otherDetails);
    }
  } catch (error) {
    next(error);
  }
};

export const loginProvider = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const provider = await Provider.findOne({
      companyName: req.body.companyName,
    });
    if (!provider) return next(createError(404, "Provider is not found!"));

    const isPasswordCorrect = await bcrypt.compare(
      req.body.password,
      provider.password
    );
    if (!isPasswordCorrect) return next(createError(400, "Wrong password"));

    const token = jwt.sign(
      { _id: provider._id, isAdmin: provider.isAdmin },
      process.env.JWT ?? "secret_key"
    );

    const { password, ...otherDetails } = provider._doc;
    res
      .cookie("access_token", token, {
        httpOnly: true,
      })
      .status(200)
      .json(otherDetails);
  } catch (err) {
    next(err);
  }
};

export const updateProvider = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.body.companyName) {
      const foundCompany = await Provider.findOne({
        companyName: req.body.companyName,
      }).exec();
      if (foundCompany) {
        next(
          createError(
            400,
            "Cannot update new company name because this companyName is already existed"
          )
        );
      }
    }
    if (req.body.password) {
      req.body = { ...req.body, password: hashPassword(req.body.password) };
    }
    const updatedProvider = await Provider.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, timestamps: { updatedAt: true, createdAt: false } }
    );
    res.status(200).json(updatedProvider);
  } catch (error) {
    next(error);
  }
};

export const deleteProvider = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await Provider.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "The provider has been deleted" });
  } catch (error) {
    next(error);
  }
};
