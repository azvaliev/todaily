import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { snakeToCamelCase } from 'cold-case';
import { ulid } from 'ulidx';
import {
  CreateTodoInput,
  Todo, TodoStatus, TodoStore, ULID, UpdateTodoInputDetails,
} from './types';

const LOCAL_DB_NAME = 'todos';

/**
  * Schema for the Todo stores in IndexedDB
  * */
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
    indexes: { idx_created_at_status: [Date, TodoStatus] }
  };
}

type TodoDBRecord = TodoStoreDBV1Schema['todos']['value'];

class LocalTodoStore implements TodoStore {
  constructor(private db: IDBPDatabase<TodoStoreDBV1Schema>) {}

  static async create(): Promise<LocalTodoStore> {
    const db = await openDB<TodoStoreDBV1Schema>(LOCAL_DB_NAME, 1, {
      upgrade(database) {
        const todoStore = database.createObjectStore('todos', {
          keyPath: 'id',
        });
        todoStore.createIndex('idx_created_at_status', ['created_at', 'status'], { unique: false });
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

    /** Join todos to todo id's */
    const todoQueryResults = await this.db.getAllFromIndex(
      'todos',
      'idx_created_at_status',
      IDBKeyRange.bound([startOfDay], [endOfDay]),
    );

    const todos = todoQueryResults
      .map<Todo>((dbRec) => snakeToCamelCase(dbRec));

    return { items: todos };
  }

  async createTodo(details: CreateTodoInput): Promise<Todo> {
    const newTodo = {
      id: ulid(),
      created_at: new Date(),
      status: TodoStatus.Incomplete,
      ...details,
    } satisfies TodoDBRecord;

    await this.db.put('todos', newTodo, newTodo.id);

    return LocalTodoStore.mapTodoDBRecordToTodo(newTodo);
  }

  async updateTodo(id: string, details: UpdateTodoInputDetails): Promise<Todo> {
    const trx = this.db.transaction('todos', 'readwrite');

    const existingTodoRecord = await trx.store.get(id);
    if (!existingTodoRecord) {
      throw new Error('Todo does not exist');
    }

    const newTodoRecord = {
      ...existingTodoRecord,
      ...details,
      updated_at: new Date(),
    } satisfies TodoDBRecord;

    await trx.store.put(newTodoRecord, id);

    return LocalTodoStore.mapTodoDBRecordToTodo(newTodoRecord);
  }

  private static mapTodoDBRecordToTodo(todoDBRecord: TodoDBRecord): Todo {
    return snakeToCamelCase(todoDBRecord);
  }
}

export default LocalTodoStore;
