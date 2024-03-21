/* I need to do this to use IDB library w/ cursors */
/* eslint-disable no-await-in-loop */
import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { snakeToCamelCase } from 'cold-case';
import { ulid } from 'ulidx';
import {
  CreateTodoInput,
  HandleStaleTodoInput,
  StaleTodoAction,
  Todo, TodoItemsResponse, TodoPriority, TodoStatus, TodoStore, ULID, UpdateTodoInputDetails,
} from '../types';
import { convertTextToFulltextSearchTokens } from './fulltext';

const LOCAL_DB_NAME = 'todos';

/**
  * Schema for the Todo stores in IndexedDB
  * */
interface TodoStoreDBV3Schema extends DBSchema {
  todos: {
    key: ULID,
    value: {
      id: ULID;
      content: string;
      /**
        * For full text search
      * */
      content_tokens: string[];
      status: TodoStatus;
      created_at: Date;
      updated_at?: Date;
      priority: TodoPriority;
    };
    indexes: {
      idx_status: TodoStatus,
      idx_created_at: Date,
      idx_content_tokens: string[]
    }
  };
}

type TodoDBRecord = TodoStoreDBV3Schema['todos']['value'];

export class LocalTodoStore implements TodoStore {
  constructor(private db: IDBPDatabase<TodoStoreDBV3Schema>) {}

  static async create(dbName = LOCAL_DB_NAME): Promise<LocalTodoStore> {
    const db = await openDB<TodoStoreDBV3Schema>(dbName, 3, {
      async upgrade(database, oldVersion, _newVersion, transaction) {
        if (oldVersion < 1) {
          const todoStore = database.createObjectStore('todos', {
            keyPath: 'id',
          });
          todoStore.createIndex('idx_created_at', 'created_at', { unique: false });
          todoStore.createIndex('idx_status', 'status', { unique: false });
        }

        const todoStore = transaction.objectStore('todos');

        if (oldVersion < 2) {
          // Adding content_tokens to all records
          todoStore.createIndex('idx_content_tokens', 'content_tokens', { multiEntry: true });

          let cursor = await todoStore.openCursor();

          while (cursor) {
            const { value: existingRecord } = cursor;

            const contentTokens = await convertTextToFulltextSearchTokens(existingRecord.content);
            existingRecord.content_tokens = contentTokens;

            await cursor.update(existingRecord);
            cursor = await cursor.continue();
          }
        }

        // Add priority to all records
        {
          let cursor = await todoStore.openCursor();

          while (cursor) {
            const { value: existingRecord } = cursor;

            existingRecord.priority = TodoPriority.Normal;
            await cursor.update(existingRecord);
            cursor = await cursor.continue();
          }
        }

        await transaction.done;
      },
    });

    return new LocalTodoStore(db);
  }

  async getRelevantTodos(date: Date): Promise<{ items: Todo[]; }> {
    /** Midnight of `date` */
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0);

    /** Midnight, technically the next day */
    const endOfDay = new Date(date);
    endOfDay.setDate(endOfDay.getDate() + 1);
    endOfDay.setHours(0, 0, 0);

    const todoQueryResults = await this.db.getAllFromIndex(
      'todos',
      'idx_created_at',
      IDBKeyRange.bound(startOfDay, endOfDay),
    );

    const todos = todoQueryResults
      .map<Todo>(LocalTodoStore.mapTodoDBRecordToTodo);

