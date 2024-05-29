import dgram from "dgram";

import { processBindFile } from ".";

const server = dgram.createSocket("udp4");

server.bind("53");
