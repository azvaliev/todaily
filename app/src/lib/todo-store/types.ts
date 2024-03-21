export enum TodoStatus {
  Incomplete = 'incomplete',
  /**
  * todo was not completed but has been otherwise dismissed
  * */
  Inactive = 'inactive',
  Complete = 'complete',
}
export enum StaleTodoAction {
  /**
    * Todo was not completed, but it is not relevant today
  * */
  MarkInactive = 'mark-inactive',
  /**
    * Todo was not completed and should be carried over to today
  * */
  CarryOver = 'carry-over',
  /**
    * Todo was not marked as complete but was completed
  * */
  MarkCompleted = 'mark-completed',
}

export enum TodoPriority {
  Low = 'low',
  Normal = 'normal',
  High = 'high',
}

export const mapPriorityToSort = {
  [TodoPriority.Low]: 0,
  [TodoPriority.Normal]: 1,
  [TodoPriority.High]: 2,
} satisfies { [K in TodoPriority]: number };

export type ULID = string & { __brand?: never };
export type Todo = {
  id: ULID;
  content: string;
  status: TodoStatus;
  updatedAt?: Date;
  createdAt: Date;
  priority: TodoPriority;
};

export type CreateTodoInput = Pick<Todo, 'content' | 'priority'> & Partial<Pick<Todo, 'status'>>;
export type UpdateTodoInputDetails = { id: ULID } & Partial<Pick<Todo, 'content' | 'status'>>;
export type HandleStaleTodoInput = { id: ULID, action: StaleTodoAction };

export type TodoItemsResponse = { items: Todo[] };

export type TodoFilterSort = {
  /** @default priority */
  sortBy?: 'priority';
  /** @default DESC */
  sortOrder?: 'ASC' | 'DESC';
};

export interface TodoStore {
  /**
    * Get todos for `date`
  * */
  getRelevantTodos(date: Date, filterSort?: TodoFilterSort): Promise<TodoItemsResponse>;
  /**
    * Get any todos before midnight today that are incomplete
  * */
  getStaleTodos(): Promise<TodoItemsResponse>;
  handleStaleTodosActions(details: HandleStaleTodoInput[]): Promise<void>;
  createTodo(details: CreateTodoInput): Promise<Pick<Todo, 'id'>>;
  updateTodo(details: UpdateTodoInputDetails): Promise<void>;
  deleteTodo(id: ULID): Promise<void>;
  fulltextSearch(query: string): Promise<TodoItemsResponse>;
}
