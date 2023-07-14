import { ClientMessageType, ServerMessageType } from "@/lib/schemas";

export const byteArrayToLong = function (byteArray: Uint8Array) {
    var value = 0;
    for (var i = byteArray.length - 1; i >= 0; i--) {
        value = (value * 256) + byteArray[i];
    }

    return value;
};

export async function deserialize(event: MessageEvent<Blob>) {
    // Convert the event data into a Uint8Array
    const res = await new Response(event.data).arrayBuffer();
    // THIS IS A DEPRECIATED API, USE ABOVE OR FILEREADER
    // const res = await event.data.arrayBuffer();
    let data = new Uint8Array(res);
    const opCodeBytes = data.slice(0, 4);

    //Take the 4 bytes and convert them to a number
    const opCodeNumber = byteArrayToLong(opCodeBytes);
    let type: ServerMessageType = opCodeNumber;

    data = data.slice(4);

    console.log("Deserializing", { type, data });

    return { type, data };
}

// Make generic
export function getDTOBuffer(dto: Uint8Array, opCode: ClientMessageType): Uint8Array {
    const opCodeNumber: number = opCode;
    const opCodeBuffer = numToU8Array(opCodeNumber);
    const sendBuffer = contcatU8Arrays(opCodeBuffer, dto);
    return sendBuffer;
}

export function contcatU8Arrays(a: Uint8Array, b: Uint8Array) {
    let c = new (Uint8Array)(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
}

export function numToU8Array(number: number) {
    var byte1 = 0xff & number;
    var byte2 = 0xff & (number >> 8);
    var byte3 = 0xff & (number >> 16);
    var byte4 = 0xff & (number >> 24);

    return new Uint8Array([byte1, byte2, byte3, byte4]);
}

export const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
});