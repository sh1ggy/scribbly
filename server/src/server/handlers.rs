use std::collections::HashMap;

use bebop::{Record, SubRecord};
use tungstenite::Message;

use crate::{
    gen_schemas::{api, client, common},
    server::GameState,
};

use super::{ClientConnection, ClientType};

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

pub async fn handle_client_message(
    msg_type: client::ClientMessageType,
    data: &[u8],
    conn: &mut ClientConnection,
) {
    // Admin handlers
    if let ClientType::Admin = conn.client_type {
        println!("Admin message: {:?}", msg_type);
        handle_admin_message(msg_type, data, conn).await;
    }
    handle_game_message(msg_type, data, conn).await;
    // Game handlers
}

async fn handle_admin_message(
    msg_type: client::ClientMessageType,
    data: &[u8],
    conn: &mut ClientConnection,
) {
    match msg_type {
        client::ClientMessageType::StartADM => {
            if let ClientType::Admin = conn.client_type {
                // unscope the mutex before await because the future can be across 2 threads
                {
                    let mut game = conn.game_ref.lock().unwrap();
                    let mut drawings = [Vec::new(), Vec::new()];
                    drawings[0].push([Vec::new(), Vec::new()]);
                    drawings[1].push([Vec::new(), Vec::new()]);
                    

                    *game = Some(GameState {
                        clients: HashMap::new(),
                        drawings,
                    });
                }
                let e = common::Empty {};
                let msg = get_dto_binary(e, api::ServerMessageType::Start as u32);
                let msg = Message::Binary(msg);
                conn.broadcast_message(&msg).await;
                println!("Starting game");
            } else {
                println!("Unauthorized start from {:?}", conn.client_id);
            }
        }
        client::ClientMessageType::AuthADM => {
            println!("Upgrading client number {:?} to admin", conn.client_id);
            conn.client_type = ClientType::Admin;
        }

        _ => println!("Unhandled message for admin {:?}", msg_type),
    }
}

async fn handle_game_message(
    msg_type: client::ClientMessageType,
    data: &[u8],
    conn: &mut ClientConnection,
) {
    match msg_type {
        client::ClientMessageType::Ping => {
            let ping = api::Ping::deserialize(data).unwrap();

            println!("Got ping {:?}", ping);
        }
        client::ClientMessageType::CursorLocation => {
            let cursor = client::CursorLocation::deserialize(data).unwrap();
            // Run normalization calcs here
            {
                let Some(game) = &mut *conn.game_ref.lock().unwrap() else {
                    return;
                };
                let ClientType::Gamer(order) = conn.client_type else {
                    return;
                };

                let mut drawing = &game.drawings[order as usize];

                if let Some(coord) = drawing.last() {

                }

                else {
                    // drawing.push(common::Coord {
                    //     x: cursor.x,
                    //     y: cursor.y,
                    // });
                }
            }
            // let draw = api::DrawUpdate {
                 
            //     x: cursor.x,
            //     y: cursor.y,
            // };
            // THIS DOESNT WORK HEEEEELP

            let msg = get_dto_binary(cursor, api::ServerMessageType::DrawUpdate as u32);
            let msg = Message::Binary(msg);
            conn.broadcast_message(&msg).await;
        }
        client::ClientMessageType::FinishStroke => todo!(),
        client::ClientMessageType::Clear => todo!(),
        client::ClientMessageType::Vote => todo!(),
        _ => println!("Unhandled message for game {:?}", msg_type),
    }
}
