import express from "express";

import {
  getAllChargers,
  getChargerById,
  updateCharger,
  deleteCharger,
  createCharger,
  bookCharger,
  payCharger,
} from "../controllers/chargerController";
import {
  verifyToken,
  verifyAdmin,
  verifyNormalUser,
} from "../utils/verifyToken";

const router = express.Router();

router.get("/", getAllChargers);
router.post("/", verifyAdmin, createCharger);

router.get("/:id", getChargerById);
router.put("/:id", verifyAdmin, updateCharger);
router.delete("/:id", verifyAdmin, deleteCharger);

router.post("/:id/booking", verifyNormalUser, bookCharger);
router.post("/:id/payment", verifyNormalUser, payCharger);

export default router;
