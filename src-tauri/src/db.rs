use std::{cmp::Ordering, io, path::PathBuf};

use chrono::{Local, NaiveDateTime};
use serde::ser::Serializer;
use thiserror::Error;
use tokio::{fs, sync::Mutex};
use uuid::Uuid;

use crate::{model::DebateTableData, seed::create_seed_data};

pub const DB_FILE_NAME: &str = "tauri-db.json";
const DATETIME_FORMAT: &str = "%Y-%m-%d %H:%M:%S";

#[derive(Debug, Error)]
pub enum DbError {
    #[error("Failed to find item.")]
    NotFound,
    #[error("Failed to access database.")]
    Io(#[source] io::Error),
    #[error("Failed to serialize database.")]
    Serialization(#[source] serde_json::Error),
}

impl serde::Serialize for DbError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

enum ReadFailure {
    Io(io::Error),
    Invalid(serde_json::Error),
}

pub struct DbState {
    path: PathBuf,
    mutex: Mutex<()>,
}

impl DbState {
    pub fn new(path: PathBuf) -> Self {
        Self {
            path,
            mutex: Mutex::new(()),
        }
    }

    pub async fn initialize(&self) -> Result<(), DbError> {
        let _guard = self.mutex.lock().await;
        self.ensure_parent_directory().await?;
        self.read_or_recover_locked().await?;
        Ok(())
    }

    pub async fn get(&self, id: &str) -> Result<DebateTableData, DbError> {
        let _guard = self.mutex.lock().await;
        let database = self.read_or_recover_locked().await?;

        database
            .into_iter()
            .find(|record| record.info.id == id)
            .ok_or(DbError::NotFound)
    }

    pub async fn get_all(&self) -> Result<Vec<DebateTableData>, DbError> {
        let _guard = self.mutex.lock().await;
        let mut database = self.read_or_recover_locked().await?;
        database.sort_by(compare_datetime);
        Ok(database)
    }

    pub async fn post(&self, mut item: DebateTableData) -> Result<DebateTableData, DbError> {
        let _guard = self.mutex.lock().await;
        let mut database = self.read_or_recover_locked().await?;

        item.info.id = Uuid::new_v4().to_string();
        item.info.datetime = current_datetime();
        database.push(item.clone());
        self.write_locked(&database).await?;

        Ok(item)
    }

    pub async fn delete(&self, id: &str) -> Result<Vec<DebateTableData>, DbError> {
        let _guard = self.mutex.lock().await;
        let mut database = self.read_or_recover_locked().await?;
        database.retain(|record| record.info.id != id);
        self.write_locked(&database).await?;
        Ok(database)
    }

    pub async fn patch(&self, item: DebateTableData) -> Result<DebateTableData, DbError> {
        let _guard = self.mutex.lock().await;
        let mut database = self.read_or_recover_locked().await?;

        for record in &mut database {
            if record.info.id == item.info.id {
                *record = item.clone();
            }
        }

        self.write_locked(&database).await?;
        Ok(item)
    }

    async fn ensure_parent_directory(&self) -> Result<(), DbError> {
        let Some(parent) = self.path.parent() else {
            return Ok(());
        };

        fs::create_dir_all(parent).await.map_err(DbError::Io)
    }

    async fn read_or_recover_locked(&self) -> Result<Vec<DebateTableData>, DbError> {
        match self.read_locked().await {
            Ok(database) => Ok(database),
            Err(ReadFailure::Io(error)) if error.kind() == io::ErrorKind::NotFound => {
                self.replace_with_seed_locked().await
            }
            Err(ReadFailure::Invalid(_error)) => {
                fs::remove_file(&self.path).await.map_err(DbError::Io)?;
                self.replace_with_seed_locked().await
            }
            Err(ReadFailure::Io(error)) => Err(DbError::Io(error)),
        }
    }

    async fn read_locked(&self) -> Result<Vec<DebateTableData>, ReadFailure> {
        let bytes = fs::read(&self.path).await.map_err(ReadFailure::Io)?;
        serde_json::from_slice(&bytes).map_err(ReadFailure::Invalid)
    }

    async fn replace_with_seed_locked(&self) -> Result<Vec<DebateTableData>, DbError> {
        self.ensure_parent_directory().await?;
        let database = create_seed_data(&current_datetime());
        self.write_locked(&database).await?;
        Ok(database)
    }

    async fn write_locked(&self, database: &[DebateTableData]) -> Result<(), DbError> {
        let json = serde_json::to_string_pretty(database).map_err(DbError::Serialization)?;
        fs::write(&self.path, json).await.map_err(DbError::Io)
    }
}

fn current_datetime() -> String {
    Local::now().format(DATETIME_FORMAT).to_string()
}

fn compare_datetime(left: &DebateTableData, right: &DebateTableData) -> Ordering {
    let left = NaiveDateTime::parse_from_str(&left.info.datetime, DATETIME_FORMAT).ok();
    let right = NaiveDateTime::parse_from_str(&right.info.datetime, DATETIME_FORMAT).ok();

    match (left, right) {
        (Some(left), Some(right)) => left.cmp(&right),
        (Some(_), None) => Ordering::Less,
        (None, Some(_)) => Ordering::Greater,
        (None, None) => Ordering::Equal,
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use serde_json::{json, Value};
    use tempfile::TempDir;
    use tokio::fs;
    use uuid::Uuid;

    use super::{DbError, DbState, DATETIME_FORMAT};
    use crate::{model::DebateTableData, seed::create_seed_data};

    fn test_state(temp_dir: &TempDir) -> DbState {
        DbState::new(temp_dir.path().join("test-db.json"))
    }

    fn sample_item(id: &str, datetime: &str) -> DebateTableData {
        let mut item = create_seed_data(datetime).remove(0);
        item.info.id = id.to_owned();
        item.info.datetime = datetime.to_owned();
        item
    }

    async fn write_json(state: &DbState, value: &Value) {
        state.ensure_parent_directory().await.unwrap();
        fs::write(&state.path, serde_json::to_string_pretty(value).unwrap())
            .await
            .unwrap();
    }

    async fn read_json(state: &DbState) -> Value {
        serde_json::from_slice(&fs::read(&state.path).await.unwrap()).unwrap()
    }

    #[tokio::test]
    async fn initializes_seed_once_with_shared_datetime_and_unique_uuids() {
        let temp_dir = TempDir::new().unwrap();
        let state = test_state(&temp_dir);

        state.initialize().await.unwrap();
        let first = state.get_all().await.unwrap();
        state.initialize().await.unwrap();
        let second = state.get_all().await.unwrap();

        assert_eq!(first, second);
        assert_eq!(first.len(), 2);
        assert_eq!(first[0].info.datetime, first[1].info.datetime);
        assert!(
            chrono::NaiveDateTime::parse_from_str(&first[0].info.datetime, DATETIME_FORMAT).is_ok()
        );
        assert_ne!(first[0].info.id, first[1].info.id);
        assert!(Uuid::parse_str(&first[0].info.id).is_ok());
        assert!(Uuid::parse_str(&first[1].info.id).is_ok());
    }

    #[tokio::test]
    async fn supports_electron_compatible_crud_and_missing_id_behavior() {
        let temp_dir = TempDir::new().unwrap();
        let state = test_state(&temp_dir);
        state.initialize().await.unwrap();

        let created = state
            .post(sample_item("placeholder", "2010-01-01 00:00:00"))
            .await
            .unwrap();
        assert_ne!(created.info.id, "placeholder");
        assert_ne!(created.info.datetime, "2010-01-01 00:00:00");
        assert!(Uuid::parse_str(&created.info.id).is_ok());
        assert_eq!(
            state.get(&created.info.id).await.unwrap().info.id,
            created.info.id
        );

        let mut patched = created.clone();
        patched.info.agenda = "수정된 주제".to_owned();
        assert_eq!(state.patch(patched.clone()).await.unwrap(), patched);
        assert_eq!(
            state.get(&created.info.id).await.unwrap().info.agenda,
            "수정된 주제"
        );

        let missing_patch = sample_item("missing", "2026-01-01 00:00:00");
        assert_eq!(
            state.patch(missing_patch.clone()).await.unwrap(),
            missing_patch
        );
        assert!(matches!(state.get("missing").await, Err(DbError::NotFound)));

        let before_missing_delete = state.get_all().await.unwrap();
        assert_eq!(
            state.delete("missing").await.unwrap().len(),
            before_missing_delete.len()
        );
        assert!(state
            .delete(&created.info.id)
            .await
            .unwrap()
            .iter()
            .all(|item| item.info.id != created.info.id));
    }

    #[tokio::test]
    async fn sorts_valid_datetimes_before_invalid_datetimes() {
        let temp_dir = TempDir::new().unwrap();
        let state = test_state(&temp_dir);
        let database = vec![
            sample_item("invalid", "not-a-datetime"),
            sample_item("newer", "2026-07-15 12:00:00"),
            sample_item("older", "2024-01-01 00:00:00"),
        ];
        write_json(&state, &serde_json::to_value(database).unwrap()).await;

        let sorted = state.get_all().await.unwrap();
        let ids: Vec<_> = sorted.iter().map(|item| item.info.id.as_str()).collect();

        assert_eq!(ids, vec!["older", "newer", "invalid"]);
    }

    #[tokio::test]
    async fn replaces_each_invalid_database_shape_with_seed_data() {
        let temp_dir = TempDir::new().unwrap();
        let state = test_state(&temp_dir);
        state.ensure_parent_directory().await.unwrap();

        let invalid_documents = [
            "not json".to_owned(),
            json!({ "info": "not an array" }).to_string(),
            json!([{ "info": { "id": 123 }, "table": [] }]).to_string(),
            json!([{
                "info": {
                    "id": "id",
                    "datetime": "2026-01-01 00:00:00",
                    "name": "name",
                    "agenda": "agenda",
                    "prosTeamName": "pros",
                    "consTeamName": "cons",
                    "warningBell": false,
                    "finishBell": false
                },
                "table": [{
                    "stance": "UNKNOWN",
                    "speechType": "speech",
                    "boxType": "NORMAL",
                    "time": 1,
                    "timePerTeam": null,
                    "timePerSpeaking": null,
                    "speaker": null
                }]
            }])
            .to_string(),
        ];

        for document in invalid_documents {
            fs::write(&state.path, document).await.unwrap();
            let recovered = state.get_all().await.unwrap();
            assert_eq!(recovered.len(), 2);
            assert_eq!(recovered[0].info.name, "열린토론대회 예선 · 본선");
        }
    }

    #[tokio::test]
    async fn preserves_unknown_fields_across_reads_and_writes() {
        let temp_dir = TempDir::new().unwrap();
        let state = test_state(&temp_dir);
        let mut value =
            serde_json::to_value(vec![sample_item("with-extra", "2026-01-01 00:00:00")]).unwrap();
        value[0]["futureRoot"] = json!({ "version": 2 });
        value[0]["info"]["futureInfo"] = json!(["a", "b"]);
        value[0]["table"][0]["futureBox"] = json!(true);
        write_json(&state, &value).await;

        let item = state.get("with-extra").await.unwrap();
        assert_eq!(item.extra["futureRoot"], json!({ "version": 2 }));
        assert_eq!(item.info.extra["futureInfo"], json!(["a", "b"]));
        assert_eq!(item.table[0].extra["futureBox"], json!(true));

        state
            .post(sample_item("placeholder", "2010-01-01 00:00:00"))
            .await
            .unwrap();
        let mut patched = item;
        patched.info.name = "추가 필드가 있는 수정본".to_owned();
        state.patch(patched).await.unwrap();
        state.delete("missing").await.unwrap();
        let persisted = read_json(&state).await;
        let preserved = persisted
            .as_array()
            .unwrap()
            .iter()
            .find(|record| record["info"]["id"] == "with-extra")
            .unwrap();
        assert_eq!(preserved["futureRoot"], json!({ "version": 2 }));
        assert_eq!(preserved["info"]["futureInfo"], json!(["a", "b"]));
        assert_eq!(preserved["table"][0]["futureBox"], json!(true));
        assert_eq!(preserved["info"]["name"], "추가 필드가 있는 수정본");
    }

    #[tokio::test]
    async fn serializes_concurrent_posts_without_lost_updates() {
        let temp_dir = TempDir::new().unwrap();
        let state = Arc::new(test_state(&temp_dir));
        state.initialize().await.unwrap();

        let mut tasks = Vec::new();
        for index in 0..20 {
            let state = Arc::clone(&state);
            tasks.push(tokio::spawn(async move {
                let mut item = sample_item("placeholder", "2010-01-01 00:00:00");
                item.info.name = format!("concurrent-{index}");
                state.post(item).await.unwrap();
            }));
        }

        for task in tasks {
            task.await.unwrap();
        }

        let database = state.get_all().await.unwrap();
        assert_eq!(database.len(), 22);
        assert_eq!(
            database
                .iter()
                .filter(|item| item.info.name.starts_with("concurrent-"))
                .count(),
            20
        );
    }

    #[tokio::test]
    async fn does_not_hide_file_system_errors_as_recovery() {
        let temp_dir = TempDir::new().unwrap();
        let state = DbState::new(temp_dir.path().to_path_buf());

        assert!(matches!(state.get_all().await, Err(DbError::Io(_))));
    }
}
