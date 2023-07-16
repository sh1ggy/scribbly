use tokio::io::{BufWriter, AsyncWriteExt};

use crate::{ml::PlaceholderModel, server::Server};

mod gen_schemas;
mod ml;
mod server;

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

    server.run().await;

    // let arr = [[[0.77125,0.95375,0.98625,0.97875,0.86875,0.66875,0.62375,0.60875,0.59875,0.60125,0.64375,0.73875,0.84625,0.85625,0.85875,0.85375,0.82125,0.72875,0.69375,0.66125,0.50375,0.48375,0.43625,0.39125,0.34375,0.23875,0.06875,0.16875,0.40375,0.52875,0.57375,0.57375,0.54375,0.45375,0.44875,0.45875,0.45875,0.45625,0.45875,0.56375,0.63625,0.67875,0.68625,0.66125,0.56625,0.54875,0.53875,0.53625,0.61375],[0.034375,0.004375,0.004375,0.016875,0.054375,0.129375,0.146875,0.156875,0.179375,0.246875,0.311875,0.454375,0.529375,0.534375,0.536875,0.536875,0.526875,0.496875,0.486875,0.479375,0.449375,0.446875,0.439375,0.434375,0.436875,0.471875,0.551875,0.646875,0.581875,0.519375,0.484375,0.481875,0.474375,0.466875,0.466875,0.459375,0.456875,0.446875,0.431875,0.344375,0.311875,0.296875,0.291875,0.289375,0.296875,0.299375,0.304375,0.304375,0.324375]]];

    println!("Closing server");
}
