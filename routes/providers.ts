import express from "express";
import {
  getProviderById,
  registerProvider,
  deleteProvider,
  updateProvider,
  loginProvider,
} from "../controllers/providerController";
import {
  verifyToken,
  verifyOwnAccount,
  verifyAdmin,
} from "../utils/verifyToken";

const router = express.Router();

// router.get("/", getAllProviders);

router.get("/:id", verifyToken, verifyAdmin, verifyOwnAccount, getProviderById);

router.put("/:id", verifyToken, verifyAdmin, verifyOwnAccount, updateProvider);

router.delete(
  "/:id",
  verifyToken,
  verifyAdmin,
  verifyOwnAccount,
  deleteProvider
);

router.post("/register", registerProvider);

router.post("/login", loginProvider);

export default router;
