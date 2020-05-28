module.exports.siteSchema = {
    
    "type": "array",
    "items": {
        "properties": {
        "reference_number":{"type": "string"},
        "piece_number":{"type": "integer"},
        "updated_utc": {"type": "string"},
        "site_code": {"type": "string"},
        "shipped_status":{
            "type": "string",
            "enum": ["T", "F"]
        }
        },
        "required": ["site_code","reference_number","shipped_status"]
    }
  };