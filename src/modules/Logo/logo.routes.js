import { Router } from "express"
import * as logoController from "./logo.controller.js";
import { multerMiddlewareLocal } from "../../middlewares/multer.js";
import { allowedExtension } from "../../utils/allowedExtension.js";
const logoRouter = Router();
logoRouter.post("/addLogo",multerMiddlewareLocal({extensions:allowedExtension.image}).single('image'), logoController.addLogo);
logoRouter.get("/getLogos", logoController.getLogos);

export default logoRouter;