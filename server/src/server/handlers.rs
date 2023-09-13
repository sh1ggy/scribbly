use std::{
    collections::HashMap,
    sync::Mutex,
    time::{SystemTime, UNIX_EPOCH},
};

use bebop::{Guid, Record, SubRecord};
use rand::Rng;
use tungstenite::{protocol::CloseFrame, Message};

use crate::{
    gen_schemas::{
        api::{self, DrawUpdate, Empty},
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
                let mut categories = tokio::fs::read_to_string("categories.txt")
                    .await
                    .expect("Something went wrong reading the file");

                //Split on newline
                let categories: Vec<&str> = categories.split('\n').collect();
                //Pick a random line
                let cat = rand::random::<usize>() % categories.len();
                let prompt = categories[cat];
                let prompt = crate::server::Prompt {
                    name: prompt.to_string(),
                    class: cat as u32,
                };

                {
                    let mut maybe_exit = None;
                    if let Some(yes_game) = conn.inner.game_ref.lock().unwrap().as_mut() {
                        if (yes_game.stage != api::Stage::Results) {
                            println!("Game is not in results stage, resetting all clients start");
                            let closing_frame = CloseFrame {
                                code: tungstenite::protocol::frame::coding::CloseCode::Abnormal,
                                reason: "Game is not in results stage, resetting all clients start"
                                    .into(),
                            };

                            let close_msg = Message::Close(Some(closing_frame));
                            maybe_exit = Some(close_msg);
                        }
                    }
                    
                    if let Some(close_msg) = maybe_exit {
                        // This might work far better than the restart message
                        conn.inner.broadcast_message(&close_msg).await;
                        return;
                    }
                }

                // unscope the mutex before await because the future can be across 2 threads
                {
                    let mut game = conn.inner.game_ref.lock().unwrap();
                    let drawings = [Vec::new(), Vec::new()];
                    let current_time = SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_millis();

                    let random_bytes = rand::thread_rng().gen::<[u8; 16]>();
                    *game = Some(GameState {
                        votes: Vec::new(),
                        last_stage_time: current_time,
                        prompt,
                        id: Guid::from_ms_bytes(&random_bytes),
                        stage: api::Stage::GamerSelect,
                        clients: HashMap::new(),
                        drawings,
                        client_counter: 0,
                    });
                }

                let e = common::Empty {};
                let msg = get_dto_binary(e, api::ServerMessageType::Restart as u32);
                println!("Sending start message {:?} bytes", msg);
                let msg = Message::Binary(msg);
                conn.inner.broadcast_message(&msg).await;
                println!("Starting game");
            } else {
                println!("Unauthorized start from {:?}", conn.client_id);
            }
        }
        _ => println!("Unhandled message for admin {:?}", msg_type),
    }
}

// This function should return error types and the caller should handle them by sending them back
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
                conn.inner.broadcast_message(&msg).await;
            }
        }

        client::ClientMessageType::AuthADM => {
            println!("Upgrading client number {:?} to admin", conn.client_id);
            conn.client_type = ClientType::Admin;
        }
        client::ClientMessageType::FinishStroke => {
            let Some(game) = &mut *conn.inner.game_ref.lock().unwrap() else {
                return;
            };
            let ClientType::Gamer(order) = conn.client_type else {
                return ;
            };
            let drawing = &mut game.drawings[order as usize];
            // TODO: Instead of pushing a new vec, finish using the older vec through some kind of flag on drawing
            drawing.push(Vec::new());
        }
        client::ClientMessageType::Clear => {
            let mut msg = None;

            {
                let mut game_option = conn.inner.game_ref.lock().unwrap();
                let Some(game) = &mut *game_option else {
                return;
            };
                let ClientType::Gamer(order) = conn.client_type else {
                return ;
            };
                let drawing = &mut game.drawings[order as usize];
                drawing.clear();
                println!("Clearing drawing {:?}", order);

                msg = Some(Message::Binary(get_dto_binary(
                    api::Clear {
                        gamer: api::GamerChoice::try_from((order as u32) + 1).unwrap(),
                    },
                    api::ServerMessageType::Clear as u32,
                )));
            }

            if (msg.is_some()) {
                conn.inner.broadcast_message(&msg.unwrap()).await;
            }
        }
        client::ClientMessageType::Vote => {
            let vote = client::Vote::deserialize(data).unwrap();
            {
                let Some(game) = &mut *conn.inner.game_ref.lock().unwrap() else {
                    return;
                };
                let ClientType::Audience = conn.client_type else {
                    return ;
                };
                let vote: api::GamerChoice =
                    api::GamerChoice::try_from(vote.choice as u32).unwrap();
                game.votes.push(vote);
            }

            conn.inner
                .broadcast_message(&Message::Binary(get_dto_binary(
                    Empty {},
                    api::ServerMessageType::VoteUpdate as u32,
                )))
                .await;
        }
        _ => println!("Unhandled message for game {:?}", msg_type),
    }
}

fn save_coord_to_game_state(coord: api::Coord, conn: &mut ClientConnection) -> Option<DrawUpdate> {
    let Some(game) = &mut *conn.inner.game_ref.lock().unwrap() else {
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
                gamer: gamer_choice,
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
