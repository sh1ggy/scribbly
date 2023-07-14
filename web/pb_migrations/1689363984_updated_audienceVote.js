migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("rafb6mt2f8laakq")

  // remove
  collection.schema.removeField("0whzvpzn")

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("rafb6mt2f8laakq")

  // add
  collection.schema.addField(new SchemaField({
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
  }))

  return dao.saveCollection(collection)
})
