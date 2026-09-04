/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const categories = app.findCollectionByNameOrId("categories")
  categories.createRule = null
  categories.updateRule = null
  categories.deleteRule = null
  app.save(categories)

  const subcategories = app.findCollectionByNameOrId("subcategories")
  subcategories.createRule = null
  subcategories.updateRule = null
  subcategories.deleteRule = null
  app.save(subcategories)

  const types = app.findCollectionByNameOrId("types")
  types.createRule = null
  types.updateRule = null
  types.deleteRule = null
  app.save(types)
}, (app) => {
  const categories = app.findCollectionByNameOrId("categories")
  categories.createRule = '@request.auth.id != ""'
  categories.updateRule = '@request.auth.id != ""'
  categories.deleteRule = '@request.auth.id != ""'
  app.save(categories)

  const subcategories = app.findCollectionByNameOrId("subcategories")
  subcategories.createRule = '@request.auth.id != ""'
  subcategories.updateRule = '@request.auth.id != ""'
  subcategories.deleteRule = '@request.auth.id != ""'
  app.save(subcategories)

  const types = app.findCollectionByNameOrId("types")
  types.createRule = '@request.auth.id != ""'
  types.updateRule = '@request.auth.id != ""'
  types.deleteRule = '@request.auth.id != ""'
  app.save(types)
})

