import {
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
  vi,
} from 'vitest';
import { faker } from '@faker-js/faker';
import { LocalTodoStore } from './local-store';
import { TodoStatus, type CreateTodoInput } from './types';

describe('Basic CRUD', () => {
  let localTodoStore: LocalTodoStore;

  beforeEach(async () => {
    localTodoStore = await LocalTodoStore.create(faker.hacker.noun());
  });

  it('Can create and retrieve the todo', async () => {
    const todoContent = {
      content: faker.lorem.sentence(),
    } satisfies CreateTodoInput;

    const insertedTodo = await localTodoStore.createTodo(todoContent);

    const { items: [todo, ...rest] } = await localTodoStore.getRelevantTodos(new Date());
    expect(rest).toHaveLength(0);

    expect(insertedTodo).toStrictEqual(insertedTodo);
    expect(todo).toBeDefined();
    expect(todo!.id).toBeTypeOf('string');
    expect(todo!.createdAt).toBeInstanceOf(Date);
    expect(todo!.updatedAt).toBeUndefined();
    expect(todo).toStrictEqual(expect.objectContaining({
      ...todoContent,
      status: TodoStatus.Incomplete,
    }));
  });

  it('Honors specified todo status on creation', async () => {
    await localTodoStore.createTodo({
      content: faker.lorem.sentence(),
      status: TodoStatus.Complete,
    });

    const { items: [todo, ...rest] } = await localTodoStore.getRelevantTodos(new Date());
    expect(rest).toHaveLength(0);

    expect(todo).toBeDefined();
    expect(todo!.status).toBe(TodoStatus.Complete);
  });

  it('Can update todo content & status', async () => {
    const originalContent = faker.lorem.sentence();
    const { id, status, content } = await localTodoStore.createTodo({ content: originalContent });

    expect(status).toEqual(TodoStatus.Incomplete);
    expect(content).toEqual(originalContent);

    const newContent = faker.lorem.sentence();
    await localTodoStore.updateTodo({ id, content: newContent, status: TodoStatus.Complete });

    const { items: [updatedTodo, ...rest] } = await localTodoStore.getRelevantTodos(new Date());
    expect(rest).toHaveLength(0);

    expect(updatedTodo).toBeDefined();
    expect(updatedTodo!.updatedAt).toBeInstanceOf(Date);
    expect(updatedTodo!.updatedAt!.valueOf()).not.toEqual(updatedTodo!.createdAt.valueOf());
    expect(updatedTodo).toStrictEqual(expect.objectContaining({
      id,
      content: newContent,
      status: TodoStatus.Complete,
    }));
  });
});

describe('Relevant Todos', () => {
  const oneDayInMS = 24 * 60 * 60 * 1000;
  const nowUnixTimestamp = Date.now();
  let localTodoStore: LocalTodoStore;

  beforeEach(async () => {
    localTodoStore = await LocalTodoStore.create(faker.hacker.noun());
    vi.useFakeTimers();
    vi.setSystemTime(nowUnixTimestamp);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Does not include todo from previous days', async () => {
    // Create a todo late yesterday
    const yesterdayAlmostMidnight = new Date(nowUnixTimestamp - oneDayInMS);
    yesterdayAlmostMidnight.setHours(23, 59, 59, 0);
    vi.setSystemTime(yesterdayAlmostMidnight);

    const yesterdayTodo = await localTodoStore.createTodo({
      content: faker.lorem.sentence(),
    });

    // Create a todo very early this morning
    const midnightThisMorning = new Date(nowUnixTimestamp);
    midnightThisMorning.setHours(0, 0, 0, 0);
    vi.setSystemTime(midnightThisMorning);

    const todoCreatedMidnightThisMorning = await localTodoStore.createTodo({
      content: faker.lorem.sentence(),
    });
    expect(
      todoCreatedMidnightThisMorning.createdAt.valueOf(),
    ).toEqual(midnightThisMorning.valueOf());

    // Create todo at the end of day
    const almostMidnightToday = new Date(nowUnixTimestamp);
    almostMidnightToday.setHours(23, 59, 59, 0);
    vi.setSystemTime(almostMidnightToday);

    const todoCreatedAlmostMidnightTonight = await localTodoStore.createTodo({
      content: faker.lorem.sentence(),
    });
    expect(
      todoCreatedAlmostMidnightTonight.createdAt.valueOf(),
    ).toEqual(almostMidnightToday.valueOf());

    const { items: relevantTodos } = await localTodoStore.getRelevantTodos(new Date());
    expect(relevantTodos).toHaveLength(2);
    expect(relevantTodos, 'Yesterdays todo should not show up today').not.toContain(expect.objectContaining(yesterdayTodo));

    expect(relevantTodos, 'Relevant todos should include everything created today').toStrictEqual(expect.arrayContaining([
      todoCreatedMidnightThisMorning,
      todoCreatedAlmostMidnightTonight,
    ]));
  });

  it('completed todos are still relevant', async () => {
    const completedTodo = await localTodoStore.createTodo({
      content: faker.lorem.sentence(),
    });

    const { items: relevantTodos } = await localTodoStore.getRelevantTodos(new Date());
    expect(relevantTodos).toHaveLength(1);

    expect(relevantTodos[0]).toStrictEqual(completedTodo);
  });
});
