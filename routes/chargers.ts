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
router.get("/:id", verifyToken, getChargerById);
router.post("/", verifyAdmin, createCharger);
router.put("/:id", verifyAdmin, verifyOwnAccount, updateCharger);
router.delete("/:id", verifyAdmin, verifyOwnAccount, deleteCharger);

export default router;
