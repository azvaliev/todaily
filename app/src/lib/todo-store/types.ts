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

export type CreateTodoInput = Pick<Todo, 'content'> & Partial<Pick<Todo, 'status'>>;
export type UpdateTodoInputDetails = Partial<Pick<Todo, 'content' | 'status'>>;

export interface TodoStore {
  getTodos(date: Date): Promise<{ items: Todo[] }>;
  createTodo(details: CreateTodoInput): Promise<Todo>;
  updateTodo(id: string, details: UpdateTodoInputDetails): Promise<Todo>;
}
