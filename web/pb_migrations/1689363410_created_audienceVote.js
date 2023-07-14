migrate((db) => {
  const collection = new Collection({
    "id": "rafb6mt2f8laakq",
    "created": "2023-07-14 19:36:50.678Z",
    "updated": "2023-07-14 19:36:50.678Z",
    "name": "audienceVote",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "iz8zv7mp",
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
      },
      {
        "system": false,
        "id": "0whzvpzn",
        "name": "game",
        "type": "relation",
        "required": false,
        "unique": false,
        "options": {
          "collectionId": "8ogpizusx58r42x",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": []
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
  const collection = dao.findCollectionByNameOrId("rafb6mt2f8laakq");

  return dao.deleteCollection(collection);
})
