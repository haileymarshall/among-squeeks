import { defineRoom, defineServer } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { ROOM_NAME } from "../../web/src/shared/protocol";
import { GameRoom } from "./GameRoom";

const port = Number(process.env.PORT ?? 2567);

const server = defineServer({
  transport: new WebSocketTransport(),
  rooms: { [ROOM_NAME]: defineRoom(GameRoom) },
});

await server.listen(port);
console.log(`Among Squeeks server on :${port}`);
