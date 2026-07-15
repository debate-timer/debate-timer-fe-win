mod commands;
mod db;
mod model;
mod seed;

use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let database_path = app.path().app_data_dir()?.join(db::DB_FILE_NAME);
            let database = db::DbState::new(database_path);
            tauri::async_runtime::block_on(database.initialize())?;
            app.manage(database);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::db_get,
            commands::db_get_all,
            commands::db_post,
            commands::db_delete,
            commands::db_patch,
        ])
        .run(tauri::generate_context!())
        .expect("failed to run the Tauri application");
}
