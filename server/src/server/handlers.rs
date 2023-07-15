use std::{collections::HashMap, sync::Mutex};

use bebop::{Record, SubRecord, Guid};
use tungstenite::Message;

use crate::{
    gen_schemas::{
        api::{self, DrawUpdate},
        client,
        common::{self},
    },
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
                    let drawings = [Vec::new(), Vec::new()];
                    *game = Some(GameState {
                        prompt: String::from("banana"),
                        // TODO: make guid better lole
                        id: Guid::from_ms_bytes(&[0;16]),
                        stage: api::Stage::GamerSelect,
                        clients: HashMap::new(),
                        drawings,
                    });
                }
                
                let e = common::Empty {};
                let msg = get_dto_binary(e, api::ServerMessageType::Restart as u32);
                println!("Sending start message {:?} bytes", msg);
                let msg = Message::Binary(msg);
                conn.broadcast_message(&msg).await;
                println!("Starting game");
            } else {
                println!("Unauthorized start from {:?}", conn.client_id);
            }
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
            let server_coord = api::Coord {
                x: cursor.current_point.x,
                y: cursor.current_point.y,
            };
            let draw_update = save_coord_to_game_state(server_coord, conn);
            if let Some(draw_update) = draw_update {
                let msg = get_dto_binary(draw_update, api::ServerMessageType::DrawUpdate as u32);
                let msg = Message::Binary(msg);
                conn.broadcast_message(&msg).await;
            }
        }

        client::ClientMessageType::AuthADM => {
            println!("Upgrading client number {:?} to admin", conn.client_id);
            conn.client_type = ClientType::Admin;
        }
        client::ClientMessageType::FinishStroke => {
            let Some(game) = &mut *conn.game_ref.lock().unwrap() else {
                return;
            };
            let ClientType::Gamer(order) = conn.client_type else {
                return ;
            };
            let drawing = &mut game.drawings[order as usize];
            drawing.push(Vec::new());
        }
        client::ClientMessageType::Clear => todo!(),
        client::ClientMessageType::Vote => todo!(),
        _ => println!("Unhandled message for game {:?}", msg_type),
    }
}

fn save_coord_to_game_state(coord: api::Coord, conn: &mut ClientConnection) -> Option<DrawUpdate> {
    let Some(game) = &mut *conn.game_ref.lock().unwrap() else {
        return None;
    };
    let ClientType::Gamer(order) = conn.client_type else {
        return None;
    };

    let drawing = &mut game.drawings[order as usize];

    if let Some(stroke) = drawing.last_mut() {
        let mut ret_val = None;

        if let Some(prev_coord) = stroke.last() {
            let prev_point = api::Coord {
                x: prev_coord.x,
                y: prev_coord.y,
            };

            let current_point = api::Coord {
                x: coord.x,
                y: coord.y,
            };
            let gamer_choice = api::GamerChoice::try_from((order as u32) + 1).unwrap();

            ret_val = Some(DrawUpdate {
                prev_point,
                current_point,
                gamer: gamer_choice
            })
        } else {
            ret_val = None;
        }

        stroke.push(coord);
        ret_val
    } else {
        // If no strokes yet in the drawing, means this is our first point
        drawing.push(vec![coord]);
        None
    }
}
