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

    const insertedTodo = await localTodoStore.createTodo(todoContent);

    const { items: [todo, ...rest] } = await localTodoStore.getRelevantTodos(new Date());
    expect(rest.length).toBe(0);

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
    expect(rest.length).toBe(0);

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
    expect(rest.length).toBe(0);

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
