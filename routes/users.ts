import express from "express";
import {
  registerUser,
  loginUser,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController";
import {
  verifyToken,
  verifyOwnAccount,
  verifyAdmin,
} from "../utils/verifyToken";

const router = express.Router();

router.get("/:id", verifyToken, getUserById);

router.put("/:id", verifyToken, verifyOwnAccount, updateUser);

router.delete("/:id", verifyToken, verifyOwnAccount, deleteUser);

router.post("/register", registerUser);

router.post("/login", loginUser);

export default router;
