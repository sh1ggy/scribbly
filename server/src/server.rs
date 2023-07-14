mod handlers;

use std::{
    clone,
    collections::HashMap,
    sync::{Arc, Mutex},
};

use tokio::{
    io::BufWriter,
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
    gen_schemas::{ self, common, api, client},
    ml,
};

use handlers::get_dto_binary;

use bebop::prelude::*;

type Clients = HashMap<u32, UnboundedSender<Message>>;

const MAX_PLAYERS: usize = 50;
const MAX_BROADCAST_MESSAGES: usize = 100;


#[derive(Debug, Default, Clone)]
struct Gamer {
    /// Starts the order at 1
    pub order: u8,
}

#[derive(Debug, Clone)]
enum ClientType {
    Gamer(Gamer),
    Audience,
    Admin,
    Unknown,
}

#[derive(Debug)]
struct GameResult {
    pub game_outcome: common::GamerChoice,
    pub audience_votes: Vec<common::GamerChoice>,
    pub image_locs: [Vec<u8>; 2],
    pub ppl: Vec<ClientType>,
}



#[derive(Debug)]
struct GameState {}


#[derive(Debug)]
struct ClientConnection {
    pub clients_ref: Arc<Mutex<Clients>>,
    pub client_type: ClientType,
    pub game_ref: Arc<Mutex<Option<GameState>>>,
    pub client_id: u32,
}

impl ClientConnection {
    pub async fn broadcast_message(&self, msg: &Message) {
        let clients = self.clients_ref.lock().unwrap();
        for (_, client) in clients.iter() {
            let msg = msg.clone();
            client.send(msg).unwrap();
        }
    }

    pub async fn remove_client(&mut self, client_id: u32) {
        let mut clients = self.clients_ref.lock().unwrap();
        clients.remove_entry(&client_id);
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
    // Very important consideration here is we cant keep a mutexed object naked and unused before await because the future can be across 2 threads
    let client_count = conn.clients_ref.lock().unwrap().len();
    // TODO: this partial ownership is rough, refactor for client to not own stream
    let ws_stream = accept_async(stream).await?; //expect("Failed to accept");
    conn.client_id = (client_count as u32);

    if (client_count <= 1) {
        conn.client_type = ClientType::Gamer(Gamer {
            order: client_count as u8,
        });
    } else {
        conn.client_type = ClientType::Audience;
    }

    let (mut ws_sender, mut ws_receiver) = ws_stream.split();
    let (tx, mut rx) = unbounded_channel::<Message>();

    conn.clients_ref.lock().unwrap().insert(conn.client_id, tx);

    let ping = api::Ping {
        msg: &String::from("sup"),
        test: true
    };

    let buf = get_dto_binary(ping, api::ServerMessageType::Ping as u32);
    let msg = Message::Binary(buf);
    ws_sender.send(msg).await?;



    // let ctype_dto: common::ClientType = match conn.client_type {
    //     ClientType::Audience => common::ClientType::Audience,
    //     ClientType::Gamer(_) => common::ClientType::Gamer,
    //     ClientType::Unknown => common::ClientType::Unknown,
    // };

    // let mut ctype = api::ClientTypeDTO {
    //     ctype: ctype_dto,
    //     gamer_id: 0,
    //     id: conn.client_id,
    // };

    // if let ClientType::Gamer(ref gamer) = conn.client_type {
    //     ctype.gamer_id = gamer.order;
    // }

    // let buf = get_dto_binary(ctype, shared::ServerMessageType::ClientType as u32);
    // println!("Client type: {:?} and binary: {:?}", ctype_dto, &buf);
    // let msg = Message::Binary(buf);
    // ws_sender.send(msg).await?;

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

async fn handle_client_message(msg_type : client::ClientMessageType, data: &[u8], conn: &mut ClientConnection) {
    match msg_type {
        client::ClientMessageType::Ping => {
            let ping = api::Ping::deserialize(data).unwrap();

            println!("Got ping {:?}", ping);
        }
        client::ClientMessageType::StartADM=> {
            // let img = ImageData::deserialize(data).unwrap();
            let mut game = conn.game_ref.lock().unwrap();
            *game = Some(GameState {});
            println!("Starting game");
            // let new_buf = get_dto_binary(img, api::ServerMessageType::Image as u32);
            // let msg = Message::Binary(new_buf);

            // conn.broadcast_message(&msg).await;
        },
        client::ClientMessageType::AuthADM => {
            println!("Upgrading client number {:?} to admin", conn.client_id);
            conn.client_type = ClientType::Admin;
        }

        _=> println!("Unhandled message {:?}", msg_type),
    }
}


