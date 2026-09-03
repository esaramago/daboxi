/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  let modified = false

  if (!collection.fields.getByName("enablebanking_bank_name")) {
    collection.fields.add(new Field({
      "autogeneratePattern": "",
      "hidden": false,
      "id": "text3244933776",
      "max": 0,
      "min": 0,
      "name": "enablebanking_bank_name",
      "pattern": "",
      "presentable": false,
      "primaryKey": false,
      "required": false,
      "system": false,
      "type": "text"
    }))
    modified = true
  }

  if (!collection.fields.getByName("enablebanking_country")) {
    collection.fields.add(new Field({
      "autogeneratePattern": "",
      "hidden": false,
      "id": "text2859811872",
      "max": 0,
      "min": 0,
      "name": "enablebanking_country",
      "pattern": "",
      "presentable": false,
      "primaryKey": false,
      "required": false,
      "system": false,
      "type": "text"
    }))
    modified = true
  }

  if (modified) {
    return app.save(collection)
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // remove field
  collection.fields.removeById("text3244933776")

  // remove field
  collection.fields.removeById("text2859811872")

  return app.save(collection)
})
