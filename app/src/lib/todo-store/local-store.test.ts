import {
  describe, beforeEach, it, expect,
} from 'vitest';
import { faker } from '@faker-js/faker';
import { LocalTodoStore } from './local-store';
import { TodoStatus, type CreateTodoInput } from './types';

describe('Local browser store happy path', () => {
  let localTodoStore: LocalTodoStore;

  beforeEach(async () => {
    localTodoStore = await LocalTodoStore.create(faker.hacker.noun());
  });

  it('Can create and retrieve the todo', async () => {
    const todoContent = {
      content: faker.lorem.sentence(),
    } satisfies CreateTodoInput;

    await localTodoStore.createTodo(todoContent);

    const { items: [todo] } = await localTodoStore.getRelevantTodos(new Date());

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

    const { items: [todo] } = await localTodoStore.getRelevantTodos(new Date());

    expect(todo).toBeDefined();
    expect(todo!.status).toBe(TodoStatus.Complete);
  });
});
