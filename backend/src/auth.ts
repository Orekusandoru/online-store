import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "./database";
import { JWT_SECRET, BCRYPT_SALT_ROUNDS } from "./config";

// Реєстрація нового користувача
export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Вкажіть email та пароль" });
    }

    // Перевіряємо, чи існує користувач
    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Користувач з таким email вже існує" });
    }

    // Хешуємо пароль
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Додаємо користувача в БД
    const newUser = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
      [email, hashedPassword]
    );

    // Генеруємо токен
    const token = jwt.sign({ id: newUser.rows[0].id, email }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ message: "Користувач створений", token });
  } catch (error) {
    console.error("Помилка реєстрації:", error);
    res.status(500).json({ message: "Помилка сервера" });
  }
};
