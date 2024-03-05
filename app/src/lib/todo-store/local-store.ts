import { DBSchema, IDBPDatabase, openDB } from 'idb';
import {
  Todo, TodoStatus, TodoStore, ULID,
} from './types';

const LOCAL_DB_NAME = 'todos';

/**
  * Schema for the Todo stores in IndexedDB
  *
  * Using unix timestamps for ease of date querying in IndexedDB
  * IndexedDB does not support BigInt so just to be safe using seconds
  * Also, for our use case the granularity of milliseconds is not neccesary
  * */
interface TodoStoreDBV1Schema extends DBSchema {
  todos: {
    key: ULID,
    value: {
      id: ULID;
      content: string;
      status: TodoStatus;
      /** unix timestamp seconds */
      createdAt: number;
      /** unix timestamp seconds */
      updatedAt?: number;
    };
  };
  /**
    * Which todos are relevant for today, based on created_at
    * A single todo can be carried over multiple days so this table represents that
    * */
  todo_days: {
    key: ULID;
    value: {
      id: ULID;
      todoId: ULID;
      /** unix timestamp seconds */
      createdAt: number;
    },
    indexes: { idx_created_at: number; }
  }
}

class LocalTodoStore implements TodoStore {
  constructor(private db: IDBPDatabase<TodoStoreDBV1Schema>) {}

  static async create(): Promise<LocalTodoStore> {
    const db = await openDB<TodoStoreDBV1Schema>(LOCAL_DB_NAME, 1, {
      upgrade(database) {
        database.createObjectStore('todos', {
          keyPath: 'id',
        });

        const todoDaysStore = database.createObjectStore('todo_days', {
          keyPath: 'id',
        });
        todoDaysStore.createIndex('idx_created_at', 'created_at', { unique: false });
      },
    });

    return new LocalTodoStore(db);
  }

  async getTodos(date: Date): Promise<{ items: Todo[]; }> {
    /** Midnight of `date` */
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0);
    const startOfDayUnixSeconds = LocalTodoStore.convertDateToUnixSecondsTimestamp(startOfDay);

    /** Midnight, technically the next day */
    const endOfDay = new Date(date);
    endOfDay.setDate(endOfDay.getDate() + 1);
    endOfDay.setHours(0, 0, 0);
    const endOfDayUnixSeconds = LocalTodoStore.convertDateToUnixSecondsTimestamp(endOfDay);

    /** Get all todo id's relevant for day */
    const todoDays = await this.db.getAllFromIndex('todo_days', 'idx_created_at', IDBKeyRange.bound(startOfDayUnixSeconds, endOfDayUnixSeconds));

    const todoIds = todoDays
      .map((todoDay) => todoDay.todoId)
      // This shouldn't be a thing.. but I can't guarantee that through any kind of constraint here
      .filter((todoId, todoIdx, filteringTodoIds) => filteringTodoIds.indexOf(todoId) === todoIdx);

    /** Join todos to todo id's */
    const todoTrx = this.db.transaction('todos', 'readonly');
    const todoQueryResults = await Promise.all(
      todoIds.map((todoId) => (
        todoTrx.store.get(todoId)
      )),
    );

    const todos = todoQueryResults
      .filter((todo): todo is TodoStoreDBV1Schema['todos']['value'] => {
        if (todo === null || todo === undefined) {
          console.warn('Failed to locate some existing todos');
          return false;
        }
        return true;
      })
      .map<Todo>((todo) => {
      const createdAtDate = LocalTodoStore.convertUnixSecondsTimestampToDate(todo.createdAt);
      let updatedAtDate: Todo['updatedAt'];
      if (todo.updatedAt) {
        updatedAtDate = LocalTodoStore.convertUnixSecondsTimestampToDate(todo.updatedAt);
      }

      return {
        ...todo,
        createdAt: createdAtDate,
        updatedAt: updatedAtDate,
      };
    });

    return { items: todos };
  }

  private static convertDateToUnixSecondsTimestamp(date: Date): UnixSeconds {
    const unixMilliseconds = date.valueOf();
    return Math.trunc(unixMilliseconds / 1000);
  }

  private static convertUnixSecondsTimestampToDate(seconds: UnixSeconds): Date {
    const unixMilliseconds = seconds * 1000;
    return new Date(unixMilliseconds);
  }
}

/**
  * like a normal unix timestamp, but in seconds instead of milliseconds
  * */
type UnixSeconds = number & { __brand?: never };

export default LocalTodoStore;
