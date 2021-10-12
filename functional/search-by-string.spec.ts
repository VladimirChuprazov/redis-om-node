import { addBigfootSighting, createBigfootSchema, expectMatchesSighting, sortByEntityId, Bigfoot,
  A_BIGFOOT_SIGHTING, AN_ENTITY_ID, AN_ENTITY_KEY,
  ANOTHER_BIGFOOT_SIGHTING, ANOTHER_ENTITY_ID, ANOTHER_ENTITY_KEY,
  A_THIRD_BIGFOOT_SIGHTING, A_THIRD_ENTITY_KEY,
  AN_ESCAPED_BIGFOOT_SIGHTING, AN_ESCAPED_ENTITY_ID, AN_ESCAPED_ENTITY_KEY } from './helpers/data-helper';
  
import Client from '../lib/client';
import Schema from '../lib/schema/schema';
import Repository from '../lib/repository/repository';

describe("Repository", () => {

  let client: Client;
  let repository: Repository<Bigfoot>;
  let schema: Schema<Bigfoot>;
  let entities: Bigfoot[];

  beforeAll(async () => {
    client = new Client();
    await client.open();
    schema = createBigfootSchema();
  });

  beforeEach(async () => {
    await client.execute(['FLUSHALL']);
    repository = client.fetchRepository<Bigfoot>(schema);
    await repository.createIndex();
  });

  afterAll(async () => await client.close());

  describe("#search", () => {
    beforeEach(async () => {
      await addBigfootSighting(client, AN_ENTITY_KEY, A_BIGFOOT_SIGHTING);
      await addBigfootSighting(client, ANOTHER_ENTITY_KEY, ANOTHER_BIGFOOT_SIGHTING);
      await addBigfootSighting(client, A_THIRD_ENTITY_KEY, A_THIRD_BIGFOOT_SIGHTING);
    });

    describe("finding an entity matching a string", () => {
      beforeEach(async () => {
        entities = await repository.search()
          .where('state').eq('OH')
          .run();
        entities.sort(sortByEntityId);
      });

      it("returns all the entities that match the string", () => {
        expect(entities).toHaveLength(2);
        expectMatchesSighting(entities[0], AN_ENTITY_ID, A_BIGFOOT_SIGHTING);
        expectMatchesSighting(entities[1], ANOTHER_ENTITY_ID, ANOTHER_BIGFOOT_SIGHTING);
      });
    });

    describe("finding an entity matching multiple strings", () => {
      beforeEach(async () => {
        entities = await repository.search()
          .where('county').eq('Ashland')
          .where('state').eq('OH')
          .run();
        entities.sort(sortByEntityId);
      });

      it("returns all the entities that match the string", () => {
        expect(entities).toHaveLength(1);
        expectMatchesSighting(entities[0], ANOTHER_ENTITY_ID, ANOTHER_BIGFOOT_SIGHTING);
      });
    });

    describe("finding all the entities that match a string with escaped punctuation", () => {
      beforeEach(async () => {
        await addBigfootSighting(client, AN_ESCAPED_ENTITY_KEY, AN_ESCAPED_BIGFOOT_SIGHTING);
        entities = await repository.search()
          .where('county').eq("Ash ,.<>{}[]\"':;!@#$%^&*()-+=~ land") // has TAG separator of |
          .where('state').eq("K ,.<>{}[]\"':;!@#$%^*()-+=~| Y")       // has TAG separator of &
          .run();
        entities.sort(sortByEntityId);
      });

      it("returns the entity that matches the string", () => {
        expect(entities).toHaveLength(1);
        expectMatchesSighting(entities[0], AN_ESCAPED_ENTITY_ID, AN_ESCAPED_BIGFOOT_SIGHTING);
      });
    });
  });
});