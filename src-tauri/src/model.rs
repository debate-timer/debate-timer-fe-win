use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use serde_json::{Number, Value};

pub type ExtraFields = BTreeMap<String, Value>;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Stance {
    Pros,
    Cons,
    Neutral,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TimeBoxType {
    Normal,
    TimeBased,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimeBoxInfo {
    pub stance: Stance,
    pub speech_type: String,
    pub box_type: TimeBoxType,
    pub time: Option<Number>,
    pub time_per_team: Option<Number>,
    pub time_per_speaking: Option<Number>,
    pub speaker: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub allow_speaking_overflow: Option<bool>,
    #[serde(flatten)]
    pub extra: ExtraFields,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DebateInfo {
    pub id: String,
    pub datetime: String,
    pub name: String,
    pub agenda: String,
    pub pros_team_name: String,
    pub cons_team_name: String,
    pub warning_bell: bool,
    pub finish_bell: bool,
    #[serde(flatten)]
    pub extra: ExtraFields,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct DebateTableData {
    pub info: DebateInfo,
    pub table: Vec<TimeBoxInfo>,
    #[serde(flatten)]
    pub extra: ExtraFields,
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::DebateTableData;

    #[test]
    fn preserves_known_and_unknown_json_fields() {
        let source = json!({
            "info": {
                "id": "placeholder",
                "datetime": "2026-07-15 12:34:56",
                "name": "테스트",
                "agenda": "테스트 주제",
                "prosTeamName": "찬성",
                "consTeamName": "반대",
                "warningBell": false,
                "finishBell": true,
                "futureInfo": { "enabled": true }
            },
            "table": [{
                "stance": "NEUTRAL",
                "speechType": "자유토론",
                "boxType": "TIME_BASED",
                "time": null,
                "timePerTeam": 420,
                "timePerSpeaking": 90.5,
                "speaker": null,
                "allowSpeakingOverflow": true,
                "futureBox": [1, 2, 3]
            }],
            "futureRoot": "kept"
        });

        let model: DebateTableData = serde_json::from_value(source.clone()).unwrap();
        let serialized = serde_json::to_value(model).unwrap();

        assert_eq!(serialized, source);
    }

    #[test]
    fn omits_missing_optional_allow_speaking_overflow() {
        let source = json!({
            "info": {
                "id": "placeholder",
                "datetime": "2026-07-15 12:34:56",
                "name": "테스트",
                "agenda": "테스트 주제",
                "prosTeamName": "찬성",
                "consTeamName": "반대",
                "warningBell": false,
                "finishBell": false
            },
            "table": [{
                "stance": "PROS",
                "speechType": "입론",
                "boxType": "NORMAL",
                "time": 180,
                "timePerTeam": null,
                "timePerSpeaking": null,
                "speaker": null
            }]
        });

        let model: DebateTableData = serde_json::from_value(source).unwrap();
        let serialized = serde_json::to_value(model).unwrap();

        assert!(serialized["table"][0]
            .as_object()
            .unwrap()
            .get("allowSpeakingOverflow")
            .is_none());
    }
}
