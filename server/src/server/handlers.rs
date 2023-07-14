use bebop::{SubRecord, Record};

use super::ClientConnection;


pub fn get_dto_binary<'a, T: Record<'a>>(dto: T, op_code: u32) -> Vec<u8> {
    let mut buf = Vec::from(vec![0; dto.serialized_size()]);
    dto.serialized_size();

    //Place initial 4 values for opcode (end of vec but still)
    buf.extend(vec![0; 4]);


    // Copy over the op_code to the first 4 bytes
    let op_code_slice = &mut buf[0..4];
    let op_code_as_bytes = &op_code.to_le_bytes();
    op_code_slice.copy_from_slice(op_code_as_bytes);

    let mut body_slice = &mut buf[4..];

    dto.serialize(&mut body_slice).unwrap();

    buf
}