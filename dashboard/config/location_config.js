module.exports.locationSchema = {
    
  "type": "object",
  "properties": {
    "location_id": {"type": "integer"},
    "locationxy_coordinate":{"type": "object"},
    "site_id": {"type": "integer"},
    "location_name": {"type": "string"},
    "action":{"type": "string"},
    "is_logical":{"type": "string"},
    "is_multipolygon":{"type": "string"},
    "parent_location":{"type": "integer"}
  },
  "required": ["location_name","site_id"]
};