mod placeholder;
mod models;


pub use placeholder::PlaceholderModel;

use std::path::PathBuf;
use models::MLResult;

pub trait MLModel {
    fn predict(&self, input_file: &PathBuf) -> MLResult;
}