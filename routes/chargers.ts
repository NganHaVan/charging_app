import express from "express";

import {
  getAllChargers,
  getChargerById,
  updateCharger,
  deleteCharger,
  createCharger,
} from "../controllers/chargerController";
import {
  verifyToken,
  verifyOwnAccount,
  verifyAdmin,
} from "../utils/verifyToken";

const router = express.Router();

router.get("/", getAllChargers);
router.post("/", verifyAdmin, createCharger);

router.get("/:id", getChargerById);
router.put("/:id", verifyAdmin, updateCharger);
router.delete("/:id", verifyAdmin, deleteCharger);

export default router;
