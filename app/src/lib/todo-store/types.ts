export enum TodoStatus {
  Incomplete = 'incomplete',
  Complete = 'complete',
}

export type ULID = string & { __brand?: never };
export type Todo = {
  id: ULID;
  content: string;
  status: TodoStatus;
  updatedAt?: Date;
  createdAt: Date;
};

export interface TodoStore {
  getTodos(date: Date): Promise<{ items: Todo[] }>;
  createTodo(details: Pick<Todo, 'content'> & Partial<Pick<Todo, 'status'>>): Promise<Todo>;
  updateTodo(id: string, details: Partial<Pick<Todo, 'content' | 'status'>>): Promise<Todo>;
}
