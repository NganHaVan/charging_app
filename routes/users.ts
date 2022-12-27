import express from "express";
import {
  registerUser,
  loginUser,
  getUserById,
  updateUser,
  deleteUser,
  getHistoryPayment,
} from "../controllers/userController";
import {
  verifyToken,
  verifyOwnAccount,
  verifyNormalUser,
} from "../utils/verifyToken";

const router = express.Router();

router.get("/:id", verifyToken, getUserById);

router.put("/:id", verifyToken, verifyOwnAccount, updateUser);

router.delete("/:id", verifyToken, verifyOwnAccount, deleteUser);

router.get("/:id/history_payment", verifyNormalUser, getHistoryPayment);

router.post("/register", registerUser);

router.post("/login", loginUser);

export default router;
