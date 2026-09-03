/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  const existing = collection.fields.getByName("enablebanking_enabled")
  if (!existing) {
    collection.fields.add(new Field({
      "autogeneratePattern": "",
      "hidden": false,
      "id": "bool2859811873",
      "name": "enablebanking_enabled",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "bool"
    }))

    return app.save(collection)
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // remove field
  collection.fields.removeById("bool2859811873")

  return app.save(collection)
})
