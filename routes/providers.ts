import express from "express";
import {
  getAllProviders,
  getProviderById,
  registerProvider,
  deleteProvider,
  updateProvider,
  loginProvider,
} from "../controllers/providerController";

const router = express.Router();

// router.get("/", getAllProviders);

router.get("/:id", getProviderById);

router.put("/:id", updateProvider);

router.delete("/:id", deleteProvider);

router.post("/register", registerProvider);

router.post("/login", loginProvider);

export default router;