    return { items: todos };
  }

  async getStaleTodos(): Promise<{ items: Todo[]; }> {
    const yesterdaySameTimeUnix = new Date().getTime() - (24 * 60 * 60 * 1000);

    const endOfDayYesterday = new Date(yesterdaySameTimeUnix);
    endOfDayYesterday.setHours(23, 59, 59);

    const todoQueryResults = await this.db.getAllFromIndex(
      'todos',
      'idx_status',
      IDBKeyRange.only(TodoStatus.Incomplete),
    );

    const todos = todoQueryResults
      .filter((todo) => todo.created_at.getTime() < endOfDayYesterday.getTime())
      .map<Todo>(LocalTodoStore.mapTodoDBRecordToTodo);

    return {
      items: todos,
    };
  }

  private async getTodoById(todoId: ULID): Promise<Todo | null> {
    const todoRecord = await this.db.get('todos', todoId);
    if (!todoRecord) return null;

    return LocalTodoStore.mapTodoDBRecordToTodo(todoRecord);
  }

  async handleStaleTodosActions(details: HandleStaleTodoInput[]): Promise<void> {
    await Promise.all(
      details.map(({ action, id }) => (
        this.handleStaleTodoAction({ action, id })
      )),
    );
  }

  private async handleStaleTodoAction({
    action,
    id: todoId,
  }: HandleStaleTodoInput): Promise<void> {
    switch (action) {
      case StaleTodoAction.MarkInactive: {
        await this.updateTodo({
          id: todoId,
          status: TodoStatus.Inactive,
        });
        break;
      }
      case StaleTodoAction.MarkCompleted: {
        await this.updateTodo({
          id: todoId,
          status: TodoStatus.Complete,
        });
        break;
      }
      case StaleTodoAction.CarryOver: {
        const todo = await this.getTodoById(todoId);
        if (!todo) {
          console.warn(`Could not find todo with ID ${todoId}`);
          throw new Error('Could not carry over some todos');
        }
        await this.updateTodo({
          id: todoId,
          status: TodoStatus.Inactive,
        });
        await this.createTodo(todo);
        break;
      }
      default: {
        console.warn('LocalTodoStore#handleStaleTodoAction called with invalid / unhandleable action type', { action, id: todoId });
      }
    }
  }

  async createTodo(details: CreateTodoInput): Promise<Todo> {
    const contentTokens = await convertTextToFulltextSearchTokens(details.content);
    const newTodo = {
      id: ulid(),
      created_at: new Date(),
      status: TodoStatus.Incomplete,
      content_tokens: contentTokens,
      ...details,
    } satisfies TodoDBRecord;

    await this.db.put('todos', newTodo);

    return LocalTodoStore.mapTodoDBRecordToTodo(newTodo);
  }

  async updateTodo(details: UpdateTodoInputDetails): Promise<void> {
    const trx = this.db.transaction('todos', 'readwrite');

    const existingTodoRecord = await trx.store.get(details.id);
    if (!existingTodoRecord) {
      throw new Error('Todo does not exist');
    }

    const newTodoRecord = {
      ...existingTodoRecord,
      ...details,
      updated_at: new Date(),
    } satisfies TodoDBRecord;

    await trx.store.put(newTodoRecord);
  }

  async deleteTodo(id: ULID): Promise<void> {
    await this.db.delete('todos', id);
  }

  async fulltextSearch(query: string): Promise<TodoItemsResponse> {
    const queryTokens = await convertTextToFulltextSearchTokens(query);

    if (queryTokens.length < 1) {
      return {
        items: [],
      };
    }

    // This gives us matched records for each individual token
    const matchedRecordsPerToken = (await Promise.all(
      queryTokens.map(async (token) => {
        const tx = this.db.transaction('todos', 'readonly');
        const store = tx.objectStore('todos');
        const idx = store.index('idx_content_tokens');

        const matchedRecords: TodoDBRecord[] = [];

        let cursor = await idx.openCursor(IDBKeyRange.only(token));
        while (cursor) {
          matchedRecords.push(cursor.value);
          cursor = await cursor.continue();
        }

        return matchedRecords;
      }),
    )).flat();

    const minScore = queryTokens.length / 2;
    type Score = number;

    // Determine a score for each record, how many terms they matched
    const mappedRecordScore = matchedRecordsPerToken
      .flat()
      .reduce((map, record) => {
        const oldScore = map.get(record.id) || 0;

        map.set(record.id, oldScore + 1);

        return map;
      }, new Map<ULID, Score>());

    const matchedRecords = Array.from(mappedRecordScore.entries())
      .filter(([_id, score]) => score > minScore)
      .sort(([_aid, aScore], [_bId, bScore]) => {
        if (aScore > bScore) {
          return 1;
        } if (bScore > aScore) {
          return -1;
        }
        return 0;
      })
      .slice(0, 20)
      .map(([id]) => matchedRecordsPerToken.find((record) => record.id === id)!)
      .map((record) => LocalTodoStore.mapTodoDBRecordToTodo(record));

    return {
      items: matchedRecords,
    };
  }

  private static mapTodoDBRecordToTodo(todoDBRecord: TodoDBRecord): Todo {
    return snakeToCamelCase(todoDBRecord);
  }
}

export default LocalTodoStore;

/** @deprecated */
// @ts-expect-error unused
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface TodoStoreDBV2Schema extends DBSchema {
  todos: {
    key: ULID,
    value: {
      id: ULID;
      content: string;
      /**
        * For full text search
      * */
      content_tokens: string[];
      status: TodoStatus;
      created_at: Date;
      updated_at?: Date;
    };
    indexes: {
      idx_status: TodoStatus,
      idx_created_at: Date,
      idx_content_tokens: string[]
    }
  };
}

/**
  * @deprecated
  * */
// @ts-expect-error unused
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface TodoStoreDBV1Schema extends DBSchema {
  todos: {
    key: ULID,
    value: {
      id: ULID;
      content: string;
      status: TodoStatus;
      created_at: Date;
      updated_at?: Date;
    };
    indexes: { idx_status: TodoStatus, idx_created_at: Date }
  };
}
