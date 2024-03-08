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

export type ULID = string & { __brand?: never };
export type Todo = {
  id: ULID;
  content: string;
  status: TodoStatus;
  updatedAt?: Date;
  createdAt: Date;
};

export type CreateTodoInput = Pick<Todo, 'content'> & Partial<Pick<Todo, 'status'>>;
export type UpdateTodoInputDetails = { id: ULID } & Partial<Pick<Todo, 'content' | 'status'>>;
export type HandleStaleTodoInput = { id: ULID, action: StaleTodoAction };

export interface TodoStore {
  /**
    * Get todos for `date`
  * */
  getRelevantTodos(date: Date): Promise<{ items: Todo[] }>;
  /**
    * Get any todos before midnight today that are incomplete
  * */
  getStaleTodos(): Promise<{ items: Todo[] }>;
  handleStaleTodosActions(details: HandleStaleTodoInput[]): Promise<void>;
  createTodo(details: CreateTodoInput): Promise<Pick<Todo, 'id'>>;
  updateTodo(details: UpdateTodoInputDetails): Promise<void>;
}
