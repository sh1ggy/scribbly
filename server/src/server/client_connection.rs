use std::{
    sync::{Arc, Mutex},
    time::{SystemTime, UNIX_EPOCH},
};

use bebop::SliceWrapper;
use tokio::sync::mpsc::UnboundedSender;
use tungstenite::Message;

use crate::gen_schemas::{
    api::{self, Drawing},
    common,
};

use super::{handlers::get_dto_binary, Clients, GameState, InternalMessage};

#[derive(Debug, Clone)]
pub enum ClientType {
    Gamer(u8),
    Audience,
    Admin,
    Unknown,
}

impl Into<api::ClientType> for ClientType {
    fn into(self) -> api::ClientType {
        match self {
            ClientType::Audience => api::ClientType::Audience,
            ClientType::Gamer(_) => api::ClientType::Gamer,
            ClientType::Unknown => api::ClientType::Unknown,
            ClientType::Admin => api::ClientType::Admin,
        }
    }
}

impl ClientType {
    pub fn to_dto(self, id: u32) -> api::ClientTypeDTO {
        let mut ctype_dto = api::ClientTypeDTO {
            ctype: self.clone().into(),
            gamer_id: 0,
            id,
        };

        if let ClientType::Gamer(gamer_order) = self {
            ctype_dto.gamer_id = gamer_order;
        }
        ctype_dto
    }
}

#[derive(Debug)]
pub struct InnerConn {
    pub clients_ref: Arc<Mutex<Clients>>,
    // Having to destructure the Option and check it every time is bad, fixes include:
    // 1. Using an internal Arc<Mutex<GameState>> and cloning it every time we need it, using a rwlock on the outside Options
    // 2. Using the actor pattern with a single actor that holds the game state in a thread listening for messages on how to mutate with A LOT of getters
    pub game_ref: Arc<Mutex<Option<GameState>>>,
}

impl InnerConn {
    pub async fn broadcast_message(&self, msg: &Message) {
        let mut to_disconnect_clients = Vec::new();
        {
            let clients = self.clients_ref.lock().unwrap();
            for (id, client) in clients.iter() {
                let msg = msg.clone();
                if let Err(e) = client.send(msg) {
                    println!("Error sending from client: {:?}", e);
                    to_disconnect_clients.push(id.clone());
                }
            }
        }

        // // This is why we need Internal Message passing than just websocket::Messages passed through every client
        for id in to_disconnect_clients {
            println!("Disconnecting client: {:?}", id);
            if let Some(game) = &mut *self.game_ref.lock().unwrap() {
                game.clients.remove(&id);
            }
            self.clients_ref.lock().unwrap().remove(&id);
        }
    }

    pub async fn send_gamestate_dto<'a>(&mut self) {
        let e = api::Empty {};

        let mut msg = Message::Binary(get_dto_binary(
            e,
            api::ServerMessageType::NoGameState as u32,
        ));

        if let Some(game) = &mut *self.game_ref.lock().unwrap() {
            let mut drawings: Vec<Drawing> = Vec::new();
            let game_drawings = game.drawings.clone();
            for drawing in game_drawings.iter() {
                let mut drawingDto = Drawing {
                    strokes: Vec::new(),
                };

                for stroke in drawing.iter() {
                    // Idk why we need a ref here
                    let saved = &stroke;
                    drawingDto.strokes.push(SliceWrapper::Cooked(saved));
                }

                drawings.push(drawingDto);
            }

            let clients = game
                .clients
                .clone()
                .into_iter()
                .map(|(id, ctype)| (id, ctype.into()))
                .collect();

            let current_time = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_millis();

            let stage_timing = match game.stage {
                api::Stage::Drawing => common::DRAWING_TIME,
                api::Stage::AudienceLobby => common::AUDIENCE_LOBBY_TIME,
                api::Stage::Voting => common::VOTING_TIME,
                _ => 0,
            };

            let stage_finish_time = (game.last_stage_time + (stage_timing as u128)) as u64;

            let prompt = api::Prompt {
                class: game.prompt.class,
                name: &game.prompt.name.clone(),
            };

            let gamestate_dto = api::GameState {
                stage_finish_time,
                id: game.id,
                clients,
                drawings,
                stage: game.stage,
                prompt,
            };
            let bin = get_dto_binary(gamestate_dto, api::ServerMessageType::GameState as u32);
            msg = Message::Binary(bin);
        }

        self.broadcast_message(&msg).await;
    }
}

#[derive(Debug)]
pub struct ClientConnection {
    pub client_type: ClientType,
    pub client_id: u32,
    pub internal_comms: UnboundedSender<InternalMessage>,
    pub inner: InnerConn,
}

impl ClientConnection {
    pub async fn remove_client(&mut self, client_id: u32) {
        let mut clients = self.inner.clients_ref.lock().unwrap();
        clients.remove_entry(&client_id);

        if let Some(ref mut game) = self.inner.game_ref.lock().unwrap().as_mut() {
            game.clients.remove_entry(&client_id);
        }
    }

    pub async fn add_client(&mut self, tx: UnboundedSender<Message>) {
        let client_count = self.inner.clients_ref.lock().unwrap().len();
        let mut new_id = 0;
        {
            if let Some(game) = &mut *self.inner.game_ref.lock().unwrap() {
                game.client_counter += 1;
                new_id = game.client_counter;
            }
            else {
                println!("Weird guy joining since there's no game");
            }
        }
        self.client_id = (new_id);
        self.inner
            .clients_ref
            .lock()
            .unwrap()
            .insert(self.client_id, tx);

        if let Some(ref mut game) = self.inner.game_ref.lock().unwrap().as_mut() {
            let total_gamers = game
                .clients
                .iter()
                .filter(|(id, client_type)| match client_type {
                    ClientType::Gamer(_) => true,
                    _ => false,
                })
                .count();

            if (total_gamers <= 1) {
                self.client_type = ClientType::Gamer(total_gamers as u8);
            } else {
                self.client_type = ClientType::Audience;
            }

            game.clients
                .insert(self.client_id, self.client_type.clone());

            if let api::Stage::GamerSelect = game.stage {
                if (total_gamers == 2) {
                    self.internal_comms
                        .send(InternalMessage::CountDownLobby)
                        .unwrap();
                }
            }
        }
    }
}
