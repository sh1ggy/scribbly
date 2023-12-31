mod client_connection;
mod handlers;

use serde::{Deserialize, Serialize};
use tungstenite::protocol::CloseFrame;

use std::{
    collections::HashMap,
    path::PathBuf,
    sync::{Arc, Mutex},
    thread,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use tokio::{
    io::{AsyncWriteExt, BufWriter},
    net::{TcpListener, TcpStream},
    process::Command,
    sync::mpsc::{unbounded_channel, UnboundedSender},
};

use futures_util::{SinkExt, StreamExt};
use tokio_tungstenite::{
    accept_async,
    tungstenite::{Error, Message},
};

// Just so we dont have to type out crate::ml every time
use crate::{
    gen_schemas::{
        api::{self, Drawing},
        client, common,
    },
    ml::{self, PlaceholderModel},
    server::client_connection::InnerConn,
};

use handlers::{get_dto_binary, handle_client_message};

use bebop::prelude::*;

use self::client_connection::{ClientConnection, ClientType};

type Clients = HashMap<u32, UnboundedSender<Message>>;

const MAX_PLAYERS: usize = 50;

type Stroke = [Vec<f32>; 2];
type CSVDrawing = Vec<Stroke>;

#[derive(Debug, Clone)]
pub struct Prompt {
    pub name: String,
    pub class: u32,
}

#[derive(Debug)]
pub struct GameState {
    id: Guid,
    clients: HashMap<u32, ClientType>,
    drawings: [Vec<Vec<api::Coord>>; 2],
    stage: api::Stage,
    prompt: Prompt,
    last_stage_time: u128,
    votes: Vec<api::GamerChoice>,
    client_counter: u32,
}

pub enum InternalMessage {
    CountDownLobby,
}

// Need the lifetime specifier for model ref, which also needs to be in a generic because it is a trait
pub struct Server<'a> {
    server_addr: &'a str,
    // If we dont need to save clients on a global scope like this, dont bother doing so
}

// I guess this is also another way of declaring generics less verbosely
impl<'a> Server<'a> {
    // Generally recommended to use sync fn for new then a async fn for run
    pub fn new(server_addr: &'a str) -> Self {
        println!("Server created");
        Self { server_addr }
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
            let mut inner = InnerConn {
                clients_ref: cons_ref.clone(),
                game_ref: game_ref.clone(),
            };
            loop {
                let msg = internal_rx.recv().await.unwrap();

                {
                    let mut maybe_exit = None;

                    let res = handle_internal_msg(msg, &mut inner).await;
                    match res {
                        Ok(_) => {}
                        Err(e) => {
                            println!("Error handling internal message: {}", e);
                            // This closeframe just closes the websocket without any error message
                            let closing_frame = CloseFrame {
                                code: tungstenite::protocol::frame::coding::CloseCode::Abnormal,
                                reason: "Error handling internal message".into(),
                            };

                            let close_msg = Message::Close(Some(closing_frame));
                            maybe_exit = Some(close_msg);
                        }
                    }

                    if let Some(close_msg) = maybe_exit {
                        {
                            let mut game = inner.game_ref.lock().unwrap();
                            *game = None;
                        }
                        inner.broadcast_message(&close_msg).await;
                    }
                }
            }
        });

        while let Ok((stream, _)) = listener.accept().await {
            let inner = InnerConn {
                clients_ref: cons_ref_clone.clone(),
                game_ref: game_ref_clone.clone(),
            };
            let cc = ClientConnection {
                client_type: ClientType::Unknown,
                client_id: 0,
                internal_comms: internal_tx.clone(),
                inner,
            };

            // tokio::spawn(handle_connection(stream, cc));
            tokio::spawn(accept_connection(stream, cc));
        }
    }
}

