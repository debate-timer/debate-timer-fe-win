use std::collections::BTreeMap;

use serde_json::Number;
use uuid::Uuid;

use crate::model::{DebateInfo, DebateTableData, Stance, TimeBoxInfo, TimeBoxType};

pub fn create_seed_data(datetime: &str) -> Vec<DebateTableData> {
    vec![
        main_round(Uuid::new_v4().to_string(), datetime.to_owned()),
        final_round(Uuid::new_v4().to_string(), datetime.to_owned()),
    ]
}

fn main_round(id: String, datetime: String) -> DebateTableData {
    DebateTableData {
        info: debate_info(
            id,
            datetime,
            "열린토론대회 예선 · 본선",
            "선거운동에 생성형 AI로 제작한 콘텐츠 사용을 전면 금지해야 한다",
        ),
        table: vec![
            normal_box(Stance::Pros, "찬성팀 시작발언", 90),
            normal_box(Stance::Cons, "반대팀 시작발언", 90),
            time_based_box(120, 600),
            normal_box(Stance::Cons, "반대팀 마무리발언", 90),
            normal_box(Stance::Pros, "찬성팀 마무리발언", 90),
        ],
        extra: BTreeMap::new(),
    }
}

fn final_round(id: String, datetime: String) -> DebateTableData {
    DebateTableData {
        info: debate_info(
            id,
            datetime,
            "열린토론대회 결선",
            "선거운동에 생성형 AI로 제작한 콘텐츠 사용을 전면 금지해야 한다",
        ),
        table: vec![
            normal_box(Stance::Pros, "찬성팀 시작발언", 120),
            normal_box(Stance::Cons, "반대팀 시작발언", 120),
            time_based_box(120, 840),
            normal_box(Stance::Cons, "반대팀 마무리발언", 120),
            normal_box(Stance::Pros, "찬성팀 마무리발언", 120),
        ],
        extra: BTreeMap::new(),
    }
}

fn debate_info(id: String, datetime: String, name: &str, agenda: &str) -> DebateInfo {
    DebateInfo {
        id,
        datetime,
        name: name.to_owned(),
        agenda: agenda.to_owned(),
        pros_team_name: "찬성".to_owned(),
        cons_team_name: "반대".to_owned(),
        warning_bell: false,
        finish_bell: false,
        extra: BTreeMap::new(),
    }
}

fn normal_box(stance: Stance, speech_type: &str, time: u64) -> TimeBoxInfo {
    TimeBoxInfo {
        stance,
        speech_type: speech_type.to_owned(),
        box_type: TimeBoxType::Normal,
        time: Some(Number::from(time)),
        time_per_team: None,
        time_per_speaking: None,
        speaker: None,
        allow_speaking_overflow: None,
        extra: BTreeMap::new(),
    }
}

fn time_based_box(time_per_speaking: u64, time_per_team: u64) -> TimeBoxInfo {
    TimeBoxInfo {
        stance: Stance::Neutral,
        speech_type: "시간 총량제".to_owned(),
        box_type: TimeBoxType::TimeBased,
        time: None,
        time_per_team: Some(Number::from(time_per_team)),
        time_per_speaking: Some(Number::from(time_per_speaking)),
        speaker: None,
        allow_speaking_overflow: Some(true),
        extra: BTreeMap::new(),
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;
    use uuid::Uuid;

    use super::create_seed_data;

    #[test]
    fn creates_electron_equivalent_seed_with_fresh_metadata() {
        let datetime = "2026-07-15 12:34:56";
        let seed = create_seed_data(datetime);
        let main_id = seed[0].info.id.clone();
        let final_id = seed[1].info.id.clone();

        assert_eq!(seed.len(), 2);
        assert_ne!(main_id, final_id);
        assert!(Uuid::parse_str(&main_id).is_ok());
        assert!(Uuid::parse_str(&final_id).is_ok());
        assert_eq!(
            serde_json::to_value(seed).unwrap(),
            json!([
                {
                    "info": {
                        "id": main_id,
                        "datetime": datetime,
                        "name": "열린토론대회 예선 · 본선",
                        "agenda": "선거운동에 생성형 AI로 제작한 콘텐츠 사용을 전면 금지해야 한다",
                        "prosTeamName": "찬성",
                        "consTeamName": "반대",
                        "warningBell": false,
                        "finishBell": false
                    },
                    "table": [
                        normal_box("PROS", "찬성팀 시작발언", 90),
                        normal_box("CONS", "반대팀 시작발언", 90),
                        time_based_box(600),
                        normal_box("CONS", "반대팀 마무리발언", 90),
                        normal_box("PROS", "찬성팀 마무리발언", 90)
                    ]
                },
                {
                    "info": {
                        "id": final_id,
                        "datetime": datetime,
                        "name": "열린토론대회 결선",
                        "agenda": "선거운동에 생성형 AI로 제작한 콘텐츠 사용을 전면 금지해야 한다",
                        "prosTeamName": "찬성",
                        "consTeamName": "반대",
                        "warningBell": false,
                        "finishBell": false
                    },
                    "table": [
                        normal_box("PROS", "찬성팀 시작발언", 120),
                        normal_box("CONS", "반대팀 시작발언", 120),
                        time_based_box(840),
                        normal_box("CONS", "반대팀 마무리발언", 120),
                        normal_box("PROS", "찬성팀 마무리발언", 120)
                    ]
                }
            ])
        );
    }

    fn normal_box(stance: &str, speech_type: &str, time: u64) -> serde_json::Value {
        json!({
            "stance": stance,
            "speechType": speech_type,
            "boxType": "NORMAL",
            "time": time,
            "timePerTeam": null,
            "timePerSpeaking": null,
            "speaker": null
        })
    }

    fn time_based_box(time_per_team: u64) -> serde_json::Value {
        json!({
            "stance": "NEUTRAL",
            "speechType": "시간 총량제",
            "boxType": "TIME_BASED",
            "time": null,
            "timePerTeam": time_per_team,
            "timePerSpeaking": 120,
            "speaker": null,
            "allowSpeakingOverflow": true
        })
    }
}
