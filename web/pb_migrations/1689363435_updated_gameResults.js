migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("8ogpizusx58r42x")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "oabwwm3b",
    "name": "votes",
    "type": "relation",
    "required": false,
    "unique": false,
    "options": {
      "collectionId": "rafb6mt2f8laakq",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": null,
      "displayFields": []
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("8ogpizusx58r42x")

  // remove
  collection.schema.removeField("oabwwm3b")

  return dao.saveCollection(collection)
})
