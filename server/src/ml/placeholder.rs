use super::{models::MLResult, MLModel};
use rand::random;

pub struct PlaceholderModel {
    pub model_path: String,

}

impl PlaceholderModel {
    pub fn new(model_path: String) -> Self {
        Self { model_path }
    }
}

impl MLModel for PlaceholderModel {
    fn predict(&self, input_file: &std::path::PathBuf) -> MLResult {
        let mut vec = vec![0.0; 3];
        for i in vec.iter_mut() {
            *i = random::<f32>();
        }

        MLResult {
            probabilities: vec,
            inference_time: random::<f32>(),
        }
    }
}
