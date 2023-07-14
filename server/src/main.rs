use crate::{ml::PlaceholderModel, server::Server};


mod server;
mod ml;
mod gen_schemas;

#[tokio::main]
async fn main() {
      let model = PlaceholderModel::new("".to_string());
    let server_addr = "127.0.0.1:8001";
    let mut server = Server::new(&model, server_addr);

    server.run().await;

    println!("Closing server");
}
