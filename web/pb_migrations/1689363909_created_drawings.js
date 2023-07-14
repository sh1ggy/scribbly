migrate((db) => {
  const collection = new Collection({
    "id": "7y6pm5wu15dloj1",
    "created": "2023-07-14 19:45:09.354Z",
    "updated": "2023-07-14 19:45:09.354Z",
    "name": "drawings",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "qvlofddy",
        "name": "coords",
        "type": "json",
        "required": false,
        "unique": false,
        "options": {}
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
  const collection = dao.findCollectionByNameOrId("7y6pm5wu15dloj1");

  return dao.deleteCollection(collection);
})
