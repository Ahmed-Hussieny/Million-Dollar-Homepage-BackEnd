import connection_DB from "../DB/connection.js";
import { config } from "dotenv";
import { logoRouter } from "./modules/index.routes.js";
export const initiateApp = async ({app, express}) => {
    app.use(express.json());
    config();
    connection_DB();
    app.use('/logo', logoRouter);
};