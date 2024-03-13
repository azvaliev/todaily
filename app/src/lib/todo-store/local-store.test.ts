import {
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
  vi,
} from 'vitest';
import { faker } from '@faker-js/faker';
import { ulid } from 'ulidx';
import { LocalTodoStore } from './local-store';
import { TodoStatus, type CreateTodoInput, StaleTodoAction } from './types';

describe('Basic CRUD', () => {
  let localTodoStore: LocalTodoStore;

  beforeEach(async () => {
    localTodoStore = await LocalTodoStore.create(ulid());
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

  it('Can delete todo', async () => {
    const todoToBeDeleted = await localTodoStore.createTodo({ content: faker.lorem.sentence() });
    const todoShouldRemain = await localTodoStore.createTodo({ content: faker.lorem.sentence() });

    let { items } = await localTodoStore.getRelevantTodos(new Date());
    expect(items).toHaveLength(2);
    expect(items).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining(todoToBeDeleted),
        expect.objectContaining(todoShouldRemain),
      ]),
    );

    await localTodoStore.deleteTodo(todoToBeDeleted.id);

    ({ items } = await localTodoStore.getRelevantTodos(new Date()));
    expect(items).toHaveLength(1);
    expect(items[0]).toStrictEqual(
      expect.objectContaining(todoShouldRemain),
    );
  });
});

const oneDayInMS = 24 * 60 * 60 * 1000;
const nowUnixTimestamp = Date.now();

describe('Relevant Todos', () => {
  let localTodoStore: LocalTodoStore;

  beforeEach(async () => {
    localTodoStore = await LocalTodoStore.create(ulid());
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

describe('stale todos', () => {
  let localTodoStore: LocalTodoStore;

  beforeEach(async () => {
    localTodoStore = await LocalTodoStore.create(ulid());
    vi.useFakeTimers();
    vi.setSystemTime(nowUnixTimestamp);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('finds previously incomplete todos', async () => {
    const yesterday = nowUnixTimestamp - oneDayInMS;
    vi.setSystemTime(yesterday);

    const yesterdayIncompleteTodo = await localTodoStore.createTodo({
      content: faker.lorem.sentence(),
    });

    const oneWeekAgo = nowUnixTimestamp - (7 * oneDayInMS);
    vi.setSystemTime(oneWeekAgo);

    const oneWeekAgoIncompleteTodo = await localTodoStore.createTodo({
      content: faker.lorem.sentence(),
    });

    vi.setSystemTime(nowUnixTimestamp);

    const { items: staleTodos } = await localTodoStore.getStaleTodos();
    expect(staleTodos).toHaveLength(2);

    expect(staleTodos).toStrictEqual(
      expect.arrayContaining([yesterdayIncompleteTodo, oneWeekAgoIncompleteTodo]),
    );
  });

  it.each([TodoStatus.Inactive, TodoStatus.Complete])('ignores previously %s or inactive todos', async (status) => {
    const yesterday = nowUnixTimestamp - oneDayInMS;
    vi.setSystemTime(yesterday);

    const yesterdayTodo = await localTodoStore.createTodo({
      content: faker.lorem.sentence(),
    });
    await localTodoStore.updateTodo({ id: yesterdayTodo.id, status });

    const oneYearAgo = nowUnixTimestamp - (365 * oneDayInMS);
    vi.setSystemTime(oneYearAgo);

    const oneYearAgoTodo = await localTodoStore.createTodo({
      content: faker.lorem.sentence(),
    });
    await localTodoStore.updateTodo({ id: oneYearAgoTodo.id, status });

    vi.setSystemTime(nowUnixTimestamp);

    const { items: staleTodos } = await localTodoStore.getStaleTodos();
    expect(staleTodos).toHaveLength(0);
  });

  it('does not count todays todos as stale', async () => {
    await localTodoStore.createTodo({ content: faker.lorem.sentence() });
    await localTodoStore.createTodo({
      content: faker.lorem.sentence(),
      status: TodoStatus.Complete,
    });

    const { items: todos } = await localTodoStore.getStaleTodos();
    expect(todos).toHaveLength(0);
  });

  it('can take action on stale todos', async () => {
    const lastWeek = nowUnixTimestamp - (7 * oneDayInMS);
    vi.setSystemTime(lastWeek);

    const staleCompletedTodo = await localTodoStore.createTodo({
      content: faker.lorem.sentence(),
      status: TodoStatus.Complete,
    });
    const staleIncompleteTodoCarryOver = await localTodoStore.createTodo({
      content: faker.lorem.sentence(),
      status: TodoStatus.Incomplete,
    });
    const staleIncompleteToInactive = await localTodoStore.createTodo({
      content: faker.lorem.sentence(),
      status: TodoStatus.Incomplete,
    });
    const staleIncompleteTodoToCompleted = await localTodoStore.createTodo({
      content: faker.lorem.sentence(),
      status: TodoStatus.Incomplete,
    });

    vi.setSystemTime(nowUnixTimestamp);

    const activeTodo = await localTodoStore.createTodo({ content: faker.lorem.sentence() });

    const { items: staleTodos } = await localTodoStore.getStaleTodos();
    expect(staleTodos).toHaveLength(3);
    expect(staleTodos).not.toContain(expect.objectContaining(staleCompletedTodo));

    expect(staleTodos).toStrictEqual(expect.arrayContaining([
      staleIncompleteTodoCarryOver,
      staleIncompleteToInactive,
      staleIncompleteTodoToCompleted,
    ]));

    await localTodoStore.handleStaleTodosActions([
      { id: staleIncompleteTodoCarryOver.id, action: StaleTodoAction.CarryOver },
      { id: staleIncompleteToInactive.id, action: StaleTodoAction.MarkInactive },
      { id: staleIncompleteTodoToCompleted.id, action: StaleTodoAction.MarkCompleted },
    ]);

    const { items: stillStaleTodos } = await localTodoStore.getStaleTodos();
    expect(stillStaleTodos).toHaveLength(0);

    const {
      items: activeTodosOneWeekAgo,
    } = await localTodoStore.getRelevantTodos(new Date(lastWeek));
    expect(activeTodosOneWeekAgo).toHaveLength(3);

    // The updatedAt changed so no need to compare anymore
    delete staleIncompleteToInactive.updatedAt;
    delete staleIncompleteTodoToCompleted.updatedAt;

    expect(activeTodosOneWeekAgo).toStrictEqual(expect.arrayContaining([
      staleCompletedTodo,
      expect.objectContaining({ ...staleIncompleteToInactive, status: TodoStatus.Inactive }),
      expect.objectContaining({ ...staleIncompleteTodoToCompleted, status: TodoStatus.Complete }),
    ]));

    const {
      items: activeTodos,
    } = await localTodoStore.getRelevantTodos(new Date());
    expect(activeTodos).toHaveLength(2);

    expect(activeTodos).toStrictEqual(expect.arrayContaining([
      staleIncompleteTodoCarryOver,
      activeTodo,
    ]));
  });
});
