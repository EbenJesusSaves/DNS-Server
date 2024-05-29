import dgram from "dgram";

import { processBindFile } from "./index.js";

const server = dgram.createSocket("udp4");

server.bind("53");

const king = "boy ";

king.toString(16);
console.log(king);
