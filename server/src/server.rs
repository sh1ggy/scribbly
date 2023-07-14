use crate::ml;

pub struct Server<'a, T: ml::MLModel> {
    model: T,
    server_addr: &'a str,
}

impl<'a, T: ml::MLModel> Server<'a, T> {
    pub fn new(model: T, server_addr: &'a str) -> Self {
        println!("Server created");
        Self { model, server_addr }
    }

    pub async fn run(&mut self) {
        println!("Server running on {}", self.server_addr);

        let listener = TcpListener::bind(self.server_addr)
            .await
            .expect("Failed to bind to address");
        // Initialise game
        let game = GameResult::default();
        let game_ref = Arc::new(Mutex::new(game));

        // TODO: make this a hashmap of player_id
        // let clients_con: Clients = Vec::<_>::new();
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
