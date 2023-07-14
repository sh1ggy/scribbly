mod handlers;
mod client_connection;

use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

use tokio::{
    net::{TcpListener, TcpStream},
    sync::mpsc::{unbounded_channel, UnboundedSender},
};

use futures_util::{SinkExt, StreamExt};
use tokio_tungstenite::{
    accept_async,
    tungstenite::{Error, Message, Result},
};

// Just so we dont have to type out crate::ml every time
use crate::{
    gen_schemas::{api, client, common},
    ml,
};

use handlers::{get_dto_binary, handle_client_message};

use bebop::prelude::*;

type Clients = HashMap<u32, UnboundedSender<Message>>;

const MAX_PLAYERS: usize = 50;
const MAX_BROADCAST_MESSAGES: usize = 100;

#[derive(Debug, Clone)]
pub enum ClientType {
    Gamer(u8),
    Audience,
    Admin,
    Unknown,
}

impl ClientType {
    pub fn to_dto(self, id: u32) -> api::ClientTypeDTO {
        let ctype: api::ClientType = match self {
            ClientType::Audience => api::ClientType::Audience,
            ClientType::Gamer(_) => api::ClientType::Gamer,
            ClientType::Unknown => api::ClientType::Unknown,
            ClientType::Admin => api::ClientType::Admin,
        };

        let mut ctype_dto = api::ClientTypeDTO {
            ctype,
            gamer_id: 0,
            id,
        };

        if let ClientType::Gamer(gamer_order) = self {
            ctype_dto.gamer_id = gamer_order;
        }
        ctype_dto
    }
}

type Stroke = [Vec<u8>;2];

#[derive(Debug)]
pub struct GameState {
    clients: HashMap<u32, ClientType>,
    drawings: [Vec<Stroke>; 2],
}
#[derive(Debug)]
pub struct ClientConnection {
    pub clients_ref: Arc<Mutex<Clients>>,
    pub client_type: ClientType,
    pub game_ref: Arc<Mutex<Option<GameState>>>,
    pub client_id: u32,
}

impl ClientConnection {
    /// Understand that if you encounter a send error for this opbject, it means u have an unresolved mutex before awaiting this
    pub async fn broadcast_message(&self, msg: &Message) {
        let clients = self.clients_ref.lock().unwrap();
        for (_, client) in clients.iter() {
            let client = client.clone();
            let msg = msg.clone();
            tokio::spawn(async move {
                client.send(msg).unwrap();
            });
        }
    }

    pub async fn remove_client(&mut self, client_id: u32) {
        let mut clients = self.clients_ref.lock().unwrap();
        clients.remove_entry(&client_id);
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
        }
    }
}

// Need the lifetime specifier for model ref, which also needs to be in a generic because it is a trait
pub struct Server<'a, T: ml::MLModel> {
    model: &'a T,
    server_addr: &'a str,
    // If we dont need to save clients on a global scope like this, dont bother doing so
}

// I guess this is also another way of declaring generics less verbosely
impl<'a, T: ml::MLModel> Server<'a, T> {
    // Generally recommended to use sync fn for new then a async fn for run
    pub fn new(model: &'a T, server_addr: &'a str) -> Self {
        println!("Server created");
        Self { model, server_addr }
    }

    pub async fn run(&mut self) {
        println!("Server running on {}", self.server_addr);

        let listener = TcpListener::bind(self.server_addr)
            .await
            .expect("Failed to bind to address");
        let game = None;
        let game_ref = Arc::new(Mutex::new(game));

        let clients_con = HashMap::new();
        let cons_ref = Arc::new(Mutex::new(clients_con));

        while let Ok((stream, _)) = listener.accept().await {
            let cc = ClientConnection {
                clients_ref: cons_ref.clone(),
                client_type: ClientType::Unknown,
                client_id: 0,
                game_ref: game_ref.clone(),
            };

            tokio::spawn(accept_connection(stream, cc));
        }
    }
}

async fn accept_connection(stream: TcpStream, conn: ClientConnection) {
    if let Err(e) = handle_connection(stream, conn).await {
        match e {
            Error::ConnectionClosed | Error::Protocol(_) | Error::Utf8 => (),
            err => println!("Error processing connection: {}", err),
        }
    }
}

async fn handle_connection(stream: TcpStream, mut conn: ClientConnection) -> Result<()> {
    println!("New TCP connection from {}", stream.peer_addr()?);
    let ws_stream = accept_async(stream).await?;

    let (mut ws_sender, mut ws_receiver) = ws_stream.split();
    let (tx, mut rx) = unbounded_channel::<Message>();

    let ping = api::Ping {
        msg: &String::from("sup"),
        test: true,
    };

    conn.add_client(tx).await;
    println!("Client added to server {:?}", conn.game_ref.lock().unwrap());

    let buf = get_dto_binary(ping, api::ServerMessageType::Ping as u32);
    let msg = Message::Binary(buf);
    ws_sender.send(msg).await?;

    let ctype = conn.client_type.clone();
    let ctype_dto = ctype.to_dto(conn.client_id);

    let buf = get_dto_binary(ctype_dto, api::ServerMessageType::ClientTypeDTO as u32);
    let msg = Message::Binary(buf);
    ws_sender.send(msg).await?;

    loop {
        // Choses either rx or websocket to recieve, is really just a fancy match for 2 futures
        tokio::select! {
            ws_msg = ws_receiver.next() => {
                match ws_msg {
                    Some(msg)=>{
                        let msg = msg?;
                        if msg.is_text() {
                            conn.broadcast_message(&msg).await;
                            let txt = msg.to_text().unwrap();
                            println!("Got ws message: {}", txt);

                        }
                        else if msg.is_binary() {

                            println!("Got binary: {}",&msg);

                            let mut data = msg.into_data();
                            let op_code_buf = &data[0..4];
                            let op_code_number = u32::from_le_bytes(op_code_buf.try_into().unwrap());
                            if let Ok(op_code) = client::ClientMessageType::try_from(op_code_number) {

                                let data_buf = &mut data[4..];
                                handle_client_message(op_code, data_buf, &mut conn).await;
                            }
                            else {
                                println!("Bad msg type {:?}",op_code_number );
                            }
                        }
                        else if msg.is_close() {
                            println!("Got close message");
                            conn.remove_client(conn.client_id).await;
                            break;
                        }
                    }
                    None => break,
                }
            },

            rx_msg = rx.recv() => {
                let rx_msg = rx_msg.unwrap();
                ws_sender.send(rx_msg).await?;
            },
        }
    }
    Ok(())
}
