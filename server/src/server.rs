mod client_connection;
mod handlers;

use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    thread,
    time::Duration,
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
    gen_schemas::{
        api::{self, Drawing},
        client, common,
    },
    ml,
};

use handlers::{get_dto_binary, handle_client_message};

use bebop::prelude::*;

use self::client_connection::{ClientType, ClientConnection};

type Clients = HashMap<u32, UnboundedSender<Message>>;

const MAX_PLAYERS: usize = 50;
const MAX_BROADCAST_MESSAGES: usize = 100;


type Stroke = [Vec<u8>; 2];

struct CSVData {
    pub drawing: Vec<Stroke>,
}

#[derive(Debug)]
pub struct GameState {
    id: Guid,
    clients: HashMap<u32, ClientType>,
    drawings: [Vec<Vec<api::Coord>>; 2],
    stage: api::Stage,
    prompt: String,
}
// THE LIFETIME SPECIFIER HERE MAKES SURE THAT SLICE WRAPPER IS ABLE TO KEEP THE REFERENCE TO THE STROKE ARRAYS
async fn send_gamestate_dto<'a>(conn: &mut ClientConnection) {
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

        let gamestate_dto = api::GameState {
            id: game.id,
            clients,
            drawings,
            stage: game.stage,
            prompt: &game.prompt.clone(),
        };
        let bin = get_dto_binary(gamestate_dto, api::ServerMessageType::GameState as u32);
        msg = Message::Binary(bin);
    }

    conn.broadcast_message(&msg).await;
}

pub enum InternalMessage {
    CountDownLobby,
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

        let (internal_tx, mut internal_rx) = unbounded_channel();

        let game_ref_clone = Arc::clone(&game_ref);
        let cons_ref_clone = Arc::clone(&cons_ref);
        // Tokio threads need an async task in them for them to be considerd async,
        tokio::spawn(async move {
            loop {
                let msg = internal_rx.recv().await.unwrap();

                // handle_internal_msg(msg, game_ref_clone, cons_ref_clone).await;
                handle_internal_msg(msg, game_ref.clone(), cons_ref.clone()).await;
                // send_gamestate_dto(&mut ClientConnection {
                //     clients_ref: cons_ref.clone(),
                //     client_type: ClientType::Unknown,
                //     client_id: 0,
                //     game_ref: game_ref.clone(),
                // })
                // .await;
            }
        });

        while let Ok((stream, _)) = listener.accept().await {
            let cc = ClientConnection {
                clients_ref: cons_ref_clone.clone(),
                client_type: ClientType::Unknown,
                client_id: 0,
                game_ref: game_ref_clone.clone(),
                internal_comms: internal_tx.clone(),
            };

            tokio::spawn(accept_connection(stream, cc));
        }
    }
}

async fn handle_internal_msg(
    msg: InternalMessage,
    game_ref: Arc<Mutex<Option<GameState>>>,
    clients_ref: Arc<Mutex<Clients>>,
) {
    match msg {
        InternalMessage::CountDownLobby => {
            tokio::time::sleep(Duration::from_secs(2)).await;
            let mut clients = clients_ref.lock().unwrap();
            broadcast_message(&mut clients, &Message::Ping("Yo".into()));

            println!("Counting down lobby");
        }
    }
}

pub async fn broadcast_message(clients: &mut Clients, msg: &Message) {
    for (_, client) in clients.iter() {
        let msg = msg.clone();
        client.send(msg).unwrap();
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

    let buf = get_dto_binary(ping, api::ServerMessageType::Ping as u32);
    let msg = Message::Binary(buf);
    ws_sender.send(msg).await?;

    send_gamestate_dto(&mut conn).await;

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
                if let Some(rx_msg) = rx_msg {
                    ws_sender.send(rx_msg).await?;
                }
                else {
                    println!("No message from rx channel");
                }
            },
        }
    }
    Ok(())
}
