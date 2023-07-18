use tokio::io::{AsyncWriteExt, BufWriter};

use crate::{ml::PlaceholderModel, server::Server};
use tokio::process::Command;

mod gen_schemas;
mod ml;
mod server;

use std::str;

#[tokio::main]
async fn main() {
    let server_addr = "127.0.0.1:8001";
    let mut server = Server::new(server_addr);

    // let mut file = tokio::fs::OpenOptions::new()
    //     .write(true)
    //     .create(true)
    //     .append(true)
    //     .open("../results.csv")
    //     .await
    //     .unwrap();

    // let mut writer = BufWriter::new(file);

    // //Drawing, key, word, game_id, vote
    // let csv_entry = format!("{}", "Hey man");

    // writer.write(csv_entry.as_bytes()).await.unwrap();
    // writer.flush().await.unwrap();

    // let output = Command::new("ls")
    //     .args(&["-l", "-a"])
    //     .output()
    //     .await
    //     .unwrap(); //Handle error here
    // println!("status: {}, {}", output.status, str::from_utf8(&output.stdout).unwrap());
    // let data: [Vec<f32>;2] = serde_json::from_str("[[24.0, 199.0, 243.0], [7.0, 24.0, 172.0]]").unwrap();
    // // Map the data to turn into Vec of u32
    // println!(
    //     "status: {}, {}",
    //     output.status,
    // );

    server.run().await;

    println!("Closing server");
}
