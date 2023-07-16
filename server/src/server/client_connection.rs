use std::{
    sync::{Arc, Mutex},
    time::{SystemTime, UNIX_EPOCH},
};

use bebop::SliceWrapper;
use tokio::sync::mpsc::UnboundedSender;
use tungstenite::Message;

use crate::gen_schemas::api::{self, Drawing};

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
pub struct ClientConnection {
    pub clients_ref: Arc<Mutex<Clients>>,
    pub client_type: ClientType,
    pub game_ref: Arc<Mutex<Option<GameState>>>,
    pub client_id: u32,
    pub internal_comms: UnboundedSender<InternalMessage>,
}

impl ClientConnection {
    /// Understand that if you encounter a send error for this opbject, it means u have an unresolved mutex before awaiting this
    pub async fn broadcast_message(&self, msg: &Message) {
        let clients = self.clients_ref.lock().unwrap();
        for (_, client) in clients.iter() {
            let msg = msg.clone();
            if let Err(e) = client.send(msg) {
                println!("Error sending from client: {:?}", e);
            }
        }
    }

    pub async fn remove_client(&mut self, client_id: u32) {
        let mut clients = self.clients_ref.lock().unwrap();
        clients.remove_entry(&client_id);

        if let Some(ref mut game) = self.game_ref.lock().unwrap().as_mut() {
            game.clients.remove_entry(&client_id);
        }
    }

    pub async fn add_client(&mut self, tx: UnboundedSender<Message>) {
        let client_count = self.clients_ref.lock().unwrap().len();
        self.client_id = (client_count as u32);
        self.clients_ref.lock().unwrap().insert(self.client_id, tx);

        if let Some(ref mut game) = self.game_ref.lock().unwrap().as_mut() {
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

            let total_gamers = game
                .clients
                .iter()
                .filter(|(id, client_type)| match client_type {
                    ClientType::Gamer(_) => true,
                    _ => false,
                })
                .count();
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

// THE LIFETIME SPECIFIER HERE MAKES SURE THAT SLICE WRAPPER IS ABLE TO KEEP THE REFERENCE TO THE STROKE ARRAYS
pub async fn send_gamestate_dto<'a>(conn: &mut ClientConnection) {
    let e = api::Empty {};

    let mut msg = Message::Binary(get_dto_binary(
        e,
        api::ServerMessageType::NoGameState as u32,
    ));

    if let Some(game) = &mut *conn.game_ref.lock().unwrap() {
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

        let millis_elapsed_since_stage = (current_time - game.last_stage_time) as u64;

        let gamestate_dto = api::GameState {
            id: game.id,
            clients,
            drawings,
            stage: game.stage,
            prompt: &game.prompt.name.clone(),
            millis_elapsed_since_stage,
        };
        let bin = get_dto_binary(gamestate_dto, api::ServerMessageType::GameState as u32);
        msg = Message::Binary(bin);
    }

    conn.broadcast_message(&msg).await;
}
