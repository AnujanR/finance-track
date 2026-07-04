export function toJSON(doc) {
  if (!doc) return null
  const obj = doc.toObject ? doc.toObject() : doc
  const { _id, __v, ...rest } = obj
  return { id: _id.toString(), ...rest }
}

export function toJSONList(docs) {
  return docs.map(toJSON)
}
