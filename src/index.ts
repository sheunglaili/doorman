import dotenv from "dotenv";

import { DoormanServer } from "./server";

dotenv.config();

const server = new DoormanServer();
server.start();