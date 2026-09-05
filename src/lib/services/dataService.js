import { api } from "@/api/apiClient";

function collection(name) {
  const entity = api.entities[name];
  if (!entity) throw new Error(`dataService: unknown collection "${name}"`);

  return {
    list: (sort, limit) => entity.list(sort, limit),
    filter: (query, sort, limit) => entity.filter(query, sort, limit),
    get: (id) => entity.get(id),
    create: (data) => entity.create(data),
    bulkCreate: (records) => entity.bulkCreate(records),
    update: (id, data) => entity.update(id, data),
    updateMany: (query, update) => entity.updateMany(query, update),
    bulkUpdate: (records) => entity.bulkUpdate(records),
    delete: (id) => entity.delete(id),
    deleteMany: (query) => entity.deleteMany(query),
    subscribe: (cb) => entity.subscribe(cb),
    schema: () => entity.schema(),
  };
}

export const dataService = { collection };
export default dataService;
