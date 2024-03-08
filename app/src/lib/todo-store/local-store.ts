import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { snakeToCamelCase } from 'cold-case';
import { ulid } from 'ulidx';
import {
  CreateTodoInput,
  HandleStaleTodoInput,
  StaleTodoAction,
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

    const todoQueryResults = await this.db.getAllFromIndex(
      'todos',
      'idx_created_at_status',
      IDBKeyRange.bound([startOfDay], [endOfDay]),
    );

    const todos = todoQueryResults
      .map<Todo>(LocalTodoStore.mapTodoDBRecordToTodo);

    return { items: todos };
  }

  async getStaleTodos(): Promise<{ items: Todo[]; }> {
    const yesterdaySameTimeUnix = new Date().getTime() - (24 * 60 * 60 * 1000);

    const endOfDayYesterday = new Date(yesterdaySameTimeUnix);
    endOfDayYesterday.setHours(23, 59, 59);

    const unixEpoch = new Date(0);

    const todoQueryResults = await this.db.getAllFromIndex(
      'todos',
      'idx_created_at_status',
      IDBKeyRange.bound(
        [unixEpoch, TodoStatus.Incomplete],
        [endOfDayYesterday, TodoStatus.Incomplete],
        true,
        false,
      ),
    );

    const todos = todoQueryResults
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
    const newTodo = {
      id: ulid(),
      created_at: new Date(),
      status: TodoStatus.Incomplete,
      ...details,
    } satisfies TodoDBRecord;

    await this.db.put('todos', newTodo, newTodo.id);

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

    await trx.store.put(newTodoRecord, details.id);
  }

  private static mapTodoDBRecordToTodo(todoDBRecord: TodoDBRecord): Todo {
    return snakeToCamelCase(todoDBRecord);
  }
}

export default LocalTodoStore;