use std::str;
async fn handle_internal_msg<'a>(
    msg: InternalMessage,
    inner: &mut InnerConn,
) -> anyhow::Result<()> {
    match msg {
        InternalMessage::CountDownLobby => {
            println!("TRansitioning to AudienceLobby and waiting");
            anyhow::bail!("Can i get uuuhh fuggin ");
            {
                if let Some(game) = &mut *inner.game_ref.lock().unwrap() {
                    game.stage = api::Stage::AudienceLobby;
                    game.last_stage_time = time();
                }
                inner.send_gamestate_dto().await;
            }

            tokio::time::sleep(Duration::from_millis(common::AUDIENCE_LOBBY_TIME as u64)).await;

            println!("TRansitioning to Drawing");
            {
                let thing = (inner.game_ref.lock().map_err(|e| e.to_string()));
                match thing {
                    Ok(mut game) => {
                        if let Some(game) = &mut *game {
                            game.stage = api::Stage::Drawing;
                            game.last_stage_time = time();
                        }
                    }
                    Err(e) => {
                        anyhow::bail!("MutexError: {}", e);
                    }
                }
            }

            inner.send_gamestate_dto().await;

            println!("Waiting for drawing to finish");

            tokio::time::sleep(Duration::from_millis(common::DRAWING_TIME as u64)).await;

            {
                if let Some(game) = &mut *inner.game_ref.lock().unwrap() {
                    game.stage = api::Stage::Voting;
                    game.last_stage_time = time();
                }
            }
            inner.send_gamestate_dto().await;

            tokio::time::sleep(Duration::from_millis(common::VOTING_TIME as u64)).await;
            {
                if let Some(game) = &mut *inner.game_ref.lock().unwrap() {
                    game.stage = api::Stage::Judging;
                    game.last_stage_time = time();
                }
            }

            inner.send_gamestate_dto().await;

            finalise_game(inner.game_ref.clone()).await;

            let gamerA = Vec::new();
            let gamerB = Vec::new();

            let mut msg = Message::Binary(get_dto_binary(
                common::Empty {},
                api::ServerMessageType::NoGameState as u32,
            ));

            #[cfg(windows)]
            {
                let output = Command::new("C:/Users/anhad/miniconda3/envs/ml/python.exe ")
                    .args(&["d:/scribbly/server/scribbly.py"])
                    .output()
                    .await
                    .unwrap(); //Handle error here

                let output = str::from_utf8(&output.stdout).unwrap();
                println!("Got Ml Result: {}", output);

                let data: [Vec<f32>; 2] = serde_json::from_str(output).unwrap();

                let gamerA = data[0]
                    .iter()
                    .map(|x| x.round() as u32)
                    .collect::<Vec<u32>>();
                let gamerB = data[1]
                    .iter()
                    .map(|x| x.round() as u32)
                    .collect::<Vec<u32>>();
            }

            {
                if let Some(game) = &mut *inner.game_ref.lock().unwrap() {
                    let votes_clone = (&game.votes.clone());
                    let result = api::ResultsSTG {
                        id: game.id,
                        votes: SliceWrapper::Cooked(&votes_clone),
                        gamer_akvals: SliceWrapper::Cooked(&gamerA),
                        gamer_bkvals: SliceWrapper::Cooked(&gamerB),
                    };
                    let data = get_dto_binary(result, api::ServerMessageType::ResultsSTG as u32);
                    msg = Message::Binary(data);
                }
            }
            inner.broadcast_message(&msg).await;
        }
    }
    Ok(())
}

async fn finalise_game(game_ref: Arc<Mutex<Option<GameState>>>) {
    let drawings;
    let prompt;
    let votes;
    let guid;
    {
        let mut game = game_ref.lock().unwrap();
        let Some(game) = &mut *game else {
        return ;
        };
        drawings = game.drawings.clone();
        prompt = game.prompt.clone();
        votes = game.votes.clone();
        guid = game.id.clone();
    }

    save_results_to_csv(&drawings, prompt, &votes, guid).await;
}

async fn save_results_to_csv(
    drawings: &[Vec<Vec<api::Coord>>; 2],
    prompt: Prompt,
    votes: &Vec<api::GamerChoice>,
    game_id: Guid,
) {
    for (gamer_id, drawing) in drawings.iter().enumerate() {
        let mut csv_data: CSVDrawing = Vec::new();
        for stroke in drawing.iter() {
            let mut stroke_def: Stroke = [Vec::new(), Vec::new()];
            for coord in stroke.iter() {
                stroke_def[0].push(coord.x);
                stroke_def[1].push(coord.y);
            }
            csv_data.push(stroke_def);
        }

        let file_handle = tokio::fs::OpenOptions::new()
            .write(true)
            .create(true)
            .append(true)
            .open("./results.csv")
            .await;
        match file_handle {
            Ok(file) => {
                // Create a `BufWriter` for efficient writing
                let mut writer = BufWriter::new(file);

                // let mut csv_string = String::from("\n");
                // csv_string.push_str(&serde_json::to_string(&csv_data).unwrap());
                let csv_string = serde_json::to_string(&csv_data).unwrap();
                //Drawing, key, word, game_id, vote
                let gamer_id = api::GamerChoice::try_from((gamer_id as u32) + 1).unwrap();
                let sum_count = votes.iter().count();
                let votes_for_gamer = votes.iter().filter(|v| (**v == gamer_id.clone())).count();
                println!("{:?} got {:?} votes", gamer_id, votes_for_gamer);
                let mut votes_ratio = 0.0;
                if votes_for_gamer != 0 {
                    votes_ratio = votes_for_gamer as f32 / sum_count as f32;
                }

                println!("Votes ratio: {:?}", votes_ratio);

                let csv_entry = format!(
                    "\n\"{}\",{},{}",
                    csv_string,
                    prompt.class.clone(),
                    votes_ratio
                );
                println!("CSV entry: {:?}", csv_entry);

                writer.write(csv_entry.as_bytes()).await.unwrap();
                writer.flush().await.unwrap();
            }
            Err(e) => {
                println!("Error opening file: {}", e);
                return;
            }
        }
    }
}

fn time() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis()
}
async fn accept_connection(stream: TcpStream, conn: ClientConnection) {
    if let Err(e) = handle_connection(stream, conn).await {
        // match e {
        //     Error::ConnectionClosed | Error::Protocol(_) | Error::Utf8 => (),
        //     err => println!("Error processing connection: {}", err),
        // }

            println!("Error processing connection: {}", e);
    }
}

async fn handle_connection(stream: TcpStream, mut conn: ClientConnection) -> anyhow::Result<()> {
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

    conn.inner.send_gamestate_dto().await;

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
                            conn.inner.broadcast_message(&msg).await;
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
                    conn.remove_client(conn.client_id).await;
                    ws_sender.close().await?;
                    println!("No message from rx channel meaning theres no refs to this clients sender {}, closing connection", conn.client_id);
                    break;
                }
            },
        }
    }
    Ok(())
}
