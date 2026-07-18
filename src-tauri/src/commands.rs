use tauri::State;

use crate::{
    db::{DbError, DbState},
    model::DebateTableData,
};

#[tauri::command]
pub async fn db_get(state: State<'_, DbState>, id: String) -> Result<DebateTableData, DbError> {
    state.get(&id).await
}

#[tauri::command]
pub async fn db_get_all(state: State<'_, DbState>) -> Result<Vec<DebateTableData>, DbError> {
    state.get_all().await
}

#[tauri::command]
pub async fn db_post(
    state: State<'_, DbState>,
    item: DebateTableData,
) -> Result<DebateTableData, DbError> {
    state.post(item).await
}

#[tauri::command]
pub async fn db_delete(
    state: State<'_, DbState>,
    id: String,
) -> Result<Vec<DebateTableData>, DbError> {
    state.delete(&id).await
}

#[tauri::command]
pub async fn db_patch(
    state: State<'_, DbState>,
    item: DebateTableData,
) -> Result<DebateTableData, DbError> {
    state.patch(item).await
}
