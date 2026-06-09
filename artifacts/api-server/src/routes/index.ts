import { Router, type IRouter } from "express";
import healthRouter from "./health";
import articlesRouter from "./articles";
import categoriesRouter from "./categories";
import digestRouter from "./digest";
import statsRouter from "./stats";
import newsletterRouter from "./newsletter";
import initRouter from "./init";

const router: IRouter = Router();

router.use(healthRouter);
router.use(articlesRouter);
router.use(categoriesRouter);
router.use(digestRouter);
router.use(statsRouter);
router.use(newsletterRouter);
router.use(initRouter);

export default router;
