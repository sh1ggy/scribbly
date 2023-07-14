migrate((db) => {
  const collection = new Collection({
    "id": "8ogpizusx58r42x",
    "created": "2023-07-14 19:35:03.523Z",
    "updated": "2023-07-14 19:35:03.523Z",
    "name": "gameResults",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "qnfdxiy6",
        "name": "gamerChoice",
        "type": "select",
        "required": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "A",
            "B",
            "Neither"
          ]
        }
      }
    ],
    "indexes": [],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("8ogpizusx58r42x");

  return dao.deleteCollection(collection);
})
