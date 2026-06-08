import { Router } from "express";
import { db, newsletterTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/newsletter/subscribe", async (req, res) => {
  try {
    const { email, name, countries } = req.body as {
      email: string;
      name?: string;
      countries?: string[];
    };

    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    const existing = await db
      .select()
      .from(newsletterTable)
      .where(eq(newsletterTable.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already subscribed" });
    }

    await db.insert(newsletterTable).values({
      email: email.toLowerCase(),
      name: name ?? null,
      countries: countries ?? [],
    });

    res.status(201).json({
      success: true,
      message: "Successfully subscribed to the Arabian Startups Ecosystem daily digest!",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to subscribe newsletter");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
