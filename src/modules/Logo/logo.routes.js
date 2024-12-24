import { Router } from "express"
import * as logoController from "./logo.controller.js";
import { multerMiddlewareLocal } from "../../middlewares/multer.js";
import { allowedExtension } from "../../utils/allowedExtension.js";
import crypto from "crypto";
const logoRouter = Router();
logoRouter.post("/addLogo",multerMiddlewareLocal({extensions:allowedExtension.image}).single('image'), logoController.addLogo);
logoRouter.get("/getLogos", logoController.getLogos);


const verifyWebhookSignature = (req) => {
    const signature = req.headers["x-tap-signature"];
    const body = JSON.stringify(req.body);
    const secretKey = process.env.TAP_SECRET_KEY;
    const generatedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(body)
      .digest("hex");
  
    return signature === generatedSignature;
  };

logoRouter.post("/webhook", logoController.verifyPayment);
logoRouter.post("/tap-webhook", logoController.test);
export default logoRouter;