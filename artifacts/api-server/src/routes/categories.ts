import { Router } from "express";
import { db, categoriesTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/categories", async (req, res) => {
  try {
    const categories = await db
      .select()
      .from(categoriesTable)
      .orderBy(desc(categoriesTable.articleCount));
    res.json(categories);
  } catch (err) {
    req.log.error({ err }, "Failed to list categories");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
