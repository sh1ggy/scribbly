use bebop::BuildConfig;
use bebop_tools as bebop;
use std::{path::PathBuf, env};
fn main() {
    bebop::download_bebopc(PathBuf::from("target").join("bebopc"));
    bebop::build_schema_dir(
        "schemas",
        "src/gen_schemas",
        &BuildConfig {
            skip_generated_notice: false,
            generate_module_file: true,
            format_files: true,
        },
    );
    
}
