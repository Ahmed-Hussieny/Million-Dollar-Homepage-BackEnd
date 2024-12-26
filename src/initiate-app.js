import connection_DB from "../DB/connection.js";
import { config } from "dotenv";
import * as Routers from "./modules/index.routes.js";
import { globalResponce } from './middlewares/global-Responce.js';
export const initiateApp = async ({app, express}) => {
    app.use(express.json());
    config();
    connection_DB();
    app.use('/logo', Routers.logoRouter);
    app.use('/auth', Routers.authRouter);
    app.use(globalResponce);

    app.use('*', (req, res) => {
        return res.status(404).json({message: 'Route not found'});
    });
};