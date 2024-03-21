# ToDaily

Todo list app focused around a daily set of todo's. Check it out [here](https://todaily.fly.dev)

## Core idea

You can add todos, edit & delete them, and mark them as completed.
When a new day begins and previous todos were not completed, one can either

- carry them over to today
- mark them as completed
- mark them as now irrelevant

## Features

- Create, edit & delete todos
- Mark todos as completed
- Prioritize todos
- Can view past days of todos
- IndexedDB, with
  - **Fulltext search** implemented in IndexedDB
  - Persistent storage for viewing todo history

## Storage Mechanisms

- IndexedDB
- (Eventually) Cloud via per tenant LibSQL DB
